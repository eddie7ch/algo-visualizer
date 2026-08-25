# Algorithm Visualizer

An interactive visualizer for six sorting algorithms and four pathfinding
algorithms — every algorithm is implemented from scratch as a generator
function, so the UI renders each comparison, swap, and node visit as it
actually happens, not as a canned animation.

**[Live demo →](https://algo-visualizer-eddie7ch.vercel.app)**

## Why this exists

Real product work (see [Leverage AI](https://github.com/eddie7ch/leverage-ai-architecture))
demonstrates shipping and integration skill, but it doesn't exercise
classic data-structures-and-algorithms fundamentals — the kind tested in
technical interviews. This project fills that gap deliberately: no
`Array.prototype.sort`, no pathfinding library, no shortcuts.

## Sorting

| Algorithm | Time | Space |
|---|---|---|
| Bubble Sort | O(n²) | O(1) |
| Insertion Sort | O(n²) | O(1) |
| Selection Sort | O(n²) | O(1) |
| Merge Sort | O(n log n) | O(n) |
| Quick Sort | O(n log n) average, O(n²) worst case | O(log n) |
| Heap Sort | O(n log n) | O(1) |

## Pathfinding

| Algorithm | Time | Guarantee |
|---|---|---|
| Breadth-First Search | O(V + E) | Shortest path (unweighted) |
| Depth-First Search | O(V + E) | *A* path — not necessarily shortest |
| Dijkstra's Algorithm | O((V+E) log V) | Shortest path (weighted), via a binary min-heap |
| A* Search | O((V+E) log V) | Shortest path, visits fewer nodes via a Manhattan-distance heuristic |

Draw walls by clicking and dragging on the grid, then compare how many
nodes each algorithm visits to find the same shortest path — DFS finding
*a* path versus BFS/Dijkstra/A* guaranteeing the shortest one is the
whole point of the demo.

## Stack

React 19 · TypeScript · Vite — no animation library, no charting library.
Every bar and every grid cell is driven directly by the algorithm's own
step generator (`src/algorithms/sorting.ts`, `src/algorithms/pathfinding.ts`).

## Run locally

```bash
npm install
npm run dev
```

## Author

Eddie Chongtham — [mlebotics.com](https://mlebotics.com) · [github.com/eddie7ch](https://github.com/eddie7ch)
