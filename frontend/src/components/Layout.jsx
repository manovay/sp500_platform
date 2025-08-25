import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  
  return (
    <div className="container">
      <header className="header">
        <nav className="nav">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Portfolio
          </Link>
          <Link 
            to="/history" 
            className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}
          >
            History
          </Link>
          <Link 
            to="/analysis" 
            className={`nav-link ${location.pathname === '/analysis' ? 'active' : ''}`}
          >
            Analysis
          </Link>
          <Link 
            to="/stepper" 
            className={`nav-link ${location.pathname === '/stepper' ? 'active' : ''}`}
          >
            Stock Analysis
          </Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
