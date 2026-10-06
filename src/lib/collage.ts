// Collage layout for project galleries.
//
// Every image keeps its own aspect ratio, so screenshots are never cropped
// (tiles can be off by a pixel or two because of the gaps). Images stay in
// the given order. We try every arrangement of nested rows and columns up to
// three levels deep and keep the one closest to the target height, avoiding
// tiny tiles and preferring a large first image.

type Dir = "row" | "col";
type Node = { img: number } | { dir: Dir; kids: Node[] };

export interface Tile {
  index: number;
  // Position and size as percentages of the collage box
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Collage {
  ratio: number; // width / height of the whole collage
  tiles: Tile[];
}

export interface CollageOptions {
  width: number;        // reference width (px) used to score layouts
  gap: number;          // gap between tiles (px) at that width
  targetHeight: number; // preferred collage height (px)
  minTile: number;      // tiles with a shorter side below this are penalized
  mirror?: boolean;     // flip horizontally so the first image sits on the right
}

const flip = (dir: Dir): Dir => (dir === "row" ? "col" : "row");
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

// A row is as wide as its children side by side; a column stacks them
function ratioOf(node: Node, ratios: number[]): number {
  if ("img" in node) return ratios[node.img];
  const rs = node.kids.map(kid => ratioOf(kid, ratios));
  return node.dir === "row" ? sum(rs) : 1 / sum(rs.map(r => 1 / r));
}

// Every way to cut [start, end) into two or more consecutive groups
function* splits(start: number, end: number): Generator<[number, number][]> {
  const n = end - start;
  for (let mask = 1; mask < 1 << (n - 1); mask++) {
    const groups: [number, number][] = [];
    let from = start;
    for (let i = 1; i < n; i++) {
      if (mask & (1 << (i - 1))) {
        groups.push([from, start + i]);
        from = start + i;
      }
    }
    groups.push([from, end]);
    yield groups;
  }
}

function candidates(start: number, end: number, dir: Dir, depth: number): Node[] {
  if (end - start === 1) return [{ img: start }];
  if (depth === 0) return [];

  const out: Node[] = [];
  for (const groups of splits(start, end)) {
    const options = groups.map(([a, b]) => candidates(a, b, flip(dir), depth - 1));
    if (options.some(opts => opts.length === 0)) continue;

    let combos: Node[][] = [[]];
    for (const opts of options) combos = combos.flatMap(c => opts.map(o => [...c, o]));
    for (const kids of combos) out.push({ dir, kids });
  }
  return out;
}

function place(node: Node, x: number, y: number, w: number, h: number, ratios: number[], gap: number, out: Tile[]) {
  if ("img" in node) {
    out.push({ index: node.img, x, y, w, h });
    return;
  }

  const rs = node.kids.map(kid => ratioOf(kid, ratios));
  if (node.dir === "row") {
    const avail = w - gap * (rs.length - 1);
    const total = sum(rs);
    let cx = x;
    node.kids.forEach((kid, i) => {
      const kw = (avail * rs[i]) / total;
      place(kid, cx, y, kw, h, ratios, gap, out);
      cx += kw + gap;
    });
  } else {
    const avail = h - gap * (rs.length - 1);
    const total = sum(rs.map(r => 1 / r));
    let cy = y;
    node.kids.forEach((kid, i) => {
      const kh = (avail * (1 / rs[i])) / total;
      place(kid, x, cy, w, kh, ratios, gap, out);
      cy += kh + gap;
    });
  }
}

export function buildCollage(ratios: number[], options: CollageOptions): Collage {
  const { width, gap, targetHeight, minTile, mirror = false } = options;
  const n = ratios.length;
  if (n === 0) return { ratio: 1, tiles: [] };

  // The search grows fast; keep it shallow for unusually large galleries
  const depth = n > 10 ? 2 : 3;
  const nodes = [...candidates(0, n, "row", depth), ...candidates(0, n, "col", depth)];

  let best: { cost: number; height: number; tiles: Tile[] } | undefined;
  for (const node of nodes) {
    const height = width / ratioOf(node, ratios);
    const tiles: Tile[] = [];
    place(node, 0, 0, width, height, ratios, gap, tiles);

    let cost = 4 * Math.log(height / targetHeight) ** 2;
    for (const tile of tiles) {
      const short = Math.min(tile.w, tile.h);
      if (short < minTile) cost += 3 * ((minTile - short) / minTile) ** 2;
    }
    const areas = tiles.map(tile => tile.w * tile.h);
    cost += 2 * Math.max(0, 1.5 / n - areas[0] / sum(areas));

    if (!best || cost < best.cost) best = { cost, height, tiles };
  }

  return toCollage(width, best!.height, best!.tiles, mirror);
}

// Fixed layout instead of the search: each row holds the given image
// indexes, and every image in a row gets the same height. Never mirrored,
// so the order on screen is exactly the order given.
export function buildRows(ratios: number[], rows: number[][], options: Pick<CollageOptions, "width" | "gap">): Collage {
  const { width, gap } = options;
  const node: Node = { dir: "col", kids: rows.map(row => ({ dir: "row", kids: row.map(img => ({ img })) })) };
  const height = width / ratioOf(node, ratios);
  const tiles: Tile[] = [];
  place(node, 0, 0, width, height, ratios, gap, tiles);
  return toCollage(width, height, tiles, false);
}

function toCollage(width: number, height: number, tiles: Tile[], mirror: boolean): Collage {
  const pct = (value: number, of: number) => Math.round((value / of) * 100000) / 1000;
  return {
    ratio: width / height,
    tiles: tiles.map(tile => ({
      index: tile.index,
      x: pct(mirror ? width - tile.x - tile.w : tile.x, width),
      y: pct(tile.y, height),
      w: pct(tile.w, width),
      h: pct(tile.h, height),
    })),
  };
}
