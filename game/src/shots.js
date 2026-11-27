// shots.js — the ?shot= hook for screenshots. It only picks a starting state and
// pre-places the actors; every pixel is still drawn by the game's own render code.
//   ?shot=title   title screen over the farmyard
//   ?shot=play    mid-run in the farmyard, farmer mid-chase, corn on the ground
//   ?shot=kitchen mid-run in the kitchen stage, ovens glowing
//   ?shot=end     the CAUGHT end screen

export function applyShot(game, actions) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return;

  if (shot === 'play' || shot === 'kitchen') {
    actions.startRun();
    if (shot === 'kitchen') actions.loadStage(2);
    // Stage the scene: turkey mid-field with corn nearby, farmer close and chasing.
    game.turkey.x = 430; game.turkey.y = 330;
    game.turkey.facing = 1;
    game.score = shot === 'kitchen' ? 1450 : 600;
    game.turkey.distance = shot === 'kitchen' ? 214 : 96;
    game.cornEaten = shot === 'kitchen' ? 9 : 4;
    game.farmer.x = 300; game.farmer.y = 240;
    game.farmer.state = 'chase';
    game.farmer.lastSeen = { x: 430, y: 330 };
    if (shot === 'kitchen') {
      // Stage one falling knife mid-warning so the shot shows the drop hazard too.
      const drop = game.stage.knives.find((k) => k.kind === 'drop');
      if (drop) { drop.state = 'warn'; drop.timer = 0.55; drop.warn = 0.6; drop.x = 620; }
    }
  } else if (shot === 'end') {
    actions.startRun();
    game.state = 'caught';
    game.score = 1250;
    game.lives = 0;
    game.cornEaten = 7;
    game.turkey.distance = 183;
    game.turkey.x = 470; game.turkey.y = 300;
    game.farmer.x = 500; game.farmer.y = 300;
    game.farmer.state = 'chase';
  }
  // 'title' needs nothing: the game already boots on the title screen.
}
