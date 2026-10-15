import "./style.css";
import { Game, N } from "./game";
import { Piece } from "./pieces";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const game = new Game();

let W = 0,
  H = 0,
  cell = 0,
  bx = 0,
  by = 0,
  trayY = 0,
  slotW = 0,
  trayCell = 0;
let drag: { i: number; x: number; y: number } | null = null;
let flash: { cells: number[][]; t: number } | null = null;
const dim = [0, 0, 0];
const lastPiece: (Piece | null)[] = [null, null, null];

function mixColor(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const m = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${m[0]}, ${m[1]}, ${m[2]})`;
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const size = Math.min(W - 24, H * 0.56);
  cell = size / N;
  bx = (W - size) / 2;
  by = Math.max(80, H * 0.12);
  trayY = by + size + 24;
  slotW = W / 3;
  trayCell = Math.min(cell * 0.7, slotW / 5.6);
}
window.addEventListener("resize", resize);
resize();

function vibrate(ms: number) {
  if ("vibrate" in navigator) navigator.vibrate(ms);
}

function drawBlock(x: number, y: number, s: number, color: string, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x + 1, y + 1, s - 2, s - 2, s * 0.18);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.roundRect(x + 3, y + 3, s - 6, (s - 6) * 0.35, s * 0.12);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawPiece(p: Piece, x: number, y: number, s: number, alpha = 1) {
  p.cells.forEach(([r, c]) =>
    drawBlock(x + c * s, y + r * s, s, p.color, alpha),
  );
}

function target(): { r: number; c: number } | null {
  if (!drag) return null;
  const p = game.pieces[drag.i];
  if (!p) return null;
  const px = drag.x - (p.w * cell) / 2;
  const py = drag.y - cell * 2 - (p.h * cell) / 2;
  return { c: Math.round((px - bx) / cell), r: Math.round((py - by) / cell) };
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#14172b";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 ${Math.min(34, W * 0.08)}px system-ui, sans-serif`;
  ctx.fillText(String(game.score), bx, by - 28);
  ctx.font = `500 ${Math.min(16, W * 0.04)}px system-ui, sans-serif`;
  ctx.fillStyle = "#8b92b8";
  ctx.fillText("PONTOS", bx, by - 62);
  ctx.textAlign = "right";
  ctx.fillText("RECORDE", bx + cell * N, by - 62);
  ctx.fillStyle = "#feca57";
  ctx.font = `700 ${Math.min(26, W * 0.06)}px system-ui, sans-serif`;
  ctx.fillText(String(game.best), bx + cell * N, by - 28);

  ctx.fillStyle = "#1e2342";
  ctx.beginPath();
  ctx.roundRect(bx - 6, by - 6, cell * N + 12, cell * N + 12, 14);
  ctx.fill();

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const shade =
        (Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 0
          ? "#2a3058"
          : "#232949";
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.roundRect(
        bx + c * cell + 1,
        by + r * cell + 1,
        cell - 2,
        cell - 2,
        cell * 0.15,
      );
      ctx.fill();
      const col = game.board[r][c];
      if (col) drawBlock(bx + c * cell, by + r * cell, cell, col);
    }
  }

  ctx.strokeStyle = "#5b6396";
  ctx.lineWidth = 2;
  for (let i = 0; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(bx + i * 3 * cell, by);
    ctx.lineTo(bx + i * 3 * cell, by + N * cell);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx, by + i * 3 * cell);
    ctx.lineTo(bx + N * cell, by + i * 3 * cell);
    ctx.stroke();
  }

  if (flash && performance.now() - flash.t < 250) {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    flash.cells.forEach(([r, c]) =>
      ctx.fillRect(bx + c * cell, by + r * cell, cell, cell),
    );
  }

  const t = target();
  if (drag && t) {
    const p = game.pieces[drag.i]!;
    if (game.canPlace(p, t.r, t.c)) {
      const willClear = game.previewClear(p, t.r, t.c);
      drawPiece(
        p,
        bx + t.c * cell,
        by + t.r * cell,
        cell,
        willClear.length ? 0.6 : 0.35,
      );

      if (willClear.length) {
        const pulse = 0.35 + 0.25 * Math.sin(performance.now() / 110);
        willClear.forEach(([r, c]) => {
          const x = bx + c * cell,
            y = by + r * cell;
          ctx.fillStyle = `rgba(255, 214, 90, ${pulse})`;
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, cell - 2, cell - 2, cell * 0.18);
          ctx.fill();
          ctx.strokeStyle = `rgba(255, 235, 150, ${0.5 + pulse})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, cell - 4, cell - 4, cell * 0.16);
          ctx.stroke();
        });
      }
    }
  }

  game.pieces.forEach((p, i) => {
    if (p !== lastPiece[i]) {
      dim[i] = 0;
      lastPiece[i] = p;
    }
    if (!p || (drag && drag.i === i)) return;

    const stuck = !game.canPlaceAnywhere(p);
    dim[i] += ((stuck ? 1 : 0) - dim[i]) * 0.15;
    const d = dim[i];

    const shake = Math.sin(performance.now() / 35) * 4 * (d * (1 - d) * 4);
    const x = i * slotW + (slotW - p.w * trayCell) / 2 + shake;
    const y = trayY + (5 * trayCell - p.h * trayCell) / 2;
    drawPiece(
      { ...p, color: mixColor(p.color, "#5c6280", d) },
      x,
      y,
      trayCell,
      1 - 0.45 * d,
    );
  });

  if (drag) {
    const p = game.pieces[drag.i];
    if (p)
      drawPiece(
        p,
        drag.x - (p.w * cell) / 2,
        drag.y - cell * 2 - (p.h * cell) / 2,
        cell,
      );
  }

  if (game.over) {
    ctx.fillStyle = "rgba(10,12,28,0.85)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = `800 ${Math.min(44, W * 0.1)}px system-ui, sans-serif`;
    ctx.fillText("Fim de jogo", W / 2, H / 2 - 40);
    ctx.font = `500 ${Math.min(24, W * 0.06)}px system-ui, sans-serif`;
    ctx.fillText(`Pontos: ${game.score}`, W / 2, H / 2 + 5);
    ctx.fillStyle = "#feca57";
    ctx.fillText(`Recorde: ${game.best}`, W / 2, H / 2 + 40);
    ctx.fillStyle = "#8b92b8";
    ctx.font = `500 ${Math.min(18, W * 0.045)}px system-ui, sans-serif`;
    ctx.fillText("Toca para jogar outra vez", W / 2, H / 2 + 90);
  }
  requestAnimationFrame(draw);
}

canvas.addEventListener("pointerdown", (e) => {
  if (game.over) {
    game.reset();
    return;
  }
  if (e.clientY < trayY - 20) return;
  const i = Math.min(2, Math.max(0, Math.floor(e.clientX / slotW)));
  const piece = game.pieces[i];
  if (!piece) return;
  if (!game.canPlaceAnywhere(piece)) {
    vibrate(30);
    return;
  }
  canvas.setPointerCapture(e.pointerId);
  drag = { i, x: e.clientX, y: e.clientY };
  vibrate(5);
});

canvas.addEventListener("pointermove", (e) => {
  if (drag) {
    drag.x = e.clientX;
    drag.y = e.clientY;
  }
});

function release() {
  if (!drag) return;
  const t = target();
  if (t) {
    const cleared = game.place(drag.i, t.r, t.c);
    if (cleared >= 0) {
      vibrate(cleared > 0 ? 40 : 10);
      if (cleared > 0)
        flash = { cells: game.lastCleared, t: performance.now() };
    }
  }
  drag = null;
}
canvas.addEventListener("pointerup", release);
canvas.addEventListener("pointercancel", () => {
  drag = null;
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") game.persist();
});
window.addEventListener("pagehide", () => game.persist());

game.restore().finally(() => requestAnimationFrame(draw));
