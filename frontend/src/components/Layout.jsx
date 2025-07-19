import { Outlet, Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem' }}>
      <header style={{ borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>
        <Link to="/" style={{ marginRight: '1rem' }}>Dashboard</Link>
        {/* <Link to="/settings">Settings</Link> */}
      </header>
      <main style={{ marginTop: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
