// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import StepperPage from './pages/StepperPage';
import BuildTimelinePage from './pages/BuildTimelinePage';
import PortfolioSnapshot from './components/PortfolioSnapshot';
import History from './components/History';
import PortfolioAnalysis from './components/PortfolioAnalysis';
import SystemFlowchart from './components/SystemFlowchart';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<PortfolioSnapshot />} />
        <Route path="history" element={<History />} />
        <Route path="analysis" element={<PortfolioAnalysis />} />
        <Route path="stepper" element={<StepperPage />} />
        <Route path="flowchart" element={<SystemFlowchart />} />
        <Route path="timeline" element={<BuildTimelinePage />} />
      </Route>
    </Routes>
  );
}
