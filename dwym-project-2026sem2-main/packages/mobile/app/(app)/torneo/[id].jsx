import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { knownEmail, matchStatus, neutralMatchStatus, playerIdOf, shortUserLabel, sideOf, tournamentStatus, userLabel } from '@batalla/core';
import { useSession, useTournament, useTournamentMatches, useUserDirectory } from '@batalla/hooks';
import { Chip, Empty, Header, ListCard, QueryState, Screen, Section, T } from '../../../components/ui.jsx';

export default function TournamentScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useSession();
  const router = useRouter();
  const tournament = useTournament(id);
  const matches = useTournamentMatches(id);
  const directory = useUserDirectory();
  const t = tournament.data;
  const organiser = t && knownEmail(t.organisedBy, directory);

  return (
    <View style={{ flex: 1 }}>
      <Header back title={t?.name ?? 'Torneo'} subtitle={organiser ? `Organiza ${organiser}` : undefined} />
      <Screen contentStyle={{ paddingTop: 20 }}>
        <QueryState query={tournament}>
          {(tour) => {
            const s = tournamentStatus(tour);
            return (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip tone={s.tone}>{s.label}</Chip>
                <T variant="small">Ganador: {tour.winner ? userLabel(tour.winner, directory) : 'sin definir'}</T>
              </View>
            );
          }}
        </QueryState>
        <Section title="Partidas del torneo">
          <T variant="small">Solo puedes abrir las partidas en las que juegas.</T>
          <QueryState query={matches}>
            {(list) =>
              list.length === 0 ? (
                <Empty>El organizador todavía no armó partidas.</Empty>
              ) : (
                list.map((m) => {
                  const mine = sideOf(m, session.userId);
                  const s = mine ? matchStatus(m, session.userId) : neutralMatchStatus(m);
                  const names = `${shortUserLabel(m.playerNorth, directory)} vs ${shortUserLabel(m.playerSouth, directory)}`;
                  let subtitle = 'Norte · Sur';
                  if (!mine) subtitle = m.winner ? `Ganó ${shortUserLabel(playerIdOf(m, m.winner), directory)}` : 'No participas';
                  else if (m.winner) subtitle = m.winner === mine ? 'Ganaste esta partida' : 'Perdiste esta partida';
                  return (
                    <ListCard
                      key={m.id}
                      title={names}
                      subtitle={subtitle}
                      chip={s.label}
                      tone={s.tone}
                      highlight={s.actionable}
                      flat={!mine}
                      onPress={mine ? () => router.push(`/partida/${m.id}`) : undefined}
                    />
                  );
                })
              )
            }
          </QueryState>
        </Section>
      </Screen>
    </View>
  );
}
