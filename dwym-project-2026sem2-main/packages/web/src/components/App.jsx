import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { hasRole } from '@batalla/core';
import { useSession } from '@batalla/hooks';
import { Layout } from './Layout.jsx';
import { Loading } from './ui.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { HomePage } from '../pages/HomePage.jsx';
import { MatchesPage } from '../pages/MatchesPage.jsx';
import { MatchPage } from '../pages/MatchPage.jsx';
import { TournamentPage } from '../pages/TournamentPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';
import { OrganisedTournamentsPage } from '../pages/organiser/OrganisedTournamentsPage.jsx';
import { ManageTournamentPage } from '../pages/organiser/ManageTournamentPage.jsx';
import { UsersPage } from '../pages/admin/UsersPage.jsx';
import { EditUserPage } from '../pages/admin/EditUserPage.jsx';

/** Exige sesión iniciada; si no, manda a ingresar y vuelve después. */
function RequireSession() {
  const { session, ready } = useSession();
  const location = useLocation();
  if (!ready) return <Loading />;
  if (!session) return <Navigate to="/ingresar" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Exige un rol mínimo (jerarquía jugador < organizador < admin). */
function RequireRole({ role }) {
  const { session } = useSession();
  return hasRole(session.role, role) ? <Outlet /> : <NotFoundPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/ingresar" element={<LoginPage />} />
      <Route element={<RequireSession />}>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="partidas" element={<MatchesPage />} />
          <Route path="partidas/:id" element={<MatchPage />} />
          <Route path="torneos/:id" element={<TournamentPage />} />
          <Route element={<RequireRole role="organiser" />}>
            <Route path="organizar" element={<OrganisedTournamentsPage />} />
            <Route path="organizar/:id" element={<ManageTournamentPage />} />
          </Route>
          <Route element={<RequireRole role="admin" />}>
            <Route path="usuarios" element={<UsersPage />} />
            <Route path="usuarios/:id" element={<EditUserPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
