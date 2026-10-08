/*
 * The hover field behind each app card (see .cx-app-noise in global.css), on
 * the clients page and the homepage: a grid of tiny digits in the card's
 * `--glow`, flickering on and off like a stream of data.
 *
 * Every cell holds a digit and an intensity that decays each frame. While
 * the row is hovered, random cells are struck with a fresh digit at full
 * strength, and a lit cell occasionally changes digit as it fades. Each is
 * drawn multiplied by a mask that keeps the inside of the row faint and
 * fades the gutters to nothing at their far edge, and the brightest burn
 * toward white.
 *
 * It runs only while a row is hovered and until its last digit has faded,
 * at roughly 30fps. Nothing runs on touch screens or with reduced motion.
 */
const CELL_W = 7;
const CELL_H = 10;
const FRAME = 1000 / 30;

const hoverable = matchMedia('(hover: hover)').matches;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

function rgb(color: string): [number, number, number] {
  const probe = document.createElement('canvas').getContext('2d')!;
  probe.fillStyle = color;
  const hex = probe.fillStyle as string;
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}

function field(row: HTMLElement, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  const [r, g, b] = rgb(getComputedStyle(row).getPropertyValue('--glow').trim());
  const font = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-mono')
    .trim();

  let cols = 0;
  let rows = 0;
  let width = 0;
  let height = 0;
  let heat = new Float32Array(0);
  let mask = new Float32Array(0);
  let digit = new Uint8Array(0);
  let hovered = false;
  let running = false;
  let last = 0;

  function size() {
    const box = canvas.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    width = box.width;
    height = box.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `8px ${font || 'monospace'}`;
    ctx.textBaseline = 'top';

    cols = Math.ceil(width / CELL_W);
    rows = Math.ceil(height / CELL_H);
    heat = new Float32Array(cols * rows);
    mask = new Float32Array(cols * rows);
    digit = new Uint8Array(cols * rows);

    // The row's span inside the canvas, in pixels.
    const left = rowBox.left - box.left;
    const right = rowBox.right - box.left;
    const top = rowBox.top - box.top;
    const bottom = rowBox.bottom - box.top;

    for (let y = 0; y < rows; y++) {
      const py = y * CELL_H + CELL_H / 2;
      const vy =
        py < top ? py / top : py > bottom ? (height - py) / (height - bottom) : 1;
      for (let x = 0; x < cols; x++) {
        const px = x * CELL_W + CELL_W / 2;
        let m: number;
        if (px < left) m = Math.pow(px / Math.max(1, left), 1.5);
        else if (px > right) m = Math.pow((width - px) / Math.max(1, width - right), 1.5);
        else m = 0.18;
        mask[y * cols + x] = m * Math.max(0, Math.min(1, vy));
      }
    }
  }

  function step() {
    if (hovered) {
      const strikes = Math.ceil(cols * rows * 0.02);
      for (let i = 0; i < strikes; i++) {
        const k = (Math.random() * heat.length) | 0;
        heat[k] = 0.5 + Math.random() * 0.5;
        digit[k] = (Math.random() * 10) | 0;
      }
    }

    ctx.clearRect(0, 0, width, height);
    let any = false;
    for (let k = 0; k < heat.length; k++) {
      heat[k] *= 0.86;
      const v = heat[k] * mask[k];
      if (heat[k] > 0.03) any = true;
      if (v < 0.03) continue;
      if (Math.random() < 0.06) digit[k] = (Math.random() * 10) | 0;
      // The brightest digits burn through to white.
      const white = v > 0.7 ? (v - 0.7) * 2.5 : 0;
      ctx.fillStyle = `rgba(${r + (255 - r) * white},${g + (255 - g) * white},${b + (255 - b) * white},${v})`;
      ctx.fillText(String(digit[k]), (k % cols) * CELL_W, ((k / cols) | 0) * CELL_H);
    }
    return any;
  }

  function loop(now: number) {
    if (now - last >= FRAME) {
      last = now;
      if (!step() && !hovered) {
        running = false;
        return;
      }
    }
    requestAnimationFrame(loop);
  }

  row.addEventListener('pointerenter', () => {
    hovered = true;
    if (!running) {
      size();
      running = true;
      requestAnimationFrame(loop);
    }
  });
  row.addEventListener('pointerleave', () => {
    hovered = false;
  });
}

if (hoverable && !still) {
  for (const row of document.querySelectorAll<HTMLElement>('.cx-app')) {
    const canvas = row.querySelector<HTMLCanvasElement>('.cx-app-noise');
    if (canvas) field(row, canvas);
  }
}
