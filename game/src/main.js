// main.js — game boot, state machine and the main loop.
// States: title → play → stageClear → play … → caught | escaped → (restart) title.
// The ?shot=title|play|kitchen|end hook stages a real render of the game's own code
// for screenshots; it only changes the starting state, never the art.
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { buildStage } from './levels.js';
import { createTurkey, updateTurkey, eatCorn, atExit } from './turkey.js';
import { createFarmer, updateFarmer, farmerCaught } from './farmer.js';
import { updateHazards, hazardTouching } from './hazards.js';
import { drawScene } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const game = {
  state: 'title',        // 'title' | 'play' | 'stageClear' | 'caught' | 'escaped'
  stageIndex: 0,
  stage: buildStage(0),
  turkey: createTurkey(80, 520),
  farmer: null,
  score: 0,
  lives: 3,
  cornEaten: 0,
  time: 0,
  blink: true,
  stageClearTimer: 0,
  endTimer: 0,
};
game.farmer = createFarmer(game.stage.farmerStart.x, game.stage.farmerStart.y, game.stage.farmerPatrol, game.stage.farmerBaseSpeed, game.stage.farmerSight);

const input = createInput(canvas);
const audio = createAudio();

function loadStage(index) {
  game.stageIndex = index;
  game.stage = buildStage(index);
  game.turkey = createTurkey(game.stage.turkeyStart.x, game.stage.turkeyStart.y);
  // Keep the run total; only the position resets.
  game.turkey.distance = game.distanceKept ?? 0;
  game.farmer = createFarmer(game.stage.farmerStart.x, game.stage.farmerStart.y, game.stage.farmerPatrol, game.stage.farmerBaseSpeed, game.stage.farmerSight);
}

function startRun() {
  game.score = 0;
  game.lives = 3;
  game.cornEaten = 0;
  game.distanceKept = 0;
  loadStage(0);
  game.state = 'play';
  audio.unlock();
  audio.gobble();
}

function loseLife(reason) {
  game.lives -= 1;
  audio.hurt();
  if (game.lives <= 0) {
    game.state = 'caught';
    game.endTimer = 0;
    audio.caught();
    return;
  }
  // Caught or burned: the turkey scrambles back to the stage start, the farmer
  // resets to his patrol — a narrow escape stays fair.
  const keep = game.turkey.distance;
  game.turkey = createTurkey(game.stage.turkeyStart.x, game.stage.turkeyStart.y);
  game.turkey.distance = keep;
  game.turkey.invuln = 2;
  game.farmer = createFarmer(game.stage.farmerStart.x, game.stage.farmerStart.y, game.stage.farmerPatrol, game.stage.farmerBaseSpeed, game.stage.farmerSight);
}

function update(dt) {
  game.time += dt;
  game.blink = Math.floor(game.time * 1.6) % 2 === 0;

  if (game.state === 'title') {
    if (input.enterPressed() || input.consumeClick()) startRun();
    return;
  }
  if (game.state === 'caught' || game.state === 'escaped') {
    game.endTimer += dt;
    if (game.endTimer > 0.6 && (input.enterPressed() || input.consumeClick())) startRun();
    return;
  }
  if (game.state === 'stageClear') {
    game.stageClearTimer -= dt;
    if (game.stageClearTimer <= 0) {
      game.distanceKept = game.turkey.distance;
      loadStage(game.stageIndex + 1);
      game.state = 'play';
    }
    return;
  }

  // --- play ---
  updateTurkey(game.turkey, dt, input, game.stage.fences, audio);
  updateFarmer(game.farmer, game.turkey, dt, game.stage.fences, audio);
  updateHazards(game.stage, dt, audio);

  const eaten = eatCorn(game.turkey, game.stage.corn, audio);
  if (eaten > 0) { game.cornEaten += eaten; game.score += eaten * 100; }

  if (game.turkey.invuln <= 0) {
    const hit = hazardTouching(game.turkey, game.stage);
    if (hit) { loseLife(hit); return; }
    if (farmerCaught(game.farmer, game.turkey)) { loseLife('caught'); return; }
  }

  if (atExit(game.turkey, game.stage.exit)) {
    game.score += 500;
    audio.stageClear();
    if (game.stageIndex + 1 >= 3) {
      game.state = 'escaped';
      game.endTimer = 0;
      audio.escaped();
    } else {
      game.state = 'stageClear';
      game.stageClearTimer = 2.2;
    }
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  drawScene(ctx, game);
  requestAnimationFrame(frame);
}

// Screenshot hook: ?shot=title|play|kitchen|end stages a genuine render.
applyShot(game, { loadStage, startRun });
requestAnimationFrame(frame);
