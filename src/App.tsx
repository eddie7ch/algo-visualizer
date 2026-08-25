import { useState } from 'react';
import './App.css';
import SortingView from './components/SortingView';
import PathfindingView from './components/PathfindingView';

type Tab = 'sorting' | 'pathfinding';

export default function App() {
  const [tab, setTab] = useState<Tab>('sorting');

  return (
    <div className="shell">
      <header className="header">
        <div className="brand">
          <h1>ALGORITHM VISUALIZER</h1>
          <span className="tag">six sorts · four searches · zero library shortcuts</span>
        </div>
        <div className="tabs">
          <button className={`tab ${tab === 'sorting' ? 'active' : ''}`} onClick={() => setTab('sorting')}>Sorting</button>
          <button className={`tab ${tab === 'pathfinding' ? 'active' : ''}`} onClick={() => setTab('pathfinding')}>Pathfinding</button>
        </div>
        <a className="source-link" href="https://github.com/eddie7ch/algo-visualizer" target="_blank" rel="noreferrer">
          View source →
        </a>
      </header>

      {tab === 'sorting' ? <SortingView /> : <PathfindingView />}

      <footer className="footer">
        <span>EVERY ALGORITHM IMPLEMENTED FROM SCRATCH — SEE /src/algorithms</span>
        <span>BUILT BY EDDIE CHONGTHAM</span>
      </footer>
    </div>
  );
}
