import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { boardModel, endedBySinking, moveHistory } from '@batalla/core';
import { useMatchMoves } from '@batalla/hooks';
import { Board, LEGENDS, Legend } from '../components/Board.jsx';
import { MoveLog } from '../components/MoveLog.jsx';
import { Button, ErrorState, Heading, Loading, Screen, Segmented } from '../components/ui.jsx';
import { TurnBanner } from './MatchInProgress.jsx';

const BOARDS = [
  { value: 'rival', label: 'Flota rival' },
  { value: 'mine', label: 'Mi flota' },
];

/** Partida terminada: resultado, flotas reveladas e historial completo. */
export function MatchEnded({ match, board, perspective: p, rival, rivalShort }) {
  const router = useRouter();
  const [tab, setTab] = useState('rival');
  const movesQuery = useMatchMoves(match.id, true);
  const sunkAll = endedBySinking(match, board);

  const rivalRows = useMemo(() => boardModel(board, { fleet: p.rivalFleet, shots: p.myShots }), [board, p.rivalFleet, p.myShots]);
  const myRows = useMemo(() => boardModel(board, { fleet: p.myFleet, shots: p.rivalShots }), [board, p.myFleet, p.rivalShots]);
  const history = useMemo(
    () => (movesQuery.data ? moveHistory(movesQuery.data, match).map((m) => ({ ...m, who: m.side === p.side ? 'Tú' : rivalShort })) : []),
    [movesQuery.data, match, p.side, rivalShort],
  );

  const shots = p.won ? p.myShots.length : p.rivalShots.length;
  const subtitle = !sunkAll
    ? `El organizador dio la partida por terminada${p.won ? ' a tu favor' : ` a favor de ${rival}`}.`
    : p.won
      ? `Hundiste todos los barcos de ${rival} en ${shots} disparos.`
      : `${rival} hundió todos tus barcos en ${shots} disparos.`;

  return (
    <Screen>
      <TurnBanner tone={p.won ? 'win' : 'lose'} title={p.won ? 'Victoria' : 'Derrota'} subtitle={subtitle} big />
      <Segmented options={BOARDS} value={tab} onChange={setTab} />
      <View>
        {tab === 'rival' ? <Board board={board} rows={rivalRows} shipClass="rev" /> : <Board board={board} rows={myRows} />}
        <Legend items={tab === 'rival' ? LEGENDS.revealed : LEGENDS.mine} />
      </View>
      <View>
        <Heading style={{ marginBottom: 10 }}>Historial de jugadas</Heading>
        {movesQuery.isPending ? (
          <Loading label="Cargando historial…" />
        ) : movesQuery.isError ? (
          <ErrorState error={movesQuery.error} onRetry={() => movesQuery.refetch()} />
        ) : (
          <MoveLog entries={history} maxHeight={340} emptyText="La partida terminó sin jugadas." />
        )}
      </View>
      <Button title="Volver a partidas" variant="out" onPress={() => router.replace('/partidas')} />
    </Screen>
  );
}
