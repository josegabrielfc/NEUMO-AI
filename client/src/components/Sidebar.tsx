import { NavLink } from 'react-router-dom';
import { ShieldCheck, PlusCircle, History } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="app-sidebar">
      {/* Brand logo */}
      <div className="sidebar-brand">
        <ShieldCheck size={28} color="var(--primary)" className="brand-icon" />
        <div className="brand-text-wrapper">
          <h1 className="brand-title">NEUMO-AI</h1>
          <p className="brand-subtitle">Clínica Los Andes</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-nav">
        <NavLink
          to="/"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <PlusCircle size={20} color={isActive ? "var(--white)" : "var(--gray-dark)"} />
              <span>Nuevo Diagnóstico</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <History size={20} color={isActive ? "var(--white)" : "var(--gray-dark)"} />
              <span>Historial de Pacientes</span>
            </>
          )}
        </NavLink>
      </nav>

      {/* Footer / Department Info */}
      <div className="sidebar-footer">
        <p className="footer-text">Semestre 2026-1</p>
        <p className="footer-subtext">Informática Médica</p>
      </div>
    </aside>
  );
}
