import { useEffect, useRef, useState } from 'react';
import { SORT_ALGORITHMS, type SortKey, type SortStep } from '../algorithms/sorting';

function randomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 96) + 4);
}

export default function SortingView() {
  const [algo, setAlgo] = useState<SortKey>('quick');
  const [size, setSize] = useState(60);
  const [speed, setSpeed] = useState(60); // ms delay per step, lower = faster
  const [array, setArray] = useState<number[]>(() => randomArray(60));
  const [comparing, setComparing] = useState<number[]>([]);
  const [swapping, setSwapping] = useState<number[]>([]);
  const [sorted, setSorted] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const [comparisons, setComparisons] = useState(0);
  const [writes, setWrites] = useState(0);

  const runIdRef = useRef(0);

  function reset(newSize = size) {
    runIdRef.current++; // invalidate any in-flight run loop
    setRunning(false);
    setArray(randomArray(newSize));
    setComparing([]);
    setSwapping([]);
    setSorted([]);
    setComparisons(0);
    setWrites(0);
  }

  useEffect(() => {
    reset(size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  function applyStep(step: SortStep) {
    setArray(step.array);
    setComparing(step.comparing);
    setSwapping(step.swapping);
    setSorted(step.sorted);
    if (step.comparing.length) setComparisons((c) => c + 1);
    if (step.swapping.length) setWrites((w) => w + 1);
  }

  async function run() {
    if (running) return;
    const myRunId = ++runIdRef.current;
    setRunning(true);
    setComparisons(0);
    setWrites(0);
    const generator = SORT_ALGORITHMS[algo].run([...array]);
    let result = generator.next();
    while (!result.done) {
      if (runIdRef.current !== myRunId) return; // superseded by a reset
      applyStep(result.value);
      await new Promise((r) => setTimeout(r, speed));
      result = generator.next();
    }
    if (runIdRef.current === myRunId) {
      applyStep(result.value);
      setRunning(false);
    }
  }

  const max = Math.max(...array, 1);

  return (
    <div className="view">
      <div className="stage">
        <div className="bars">
          {array.map((v, i) => {
            let cls = 'bar';
            if (sorted.includes(i)) cls += ' sorted';
            else if (swapping.includes(i)) cls += ' swap';
            else if (comparing.includes(i)) cls += ' compare';
            return <div key={i} className={cls} style={{ height: `${(v / max) * 100}%` }} />;
          })}
        </div>
      </div>

      <div className="sidebar">
        <div className="field">
          <label>Algorithm</label>
          <select
            className="select"
            value={algo}
            disabled={running}
            onChange={(e) => setAlgo(e.target.value as SortKey)}
          >
            {Object.entries(SORT_ALGORITHMS).map(([key, a]) => (
              <option key={key} value={key}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="complexity-badge">
          TIME <b>{SORT_ALGORITHMS[algo].time}</b> &nbsp;·&nbsp; SPACE <b>{SORT_ALGORITHMS[algo].space}</b>
        </div>

        <div className="field">
          <label>Array size — {size}</label>
          <input
            type="range" min={10} max={140} value={size}
            disabled={running}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </div>

        <div className="field">
          <label>Speed — {speed}ms / step</label>
          <input
            type="range" min={2} max={200} value={210 - speed}
            onChange={(e) => setSpeed(210 - Number(e.target.value))}
          />
        </div>

        <div className="btn-row">
          <button className="btn primary" onClick={run} disabled={running}>
            {running ? 'Running…' : 'Run'}
          </button>
          <button className="btn" onClick={() => reset(size)}>Shuffle</button>
        </div>

        <div>
          <div className="stat-row"><span>Comparisons</span><span className="num">{comparisons}</span></div>
          <div className="stat-row"><span>Writes / swaps</span><span className="num">{writes}</span></div>
          <div className="stat-row"><span>Elements</span><span className="num">{array.length}</span></div>
        </div>

        <div className="legend">
          <div className="legend-item"><span className="swatch" style={{ background: 'var(--border-soft)' }} /> unsorted</div>
          <div className="legend-item"><span className="swatch" style={{ background: 'var(--compare)' }} /> comparing</div>
          <div className="legend-item"><span className="swatch" style={{ background: 'var(--swap)' }} /> writing</div>
          <div className="legend-item"><span className="swatch" style={{ background: 'var(--accent)' }} /> sorted</div>
        </div>
      </div>
    </div>
  );
}
