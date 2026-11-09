import { useParams } from 'react-router-dom';
import { matchPerspective, PHASE, shortUserLabel, userLabel } from '@batalla/core';
import { useBoard, useMatch, useSession, useTournament, useUserDirectory } from '@batalla/hooks';
import { ErrorState, Loading, PageHead } from '../components/ui.jsx';
import { PlaceFleet } from './match/PlaceFleet.jsx';
import { MatchInProgress } from './match/MatchInProgress.jsx';
import { MatchEnded } from './match/MatchEnded.jsx';

/**
 * Pantalla de una partida. Según la fase muestra la ubicación de la flota,
 * el juego en curso o el resultado. La partida se consulta cada 3 s
 * (useMatch) mientras está abierta, para enterarse de las jugadas del rival.
 */
export function MatchPage() {
  const { id } = useParams();
  const { session } = useSession();
  const matchQuery = useMatch(id);
  const boardQuery = useBoard();
  const { data: tournament } = useTournament(matchQuery.data?.tournament);
  const directory = useUserDirectory();

  const failed = matchQuery.isError ? matchQuery : boardQuery.isError ? boardQuery : null;
  if (failed && !matchQuery.data) return <ErrorState error={failed.error} onRetry={() => failed.refetch()} />;
  if (!matchQuery.data || !boardQuery.data) return <Loading label="Cargando partida…" />;

  const match = matchQuery.data;
  const p = matchPerspective(match, session.userId);
  const crumbs = [{ to: '/partidas', label: 'Partidas' }, { label: tournament?.name ?? 'Partida' }];
  if (!p) {
    return <PageHead crumbs={crumbs} title="Partida" sub="No participas en esta partida, así que no puedes verla." />;
  }

  const rival = userLabel(p.rivalId, directory);
  crumbs[1].label = `${tournament?.name ?? 'Partida'} · vs ${rival}`;
  const rivalShort = shortUserLabel(p.rivalId, directory);
  const props = { match, board: boardQuery.data, perspective: p, rival, rivalShort, crumbs };

  if (p.phase === PHASE.PLACE_FLEET) return <PlaceFleet {...props} />;
  if (p.phase === PHASE.ENDED) return <MatchEnded {...props} />;
  return <MatchInProgress {...props} />;
}
