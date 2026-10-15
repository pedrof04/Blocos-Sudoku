export type Cell = [number, number];
export interface Piece {
  cells: Cell[];
  w: number;
  h: number;
  color: string;
}

const SHAPES: string[][] = [
  ["#"],
  ["##"],
  ["#", "#"],
  ["###"],
  ["#", "#", "#"],
  ["####"],
  ["#", "#", "#", "#"],
  ["#####"],
  ["#", "#", "#", "#", "#"],
  ["##", "##"],
  ["###", "###", "###"],
  ["##", "#."],
  ["##", ".#"],
  ["#.", "##"],
  [".#", "##"],
  ["#.", "#.", "##"],
  [".#", ".#", "##"],
  ["##", "#.", "#."],
  ["##", ".#", ".#"],
  ["..#", "..#", "###"],
  ["#..", "#..", "###"],
  ["###", "..#", "..#"],
  ["###", "#..", "#.."],
  [".#.", "###"],
  ["###", ".#."],
  ["#.", "##", "#."],
  [".#", "##", ".#"],
  ["##.", ".##"],
  [".##", "##."],
  ["#.", "##", ".#"],
  [".#", "##", "#."],
  ["###", "#.#"],
  ["#.#", "###"],
  [".#.", "###", ".#."],
];

const COLORS = [
  "#ff6b6b",
  "#feca57",
  "#48dbfb",
  "#1dd1a1",
  "#5f9bff",
  "#c56cf0",
  "#ff9f43",
];

function parse(shape: string[], color: string): Piece {
  const cells: Cell[] = [];
  shape.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch === "#") cells.push([r, c]);
    }),
  );
  return {
    cells,
    h: shape.length,
    w: Math.max(...shape.map((s) => s.length)),
    color,
  };
}

export function randomPiece(): Piece {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return parse(shape, color);
}
