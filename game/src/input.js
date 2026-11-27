// input.js — keyboard (WASD / arrows) and mouse (click to dash) state, one job only.
export function createInput(canvas) {
  const keys = new Set();
  const mouse = { x: 0, y: 0, clicked: false, down: false };

  const keyName = (e) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') return 'up';
    if (k === 'arrowdown' || k === 's') return 'down';
    if (k === 'arrowleft' || k === 'a') return 'left';
    if (k === 'arrowright' || k === 'd') return 'right';
    if (k === ' ') return 'dash';
    if (k === 'enter') return 'enter';
    return null;
  };

  window.addEventListener('keydown', (e) => {
    const n = keyName(e);
    if (n) { keys.add(n); if (n === 'dash' || n.startsWith('arrow')) e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => { const n = keyName(e); if (n) keys.delete(n); });
  window.addEventListener('blur', () => keys.clear());

  const toLocal = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  };
  canvas.addEventListener('mousemove', (e) => { const p = toLocal(e); mouse.x = p.x; mouse.y = p.y; });
  canvas.addEventListener('mousedown', (e) => {
    const p = toLocal(e); mouse.x = p.x; mouse.y = p.y; mouse.down = true; mouse.clicked = true;
  });
  window.addEventListener('mouseup', () => { mouse.down = false; });

  return {
    keys, mouse,
    // Unit vector of the held movement keys, or null when none are held.
    moveVector() {
      let x = 0, y = 0;
      if (keys.has('left')) x -= 1;
      if (keys.has('right')) x += 1;
      if (keys.has('up')) y -= 1;
      if (keys.has('down')) y += 1;
      if (x === 0 && y === 0) return null;
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
    dashPressed() { return keys.has('dash'); },
    enterPressed() { return keys.has('enter'); },
    // Consumes a mouse click (true once per click).
    consumeClick() { const c = mouse.clicked; mouse.clicked = false; return c; },
  };
}
