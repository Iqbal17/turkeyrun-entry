// hazards.js — ovens, carving knives and the hit tests for all of them.
// Ovens are hot floor zones; knives either swing on a pivot or drop from above with a
// warning flash. Each hazard reports whether it hurt the turkey this frame.
import { distToSegment } from './levels.js';

export function updateHazards(stage, dt, audio) {
  for (const k of stage.knives) {
    if (k.kind === 'swing') {
      k.phase += dt * k.speed * stage.knifeRate;
    } else if (k.kind === 'drop') {
      k.timer -= dt;
      if (k.state === 'wait') {
        if (k.timer <= 0) { k.state = 'warn'; k.timer = 0.55; k.warn = 1; }
      } else if (k.state === 'warn') {
        k.warn = 1 - k.timer / 0.55;
        if (k.timer <= 0) { k.state = 'fall'; k.y = -30; audio.knife(); }
      } else if (k.state === 'fall') {
        k.y += k.speed * dt;
        if (k.y > 620) { k.state = 'wait'; k.timer = 1.4 + Math.random() * 1.6; k.x = 120 + Math.random() * 720; k.warn = 0; }
      }
    }
  }
}

// Current angle of a swinging knife.
export function swingAngle(k) {
  return k.baseAngle + Math.sin(k.phase) * k.sweep;
}

// Tip of a swinging knife blade.
export function swingTip(k) {
  const a = swingAngle(k);
  return { x: k.pivot.x + Math.cos(a) * k.len, y: k.pivot.y + Math.sin(a) * k.len };
}

// True when any hazard touches the turkey (caller applies damage + invulnerability).
export function hazardTouching(t, stage) {
  for (const o of stage.ovens) {
    if (t.x > o.x && t.x < o.x + o.w && t.y > o.y && t.y < o.y + o.h) return 'oven';
  }
  for (const k of stage.knives) {
    if (k.kind === 'swing') {
      const tip = swingTip(k);
      if (distToSegment(t.x, t.y, k.pivot.x, k.pivot.y, tip.x, tip.y) < t.r + 6) return 'knife';
    } else if (k.kind === 'drop' && k.state === 'fall') {
      if (Math.abs(t.x - k.x) < 16 && Math.abs(t.y - k.y) < 34) return 'knife';
    }
  }
  return null;
}
