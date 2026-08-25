import { useRef, useState } from 'react';
import { PATH_ALGORITHMS, type Cell, type PathKey } from '../algorithms/pathfinding';

const ROWS = 16;
const COLS = 30;
const START: Cell = { row: 8, col: 4 };
const END: Cell = { row: 8, col: 25 };

const key = (c: Cell) => `${c.row},${c.col}`;
const isSame = (a: Cell, b: Cell) => a.row === b.row && a.col === b.col;

export default function PathfindingView() {
  const [algo, setAlgo] = useState<PathKey>('astar');
  const [walls, setWalls] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [frontier, setFrontier] = useState<Set<string>>(new Set());
  const [path, setPath] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(12);
  const [visitedCount, setVisitedCount] = useState(0);
  const [pathLength, setPathLength] = useState<number | null>(null);

  const paintingRef = useRef<{ active: boolean; erase: boolean }>({ active: false, erase: false });
  const runIdRef = useRef(0);

  function clearResult() {
    setVisited(new Set());
    setFrontier(new Set());
    setPath(new Set());
    setVisitedCount(0);
    setPathLength(null);
  }

  function toggleWall(c: Cell, forceErase?: boolean) {
    if (isSame(c, START) || isSame(c, END)) return;
    setWalls((prev) => {
      const next = new Set(prev);
      const k = key(c);
      if (forceErase ?? next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function handleMouseDown(c: Cell) {
    if (isSame(c, START) || isSame(c, END) || running) return;
    const erase = walls.has(key(c));
    paintingRef.current = { active: true, erase };
    toggleWall(c, erase);
  }

  function handleMouseEnter(c: Cell) {
    if (!paintingRef.current.active || running) return;
    toggleWall(c, paintingRef.current.erase);
  }

  function randomizeMaze() {
    if (running) return;
    const next = new Set<string>();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = { row: r, col: c };
        if (isSame(cell, START) || isSame(cell, END)) continue;
        if (Math.random() < 0.28) next.add(key(cell));
      }
    }
    setWalls(next);
    clearResult();
  }

  async function run() {
    if (running) return;
    const myRunId = ++runIdRef.current;
    setRunning(true);
    clearResult();

    const generator = PATH_ALGORITHMS[algo].run(START, END, walls, ROWS, COLS);
    let result = generator.next();
    while (!result.done) {
      if (runIdRef.current !== myRunId) return;
      const step = result.value;
      setVisited(new Set(step.visitedOrder.map(key)));
      setFrontier(new Set(step.frontier.map(key)));
      setVisitedCount(step.visitedOrder.length);
      await new Promise((r) => setTimeout(r, speed));
      result = generator.next();
    }
    if (runIdRef.current === myRunId) {
      const final = result.value;
      setVisited(new Set(final.visitedOrder.map(key)));
      setFrontier(new Set());
      setVisitedCount(final.visitedOrder.length);
      if (final.path.length > 0) {
        setPath(new Set(final.path.map(key)));
        setPathLength(final.path.length - 1);
      } else {
        setPathLength(-1);
      }
      setRunning(false);
    }
  }

  const cells: Cell[] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) cells.push({ row: r, col: c });

  return (
    <div className="view" onMouseUp={() => (paintingRef.current.active = false)}>
      <div className="stage">
        <div className="grid-wrap">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, width: '100%', maxWidth: 900 }}>
            {cells.map((c) => {
              const k = key(c);
              let cls = 'cell';
              if (isSame(c, START)) cls += ' start';
              else if (isSame(c, END)) cls += ' end';
              else if (path.has(k)) cls += ' path';
              else if (walls.has(k)) cls += ' wall';
              else if (frontier.has(k)) cls += ' frontier';
              else if (visited.has(k)) cls += ' visited';
              return (
                <div
                  key={k}
                  className={cls}
                  onMouseDown={() => handleMouseDown(c)}
                  onMouseEnter={() => handleMouseEnter(c)}
                />
              );
            })}
          </div>
        </div>
        <p className="hint">Click and drag to draw walls. The teal cell is the start, the coral cell is the target.</p>
      </div>

      <div className="sidebar">
        <div className="field">
          <label>Algorithm</label>
          <select className="select" value={algo} disabled={running} onChange={(e) => { setAlgo(e.target.value as PathKey); clearResult(); }}>
            {Object.entries(PATH_ALGORITHMS).map(([k, a]) => (
              <option key={k} value={k}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="complexity-badge">
          TIME <b>{PATH_ALGORITHMS[algo].time}</b>
        </div>
        <p className="hint">{PATH_ALGORITHMS[algo].guarantee}</p>

        <div className="field">
          <label>Speed — {speed}ms / step</label>
          <input type="range" min={2} max={60} value={62 - speed} onChange={(e) => setSpeed(62 - Number(e.target.value))} />
        </div>

        <div className="btn-row">
          <button className="btn primary" onClick={run} disabled={running}>{running ? 'Searching…' : 'Run'}</button>
          <button className="btn" onClick={randomizeMaze} disabled={running}>Randomize</button>
        </div>
        <button className="btn" onClick={() => { setWalls(new Set()); clearResult(); }} disabled={running}>Clear walls</button>

        <div>
          <div className="stat-row"><span>Nodes visited</span><span className="num">{visitedCount}</span></div>
          <div className="stat-row">
            <span>Path length</span>
            <span className="num">{pathLength === null ? '—' : pathLength === -1 ? 'no path' : pathLength}</span>
          </div>
        </div>

        <div className="legend">
          <div className="legend-item"><span className="swatch" style={{ background: 'var(--visited)' }} /> visited</div>
          <div className="legend-item"><span className="swatch" style={{ background: 'var(--frontier)' }} /> frontier</div>
          <div className="legend-item"><span className="swatch" style={{ background: 'var(--wall)' }} /> wall</div>
          <div className="legend-item"><span className="swatch" style={{ background: 'var(--accent)' }} /> path</div>
        </div>
      </div>
    </div>
  );
}
