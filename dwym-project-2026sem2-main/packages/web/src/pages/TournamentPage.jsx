import { Link, useParams } from 'react-router-dom';
import {
  invitationState,
  INVITATION_LABELS,
  INVITATION_TONES,
  knownEmail,
  matchStatus,
  sideOf,
  tournamentStatus,
  userLabel,
} from '@batalla/core';
import { useMyInvitations, useSession, useTournament, useTournamentMatches, useUserDirectory } from '@batalla/hooks';
import { Card, Chip, Empty, PageHead, QueryState } from '../components/ui.jsx';

const INVITATION_TEXT = {
  accepted: 'Aceptada. Participas en este torneo.',
  pending: 'Todavía no respondiste la invitación. Hazlo desde el inicio.',
  rejected: 'Rechazaste la invitación a este torneo.',
};

export function TournamentPage() {
  const { id } = useParams();
  const { session } = useSession();
  const tournamentQuery = useTournament(id);
  const matchesQuery = useTournamentMatches(id);
  const { data: invitations } = useMyInvitations();
  const directory = useUserDirectory();

  return (
    <QueryState query={tournamentQuery}>
      {(t) => {
        const status = tournamentStatus(t);
        const organiser = knownEmail(t.organisedBy, directory);
        const myInvitation = invitations?.find((i) => i.tournament === t.id);
        const invState = myInvitation && invitationState(myInvitation);
        return (
          <>
            <PageHead
              crumbs={[{ to: '/', label: 'Inicio' }, { label: t.name }]}
              title={t.name}
              sub={organiser ? `Organiza ${organiser}` : undefined}
              aside={<Chip tone={status.tone}>{status.label}</Chip>}
            />
            <div className="split">
              <Card className="main" title="Partidas del torneo" lead="Solo puedes abrir las partidas en las que juegas.">
                <QueryState query={matchesQuery}>
                  {(matches) =>
                    matches.length === 0 ? (
                      <Empty>El organizador todavía no armó partidas.</Empty>
                    ) : (
                      <div className="scroll">
                        <table className="tbl">
                          <thead>
                            <tr>
                              <th>Norte</th>
                              <th>Sur</th>
                              <th>Estado</th>
                              <th>Ganador</th>
                              <th>
                                <span className="visually-hidden">Acción</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {matches.map((m) => {
                              const mine = sideOf(m, session.userId);
                              const s = matchStatus(m, session.userId);
                              const winnerId = m.winner && (m.winner === 'north' ? m.playerNorth : m.playerSouth);
                              return (
                                <tr key={m.id} className={mine ? 'me' : undefined}>
                                  <td className={mine === 'north' ? 'b' : undefined}>{userLabel(m.playerNorth, directory)}</td>
                                  <td className={mine === 'south' ? 'b' : undefined}>{userLabel(m.playerSouth, directory)}</td>
                                  <td>
                                    <Chip tone={s.tone}>{s.label}</Chip>
                                  </td>
                                  <td className={winnerId ? undefined : 'muted'}>{winnerId ? userLabel(winnerId, directory) : '—'}</td>
                                  <td>
                                    {mine && (
                                      <div className="acts">
                                        <Link className={`btn sm ${s.actionable ? 'acc' : 'out'}`} to={`/partidas/${m.id}`}>
                                          {s.action}
                                        </Link>
                                      </div>
                                    )}
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
              <div className="side stack">
                <Card title="Ganador">
                  <p className="muted" style={{ marginTop: 8 }}>
                    {t.winner ? (
                      <>
                        <Chip tone="ok">{userLabel(t.winner, directory)}</Chip>
                        {t.winner === session.userId && ' ¡Ganaste el torneo!'}
                      </>
                    ) : (
                      'El organizador aún no definió al ganador del torneo.'
                    )}
                  </p>
                </Card>
                {invState && (
                  <Card title="Tu invitación">
                    <p className="muted" style={{ marginTop: 8, marginBottom: 12 }}>
                      {INVITATION_TEXT[invState]}
                    </p>
                    <Chip tone={INVITATION_TONES[invState]}>{INVITATION_LABELS[invState]}</Chip>
                  </Card>
                )}
              </div>
            </div>
          </>
        );
      }}
    </QueryState>
  );
}
