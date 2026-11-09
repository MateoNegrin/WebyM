import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate, ROLE_LABELS, ROLE_TONES, ROLES } from '@batalla/core';
import { keys, useApiMutation, useSession, useUsers } from '@batalla/hooks';
import { Chip, PageHead, QueryState } from '../../components/ui.jsx';
import { useActionRunner } from '../../hooks/useToast.js';

export function UsersPage() {
  const { session } = useSession();
  const query = useUsers();
  const run = useActionRunner();
  const remove = useApiMutation((api, id) => api.deleteUser(id), { invalidate: () => [keys.users] });

  return (
    <>
      <PageHead title="Usuarios" sub="Agrega, modifica o quita a quienes pueden ingresar a la aplicación." />
      <div className="split">
        <section className="card main" aria-labelledby="lu">
          <h2 id="lu" style={{ marginBottom: 12 }}>
            Todos los usuarios
          </h2>
          <QueryState query={query}>
            {(users) => (
              <div className="scroll">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Creado</th>
                      <th>
                        <span className="visually-hidden">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...users]
                      .sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || a.email.localeCompare(b.email))
                      .map((u) => (
                        <tr key={u.id} className={u.id === session.userId ? 'me' : undefined}>
                          <td className="b">
                            {u.email}
                            {u.id === session.userId && <span className="muted sm"> (tú)</span>}
                          </td>
                          <td>
                            <Chip tone={ROLE_TONES[u.role]}>{ROLE_LABELS[u.role]}</Chip>
                          </td>
                          <td className="muted sm">{formatDate(u.createdAt)}</td>
                          <td>
                            <div className="acts">
                              <Link className="btn sm out" to={`/usuarios/${u.id}`}>
                                Editar
                              </Link>
                              <button
                                className="btn sm dng"
                                disabled={u.id === session.userId || remove.isPending}
                                title={u.id === session.userId ? 'No puedes quitarte a ti mismo' : undefined}
                                onClick={run(remove, u.id, { confirm: `¿Quitar a ${u.email}? Ya no podrá ingresar.`, success: 'Usuario quitado.' })}
                              >
                                Quitar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </QueryState>
        </section>
        <NewUserForm />
      </div>
    </>
  );
}

const EMPTY = { email: '', password: '', role: 'player' };

function NewUserForm() {
  const [form, setForm] = useState(EMPTY);
  const [created, setCreated] = useState(null);
  const create = useApiMutation((api, user) => api.createUser(user), {
    invalidate: () => [keys.users],
    onSuccess: (user) => {
      setCreated(user.email);
      setForm(EMPTY);
    },
  });
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <form
      className="card side"
      aria-labelledby="nu"
      onSubmit={(e) => {
        e.preventDefault();
        setCreated(null);
        create.mutate({ ...form, email: form.email.trim() });
      }}
    >
      <h2 id="nu">Nuevo usuario</h2>
      <p className="lead">Podrá ingresar con este correo y contraseña.</p>
      <div className="field">
        <label htmlFor="ne">Correo electrónico</label>
        <input className="input" id="ne" type="email" placeholder="nombre@correo.com" autoComplete="off" value={form.email} onChange={set('email')} />
      </div>
      <div className="field">
        <label htmlFor="np">Contraseña</label>
        <input className="input" id="np" type="password" placeholder="••••••••" autoComplete="new-password" value={form.password} onChange={set('password')} />
      </div>
      <div className="field">
        <label htmlFor="nr">Rol</label>
        <select className="select" id="nr" value={form.role} onChange={set('role')}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>
      {create.isError && (
        <div className="alert err" role="alert" style={{ marginBottom: 16 }}>
          {create.error.message}
        </div>
      )}
      {created && (
        <div className="alert ok" role="status" style={{ marginBottom: 16 }}>
          Se creó el usuario {created}.
        </div>
      )}
      <button className="btn acc block" type="submit" disabled={!form.email.trim() || !form.password || create.isPending}>
        {create.isPending ? 'Creando…' : 'Crear usuario'}
      </button>
    </form>
  );
}
