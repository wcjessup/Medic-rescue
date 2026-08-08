import { Game } from "./engine/Game.js";
import { TitleScene } from "./scenes/TitleScene.js";
import { OverworldScene } from "./scenes/OverworldScene.js";
import { createTownMap } from "./world/maps/townMap.js";
import { createInitialPlayerState } from "./data/PlayerState.js";
import { hasSaveGame, loadGame } from "./systems/SaveSystem.js";

const container = document.getElementById("app");
if (!container) throw new Error("#app container not found");

const game = new Game(container);
const playerState = createInitialPlayerState();

const title = new TitleScene((continueGame) => {
  game.transition.fadeOut(() => {
    if (continueGame) {
      const loaded = loadGame();
      if (loaded) Object.assign(playerState, loaded);
    }
    game.scenes.replace(new OverworldScene(createTownMap(), game, playerState));
  });
}, hasSaveGame());

game.start(title);
