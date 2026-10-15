import { Piece, randomPiece } from "./pieces";
import { load, save, remove } from "./storage";

export const N = 9;

interface SaveData {
  board: (string | null)[][];
  pieces: (Piece | null)[];
  score: number;
  combo: number;
}

export class Game {
  board: (string | null)[][] = [];
  pieces: (Piece | null)[] = [];
  score = 0;
  best = 0;
  combo = 0;
  over = false;
  lastCleared: number[][] = [];

  constructor() {
    this.reset(false);
  }

  /** Carrega recorde e jogo guardado (chamar uma vez ao arrancar). */
  async restore() {
    this.best = Number((await load("best")) ?? 0);
    try {
      const raw = await load("save");
      if (!raw) return;
      const d = JSON.parse(raw) as SaveData;
      const okBoard =
        Array.isArray(d.board) &&
        d.board.length === N &&
        d.board.every((r) => Array.isArray(r) && r.length === N);
      const okPieces = Array.isArray(d.pieces) && d.pieces.length === 3;
      if (!okBoard || !okPieces) return;
      this.board = d.board;
      this.pieces = d.pieces;
      this.score = Number(d.score) || 0;
      this.combo = Number(d.combo) || 0;
      this.over = false;
    } catch {
      remove("save");
    }
  }

  /** Guarda o jogo atual. Se acabou, apaga o save. */
  persist() {
    if (this.over) {
      remove("save");
      return;
    }
    const data: SaveData = {
      board: this.board,
      pieces: this.pieces,
      score: this.score,
      combo: this.combo,
    };
    save("save", JSON.stringify(data));
  }

  private saveBest() {
    if (this.score > this.best) {
      this.best = this.score;
      save("best", String(this.best));
    }
  }

  reset(persist = true) {
    this.board = Array.from({ length: N }, () =>
      Array<string | null>(N).fill(null),
    );
    this.score = 0;
    this.combo = 0;
    this.over = false;
    this.lastCleared = [];
    this.refill();
    if (persist) this.persist();
  }

  private refill() {
    this.pieces = [randomPiece(), randomPiece(), randomPiece()];
    this.checkGameOver();
  }

  canPlace(p: Piece, r: number, c: number): boolean {
    return p.cells.every(([dr, dc]) => {
      const rr = r + dr,
        cc = c + dc;
      return (
        rr >= 0 && rr < N && cc >= 0 && cc < N && this.board[rr][cc] === null
      );
    });
  }

  /** Células que seriam limpas se a peça fosse colocada em (r, c). Não altera o tabuleiro. */
  previewClear(p: Piece, r: number, c: number): number[][] {
    if (!this.canPlace(p, r, c)) return [];
    const filled = (rr: number, cc: number) =>
      this.board[rr][cc] !== null ||
      p.cells.some(([dr, dc]) => r + dr === rr && c + dc === cc);

    const out = new Set<number>();
    const check = (cells: number[][]) => {
      if (cells.every(([a, b]) => filled(a, b)))
        cells.forEach(([a, b]) => out.add(a * N + b));
    };

    for (let i = 0; i < N; i++) {
      check(Array.from({ length: N }, (_, k) => [i, k]));
      check(Array.from({ length: N }, (_, k) => [k, i]));
    }
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const box: number[][] = [];
        for (let a = 0; a < 3; a++)
          for (let b = 0; b < 3; b++) box.push([br * 3 + a, bc * 3 + b]);
        check(box);
      }
    }
    return [...out].map((k) => [Math.floor(k / N), k % N]);
  }

  canPlaceAnywhere(p: Piece): boolean {
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) if (this.canPlace(p, r, c)) return true;
    return false;
  }

  private checkGameOver() {
    const left = this.pieces.filter((p): p is Piece => p !== null);
    if (left.length > 0 && !left.some((p) => this.canPlaceAnywhere(p))) {
      this.over = true;
      this.saveBest();
    }
  }

  /** Coloca a peça. Devolve o numero de unidades limpas (-1 se invalido). */
  place(index: number, r: number, c: number): number {
    const p = this.pieces[index];
    if (!p || this.over || !this.canPlace(p, r, c)) return -1;

    p.cells.forEach(([dr, dc]) => {
      this.board[r + dr][c + dc] = p.color;
    });
    this.score += p.cells.length;
    this.pieces[index] = null;

    const cleared = this.clearFull();
    if (cleared > 0) {
      this.combo++;
      this.score += cleared * 9 * cleared + (this.combo - 1) * 10;
    } else {
      this.combo = 0;
    }

    if (this.pieces.every((x) => x === null)) this.refill();
    else this.checkGameOver();

    this.saveBest();
    this.persist();
    return cleared;
  }

  private clearFull(): number {
    const toClear = new Set<number>();
    let units = 0;
    const full = (cells: number[][]) =>
      cells.every(([r, c]) => this.board[r][c] !== null);
    const add = (cells: number[][]) => {
      units++;
      cells.forEach(([r, c]) => toClear.add(r * N + c));
    };

    for (let i = 0; i < N; i++) {
      const row = Array.from({ length: N }, (_, c) => [i, c]);
      const col = Array.from({ length: N }, (_, r) => [r, i]);
      if (full(row)) add(row);
      if (full(col)) add(col);
    }
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const box: number[][] = [];
        for (let r = 0; r < 3; r++)
          for (let c = 0; c < 3; c++) box.push([br * 3 + r, bc * 3 + c]);
        if (full(box)) add(box);
      }
    }
    this.lastCleared = [...toClear].map((k) => [Math.floor(k / N), k % N]);
    toClear.forEach((k) => {
      this.board[Math.floor(k / N)][k % N] = null;
    });
    return units;
  }
}
