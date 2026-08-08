export interface DialogueScript {
  id: string;
  speaker?: string;
  lines: string[];
}

export const dialogueScripts: Record<string, DialogueScript> = {
  "npc.chief": {
    id: "npc.chief",
    speaker: "Chief Alvarez",
    lines: [
      "Morning, rookie. Calls are already coming in.",
      "Head out and check on anyone who needs help. Come back here to restock supplies or save your progress.",
    ],
  },
  "npc.bystander": {
    id: "npc.bystander",
    speaker: "Bystander",
    lines: ["I heard sirens earlier. Hope everyone out there is okay."],
  },
};
