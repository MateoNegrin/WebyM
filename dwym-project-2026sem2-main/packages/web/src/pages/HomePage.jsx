import { Link } from 'react-router-dom';
import {
  invitationState,
  INVITATION_LABELS,
  INVITATION_TONES,
  knownEmail,
  matchPerspective,
  matchStatus,
  relativeDay,
  sortMatchesForUser,
  tournamentStatus,
  userLabel,
} from '@batalla/core';
import {
  useMyInvitations,
  useMyMatches,
  useMyTournaments,
  useRespondInvitation,
  useSession,
  useTournamentsById,
  useUserDirectory,
} from '@batalla/hooks';
import { Card, Chip, Empty, PageHead, QueryState } from '../components/ui.jsx';
import { useActionRunner } from '../hooks/useToast.js';

export function HomePage() {
  return (
    <>
      <PageHead title="Inicio" sub="Tus invitaciones, partidas pendientes y torneos." />
      <div className="grid2">
        <InvitationsCard />
        <div className="stack">
          <PendingMatchesCard />
          <MyTournamentsCard />
        </div>
      </div>
    </>
  );
}

function InvitationsCard() {
  const query = useMyInvitations();
  const tournaments = useTournamentsById((query.data ?? []).map((i) => i.tournament));
  const directory = useUserDirectory();
  const respond = useRespondInvitation();
  const run = useActionRunner();

  const describe = (inv) => {
    const inviter = knownEmail(inv.invitingUser, directory);
    return inviter ? `Te invita ${inviter}` : 'Te invitó el organizador';
  };
  const name = (inv) => tournaments[inv.tournament]?.name ?? 'Torneo';

  return (
    <QueryState query={query}>
      {(invitations) => {
        const sorted = [...invitations].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        const pending = sorted.filter((i) => invitationState(i) === 'pending');
        const answered = sorted.filter((i) => invitationState(i) !== 'pending');
        return (
          <Card
            title="Invitaciones pendientes"
            titleAside={pending.length > 0 && <Chip tone="acc">{pending.length}</Chip>}
            lead="Acepta o rechaza para participar en un torneo."
            aria-label="Invitaciones"
          >
            {pending.length === 0 && <Empty>No tienes invitaciones pendientes.</Empty>}
            <div className="list">
              {pending.map((inv) => (
                <div className="li" key={inv.id}>
                  <div className="grow">
                    <div className="t">{name(inv)}</div>
                    <div className="sm muted">
                      {describe(inv)} · {relativeDay(inv.createdAt)}
                    </div>
                  </div>
                  <div className="acts">
                    <button
                      className="btn sm"
                      disabled={respond.isPending}
                      onClick={run(respond, { id: inv.id, accept: true }, { success: `Ahora participas en ${name(inv)}.` })}
                    >
                      Aceptar
                    </button>
                    <button
                      className="btn sm out"
                      disabled={respond.isPending}
                      onClick={run(respond, { id: inv.id, accept: false }, { confirm: `¿Rechazar la invitación a ${name(inv)}?` })}
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {answered.length > 0 && (
              <>
                <h3 style={{ margin: '28px 0 4px', color: '#53687A' }}>Ya respondidas</h3>
                <div className="list">
                  {answered.map((inv) => {
                    const state = invitationState(inv);
                    return (
                      <div className="li" key={inv.id}>
                        <div className="grow">
                          <div className="t">{name(inv)}</div>
                          <div className="sm muted">{describe(inv)}</div>
                        </div>
                        <Chip tone={INVITATION_TONES[state]}>{INVITATION_LABELS[state]}</Chip>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        );
      }}
    </QueryState>
  );
}

function PendingMatchesCard() {
  const { session } = useSession();
  const query = useMyMatches();
  const tournaments = useTournamentsById((query.data ?? []).map((m) => m.tournament));
  const directory = useUserDirectory();

  return (
    <Card title="Te toca" lead="Partidas que esperan una acción tuya.">
      <QueryState query={query}>
        {(matches) => {
          const pending = sortMatchesForUser(matches, session.userId).filter((m) => matchStatus(m, session.userId).actionable);
          if (pending.length === 0) return <Empty>No tienes jugadas pendientes. ¡Buen trabajo!</Empty>;
          return (
            <div className="list">
              {pending.map((m) => {
                const status = matchStatus(m, session.userId);
                const p = matchPerspective(m, session.userId);
                return (
                  <div className="li" key={m.id}>
                    <div className="grow">
                      <div className="t">vs {userLabel(p.rivalId, directory)}</div>
                      <div className="sm muted">{tournaments[m.tournament]?.name ?? 'Torneo'}</div>
                    </div>
                    <Chip tone={status.tone}>{status.label}</Chip>
                    <Link className="btn sm acc" to={`/partidas/${m.id}`}>
                      {status.action}
                    </Link>
                  </div>
                );
              })}
            </div>
          );
        }}
      </QueryState>
    </Card>
  );
}

function MyTournamentsCard() {
  const query = useMyTournaments();
  const directory = useUserDirectory();
  return (
    <Card title="Mis torneos" lead="Torneos donde aceptaste participar.">
      <QueryState query={query}>
        {(tournaments) =>
          tournaments.length === 0 ? (
            <Empty>Cuando aceptes una invitación, el torneo aparecerá aquí.</Empty>
          ) : (
            <div className="list">
              {tournaments.map((t) => {
                const status = tournamentStatus(t);
                const organiser = knownEmail(t.organisedBy, directory);
                return (
                  <div className="li" key={t.id}>
                    <div className="grow">
                      <div className="t">{t.name}</div>
                      {organiser && <div className="sm muted">Organiza {organiser}</div>}
                    </div>
                    <Chip tone={status.tone}>{status.label}</Chip>
                    <Link className="btn sm out" to={`/torneos/${t.id}`}>
                      Ver torneo
                    </Link>
                  </div>
                );
              })}
            </div>
          )
        }
      </QueryState>
    </Card>
  );
}
