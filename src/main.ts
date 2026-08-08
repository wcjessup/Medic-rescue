import { Game } from "./engine/Game.js";
import { TitleScene } from "./scenes/TitleScene.js";

const container = document.getElementById("app");
if (!container) throw new Error("#app container not found");

const game = new Game(container);

const title = new TitleScene((_continueGame) => {
  // Overworld scene wired in from milestone 2 onward.
}, false);

game.start(title);
