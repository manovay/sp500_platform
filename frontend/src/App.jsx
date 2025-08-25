// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import StepperPage from './pages/StepperPage';
import PortfolioSnapshot from './components/PortfolioSnapshot';
import History from './components/History';
import PortfolioAnalysis from './components/PortfolioAnalysis';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<PortfolioSnapshot />} />
        <Route path="history" element={<History />} />
        <Route path="analysis" element={<PortfolioAnalysis />} />
        <Route path="stepper" element={<StepperPage />} />
      </Route>
    </Routes>
  );
}
