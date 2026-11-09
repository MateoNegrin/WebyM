import { useState } from 'react';
import { Link } from 'react-router-dom';
import { isMatchEnded, matchDetail, matchPerspective, matchStatus, sortMatchesForUser, userLabel } from '@batalla/core';
import { useBoard, useMyMatches, useSession, useTournamentsById, useUserDirectory } from '@batalla/hooks';
import { Chip, Empty, PageHead, QueryState } from '../components/ui.jsx';

const FILTERS = [
  { id: 'all', label: 'Todas', test: () => true },
  { id: 'open', label: 'En curso', test: (m) => !isMatchEnded(m) },
  { id: 'ended', label: 'Terminadas', test: (m) => isMatchEnded(m) },
];

export function MatchesPage() {
  const { session } = useSession();
  const [filter, setFilter] = useState('all');
  const query = useMyMatches();
  const { data: board } = useBoard();
  const tournaments = useTournamentsById((query.data ?? []).map((m) => m.tournament));
  const directory = useUserDirectory();

  return (
    <>
      <PageHead
        title="Mis partidas"
        sub="Las partidas en las que participas, terminadas o no."
        aside={
          <div className="seg" role="group" aria-label="Filtro">
            {FILTERS.map((f) => (
              <button key={f.id} className={filter === f.id ? 'on' : ''} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        }
      />
      <QueryState query={query}>
        {(matches) => {
          const visible = sortMatchesForUser(matches, session.userId).filter(FILTERS.find((f) => f.id === filter).test);
          if (visible.length === 0) return <Empty>No hay partidas para mostrar.</Empty>;
          return (
            <section className="card" style={{ padding: '8px 12px 12px' }}>
              <div className="scroll">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Torneo</th>
                      <th>Rival</th>
                      <th>Estado</th>
                      <th>Detalle</th>
                      <th>
                        <span className="visually-hidden">Acción</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((m) => {
                      const status = matchStatus(m, session.userId);
                      const p = matchPerspective(m, session.userId);
                      return (
                        <tr key={m.id} className={status.actionable ? 'me' : undefined}>
                          <td className="b">{tournaments[m.tournament]?.name ?? '—'}</td>
                          <td>{userLabel(p.rivalId, directory)}</td>
                          <td>
                            <Chip tone={status.tone}>{status.label}</Chip>
                          </td>
                          <td className="muted sm">{matchDetail(m, session.userId, board)}</td>
                          <td>
                            <div className="acts">
                              <Link className={`btn sm ${status.actionable ? 'acc' : 'out'}`} to={`/partidas/${m.id}`}>
                                {status.action}
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        }}
      </QueryState>
      <p className="sm muted" style={{ marginTop: 16 }}>
        El estado se actualiza solo mientras tienes la partida abierta.
      </p>
    </>
  );
}
