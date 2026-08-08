import { Entity, type Facing } from "./Entity.js";

export class NPC extends Entity {
  readonly id: string;
  readonly dialogueId: string;

  constructor(id: string, tileX: number, tileY: number, facing: Facing, dialogueId: string) {
    super(tileX, tileY, facing);
    this.id = id;
    this.dialogueId = dialogueId;
  }
}
