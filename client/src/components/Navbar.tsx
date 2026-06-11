import { Activity, Bell } from 'lucide-react';

interface NavbarProps {
  title?: string;
}

export default function Navbar({ title = "Sistema de Diagnóstico Asistido" }: NavbarProps) {
  return (
    <header className="app-navbar">
      <div className="navbar-title-container">
        <Activity size={18} color="var(--primary)" />
        <h2 className="navbar-title">{title}</h2>
      </div>

      <div className="navbar-right-section">
        {/* Notifications mock icon */}
        <button className="navbar-icon-btn" aria-label="Notificaciones">
          <Bell size={18} color="var(--gray-dark)" />
        </button>

        {/* User profile area */}
        <div className="navbar-profile">
          <div className="navbar-avatar">DR</div>
          <div className="navbar-profile-info">
            <span className="navbar-profile-name">Dr. Radiólogo</span>
            <span className="navbar-profile-role">Unidad de Imagenología</span>
          </div>
        </div>
      </div>
    </header>
  );
}
