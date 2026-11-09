import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userLabel } from '@batalla/core';
import {
  keys,
  useApiMutation,
  useSession,
  useTournament,
  useTournamentInvitations,
  useTournamentMatches,
  useUserDirectory,
} from '@batalla/hooks';
import { useOrganisedTournaments } from '../../hooks/useOrganisedTournaments.js';
import { Chip, Empty, PageHead } from '../../components/ui.jsx';
import { useActionRunner } from '../../hooks/useToast.js';

export function OrganisedTournamentsPage() {
  const { ids, remember, forget } = useOrganisedTournaments();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [openId, setOpenId] = useState('');
  const create = useApiMutation((api, n) => api.createTournament(n), {
    onSuccess: (t) => {
      remember(t.id);
      navigate(`/organizar/${t.id}`);
    },
  });

  return (
    <>
      <PageHead title="Torneos que organizo" sub="Crea torneos, invita jugadores, arma las partidas y define al ganador." />
      <div className="split">
        <section className="card main" aria-labelledby="lt">
          <h2 id="lt" style={{ marginBottom: 12 }}>
            Mis torneos
          </h2>
          {ids.length === 0 ? (
            <Empty>Todavía no creaste torneos en este navegador.</Empty>
          ) : (
            <div className="scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Invitados</th>
                    <th>Partidas</th>
                    <th>Ganador</th>
                    <th>
                      <span className="visually-hidden">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ids.map((id) => (
                    <TournamentRow key={id} id={id} onMissing={() => forget(id)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <div className="side stack">
          <form
            className="card"
            aria-labelledby="nt"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate(name.trim());
            }}
          >
            <h2 id="nt">Nuevo torneo</h2>
            <p className="lead">Después podrás invitar jugadores y armar partidas.</p>
            <div className="field">
              <label htmlFor="tn">Nombre del torneo</label>
              <input className="input" id="tn" type="text" placeholder="Ej.: Copa de verano" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            {create.isError && (
              <div className="alert err" role="alert" style={{ marginBottom: 16 }}>
                {create.error.message}
              </div>
            )}
            <button className="btn acc block" type="submit" disabled={!name.trim() || create.isPending}>
              {create.isPending ? 'Creando…' : 'Crear torneo'}
            </button>
          </form>
          <form
            className="card"
            aria-labelledby="ot"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/organizar/${openId.trim()}`);
            }}
          >
            <h2 id="ot">Abrir un torneo</h2>
            <p className="lead">La API no lista los torneos que organizas. Si creaste uno desde otro dispositivo, ábrelo por su id y quedará guardado aquí.</p>
            <div className="inline-form">
              <div className="field">
                <label htmlFor="tid">Id del torneo</label>
                <input className="input" id="tid" type="text" value={openId} onChange={(e) => setOpenId(e.target.value)} />
              </div>
              <button className="btn out" type="submit" disabled={!openId.trim()}>
                Abrir
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function TournamentRow({ id, onMissing }) {
  const { session } = useSession();
  const tournament = useTournament(id);
  const invitations = useTournamentInvitations(id);
  const matches = useTournamentMatches(id);
  const directory = useUserDirectory();
  const run = useActionRunner();
  const remove = useApiMutation((api) => api.deleteTournament(id), {
    onSuccess: (_d, _v, queryClient) => {
      onMissing();
      queryClient.removeQueries({ queryKey: keys.tournament(id) });
    },
  });

  const missing = tournament.error?.status === 404 || (tournament.data && tournament.data.organisedBy !== session.userId && session.role !== 'admin');
  useEffect(() => {
    if (missing) onMissing();
  }, [missing, onMissing]);

  if (!tournament.data) {
    return (
      <tr>
        <td colSpan={5} className="muted">
          {tournament.isError ? tournament.error.message : 'Cargando…'}
        </td>
      </tr>
    );
  }
  const t = tournament.data;
  return (
    <tr>
      <td className="b">{t.name}</td>
      <td>{invitations.data?.length ?? '…'}</td>
      <td>{matches.data?.length ?? '…'}</td>
      <td className={t.winner ? undefined : 'muted'}>{t.winner ? <Chip tone="ok">{userLabel(t.winner, directory)}</Chip> : 'Sin definir'}</td>
      <td>
        <div className="acts">
          <Link className="btn sm" to={`/organizar/${t.id}`}>
            Gestionar
          </Link>
          <button
            className="btn sm dng"
            disabled={remove.isPending}
            onClick={run(remove, undefined, { confirm: `¿Eliminar el torneo "${t.name}"? No se puede deshacer.`, success: 'Torneo eliminado.' })}
          >
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}
