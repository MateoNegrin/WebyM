import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { matchPerspective, PHASE, shortUserLabel, userLabel } from '@batalla/core';
import { useBoard, useMatch, useSession, useTournament, useUserDirectory } from '@batalla/hooks';
import { ErrorState, Header, Loading, Screen, T } from '../../../components/ui.jsx';
import { PlaceFleet } from '../../../screens/PlaceFleet.jsx';
import { MatchInProgress } from '../../../screens/MatchInProgress.jsx';
import { MatchEnded } from '../../../screens/MatchEnded.jsx';

/**
 * Partida: según la fase, ubicar flota, jugar o ver el resultado.
 * useMatch consulta GET /api/matches/:id cada 3 s mientras la pantalla está abierta.
 */
export default function MatchScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useSession();
  const matchQuery = useMatch(id);
  const boardQuery = useBoard();
  const { data: tournament } = useTournament(matchQuery.data?.tournament);
  const directory = useUserDirectory();

  const match = matchQuery.data;
  const p = match && matchPerspective(match, session.userId);
  const rival = p ? userLabel(p.rivalId, directory) : null;
  const title = !p ? 'Partida' : p.phase === PHASE.PLACE_FLEET ? 'Coloca tu flota' : `vs ${rival}`;
  const subtitle = p?.phase === PHASE.PLACE_FLEET ? `vs ${rival} · ${tournament?.name ?? ''}` : tournament?.name;

  let body;
  const failed = matchQuery.isError ? matchQuery : boardQuery.isError ? boardQuery : null;
  if (failed && !match) {
    body = (
      <Screen>
        <ErrorState error={failed.error} onRetry={() => failed.refetch()} />
      </Screen>
    );
  } else if (!match || !boardQuery.data) {
    body = <Loading label="Cargando partida…" />;
  } else if (!p) {
    body = (
      <Screen>
        <T variant="muted">No participas en esta partida.</T>
      </Screen>
    );
  } else {
    const props = { match, board: boardQuery.data, perspective: p, rival, rivalShort: shortUserLabel(p.rivalId, directory) };
    body = p.phase === PHASE.PLACE_FLEET ? <PlaceFleet {...props} /> : p.phase === PHASE.ENDED ? <MatchEnded {...props} /> : <MatchInProgress {...props} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Header back title={title} subtitle={subtitle} />
      {body}
    </View>
  );
}
