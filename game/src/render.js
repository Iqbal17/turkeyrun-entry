// render.js — all canvas drawing: the turkey, the farmer, the farm / barn / kitchen
// scenery, the hazards, the HUD, and the title / stage / end screens. Autumn palette,
// everything drawn in code, no image assets.
import { WORLD } from './levels.js';
import { swingAngle, swingTip } from './hazards.js';

const PALETTES = [
  { ground: '#7a9b4e', ground2: '#6d8c44', wall: '#8a6b3f', accent: '#d9a441' }, // farmyard grass
  { ground: '#a97e4f', ground2: '#9c7146', wall: '#6e4f2a', accent: '#e0b25a' }, // barn wood
  { ground: '#c9b8a3', ground2: '#bfae97', wall: '#7c6a58', accent: '#c96f3b' }, // kitchen tile
];

export function drawScene(ctx, game) {
  const stage = game.stage;
  const pal = PALETTES[stage.index];
  drawGround(ctx, stage, pal);
  drawExit(ctx, stage);
  drawOvens(ctx, stage);
  drawFences(ctx, stage, pal);
  drawCorn(ctx, stage, game.time);
  drawKnives(ctx, stage);
  drawFarmer(ctx, game.farmer, game.time);
  drawTurkey(ctx, game.turkey, game.time);
  drawHUD(ctx, game);
  if (game.state === 'title') drawTitle(ctx, game);
  else if (game.state === 'stageClear') drawStageClear(ctx, game);
  else if (game.state === 'caught' || game.state === 'escaped') drawEnd(ctx, game);
}

function drawGround(ctx, stage, pal) {
  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  // Mow / plank / tile stripes so the floor reads at a glance.
  ctx.fillStyle = pal.ground2;
  if (stage.index === 0) {
    for (let y = 0; y < WORLD.h; y += 60) ctx.fillRect(0, y, WORLD.w, 30);
    // Autumn leaves scattered on the grass.
    ctx.fillStyle = '#c96f3b';
    for (const [x, y] of [[120, 90], [300, 200], [820, 140], [700, 500], [180, 480], [520, 80]]) {
      ctx.beginPath(); ctx.ellipse(x, y, 7, 4, 0.6, 0, Math.PI * 2); ctx.fill();
    }
  } else if (stage.index === 1) {
    for (let y = 0; y < WORLD.h; y += 46) ctx.fillRect(0, y, WORLD.w, 4);
    ctx.fillStyle = '#d9b25a';
    for (const [x, y] of [[120, 120], [840, 120], [120, 480], [840, 480]]) {
      ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill(); // hay tufts
      ctx.fillStyle = '#b98f3e'; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d9b25a';
    }
  } else {
    ctx.strokeStyle = 'rgba(90,70,55,.35)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= WORLD.w; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.h); ctx.stroke(); }
    for (let y = 0; y <= WORLD.h; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.w, y); ctx.stroke(); }
  }
  // Stage name plate in the corner of the floor.
  ctx.fillStyle = 'rgba(43,29,18,.55)';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`— ${stage.name} —`, 14, WORLD.h - 14);
}

function drawExit(ctx, stage) {
  const e = stage.exit;
  const pulse = 0.5 + 0.3 * Math.sin(Date.now() / 300);
  ctx.fillStyle = `rgba(46, 160, 90, ${0.55 + pulse * 0.3})`;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = '#1e6b3a';
  ctx.lineWidth = 4;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 - 4);
  ctx.fillText('➜', e.x + e.w / 2, e.y + e.h / 2 + 14);
}

function drawOvens(ctx, stage) {
  for (const o of stage.ovens) {
    const flicker = 0.75 + 0.25 * Math.sin(Date.now() / 120 + o.x);
    ctx.fillStyle = '#3d3d3d';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = `rgba(255, ${Math.floor(90 + 60 * flicker)}, 20, ${0.55 + 0.3 * flicker})`;
    ctx.fillRect(o.x + 8, o.y + 8, o.w - 16, o.h - 30);
    ctx.fillStyle = '#ffb347';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOT OVEN!', o.x + o.w / 2, o.y + o.h - 8);
  }
}

function drawFences(ctx, stage, pal) {
  for (const f of stage.fences) {
    ctx.fillStyle = pal.wall;
    ctx.fillRect(f.x, f.y, f.w, f.h);
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.fillRect(f.x, f.y, f.w, 4);
    // Fence posts.
    ctx.fillStyle = '#5b3a1e';
    const horizontal = f.w > f.h;
    const n = Math.max(2, Math.floor((horizontal ? f.w : f.h) / 44));
    for (let i = 0; i <= n; i++) {
      const px = horizontal ? f.x + (f.w * i) / n : f.x + f.w / 2;
      const py = horizontal ? f.y + f.h / 2 : f.y + (f.h * i) / n;
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawCorn(ctx, stage, time) {
  for (const c of stage.corn) {
    if (c.taken) continue;
    const bob = Math.sin(time * 3 + c.bob) * 2;
    ctx.fillStyle = '#f7c948';
    ctx.beginPath(); ctx.ellipse(c.x, c.y + bob, 9, 6, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e0a92e';
    ctx.beginPath(); ctx.ellipse(c.x, c.y + bob, 5, 3, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7cb342';
    ctx.beginPath(); ctx.moveTo(c.x - 8, c.y + bob); ctx.lineTo(c.x - 13, c.y + bob + 6); ctx.lineTo(c.x - 5, c.y + bob + 4); ctx.fill();
  }
}

function drawKnives(ctx, stage) {
  for (const k of stage.knives) {
    if (k.kind === 'swing') {
      // A real blade: a tapered steel wedge on a wooden handle, pivoting on its nail.
      const a = swingAngle(k);
      const tip = swingTip(k);
      const perp = { x: -Math.sin(a), y: Math.cos(a) };
      const hx = k.pivot.x + Math.cos(a) * 16, hy = k.pivot.y + Math.sin(a) * 16;
      ctx.fillStyle = '#5b3a1e';
      ctx.beginPath(); ctx.arc(k.pivot.x, k.pivot.y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b4a26';
      ctx.beginPath();
      ctx.moveTo(hx - perp.x * 4, hy - perp.y * 4);
      ctx.lineTo(hx + perp.x * 4, hy + perp.y * 4);
      ctx.lineTo(k.pivot.x + Math.cos(a) * 30 - perp.x * 3, k.pivot.y + Math.sin(a) * 30 - perp.y * 3);
      ctx.lineTo(k.pivot.x + Math.cos(a) * 30 + perp.x * 3, k.pivot.y + Math.sin(a) * 30 + perp.y * 3);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c0c8d0';
      ctx.beginPath();
      ctx.moveTo(k.pivot.x + Math.cos(a) * 28 - perp.x * 5, k.pivot.y + Math.sin(a) * 28 - perp.y * 5);
      ctx.lineTo(tip.x, tip.y);
      ctx.lineTo(k.pivot.x + Math.cos(a) * 28 + perp.x * 5, k.pivot.y + Math.sin(a) * 28 + perp.y * 5);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e8edf2';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(k.pivot.x + Math.cos(a) * 30, k.pivot.y + Math.sin(a) * 30);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
    } else {
      if (k.state === 'warn') {
        ctx.fillStyle = `rgba(255, 60, 40, ${0.25 + 0.45 * k.warn})`;
        ctx.fillRect(k.x - 14, 0, 28, WORLD.h);
        ctx.fillStyle = '#c0392b';
        ctx.font = 'bold 16px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', k.x, 40);
      } else if (k.state === 'fall') {
        drawKnifeBlade(ctx, k.x, k.y, 0);
      }
    }
  }
}

function drawKnifeBlade(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#c0c8d0';
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(7, 6); ctx.lineTo(0, 16); ctx.lineTo(-7, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(-5, 14, 10, 12);
  ctx.restore();
}

function drawTurkey(ctx, t, time) {
  ctx.save();
  ctx.translate(t.x, t.y);
  if (t.invuln > 0 && Math.floor(time * 12) % 2 === 0) ctx.globalAlpha = 0.45; // mercy blink
  const waddle = t.moving ? Math.sin(t.wobble) * 3 : 0;
  ctx.rotate(waddle * 0.02);
  // Tail feather fan (behind the body).
  const fan = [-0.9, -0.55, -0.2, 0.15, 0.5, 0.85];
  for (let i = 0; i < fan.length; i++) {
    const a = fan[i] + (t.facing < 0 ? Math.PI : 0) + Math.PI;
    ctx.fillStyle = i % 2 === 0 ? '#8d5a2b' : '#a06a35';
    ctx.save();
    ctx.rotate(a - Math.PI / 2 + (t.facing < 0 ? 0 : 0));
    ctx.beginPath(); ctx.ellipse(-t.facing * 14, -6, 6, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Body.
  ctx.fillStyle = '#6b4423';
  ctx.beginPath(); ctx.ellipse(0, 2, 17, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8d5a2b';
  ctx.beginPath(); ctx.ellipse(0, 4, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
  // Wing.
  ctx.fillStyle = '#5a3a1c';
  ctx.beginPath(); ctx.ellipse(-2, 3, 9, 6, -0.4, 0, Math.PI * 2); ctx.fill();
  // Head + neck.
  ctx.fillStyle = '#c97b4a';
  ctx.beginPath(); ctx.arc(t.facing * 12, -12, 8, 0, Math.PI * 2); ctx.fill();
  // Beak + wattle.
  ctx.fillStyle = '#e8a13c';
  ctx.beginPath(); ctx.moveTo(t.facing * 18, -13); ctx.lineTo(t.facing * 26, -10); ctx.lineTo(t.facing * 18, -8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.beginPath(); ctx.ellipse(t.facing * 14, -4, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Eye.
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(t.facing * 14, -14, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(t.facing * 15, -14, 1.6, 0, Math.PI * 2); ctx.fill();
  // Feet.
  ctx.strokeStyle = '#e8a13c';
  ctx.lineWidth = 2;
  const step = t.moving ? Math.sin(t.wobble) * 4 : 0;
  ctx.beginPath(); ctx.moveTo(-4, 14); ctx.lineTo(-4 + step, 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4, 14); ctx.lineTo(4 - step, 20); ctx.stroke();
  ctx.restore();

  // Dash cooldown ring.
  if (t.dashCooldown > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 24, -Math.PI / 2, -Math.PI / 2 + (1 - t.dashCooldown / 1.1) * Math.PI * 2);
    ctx.stroke();
  }
}

function drawFarmer(ctx, f, time) {
  ctx.save();
  ctx.translate(f.x, f.y);
  const bob = Math.sin(f.stride) * 2;
  // Legs (overalls).
  ctx.strokeStyle = '#2e4a7a';
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(-6, 4); ctx.lineTo(-6 + bob, 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, 4); ctx.lineTo(6 - bob, 18); ctx.stroke();
  // Body: plaid shirt + overalls.
  ctx.fillStyle = '#b03a2e';
  ctx.beginPath(); ctx.ellipse(0, -2, 16, 15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2e4a7a';
  ctx.fillRect(-12, 2, 24, 10);
  // Arms reaching forward (toward the turkey).
  ctx.strokeStyle = '#b03a2e';
  ctx.lineWidth = 6;
  const reach = f.state === 'chase' ? 8 : 2;
  ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(-18 - reach, 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(18 + reach, 2); ctx.stroke();
  // Head + straw hat.
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath(); ctx.arc(0, -20, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d9a441';
  ctx.beginPath(); ctx.ellipse(0, -26, 17, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-8, -34, 16, 9);
  // Eyes + moustache.
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-4, -21, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4, -21, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a5a3a';
  ctx.fillRect(-6, -14, 12, 3);
  ctx.restore();

  // "!" when he spots the turkey; "?" while searching.
  if (f.spotted || f.state === 'chase') {
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', f.x, f.y - 46);
  } else if (f.state === 'search') {
    ctx.fillStyle = '#f7c948';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', f.x, f.y - 46);
  }
  // Sight ring while patrolling (shows the player his vision).
  if (f.state === 'patrol') {
    ctx.strokeStyle = 'rgba(231, 76, 60, .18)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(f.x, f.y, f.sight, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawHUD(ctx, game) {
  ctx.fillStyle = 'rgba(43,29,18,.72)';
  ctx.fillRect(0, 0, WORLD.w, 34);
  ctx.fillStyle = '#f7e3b0';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`🌽 Score ${game.score}`, 12, 23);
  ctx.fillText(`Distance ${Math.floor(game.turkey.distance)} m`, 220, 23);
  ctx.fillText(`Stage ${game.stageIndex + 1}/3 · ${game.stage.name}`, 430, 23);
  ctx.textAlign = 'right';
  let hearts = '';
  for (let i = 0; i < 3; i++) hearts += i < game.lives ? '♥ ' : '♡ ';
  ctx.fillStyle = '#ff6b6b';
  ctx.fillText(hearts.trim(), WORLD.w - 12, 23);
  ctx.textAlign = 'left';
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(43,29,18,.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#d9a441';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
}

function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(20,12,6,.55)';
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  panel(ctx, 180, 110, 600, 330);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f7c948';
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText('TURKEY RUN', 480, 185);
  ctx.fillStyle = '#e8a13c';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('Thanksgiving Escape', 480, 225);
  ctx.fillStyle = '#f7e3b0';
  ctx.font = '17px Georgia, serif';
  ctx.fillText('Thanksgiving is coming — and you are the main course.', 480, 265);
  ctx.fillText('Outrun the farmer, dodge ovens and carving knives,', 480, 292);
  ctx.fillText('gobble corn and escape through the gate — farmyard,', 480, 319);
  ctx.fillText('barn, then the kitchen. Three lives. Good luck, bird.', 480, 346);
  ctx.fillStyle = '#f7c948';
  ctx.font = 'bold 19px Georgia, serif';
  ctx.fillText('WASD / arrows to run · SPACE or CLICK to dash', 480, 385);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(game.blink ? '▶ Press ENTER or CLICK to start' : '', 480, 418);
  ctx.textAlign = 'left';
}

function drawStageClear(ctx, game) {
  ctx.fillStyle = 'rgba(20,12,6,.45)';
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  panel(ctx, 230, 200, 500, 150);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7ddb8a';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText(`${game.stage.name} escaped!`, 480, 255);
  ctx.fillStyle = '#f7e3b0';
  ctx.font = '18px Georgia, serif';
  ctx.fillText(game.stageIndex + 1 < 3 ? `Next: ${STAGE_NAMES[game.stageIndex + 1]} — the farmer is faster there.` : '', 480, 295);
  ctx.fillText('Get ready…', 480, 322);
  ctx.textAlign = 'left';
}

function drawEnd(ctx, game) {
  ctx.fillStyle = 'rgba(20,12,6,.6)';
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  const escaped = game.state === 'escaped';
  panel(ctx, 210, 140, 540, 300);
  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#7ddb8a' : '#ff6b6b';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', 480, 210);
  ctx.fillStyle = '#f7e3b0';
  ctx.font = '19px Georgia, serif';
  ctx.fillText(
    escaped
      ? 'You slipped out the back door — no turkey dinner this year!'
      : 'The farmer got you… dinner is served. Gobble gobble.',
    480, 250,
  );
  ctx.fillText(`Final score: ${game.score}`, 480, 292);
  ctx.fillText(`Distance run: ${Math.floor(game.turkey.distance)} m · Corn eaten: ${game.cornEaten}`, 480, 320);
  ctx.fillStyle = '#f7c948';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(game.blink ? '▶ Press ENTER or CLICK to run again' : '', 480, 380);
  ctx.fillStyle = '#c9b8a3';
  ctx.font = '15px Georgia, serif';
  ctx.fillText('Turkey Run: Thanksgiving Escape — a turkey escape game', 480, 412);
  ctx.textAlign = 'left';
}
