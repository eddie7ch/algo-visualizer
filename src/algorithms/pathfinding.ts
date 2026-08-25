// Real, from-scratch graph search over a 2D grid — a queue-based BFS,
// a stack-based DFS, and a proper Dijkstra / A* with a binary min-heap.
// Diagonal movement is disallowed so every edge has weight 1 (BFS/DFS)
// or a real cost (Dijkstra/A*), keeping the algorithms comparable.

export type Cell = { row: number; col: number };

export type PathStep = {
  visiting: Cell | null; // node currently popped off the frontier
  visitedOrder: Cell[]; // nodes visited so far, in order
  frontier: Cell[]; // nodes currently queued/open
  path: Cell[]; // final path, populated only on the last step
};

export type PathGenerator = Generator<PathStep, PathStep, void>;

const key = (c: Cell) => `${c.row},${c.col}`;

function neighbors(c: Cell, rows: number, cols: number): Cell[] {
  const deltas = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  const out: Cell[] = [];
  for (const [dr, dc] of deltas) {
    const row = c.row + dr;
    const col = c.col + dc;
    if (row >= 0 && row < rows && col >= 0 && col < cols) out.push({ row, col });
  }
  return out;
}

function reconstructPath(cameFrom: Map<string, Cell>, end: Cell): Cell[] {
  const path: Cell[] = [end];
  let currentKey = key(end);
  while (cameFrom.has(currentKey)) {
    const prev = cameFrom.get(currentKey)!;
    path.unshift(prev);
    currentKey = key(prev);
  }
  return path;
}

// O(V + E) time. First algorithm to reach the target on an unweighted
// grid is guaranteed shortest — that's why BFS (not DFS) gives shortest
// paths.
export function* bfs(
  start: Cell,
  end: Cell,
  walls: Set<string>,
  rows: number,
  cols: number,
): PathGenerator {
  const queue: Cell[] = [start];
  const visited = new Set<string>([key(start)]);
  const cameFrom = new Map<string, Cell>();
  const visitedOrder: Cell[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    visitedOrder.push(current);
    yield { visiting: current, visitedOrder: [...visitedOrder], frontier: [...queue], path: [] };

    if (key(current) === key(end)) {
      return { visiting: null, visitedOrder, frontier: [], path: reconstructPath(cameFrom, end) };
    }

    for (const n of neighbors(current, rows, cols)) {
      if (visited.has(key(n)) || walls.has(key(n))) continue;
      visited.add(key(n));
      cameFrom.set(key(n), current);
      queue.push(n);
    }
  }
  return { visiting: null, visitedOrder, frontier: [], path: [] };
}

// O(V + E) time. Explores as deep as possible before backtracking —
// finds *a* path, with no guarantee it's the shortest one.
export function* dfs(
  start: Cell,
  end: Cell,
  walls: Set<string>,
  rows: number,
  cols: number,
): PathGenerator {
  const stack: Cell[] = [start];
  const visited = new Set<string>();
  const cameFrom = new Map<string, Cell>();
  const visitedOrder: Cell[] = [];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const k = key(current);
    if (visited.has(k)) continue;
    visited.add(k);
    visitedOrder.push(current);
    yield { visiting: current, visitedOrder: [...visitedOrder], frontier: [...stack], path: [] };

    if (k === key(end)) {
      return { visiting: null, visitedOrder, frontier: [], path: reconstructPath(cameFrom, end) };
    }

    for (const n of neighbors(current, rows, cols)) {
      if (visited.has(key(n)) || walls.has(key(n))) continue;
      if (!cameFrom.has(key(n))) cameFrom.set(key(n), current);
      stack.push(n);
    }
  }
  return { visiting: null, visitedOrder, frontier: [], path: [] };
}

// Minimal binary min-heap keyed by priority — backs both Dijkstra and A*
// so neither algorithm degrades to an O(V^2) linear scan for the next
// node to expand.
class MinHeap<T> {
  private items: { priority: number; value: T }[] = [];

  push(priority: number, value: T) {
    this.items.push({ priority, value });
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.items[parent].priority <= this.items[i].priority) break;
      [this.items[parent], this.items[i]] = [this.items[i], this.items[parent]];
      i = parent;
    }
  }

  pop(): T | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      const n = this.items.length;
      while (true) {
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        let smallest = i;
        if (l < n && this.items[l].priority < this.items[smallest].priority) smallest = l;
        if (r < n && this.items[r].priority < this.items[smallest].priority) smallest = r;
        if (smallest === i) break;
        [this.items[i], this.items[smallest]] = [this.items[smallest], this.items[i]];
        i = smallest;
      }
    }
    return top.value;
  }

  get size() {
    return this.items.length;
  }
}

// O((V + E) log V) time with a binary heap. Expands the cheapest-so-far
// node first, so the first time we pop the target it's via the shortest
// possible cost — the classic weighted-shortest-path algorithm.
export function* dijkstra(
  start: Cell,
  end: Cell,
  walls: Set<string>,
  rows: number,
  cols: number,
): PathGenerator {
  const dist = new Map<string, number>([[key(start), 0]]);
  const cameFrom = new Map<string, Cell>();
  const heap = new MinHeap<Cell>();
  heap.push(0, start);
  const visited = new Set<string>();
  const visitedOrder: Cell[] = [];

  while (heap.size > 0) {
    const current = heap.pop()!;
    const k = key(current);
    if (visited.has(k)) continue;
    visited.add(k);
    visitedOrder.push(current);
    yield { visiting: current, visitedOrder: [...visitedOrder], frontier: [], path: [] };

    if (k === key(end)) {
      return { visiting: null, visitedOrder, frontier: [], path: reconstructPath(cameFrom, end) };
    }

    for (const n of neighbors(current, rows, cols)) {
      if (walls.has(key(n))) continue;
      const newDist = (dist.get(k) ?? Infinity) + 1;
      if (newDist < (dist.get(key(n)) ?? Infinity)) {
        dist.set(key(n), newDist);
        cameFrom.set(key(n), current);
        heap.push(newDist, n);
      }
    }
  }
  return { visiting: null, visitedOrder, frontier: [], path: [] };
}

const manhattan = (a: Cell, b: Cell) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

// O((V + E) log V) time, same as Dijkstra, but the Manhattan-distance
// heuristic steers expansion toward the goal instead of outward in every
// direction — visits far fewer nodes in practice.
export function* aStar(
  start: Cell,
  end: Cell,
  walls: Set<string>,
  rows: number,
  cols: number,
): PathGenerator {
  const gScore = new Map<string, number>([[key(start), 0]]);
  const cameFrom = new Map<string, Cell>();
  const heap = new MinHeap<Cell>();
  heap.push(manhattan(start, end), start);
  const visited = new Set<string>();
  const visitedOrder: Cell[] = [];

  while (heap.size > 0) {
    const current = heap.pop()!;
    const k = key(current);
    if (visited.has(k)) continue;
    visited.add(k);
    visitedOrder.push(current);
    yield { visiting: current, visitedOrder: [...visitedOrder], frontier: [], path: [] };

    if (k === key(end)) {
      return { visiting: null, visitedOrder, frontier: [], path: reconstructPath(cameFrom, end) };
    }

    for (const n of neighbors(current, rows, cols)) {
      if (walls.has(key(n))) continue;
      const tentative = (gScore.get(k) ?? Infinity) + 1;
      if (tentative < (gScore.get(key(n)) ?? Infinity)) {
        gScore.set(key(n), tentative);
        cameFrom.set(key(n), current);
        heap.push(tentative + manhattan(n, end), n);
      }
    }
  }
  return { visiting: null, visitedOrder, frontier: [], path: [] };
}

export const PATH_ALGORITHMS = {
  bfs: { name: 'Breadth-First Search', run: bfs, guarantee: 'Shortest path (unweighted)', time: 'O(V + E)' },
  dfs: { name: 'Depth-First Search', run: dfs, guarantee: 'A path, not necessarily shortest', time: 'O(V + E)' },
  dijkstra: { name: "Dijkstra's Algorithm", run: dijkstra, guarantee: 'Shortest path (weighted)', time: 'O((V+E) log V)' },
  astar: { name: 'A* Search', run: aStar, guarantee: 'Shortest path, fewer nodes visited', time: 'O((V+E) log V)' },
} as const;

export type PathKey = keyof typeof PATH_ALGORITHMS;
