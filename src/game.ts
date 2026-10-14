import { Piece, randomPiece } from './pieces';

export const N = 9;

export class Game {
  board: (string | null)[][] = [];
  pieces: (Piece | null)[] = [];
  score = 0;
  best = Number(localStorage.getItem('best') ?? 0);
  combo = 0;
  over = false;
  lastCleared: number[][] = [];

  constructor() { this.reset(); }

  reset() {
    this.board = Array.from({ length: N }, () => Array<string | null>(N).fill(null));
    this.score = 0;
    this.combo = 0;
    this.over = false;
    this.lastCleared = [];
    this.refill();
  }

  private refill() {
    this.pieces = [randomPiece(), randomPiece(), randomPiece()];
    this.checkGameOver();
  }

  canPlace(p: Piece, r: number, c: number): boolean {
    return p.cells.every(([dr, dc]) => {
      const rr = r + dr, cc = c + dc;
      return rr >= 0 && rr < N && cc >= 0 && cc < N && this.board[rr][cc] === null;
    });
  }

  private canPlaceAnywhere(p: Piece): boolean {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (this.canPlace(p, r, c)) return true;
    return false;
  }

  private checkGameOver() {
    const left = this.pieces.filter((p): p is Piece => p !== null);
    if (left.length > 0 && !left.some((p) => this.canPlaceAnywhere(p))) {
      this.over = true;
      if (this.score > this.best) {
        this.best = this.score;
        localStorage.setItem('best', String(this.best));
      }
    }
  }

  /** Coloca a peça. Devolve o numero de linhas/colunas/quadrados limpos (-1 se invalido). */
  place(index: number, r: number, c: number): number {
    const p = this.pieces[index];
    if (!p || this.over || !this.canPlace(p, r, c)) return -1;

    p.cells.forEach(([dr, dc]) => { this.board[r + dr][c + dc] = p.color; });
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

    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem('best', String(this.best));
    }
    return cleared;
  }

  private clearFull(): number {
    const toClear = new Set<number>();
    let units = 0;
    const full = (cells: number[][]) => cells.every(([r, c]) => this.board[r][c] !== null);
    const add = (cells: number[][]) => { units++; cells.forEach(([r, c]) => toClear.add(r * N + c)); };

    for (let i = 0; i < N; i++) {
      const row = Array.from({ length: N }, (_, c) => [i, c]);
      const col = Array.from({ length: N }, (_, r) => [r, i]);
      if (full(row)) add(row);
      if (full(col)) add(col);
    }
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const box: number[][] = [];
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) box.push([br * 3 + r, bc * 3 + c]);
        if (full(box)) add(box);
      }
    }
    this.lastCleared = [...toClear].map((k) => [Math.floor(k / N), k % N]);
    toClear.forEach((k) => { this.board[Math.floor(k / N)][k % N] = null; });
    return units;
  }
}
