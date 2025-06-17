import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import History from './pages/History';
import Current from './pages/Current';
import GrowthOverview from './pages/GrowthOverview';

function App() {
  return (
    <div>
      <nav>
        <Link to="/">Current</Link>
        <Link to="/history">History</Link>
        <Link to="/growth">Growth Overview</Link>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Current />} />
          <Route path="/history" element={<History />} />
          <Route path="/growth" element={<GrowthOverview />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
