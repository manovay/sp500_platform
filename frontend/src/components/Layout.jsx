import { Outlet, Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div style={{ 
      maxWidth: 1400, 
      margin: '0 auto', 
      padding: '2rem',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      backgroundAttachment: 'fixed'
    }}>
      <header style={{ 
        borderBottom: '1px solid #374151', 
        paddingBottom: '1rem',
        marginBottom: '2rem',
        background: 'rgba(30, 30, 30, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid #374151',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <nav style={{
          display: 'flex',
          gap: '2rem',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Link to="/" style={{ 
            color: '#3b82f6',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1.125rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            background: 'linear-gradient(135deg, #1e1e1e 0%, #252525 100%)',
            border: '1px solid #374151'
          }}>Dashboard</Link>
          <Link to="/stocks" style={{ 
            color: '#3b82f6',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1.125rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            background: 'linear-gradient(135deg, #1e1e1e 0%, #252525 100%)',
            border: '1px solid #374151'
          }}>Stock List</Link>
          <Link to="/admin" style={{ 
            color: '#3b82f6',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1.125rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            background: 'linear-gradient(135deg, #1e1e1e 0%, #252525 100%)',
            border: '1px solid #374151'
          }}>Admin</Link>
        </nav>
      </header>
      <main style={{ 
        marginTop: '1rem',
        background: 'rgba(30, 30, 30, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid #374151',
        padding: '2rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <Outlet />
      </main>
    </div>
  );
}
