import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { hasRole, ROLE_LABELS } from '@batalla/core';
import { useSession } from '@batalla/hooks';
import { BrandMark } from './ui.jsx';

/** Cabezal con navegación según el rol + contenido de la página. */
export function Layout() {
  const { session, logout } = useSession();
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Inicio', end: true },
    { to: '/partidas', label: 'Partidas' },
    hasRole(session.role, 'organiser') && { to: '/organizar', label: 'Organizar' },
    hasRole(session.role, 'admin') && { to: '/usuarios', label: 'Usuarios' },
  ].filter(Boolean);

  const onLogout = async () => {
    await logout();
    navigate('/ingresar', { replace: true });
  };

  return (
    <div className="app">
      <header className="top">
        <NavLink className="brand" to="/">
          <BrandMark />
          Batalla Naval
        </NavLink>
        <nav className="nav" aria-label="Principal">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'on' : undefined)}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="user">
          <span>{session.email}</span>
          <span className="chip role">{ROLE_LABELS[session.role]}</span>
          <button className="btn outw sm" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="wrap">
        <Outlet />
      </main>
    </div>
  );
}
