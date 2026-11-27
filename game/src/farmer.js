// farmer.js — the farmer chase AI.
// States: patrol (walks his route), chase (turkey in sight: runs at it, faster the farther
// away it is), search (lost sight: hurries to where he last saw the turkey, looks around),
// cornered logic: in chase he steers toward a point slightly ahead of the turkey, so he can
// cut it off at a fence instead of trailing behind it forever.
import { WORLD } from './levels.js';

export function createFarmer(x, y, patrol, baseSpeed, sight) {
  return {
    x, y, r: 20,
    patrol, patrolIndex: 0,
    baseSpeed, sight,
    state: 'patrol',       // 'patrol' | 'chase' | 'search'
    lastSeen: null,        // {x, y} where the turkey was last spotted
    lostTimer: 0,          // seconds since sight was lost
    searchTimer: 0,
    spotted: false,        // just spotted this frame (for the "!" feedback + sound)
    vx: 0, vy: 0,
    stride: 0,
  };
}

function canSee(f, t, fences) {
  const dx = t.x - f.x, dy = t.y - f.y;
  const d = Math.hypot(dx, dy);
  if (d > f.sight) return false;
  // Line of sight is blocked by any fence the segment crosses.
  for (const w of fences) {
    if (segmentHitsRect(f.x, f.y, t.x, t.y, w)) return false;
  }
  return true;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does the segment cross the rectangle?
  const dx = x2 - x1, dy = y2 - y1;
  let tmin = 0, tmax = 1;
  if (dx === 0) { if (x1 < r.x || x1 > r.x + r.w) return false; }
  else {
    let a = (r.x - x1) / dx, b = (r.x + r.w - x1) / dx;
    if (a > b) [a, b] = [b, a];
    tmin = Math.max(tmin, a); tmax = Math.min(tmax, b);
    if (tmin > tmax) return false;
  }
  if (dy === 0) { if (y1 < r.y || y1 > r.y + r.h) return false; }
  else {
    let a = (r.y - y1) / dy, b = (r.y + r.h - y1) / dy;
    if (a > b) [a, b] = [b, a];
    tmin = Math.max(tmin, a); tmax = Math.min(tmax, b);
    if (tmin > tmax) return false;
  }
  return true;
}

function steer(f, tx, ty, speed, dt, fences) {
  const dx = tx - f.x, dy = ty - f.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) { f.vx = 0; f.vy = 0; return; }
  f.vx = (dx / d) * speed;
  f.vy = (dy / d) * speed;
  f.x += f.vx * dt;
  f.y += f.vy * dt;
  f.stride += dt * 10;
  // Slide along fences instead of sticking to them.
  for (const w of fences) {
    const cx = Math.max(w.x, Math.min(f.x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(f.y, w.y + w.h));
    const ox = f.x - cx, oy = f.y - cy;
    const od = Math.hypot(ox, oy);
    if (od < f.r && od > 0.001) { f.x = cx + (ox / od) * f.r; f.y = cy + (oy / od) * f.r; }
  }
  f.x = Math.max(f.r + 4, Math.min(WORLD.w - f.r - 4, f.x));
  f.y = Math.max(f.r + 4, Math.min(WORLD.h - f.r - 4, f.y));
}

export function updateFarmer(f, t, dt, fences, audio) {
  f.spotted = false;
  const seen = canSee(f, t, fences);
  const dist = Math.hypot(t.x - f.x, t.y - f.y);

  if (seen) {
    if (f.state !== 'chase') { f.spotted = true; audio.spotted(); }
    f.state = 'chase';
    f.lastSeen = { x: t.x, y: t.y };
    f.lostTimer = 0;
  } else if (f.state === 'chase') {
    f.lostTimer += dt;
    if (f.lostTimer > 2.2) { f.state = 'search'; f.searchTimer = 0; }
  }

  if (f.state === 'chase') {
    // Speed grows with distance: a far turkey makes him run harder, and he aims a little
    // ahead of the turkey so he can cut it off at a wall instead of trailing it.
    const speed = f.baseSpeed + Math.min(120, dist * 0.28);
    const lead = 0.35;
    const aimX = t.x + (t.vx || 0) * lead;
    const aimY = t.y + (t.vy || 0) * lead;
    steer(f, aimX, aimY, speed, dt, fences);
  } else if (f.state === 'search' && f.lastSeen) {
    const d = Math.hypot(f.lastSeen.x - f.x, f.lastSeen.y - f.y);
    if (d > 12) {
      steer(f, f.lastSeen.x, f.lastSeen.y, f.baseSpeed * 1.1, dt, fences);
    } else {
      f.searchTimer += dt;
      if (f.searchTimer > 1.6) { f.state = 'patrol'; f.lastSeen = null; }
    }
  } else {
    // Patrol: amble between waypoints.
    const wp = f.patrol[f.patrolIndex];
    const d = Math.hypot(wp.x - f.x, wp.y - f.y);
    if (d < 14) f.patrolIndex = (f.patrolIndex + 1) % f.patrol.length;
    else steer(f, wp.x, wp.y, f.baseSpeed * 0.55, dt, fences);
  }
}

// Has the farmer caught the turkey?
export function farmerCaught(f, t) {
  return Math.hypot(f.x - t.x, f.y - t.y) < f.r + t.r - 6;
}
