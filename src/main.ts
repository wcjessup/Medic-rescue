import { Game } from "./engine/Game.js";
import { TitleScene } from "./scenes/TitleScene.js";
import { OverworldScene } from "./scenes/OverworldScene.js";
import { createTownMap } from "./world/maps/townMap.js";
import { createInitialPlayerState } from "./data/PlayerState.js";

const container = document.getElementById("app");
if (!container) throw new Error("#app container not found");

const game = new Game(container);
const playerState = createInitialPlayerState();

const title = new TitleScene((_continueGame) => {
  game.transition.fadeOut(() => {
    game.scenes.replace(new OverworldScene(createTownMap(), game, playerState));
  });
}, false);

game.start(title);
