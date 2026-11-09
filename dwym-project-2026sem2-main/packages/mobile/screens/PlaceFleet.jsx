import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { boardModel, HORIZONTAL, shipLabel } from '@batalla/core';
import { usePlaceFleet, usePlacement } from '@batalla/hooks';
import { Board } from '../components/Board.jsx';
import { Alert, Button, Heading, Screen, T } from '../components/ui.jsx';
import { colors, fonts } from '../components/theme.js';
import { confirmAction } from '../lib/dialogs.js';

/** Primer movimiento: ubicar los barcos tocando el tablero. */
export function PlaceFleet({ match, board }) {
  const placement = usePlacement(board);
  const placeFleet = usePlaceFleet(match.id);
  const rows = useMemo(() => boardModel(board, { fleet: placement.fleet }), [board, placement.fleet]);

  const confirm = () =>
    confirmAction({
      title: 'Confirmar flota',
      message: 'Después no podrás cambiarla.',
      confirmText: 'Confirmar',
      onConfirm: () => placeFleet.mutate(placement.fleet),
    });

  const selectedLabel = placement.selected && shipLabel(placement.selected).toLowerCase();
  return (
    <Screen>
      <T variant="small">
        {placement.selected
          ? `Toca el tablero para ubicar el ${selectedLabel} (${placement.orientation === HORIZONTAL ? 'horizontal' : 'vertical'}). Pueden tocarse, pero no superponerse.`
          : 'Flota completa. Toca un barco para moverlo o confirma.'}
      </T>
      <Board
        board={board}
        rows={rows}
        extra={(cell) => (cell.ship && cell.ship === placement.selected ? ['picked'] : [])}
        onCellPress={(cell) => placement.tap([cell.x, cell.y])}
      />
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <Heading>Barcos</Heading>
          <T variant="small">
            {placement.placedCount} de {placement.total} colocados
          </T>
        </View>
        <View style={styles.grid}>
          {placement.names.map((name) => {
            const active = placement.selected === name;
            const placed = Boolean(placement.fleet[name]);
            return (
              <Pressable
                key={name}
                onPress={() => placement.select(name)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${shipLabel(name)}, ${board.ships[name]} casillas${placed ? ', ubicado' : ''}`}
                style={[styles.ship, placed && styles.shipPlaced, active && styles.shipActive]}
              >
                <Text style={[styles.shipText, active && { color: '#fff' }]} numberOfLines={1}>
                  {shipLabel(name)}
                </Text>
                <Text style={[styles.shipLen, active && { color: '#fff' }]}>{board.ships[name]}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <Button title="Rotar" variant="out" small style={{ flex: 1 }} onPress={placement.rotate} disabled={!placement.selected} />
          <Button title="Al azar" variant="out" small style={{ flex: 1 }} onPress={placement.randomize} />
          <Button
            title="Quitar"
            variant="out"
            small
            style={{ flex: 1 }}
            onPress={() => placement.remove(placement.selected)}
            disabled={!placement.selected || !placement.fleet[placement.selected]}
          />
        </View>
      </View>
      <View style={{ gap: 10, marginTop: 8 }}>
        {placeFleet.isError ? <Alert tone="err">{placeFleet.error.message}</Alert> : <T variant="small">Una vez confirmada, no podrás cambiar tu flota.</T>}
        <Button
          title="Confirmar flota"
          variant="acc"
          onPress={confirm}
          disabled={!placement.complete}
          loading={placeFleet.isPending}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ship: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  shipPlaced: { backgroundColor: colors.seaLight, borderColor: colors.field },
  shipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  shipText: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink, flexShrink: 1 },
  shipLen: { fontFamily: fonts.mono, fontSize: 16, color: colors.ink },
});
