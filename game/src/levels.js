// levels.js — the three stages: farmyard, barn, kitchen. Each stage is a layout of
// fences (solid walls), ovens (hot zones), knife rigs, corn, patrol routes and the exit gate.
// Difficulty grows: more knives, hotter ovens, a faster, keener farmer.
export const STAGE_NAMES = ['Farmyard', 'Barn', 'Kitchen'];
export const WORLD = { w: 960, h: 600 };

function cornRow(x0, y, n, gap) {
  const out = [];
  for (let i = 0; i < n; i++) out.push({ x: x0 + i * gap, y, taken: false, bob: Math.random() * 6.28 });
  return out;
}

// A swinging knife pivots on `pivot` and sweeps an arc of `sweep` radians around `baseAngle`.
function swingKnife(px, py, len, baseAngle, sweep, speed) {
  return { kind: 'swing', pivot: { x: px, y: py }, len, baseAngle, sweep, speed, phase: Math.random() * 6.28 };
}
// A falling knife drops from the ceiling at `x`, pauses, then plunges to the floor.
function dropKnife(x, delay, speed) {
  return { kind: 'drop', x, y: -30, delay, speed, state: 'wait', timer: delay, warn: 0 };
}

export function buildStage(index) {
  const base = {
    name: STAGE_NAMES[index],
    index,
    turkeyStart: { x: 80, y: 520 },
    farmerStart: { x: 700, y: 120 },
    farmerPatrol: [{ x: 700, y: 120 }, { x: 300, y: 140 }, { x: 480, y: 420 }, { x: 820, y: 380 }],
    exit: { x: 880, y: 60, w: 56, h: 80 },
    fences: [], ovens: [], knives: [], corn: [],
    farmerSight: 250, farmerBaseSpeed: 165, knifeRate: 1,
  };

  if (index === 0) {
    // Farmyard: open grass, two fence lines to steer around, corn trails, one swinging knife
    // hung from the old oak (the farmer's practice target).
    base.fences = [
      { x: 220, y: 180, w: 180, h: 18 },
      { x: 560, y: 330, w: 180, h: 18 },
      { x: 380, y: 90, w: 18, h: 120 },
    ];
    base.knives = [swingKnife(640, 210, 90, Math.PI / 2, 1.1, 1.4)];
    base.corn = [...cornRow(140, 300, 5, 46), ...cornRow(620, 470, 4, 46), ...cornRow(300, 470, 3, 46)];
    base.farmerSight = 240; base.farmerBaseSpeed = 160;
  } else if (index === 1) {
    // Barn: tighter wooden hall, hay-bale fences, two swinging knives and the first drop knife.
    base.fences = [
      { x: 150, y: 150, w: 220, h: 18 },
      { x: 590, y: 150, w: 220, h: 18 },
      { x: 150, y: 420, w: 220, h: 18 },
      { x: 590, y: 420, w: 220, h: 18 },
      { x: 470, y: 260, w: 18, h: 90 },
    ];
    base.knives = [
      swingKnife(300, 300, 80, 0, 1.4, 1.9),
      swingKnife(680, 300, 80, Math.PI, 1.4, 1.9),
      dropKnife(480, 1.2, 420),
    ];
    base.corn = [...cornRow(120, 300, 4, 46), ...cornRow(760, 300, 4, 46), ...cornRow(430, 90, 3, 46), ...cornRow(430, 510, 3, 46)];
    base.farmerSight = 270; base.farmerBaseSpeed = 180; base.knifeRate = 1.4;
  } else {
    // Kitchen: the final dash. Hot ovens glow along the walls, knives drop and swing,
    // the farmer is fastest and sharpest-eyed. The back door is the exit.
    base.fences = [
      { x: 200, y: 140, w: 16, h: 320 },
      { x: 744, y: 140, w: 16, h: 320 },
      { x: 420, y: 90, w: 120, h: 16 },
    ];
    base.ovens = [
      { x: 20, y: 48, w: 130, h: 90 },
      { x: 810, y: 490, w: 130, h: 90 },
      { x: 20, y: 490, w: 90, h: 90 },
    ];
    base.knives = [
      swingKnife(480, 300, 95, Math.PI / 2, 1.5, 2.3),
      dropKnife(300, 0.8, 520),
      dropKnife(660, 1.6, 520),
    ];
    base.corn = [...cornRow(280, 300, 3, 46), ...cornRow(620, 300, 3, 46), ...cornRow(430, 200, 3, 46), ...cornRow(430, 430, 3, 46)];
    base.farmerSight = 300; base.farmerBaseSpeed = 200; base.knifeRate = 1.8;
    // The turkey starts centre-bottom here: the farmyard corner (80, 520) sits
    // inside the bottom-left oven in this stage, and a respawn must never be a burn.
    base.turkeyStart = { x: 480, y: 520 };
  }
  return base;
}

// Distance from a point to a segment, used by the swinging-knife hit test.
export function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}
