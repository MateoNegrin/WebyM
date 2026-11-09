import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ROLE_LABELS, ROLES } from '@batalla/core';
import { keys, useApiMutation, useSession, useUser } from '@batalla/hooks';
import { Card, PageHead, QueryState } from '../../components/ui.jsx';
import { useToast } from '../../hooks/useToast.js';

export function EditUserPage() {
  const { id } = useParams();
  const query = useUser(id);
  return <QueryState query={query}>{(user) => <EditUser key={user.id} user={user} />}</QueryState>;
}

function EditUser({ user }) {
  const { session } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user.role);
  const isMe = user.id === session.userId;

  const save = useApiMutation((api, changes) => api.updateUser(user.id, changes), {
    invalidate: () => [keys.users, keys.user(user.id)],
    onSuccess: () => {
      toast('Cambios guardados.', 'ok');
      navigate('/usuarios');
    },
  });
  const remove = useApiMutation((api) => api.deleteUser(user.id), {
    invalidate: () => [keys.users],
    onSuccess: () => {
      toast(`Se quitó a ${user.email}.`, 'ok');
      navigate('/usuarios', { replace: true });
    },
  });

  const changes = {};
  if (password) changes.password = password;
  if (role !== user.role) changes.role = role;
  const dirty = Object.keys(changes).length > 0;

  return (
    <>
      <PageHead
        crumbs={[{ to: '/usuarios', label: 'Usuarios' }, { label: user.email }]}
        title="Editar usuario"
        sub="Cambia la contraseña o el rol. El correo no se puede modificar."
      />
      <div className="grid2">
        <form
          className="card"
          aria-labelledby="ed"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(changes);
          }}
        >
          <h2 id="ed" style={{ marginBottom: 16 }}>
            Datos
          </h2>
          <div className="field">
            <label htmlFor="em">Correo electrónico</label>
            <input className="input" id="em" type="email" value={user.email} disabled style={{ background: '#ECEAE0' }} />
          </div>
          <div className="field">
            <label htmlFor="pw">Nueva contraseña</label>
            <input
              className="input"
              id="pw"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="hint">Déjala vacía para mantener la actual.</span>
          </div>
          <div className="field">
            <label htmlFor="rl">Rol</label>
            <select className="select" id="rl" value={role} onChange={(e) => setRole(e.target.value)} disabled={isMe}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            {isMe && <span className="hint">No puedes cambiar tu propio rol.</span>}
          </div>
          {save.isError && (
            <div className="alert err" role="alert" style={{ marginBottom: 16 }}>
              {save.error.message}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button className="btn acc" type="submit" disabled={!dirty || save.isPending}>
              Guardar cambios
            </button>
            <Link className="btn out" to="/usuarios">
              Cancelar
            </Link>
          </div>
        </form>
        <Card title="Quitar usuario" lead="El usuario ya no podrá ingresar a la aplicación.">
          {remove.isError && (
            <div className="alert err" role="alert" style={{ marginBottom: 16 }}>
              {remove.error.message}
            </div>
          )}
          {isMe && (
            <div className="alert" style={{ marginBottom: 16 }}>
              No puedes quitarte a ti mismo.
            </div>
          )}
          <button
            className="btn dng"
            disabled={isMe || remove.isPending}
            onClick={() => window.confirm(`¿Quitar a ${user.email}?`) && remove.mutate()}
          >
            Quitar usuario
          </button>
        </Card>
      </div>
    </>
  );
}
