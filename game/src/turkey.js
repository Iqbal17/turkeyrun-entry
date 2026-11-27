// turkey.js — the player: a turkey that runs, dashes and pecks corn.
// Movement is velocity-based with a short dash burst; fences and the arena walls are solid.
import { WORLD } from './levels.js';

export function createTurkey(x, y) {
  return {
    x, y, r: 16,
    vx: 0, vy: 0,
    speed: 235,
    facing: 1,            // -1 left, 1 right (for the tail fan)
    dashTime: 0,          // seconds of dash left
    dashCooldown: 0,
    dashDir: { x: 1, y: 0 },
    invuln: 0,            // seconds of post-hit mercy
    wobble: 0,            // walk-cycle phase for the waddle
    moving: false,
    distance: 0,          // total metres waddled, for the HUD
  };
}

function collideWalls(t, fences) {
  // Keep the turkey inside the arena.
  t.x = Math.max(t.r + 6, Math.min(WORLD.w - t.r - 6, t.x));
  t.y = Math.max(t.r + 6, Math.min(WORLD.h - t.r - 6, t.y));
  // Push out of each fence rectangle (circle vs AABB).
  for (const f of fences) {
    const cx = Math.max(f.x, Math.min(t.x, f.x + f.w));
    const cy = Math.max(f.y, Math.min(t.y, f.y + f.h));
    const dx = t.x - cx, dy = t.y - cy;
    const d = Math.hypot(dx, dy);
    if (d < t.r && d > 0.001) {
      t.x = cx + (dx / d) * t.r;
      t.y = cy + (dy / d) * t.r;
    } else if (d <= 0.001) {
      t.y = f.y - t.r; // centre inside the fence: pop it out the top
    }
  }
}

export function updateTurkey(t, dt, input, fences, audio) {
  if (t.invuln > 0) t.invuln -= dt;
  if (t.dashCooldown > 0) t.dashCooldown -= dt;

  const mv = input.moveVector();
  const click = input.consumeClick();

  // A click dashes toward the cursor; SPACE dashes in the movement (or facing) direction.
  if (click) {
    const dx = input.mouse.x - t.x, dy = input.mouse.y - t.y;
    const len = Math.hypot(dx, dy);
    if (len > 8 && t.dashCooldown <= 0) startDash(t, dx / len, dy / len, audio);
  } else if (input.dashPressed() && t.dashCooldown <= 0) {
    const d = mv ?? { x: t.facing, y: 0 };
    startDash(t, d.x, d.y, audio);
  }

  if (t.dashTime > 0) {
    t.dashTime -= dt;
    t.vx = t.dashDir.x * 560;
    t.vy = t.dashDir.y * 560;
  } else if (mv) {
    t.vx = mv.x * t.speed;
    t.vy = mv.y * t.speed;
    t.facing = mv.x !== 0 ? Math.sign(mv.x) : t.facing;
    t.wobble += dt * 14;
    t.moving = true;
  } else {
    t.vx = 0; t.vy = 0; t.moving = false;
  }

  const step = Math.hypot(t.vx, t.vy) * dt;
  t.distance += step / 50; // 50 px ≈ 1 metre
  t.x += t.vx * dt;
  t.y += t.vy * dt;
  collideWalls(t, fences);
}

function startDash(t, dx, dy, audio) {
  t.dashTime = 0.18;
  t.dashCooldown = 1.1;
  t.dashDir = { x: dx, y: dy };
  audio.dash();
}

// Pecks up any corn kernel within reach. Returns the number eaten.
export function eatCorn(t, corn, audio) {
  let eaten = 0;
  for (const c of corn) {
    if (!c.taken && Math.hypot(c.x - t.x, c.y - t.y) < t.r + 12) {
      c.taken = true;
      eaten++;
      audio.peck();
    }
  }
  return eaten;
}

// Is the turkey standing in the exit gate?
export function atExit(t, exit) {
  return t.x > exit.x - 8 && t.x < exit.x + exit.w + 8 && t.y > exit.y - 8 && t.y < exit.y + exit.h + 8;
}
