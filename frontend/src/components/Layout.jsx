import { Outlet, Link, useLocation } from 'react-router-dom';
import logo from './oracle zero.png';

export default function Layout() {
  const location = useLocation();
  
  return (
    <div className="container">
      <header className="header">
        <nav className="nav">
          <div className="nav-logo">
            <img src={logo} alt="Oracle Zero" className="nav-logo-img" />
          </div>
          <div className="nav-links">
            <Link 
              to="/portfolio" 
              className={`nav-link ${location.pathname === '/portfolio' ? 'active' : ''}`}
            >
              Portfolio
            </Link>
            <Link 
              to="/portfolio/history" 
              className={`nav-link ${location.pathname === '/portfolio/history' ? 'active' : ''}`}
            >
              History
            </Link>
            <Link 
              to="/portfolio/analysis" 
              className={`nav-link ${location.pathname === '/portfolio/analysis' ? 'active' : ''}`}
            >
              Analysis
            </Link>
            <Link 
              to="/portfolio/flowchart" 
              className={`nav-link ${location.pathname === '/portfolio/flowchart' ? 'active' : ''}`}
            >
              How it Works
            </Link>
            <Link 
              to="/portfolio/timeline" 
              className={`nav-link ${location.pathname === '/portfolio/timeline' ? 'active' : ''}`}
            >
              How I Built It
            </Link>
          </div>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
