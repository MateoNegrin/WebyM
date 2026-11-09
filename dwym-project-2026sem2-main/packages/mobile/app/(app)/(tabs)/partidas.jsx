import { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { isMatchEnded, matchPerspective, matchStatus, sortMatchesForUser, userLabel } from '@batalla/core';
import { useMyMatches, useSession, useTournamentsById, useUserDirectory } from '@batalla/hooks';
import { Empty, Header, ListCard, QueryState, Screen, Segmented } from '../../../components/ui.jsx';

const FILTERS = [
  { value: 'all', label: 'Todas', test: () => true },
  { value: 'open', label: 'En curso', test: (m) => !isMatchEnded(m) },
  { value: 'ended', label: 'Terminadas', test: (m) => isMatchEnded(m) },
];

export default function MatchesScreen() {
  const { session } = useSession();
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const query = useMyMatches();
  const tournaments = useTournamentsById((query.data ?? []).map((m) => m.tournament));
  const directory = useUserDirectory();

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <Screen title="Partidas" refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />}>
        <Segmented options={FILTERS} value={filter} onChange={setFilter} />
        <QueryState query={query}>
          {(matches) => {
            const visible = sortMatchesForUser(matches, session.userId).filter(FILTERS.find((f) => f.value === filter).test);
            if (visible.length === 0) return <Empty>No hay partidas para mostrar.</Empty>;
            return (
              <View style={{ gap: 10 }}>
                {visible.map((m) => {
                  const s = matchStatus(m, session.userId);
                  return (
                    <ListCard
                      key={m.id}
                      title={`vs ${userLabel(matchPerspective(m, session.userId).rivalId, directory)}`}
                      subtitle={tournaments[m.tournament]?.name}
                      chip={s.label}
                      tone={s.tone}
                      highlight={s.actionable}
                      onPress={() => router.push(`/partida/${m.id}`)}
                    />
                  );
                })}
              </View>
            );
          }}
        </QueryState>
      </Screen>
    </View>
  );
}
