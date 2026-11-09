import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { boardModel, coordLabel, countSunk, PHASE, shotLog } from '@batalla/core';
import { useShoot } from '@batalla/hooks';
import { Board, LEGENDS, Legend } from '../components/Board.jsx';
import { MoveLog } from '../components/MoveLog.jsx';
import { Alert, Button, Card, Heading, Screen, Segmented, T } from '../components/ui.jsx';
import { colors, fonts } from '../components/theme.js';

/** Banner de turno (también usado por la partida terminada). */
export function TurnBanner({ tone, title, subtitle, aside, big }) {
  const bg = { turn: colors.accent, wait: colors.ink2, win: colors.ok, lose: colors.sunk }[tone];
  return (
    <View style={[styles.banner, { backgroundColor: bg }]} accessibilityLiveRegion="polite">
      <View style={{ flex: 1, minWidth: 200 }}>
        <Heading size={big ? 40 : 28} style={{ color: '#fff' }}>
          {title}
        </Heading>
        <Text style={styles.bannerSub}>{subtitle}</Text>
      </View>
      {aside}
    </View>
  );
}

const BOARDS = [
  { value: 'rival', label: 'Flota rival' },
  { value: 'mine', label: 'Mi flota' },
];

/** Partida en curso. La pantalla padre hace polling, así que se actualiza sola. */
export function MatchInProgress({ match, board, perspective: p, rival, rivalShort }) {
  const shoot = useShoot(match.id);
  const [tab, setTab] = useState('rival');
  const [selected, setSelected] = useState(null);
  const myTurn = p.phase === PHASE.MY_TURN;
  const shipCount = Object.keys(board.ships).length;

  const rivalRows = useMemo(() => boardModel(board, { shots: p.myShots }), [board, p.myShots]);
  const myRows = useMemo(() => boardModel(board, { fleet: p.myFleet, shots: p.rivalShots }), [board, p.myFleet, p.rivalShots]);
  const log = useMemo(
    () => shotLog(match).map((e) => ({ ...e, who: e.side === p.side ? 'Tú' : rivalShort })).reverse(),
    [match, p.side, rivalShort],
  );

  const banner = myTurn
    ? {
        tone: 'turn',
        title: 'Tu turno',
        subtitle: p.rivalMaybePlacing ? 'Elige una casilla y dispara. Si tu rival aún no ubicó su flota, tendrás que esperarlo.' : 'Elige una casilla del tablero rival y dispara.',
      }
    : {
        tone: 'wait',
        title: p.rivalMaybePlacing ? 'Esperando al rival' : `Turno de ${rivalShort}`,
        subtitle: p.rivalMaybePlacing ? 'Tu rival todavía no ubicó su flota o está por disparar.' : 'Espera su disparo.',
      };

  return (
    <Screen>
      <TurnBanner {...banner} aside={<Text style={styles.live}>● Se actualiza sola</Text>} />
      <Segmented options={BOARDS} value={tab} onChange={setTab} />
      {tab === 'rival' ? (
        <View>
          <Board
            board={board}
            rows={rivalRows}
            shipClass={null}
            onCellPress={myTurn ? (cell) => setSelected(cell) : undefined}
            isDisabled={(cell) => Boolean(cell.result)}
            extra={(cell) => (selected && selected.x === cell.x && selected.y === cell.y ? ['sel'] : [])}
          />
          <Legend items={LEGENDS.shots}>
            <T variant="xs">
              {countSunk(p.myShots)} de {shipCount} hundidos
            </T>
          </Legend>
        </View>
      ) : (
        <View>
          <Board board={board} rows={myRows} />
          <Legend items={LEGENDS.mine}>
            <T variant="xs">
              {countSunk(p.rivalShots)} de {shipCount} hundidos
            </T>
          </Legend>
        </View>
      )}
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ minWidth: 84 }}>
          <T variant="xs">Tu disparo</T>
          <Text style={[styles.coord, { color: myTurn && selected ? colors.accent : colors.muted }]}>
            {myTurn && selected ? coordLabel([selected.x, selected.y]) : '—'}
          </Text>
        </View>
        <Button
          title="Disparar"
          variant="acc"
          style={{ flex: 1 }}
          disabled={!myTurn || !selected || tab !== 'rival'}
          loading={shoot.isPending}
          onPress={() => shoot.mutate([selected.x, selected.y], { onSuccess: () => setSelected(null) })}
        />
      </Card>
      {shoot.isError && <Alert tone="err">{shoot.error.message}</Alert>}
      {!myTurn && <T variant="small">Podrás disparar cuando sea tu turno.</T>}
      <View>
        <Heading style={{ marginBottom: 10 }}>Jugadas</Heading>
        <MoveLog entries={log} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: 16, borderRadius: 10 },
  bannerSub: { fontFamily: fonts.regular, fontSize: 14, color: '#fff', marginTop: 2 },
  live: { fontFamily: fonts.regular, fontSize: 13, color: '#fff' },
  coord: { fontFamily: fonts.mono, fontSize: 40, lineHeight: 46 },
});
