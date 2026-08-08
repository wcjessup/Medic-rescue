import type { Game } from "../engine/Game.js";
import type { CallSite, TileMap } from "../world/TileMap.js";
import type { PlayerState } from "../data/PlayerState.js";
import { createPatientFromTemplate } from "../data/patientDefs.js";
import { PatientEncounterScene } from "../scenes/PatientEncounterScene.js";

export function checkEncounterTrigger(map: TileMap, tileX: number, tileY: number): CallSite | undefined {
  const site = map.callSiteAt(tileX, tileY);
  return site && !site.resolvedThisShift ? site : undefined;
}

/** Fades out, swaps to a PatientEncounterScene for the given call site, and fades back in. `onReturn` runs after the player closes the resolution screen. */
export function triggerEncounter(game: Game, site: CallSite, playerState: PlayerState, onReturn: () => void): void {
  game.transition.fadeOut(() => {
    const patient = createPatientFromTemplate(site.patientDefId);
    game.scenes.replace(
      new PatientEncounterScene(patient, playerState, site, () => {
        game.transition.fadeOut(onReturn);
      })
    );
  });
}
