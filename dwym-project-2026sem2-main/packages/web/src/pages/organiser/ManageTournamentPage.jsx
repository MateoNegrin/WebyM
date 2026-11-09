import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  formatDate,
  invitationState,
  INVITATION_LABELS,
  INVITATION_TONES,
  isMatchEnded,
  neutralMatchStatus,
  playerIdOf,
  shortUserLabel,
  tournamentStatus,
  userLabel,
} from '@batalla/core';
import {
  keys,
  useApiMutation,
  useSession,
  useTournament,
  useTournamentInvitations,
  useTournamentMatches,
  useUserDirectory,
  useUsers,
} from '@batalla/hooks';
import { Card, Chip, Empty, PageHead, QueryState } from '../../components/ui.jsx';
import { useActionRunner } from '../../hooks/useToast.js';
import { useOrganisedTournaments } from '../../hooks/useOrganisedTournaments.js';

export function ManageTournamentPage() {
  const { id } = useParams();
  const { session } = useSession();
  const query = useTournament(id);
  const { remember } = useOrganisedTournaments();
  const canManage = query.data && (query.data.organisedBy === session.userId || session.role === 'admin');

  useEffect(() => {
    if (canManage) remember(id);
  }, [canManage, id, remember]);

  return (
    <QueryState query={query}>
      {(t) =>
        canManage ? (
          <ManageTournament tournament={t} />
        ) : (
          <PageHead title={t.name} sub="Solo el organizador del torneo puede gestionarlo." />
        )
      }
    </QueryState>
  );
}

function ManageTournament({ tournament: t }) {
  const status = tournamentStatus(t);
  const invitations = useTournamentInvitations(t.id);
  const matches = useTournamentMatches(t.id);
  return (
    <>
      <PageHead
        crumbs={[{ to: '/organizar', label: 'Mis torneos' }, { label: t.name }]}
        title={t.name}
        sub="Gestiona invitaciones, partidas y ganador."
        aside={<Chip tone={status.tone}>{status.label}</Chip>}
      />
      <div className="stack">
        <NameCard tournament={t} />
        <InvitationsCard tournament={t} invitations={invitations} matches={matches.data ?? []} />
        <MatchesCard tournament={t} matches={matches} invitations={invitations.data ?? []} />
        <div className="grid2">
          <WinnerCard tournament={t} matches={matches.data ?? []} />
          <DangerCard tournament={t} />
        </div>
      </div>
    </>
  );
}

/** Invalida todo lo relacionado a un torneo tras una mutación. */
const tournamentKeys = (id) => [keys.tournament(id), keys.tournamentInvitations(id), keys.tournamentMatches(id)];

function NameCard({ tournament: t }) {
  const [name, setName] = useState(t.name);
  const run = useActionRunner();
  const rename = useApiMutation((api, n) => api.updateTournament(t.id, { name: n }), { invalidate: () => tournamentKeys(t.id) });
  return (
    <Card title="Datos del torneo" lead="Puedes cambiar el nombre en cualquier momento.">
      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          run(rename, name.trim(), { success: 'Nombre actualizado.' })();
        }}
      >
        <div className="field">
          <label htmlFor="nm">Nombre</label>
          <input className="input" id="nm" type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button className="btn" type="submit" disabled={!name.trim() || name.trim() === t.name || rename.isPending}>
          Guardar nombre
        </button>
      </form>
    </Card>
  );
}

function InvitationsCard({ tournament: t, invitations, matches }) {
  const { session } = useSession();
  const users = useUsers();
  const directory = useUserDirectory();
  const run = useActionRunner();
  const [selected, setSelected] = useState('');
  const invalidate = () => tournamentKeys(t.id);
  const invite = useApiMutation((api, userId) => api.invite(userId, t.id), { invalidate });
  const revoke = useApiMutation((api, invitationId) => api.deleteInvitation(invitationId), { invalidate });

  // Si a alguien se lo reinvitó tras rechazar, mostramos solo su invitación más reciente.
  const latest = useMemo(() => {
    const byUser = {};
    [...(invitations.data ?? [])]
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
      .forEach((inv) => {
        byUser[inv.invitedUser] = inv;
      });
    return Object.values(byUser);
  }, [invitations.data]);

  const activeInvitees = new Set(latest.filter((i) => invitationState(i) !== 'rejected').map((i) => i.invitedUser));
  const candidates = (users.data ?? [])
    .filter((u) => u.id !== t.organisedBy && u.id !== session.userId && !activeInvitees.has(u.id))
    .sort((a, b) => a.email.localeCompare(b.email));
  const hasPlayed = (userId) => matches.some((m) => m.playerNorth === userId || m.playerSouth === userId);

  return (
    <Card title="Invitaciones" lead="Los jugadores deben aceptar la invitación para poder participar.">
      <form
        className="inline-form"
        style={{ marginBottom: 20 }}
        onSubmit={(e) => {
          e.preventDefault();
          invite.mutate(selected, { onSuccess: () => setSelected('') });
        }}
      >
        <div className="field">
          <label htmlFor="ju">Invitar jugador</label>
          <select className="select" id="ju" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">{candidates.length ? 'Elegir un usuario…' : 'No hay más usuarios para invitar'}</option>
            {candidates.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
        </div>
        <button className="btn acc" type="submit" disabled={!selected || invite.isPending}>
          Invitar
        </button>
      </form>
      {invite.isError && (
        <div className="alert err" role="alert" style={{ marginBottom: 16 }}>
          {invite.error.message}
        </div>
      )}
      <QueryState query={invitations}>
        {() =>
          latest.length === 0 ? (
            <Empty>Todavía no invitaste a nadie.</Empty>
          ) : (
            <div className="scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Jugador</th>
                    <th>Estado</th>
                    <th>Respuesta</th>
                    <th>
                      <span className="visually-hidden">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {latest.map((inv) => {
                    const state = invitationState(inv);
                    const played = hasPlayed(inv.invitedUser);
                    const who = userLabel(inv.invitedUser, directory);
                    return (
                      <tr key={inv.id}>
                        <td className="b">{who}</td>
                        <td>
                          <Chip tone={INVITATION_TONES[state]}>{INVITATION_LABELS[state]}</Chip>
                        </td>
                        <td className="muted sm">{formatDate(inv.acceptedAt ?? inv.rejectedAt)}</td>
                        <td>
                          <div className="acts">
                            {state === 'rejected' ? (
                              <button className="btn sm out" disabled={invite.isPending} onClick={run(invite, inv.invitedUser, { success: `Invitaste de nuevo a ${who}.` })}>
                                Volver a invitar
                              </button>
                            ) : (
                              <>
                                {played && (
                                  <span className="xs muted" style={{ alignSelf: 'center' }}>
                                    Ya jugó partidas
                                  </span>
                                )}
                                <button
                                  className="btn sm dng"
                                  disabled={played || revoke.isPending}
                                  onClick={run(revoke, inv.id, { confirm: `¿Revocar la invitación de ${who}?`, success: 'Invitación revocada.' })}
                                >
                                  Revocar
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </QueryState>
    </Card>
  );
}

function MatchesCard({ tournament: t, matches, invitations }) {
  const directory = useUserDirectory();
  const run = useActionRunner();
  const [north, setNorth] = useState('');
  const [south, setSouth] = useState('');
  const invalidate = () => [...tournamentKeys(t.id), keys.myMatches];
  const create = useApiMutation((api) => api.createMatch(t.id, north, south), { invalidate });
  const end = useApiMutation((api, { id, winner }) => api.endMatch(id, winner), { invalidate });
  const remove = useApiMutation((api, matchId) => api.deleteMatch(matchId), { invalidate });

  const accepted = [...new Set(invitations.filter((i) => invitationState(i) === 'accepted').map((i) => i.invitedUser))];
  const options = (exclude) =>
    accepted
      .filter((u) => u !== exclude)
      .map((u) => (
        <option key={u} value={u}>
          {userLabel(u, directory)}
        </option>
      ));

  return (
    <Card title="Partidas" lead="Arma partidas entre jugadores que aceptaron. Norte dispara primero.">
      <form
        className="inline-form"
        style={{ marginBottom: 20 }}
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(undefined, {
            onSuccess: () => {
              setNorth('');
              setSouth('');
            },
          });
        }}
      >
        <div className="field">
          <label htmlFor="pn">Jugador Norte</label>
          <select className="select" id="pn" value={north} onChange={(e) => setNorth(e.target.value)}>
            <option value="">Elegir…</option>
            {options(south)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ps">Jugador Sur</label>
          <select className="select" id="ps" value={south} onChange={(e) => setSouth(e.target.value)}>
            <option value="">Elegir…</option>
            {options(north)}
          </select>
        </div>
        <button className="btn acc" type="submit" disabled={!north || !south || create.isPending}>
          Crear partida
        </button>
      </form>
      {accepted.length < 2 && <p className="sm muted" style={{ marginTop: -8, marginBottom: 16 }}>Se necesitan al menos dos jugadores que hayan aceptado la invitación.</p>}
      {create.isError && (
        <div className="alert err" role="alert" style={{ marginBottom: 16 }}>
          {create.error.message}
        </div>
      )}
      <QueryState query={matches}>
        {(list) =>
          list.length === 0 ? (
            <Empty>Todavía no hay partidas en este torneo.</Empty>
          ) : (
            <div className="scroll">
              <table className="tbl" style={{ minWidth: 820 }}>
                <thead>
                  <tr>
                    <th>Norte</th>
                    <th>Sur</th>
                    <th>Estado</th>
                    <th>Ganador</th>
                    <th>
                      <span className="visually-hidden">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((m) => {
                    const status = neutralMatchStatus(m);
                    const ended = isMatchEnded(m);
                    return (
                      <tr key={m.id}>
                        <td className="b">{userLabel(m.playerNorth, directory)}</td>
                        <td>{userLabel(m.playerSouth, directory)}</td>
                        <td>
                          <Chip tone={status.tone}>{status.label}</Chip>
                        </td>
                        <td className={ended ? undefined : 'muted'}>{m.winner ? userLabel(playerIdOf(m, m.winner), directory) : '—'}</td>
                        <td>
                          <div className="acts">
                            {!ended &&
                              ['north', 'south'].map((side) => {
                                const quitter = shortUserLabel(playerIdOf(m, side), directory);
                                const winner = side === 'north' ? 'south' : 'north';
                                return (
                                  <button
                                    key={side}
                                    className="btn sm out"
                                    disabled={end.isPending}
                                    onClick={run(
                                      end,
                                      { id: m.id, winner },
                                      { confirm: `¿Dar la partida por abandonada por ${quitter}? Ganará su rival.`, success: 'Partida terminada.' },
                                    )}
                                  >
                                    Abandona {quitter}
                                  </button>
                                );
                              })}
                            <button
                              className="btn sm dng"
                              disabled={remove.isPending}
                              onClick={run(remove, m.id, { confirm: '¿Eliminar esta partida? No se puede deshacer.', success: 'Partida eliminada.' })}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </QueryState>
    </Card>
  );
}

function WinnerCard({ tournament: t, matches }) {
  const directory = useUserDirectory();
  const run = useActionRunner();
  const winners = [...new Set(matches.filter((m) => m.winner).map((m) => playerIdOf(m, m.winner)))];
  const [selected, setSelected] = useState(t.winner ?? '');
  const save = useApiMutation((api, winner) => api.updateTournament(t.id, { winner }), { invalidate: () => tournamentKeys(t.id) });

  return (
    <Card title="Ganador del torneo" lead="Solo puede ser un jugador que haya ganado al menos una partida del torneo.">
      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          run(save, selected || null, { success: selected ? 'Ganador definido.' : 'Se quitó el ganador.' })();
        }}
      >
        <div className="field">
          <label htmlFor="gw">Ganador</label>
          <select className="select" id="gw" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Sin definir</option>
            {winners.map((u) => (
              <option key={u} value={u}>
                {userLabel(u, directory)}
              </option>
            ))}
          </select>
        </div>
        <button className="btn" type="submit" disabled={selected === (t.winner ?? '') || save.isPending}>
          Definir ganador
        </button>
      </form>
      {winners.length === 0 && <p className="sm muted" style={{ marginTop: 12 }}>Aún no hay partidas terminadas con ganador.</p>}
    </Card>
  );
}

function DangerCard({ tournament: t }) {
  const navigate = useNavigate();
  const { forget } = useOrganisedTournaments();
  const run = useActionRunner();
  const remove = useApiMutation((api) => api.deleteTournament(t.id), {
    onSuccess: (_d, _v, queryClient) => {
      forget(t.id);
      queryClient.removeQueries({ queryKey: keys.tournament(t.id) });
      navigate('/organizar', { replace: true });
    },
  });
  return (
    <Card title="Zona de peligro" lead="Eliminar el torneo no se puede deshacer.">
      <button className="btn dng" disabled={remove.isPending} onClick={run(remove, undefined, { confirm: `¿Eliminar el torneo "${t.name}"? No se puede deshacer.` })}>
        Eliminar torneo
      </button>
    </Card>
  );
}
