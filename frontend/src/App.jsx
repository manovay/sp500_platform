// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Details from './pages/Details';
import Admin from './pages/Admin';
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="details/:ticker" element={<Details />} />
        <Route path="admin" element={<Admin />} />
      </Route>
    </Routes>
  );
}
