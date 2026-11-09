import { RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  invitationState,
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
import { confirmAction, showError } from '../../../lib/dialogs.js';
import { Button, Card, Chip, Empty, Header, ListCard, QueryState, Screen, Section, T } from '../../../components/ui.jsx';

export default function HomeScreen() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const invitations = useMyInvitations();
  const matches = useMyMatches();
  const tournaments = useMyTournaments();
  const refreshing = invitations.isRefetching || matches.isRefetching || tournaments.isRefetching;

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <Screen
        title="Inicio"
        sub={session.email}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => queryClient.invalidateQueries()} />}
      >
        <InvitationsSection query={invitations} />
        <PendingMatchesSection query={matches} />
        <TournamentsSection query={tournaments} />
      </Screen>
    </View>
  );
}

function InvitationsSection({ query }) {
  const tournaments = useTournamentsById((query.data ?? []).map((i) => i.tournament));
  const directory = useUserDirectory();
  const respond = useRespondInvitation();

  const answer = (inv, accept) => {
    const name = tournaments[inv.tournament]?.name ?? 'este torneo';
    const run = () => respond.mutate({ id: inv.id, accept }, { onError: (e) => showError('No se pudo responder', e) });
    if (accept) return run();
    confirmAction({ title: 'Rechazar invitación', message: `¿Rechazar la invitación a ${name}?`, confirmText: 'Rechazar', destructive: true, onConfirm: run });
  };

  const pending = (query.data ?? []).filter((i) => invitationState(i) === 'pending');
  return (
    <Section title="Invitaciones" aside={pending.length > 0 && <Chip tone="acc">{pending.length}</Chip>}>
      <QueryState query={query}>
        {() =>
          pending.length === 0 ? (
            <Empty>No tienes invitaciones pendientes.</Empty>
          ) : (
            pending.map((inv) => {
              const inviter = knownEmail(inv.invitingUser, directory);
              return (
                <Card key={inv.id}>
                  <T variant="bold">{tournaments[inv.tournament]?.name ?? 'Torneo'}</T>
                  <T variant="small">
                    {inviter ? `Te invita ${inviter}` : 'Te invitó el organizador'} · {relativeDay(inv.createdAt)}
                  </T>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <Button title="Aceptar" style={{ flex: 1 }} disabled={respond.isPending} onPress={() => answer(inv, true)} />
                    <Button title="Rechazar" variant="out" style={{ flex: 1 }} disabled={respond.isPending} onPress={() => answer(inv, false)} />
                  </View>
                </Card>
              );
            })
          )
        }
      </QueryState>
    </Section>
  );
}

function PendingMatchesSection({ query }) {
  const { session } = useSession();
  const router = useRouter();
  const tournaments = useTournamentsById((query.data ?? []).map((m) => m.tournament));
  const directory = useUserDirectory();
  return (
    <Section title="Te toca">
      <QueryState query={query}>
        {(matches) => {
          const pending = sortMatchesForUser(matches, session.userId).filter((m) => matchStatus(m, session.userId).actionable);
          if (pending.length === 0) return <Empty>No tienes jugadas pendientes.</Empty>;
          return pending.map((m) => {
            const s = matchStatus(m, session.userId);
            return (
              <ListCard
                key={m.id}
                title={`vs ${userLabel(matchPerspective(m, session.userId).rivalId, directory)}`}
                subtitle={tournaments[m.tournament]?.name}
                chip={s.label}
                tone={s.tone}
                onPress={() => router.push(`/partida/${m.id}`)}
              />
            );
          });
        }}
      </QueryState>
    </Section>
  );
}

function TournamentsSection({ query }) {
  const router = useRouter();
  const directory = useUserDirectory();
  return (
    <Section title="Mis torneos">
      <QueryState query={query}>
        {(tournaments) =>
          tournaments.length === 0 ? (
            <Empty>Cuando aceptes una invitación, el torneo aparecerá aquí.</Empty>
          ) : (
            tournaments.map((t) => {
              const s = tournamentStatus(t);
              const organiser = knownEmail(t.organisedBy, directory);
              return (
                <ListCard
                  key={t.id}
                  title={t.name}
                  subtitle={organiser ? `Organiza ${organiser}` : undefined}
                  chip={s.label}
                  tone={s.tone}
                  onPress={() => router.push(`/torneo/${t.id}`)}
                />
              );
            })
          )
        }
      </QueryState>
    </Section>
  );
}
