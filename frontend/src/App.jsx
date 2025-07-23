// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Admin from './pages/Admin';
import StepperPage from './pages/StepperPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="admin" element={<Admin />} />
        <Route path="stepper" element={<StepperPage />} />
      </Route>
    </Routes>
  );
}
