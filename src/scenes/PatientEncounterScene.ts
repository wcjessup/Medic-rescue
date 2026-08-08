import type { Scene, SceneContext } from "../engine/Scene.js";
import { Patient, type Vitals, type PatientStatus } from "../data/Patient.js";
import type { CallSite } from "../world/TileMap.js";
import type { PlayerState } from "../data/PlayerState.js";
import { treatmentDefs, treatmentOrder } from "../data/Treatment.js";
import { itemDefs, itemOrder } from "../data/itemDefs.js";
import { useItem } from "../systems/InventorySystem.js";
import { advanceRound, isStable } from "../systems/VitalsSystem.js";
import { resolveEncounterExp } from "../systems/ProgressionSystem.js";
import { Menu, type MenuItem } from "../ui/Menu.js";
import { renderVitalsHUD } from "../ui/VitalsHUD.js";
import { COLORS, VIEW_WIDTH, VIEW_HEIGHT } from "../utils/constants.js";

type Mode = "main" | "treat" | "items" | "resolution";

interface ResolvedOutcome {
  status: Exclude<PatientStatus, "active">;
  exp: number;
  leveledUp: boolean;
  newLevel: number;
}

const OUTCOME_MESSAGES: Record<Exclude<PatientStatus, "active">, string> = {
  stabilized: "Patient stabilized and transported!",
  critical: "Patient transported, still critical.",
  lost: "Patient could not be saved.",
};

export class PatientEncounterScene implements Scene {
  readonly blocksInputBelow = true;
  private mode: Mode = "main";
  private menu: Menu<string>;
  private resolved: ResolvedOutcome | null = null;

  constructor(
    private patient: Patient,
    private playerState: PlayerState,
    private callSite: CallSite,
    private onComplete: () => void
  ) {
    this.menu = this.buildMainMenu();
  }

  private buildMainMenu(): Menu<string> {
    const items: MenuItem<string>[] = [
      { label: "Treat", value: "treat" },
      { label: "Items", value: "items" },
      {
        label: this.patient.backupCalled ? "Backup called" : "Call Backup",
        value: "backup",
        disabled: this.patient.backupCalled,
      },
      { label: "Transport", value: "transport" },
    ];
    return new Menu(items);
  }

  private buildTreatMenu(): Menu<string> {
    const items: MenuItem<string>[] = treatmentOrder.map((id) => {
      const def = treatmentDefs[id];
      const locked = this.playerState.level < def.requiredLevel;
      return {
        label: locked ? `${def.label} (Lv ${def.requiredLevel})` : def.label,
        value: id,
        disabled: locked,
      };
    });
    items.push({ label: "Back", value: "back" });
    return new Menu(items);
  }

  private buildItemsMenu(): Menu<string> {
    const items: MenuItem<string>[] = itemOrder.map((id) => {
      const def = itemDefs[id];
      const qty = this.playerState.inventory[id] ?? 0;
      const locked = this.playerState.level < def.requiredLevel;
      const label = locked ? `${def.name} (Lv ${def.requiredLevel})` : `${def.name} x${qty}`;
      return { label, value: id, disabled: locked || qty <= 0 };
    });
    items.push({ label: "Back", value: "back" });
    return new Menu(items);
  }

  private applyAndAdvance(id: string, costsRound: boolean, apply: (v: Vitals) => void): void {
    apply(this.patient.vitals);
    this.patient.appliedTreatments.add(id);
    if (id === "assess") this.patient.assessed = true;
    if (costsRound) advanceRound(this.patient);
    this.afterAction();
  }

  private afterAction(): void {
    if (this.patient.status !== "active") {
      this.resolve(this.patient.status as Exclude<PatientStatus, "active">);
    } else {
      this.mode = "main";
      this.menu = this.buildMainMenu();
    }
  }

  private resolve(status: Exclude<PatientStatus, "active">): void {
    this.patient.status = status;
    this.callSite.resolvedThisShift = true;
    const result = resolveEncounterExp(this.playerState, status);
    this.resolved = { status, exp: result.exp, leveledUp: result.leveledUp, newLevel: result.newLevel };
    this.mode = "resolution";
  }

  update(sc: SceneContext): void {
    if (this.mode === "resolution") {
      if (sc.input.justPressed("confirm")) this.onComplete();
      return;
    }

    if (this.mode !== "main" && sc.input.justPressed("cancel")) {
      this.mode = "main";
      this.menu = this.buildMainMenu();
      return;
    }

    const choice = this.menu.handleInput(sc.input);
    if (choice === undefined) return;

    if (this.mode === "main") {
      if (choice === "treat") {
        this.mode = "treat";
        this.menu = this.buildTreatMenu();
      } else if (choice === "items") {
        this.mode = "items";
        this.menu = this.buildItemsMenu();
      } else if (choice === "backup") {
        this.patient.backupCalled = true;
        this.patient.maxRounds += 3;
        advanceRound(this.patient);
        this.afterAction();
      } else if (choice === "transport") {
        const status = this.patient.requiredMet && isStable(this.patient) ? "stabilized" : "critical";
        this.resolve(status);
      }
    } else if (this.mode === "treat") {
      if (choice === "back") {
        this.mode = "main";
        this.menu = this.buildMainMenu();
        return;
      }
      const def = treatmentDefs[choice];
      this.applyAndAdvance(choice, def.costsRound, def.apply);
    } else if (this.mode === "items") {
      if (choice === "back") {
        this.mode = "main";
        this.menu = this.buildMainMenu();
        return;
      }
      const def = itemDefs[choice];
      if (!useItem(this.playerState, choice)) return;
      this.applyAndAdvance(choice, true, def.apply);
    }
  }

  render(sc: SceneContext): void {
    const { ctx } = sc;
    ctx.fillStyle = "#0d1b2a";
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    renderVitalsHUD(ctx, this.patient);

    if (this.mode === "resolution" && this.resolved) {
      this.renderResolution(ctx);
      return;
    }

    this.menu.render(ctx, 16, 116, VIEW_WIDTH - 32, 14);
  }

  private renderResolution(ctx: CanvasRenderingContext2D): void {
    const o = this.resolved!;
    ctx.fillStyle = COLORS.text;
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(OUTCOME_MESSAGES[o.status], VIEW_WIDTH / 2, 130);

    ctx.font = "11px sans-serif";
    ctx.fillText(`+${o.exp} EXP`, VIEW_WIDTH / 2, 148);

    if (o.leveledUp) {
      ctx.fillStyle = COLORS.warn;
      ctx.fillText(`Level up! Now level ${o.newLevel}`, VIEW_WIDTH / 2, 164);
    }

    ctx.fillStyle = COLORS.text;
    const blink = Math.sin(performance.now() / 200) > 0;
    if (blink) ctx.fillText("Press A to continue", VIEW_WIDTH / 2, 184);
    ctx.textAlign = "left";
  }
}
