import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { columnLabel, coordLabel, rowLabel, SHOT_LABELS } from '@batalla/core';
import { colors, fonts } from './theme.js';

const LABEL = 20;

const CELL_STYLES = {
  base: { backgroundColor: colors.water, borderColor: colors.waterBorder },
  ship: { backgroundColor: colors.ink, borderColor: '#2B4660' },
  rev: { backgroundColor: '#6B8498', borderColor: '#566F83' },
  ghost: { backgroundColor: colors.sea, borderColor: '#12466A' },
  bad: { backgroundColor: '#E7B9A6', borderColor: colors.bad },
  picked: { backgroundColor: colors.sea, borderColor: '#12466A' },
  hit: { backgroundColor: colors.accent, borderColor: '#8F2F08' },
  sunk: { backgroundColor: colors.sunk, borderColor: '#1F0A02' },
  sel: { backgroundColor: colors.accentLight, borderColor: colors.ink, borderWidth: 3 },
};

/** Marca de disparo: punto para agua, cruz para tocado/hundido. */
function Mark({ result, size }) {
  if (result === 'water') {
    const d = size * 0.28;
    return <View style={{ width: d, height: d, borderRadius: d / 2, backgroundColor: '#5B86A3' }} />;
  }
  if (result !== 'hit' && result !== 'sunk') return null;
  const color = result === 'sunk' ? colors.flare : '#fff';
  const len = size * 0.62;
  const bar = { position: 'absolute', width: len, height: Math.max(2, size * 0.12), backgroundColor: color };
  return (
    <>
      <View style={[bar, { transform: [{ rotate: '45deg' }] }]} />
      <View style={[bar, { transform: [{ rotate: '-45deg' }] }]} />
    </>
  );
}

const Cell = memo(function Cell({ cell, size, variant, onPress, disabled }) {
  const style = [styles.cell, { width: size, height: size }, CELL_STYLES.base];
  for (const v of variant.split(' ')) if (CELL_STYLES[v]) style.push(CELL_STYLES[v]);
  const label = `${coordLabel([cell.x, cell.y])}${cell.result ? `, ${SHOT_LABELS[cell.result]}` : ''}`;
  const content = <Mark result={cell.result} size={size} />;
  if (!onPress) {
    return (
      <View style={style} accessibilityLabel={label}>
        {content}
      </View>
    );
  }
  return (
    <Pressable style={style} onPress={() => onPress(cell)} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}>
      {content}
    </Pressable>
  );
});

/**
 * Tablero que se adapta al ancho disponible.
 * @param {object} props
 * @param {{width:number,height:number}} props.board
 * @param {Array<Array<{x,y,ship,result}>>} props.rows  ver boardModel() en @batalla/core
 * @param {'ship'|'rev'|null} [props.shipClass]
 * @param {(cell) => string[]} [props.extra]  variantes adicionales por casilla
 * @param {(cell) => void} [props.onCellPress]
 * @param {(cell) => boolean} [props.isDisabled]
 */
export function Board({ board, rows, shipClass = 'ship', extra, onCellPress, isDisabled }) {
  const [width, setWidth] = useState(0);
  const size = width ? Math.floor((width - LABEL) / board.width) : 0;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="grid">
      {size > 0 && (
        <>
          <View style={styles.row}>
            <View style={{ width: LABEL }} />
            {Array.from({ length: board.width }, (_, x) => (
              <Text key={x} style={[styles.label, { width: size }]}>
                {columnLabel(x)}
              </Text>
            ))}
          </View>
          {rows.map((row, y) => (
            <View key={y} style={styles.row}>
              <Text style={[styles.label, { width: LABEL, lineHeight: size }]}>{rowLabel(y)}</Text>
              {row.map((cell) => {
                const variant = [];
                if (cell.ship && shipClass) variant.push(shipClass);
                if (cell.result) variant.push(cell.result);
                variant.push(...(extra?.(cell) ?? []));
                return (
                  <Cell
                    key={cell.x}
                    cell={cell}
                    size={size}
                    variant={variant.join(' ')}
                    onPress={onCellPress}
                    disabled={isDisabled?.(cell)}
                  />
                );
              })}
            </View>
          ))}
        </>
      )}
    </View>
  );
}

export function Legend({ items, children }) {
  return (
    <View style={styles.legend}>
      {items.map(([color, text]) => (
        <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.swatch, { backgroundColor: color }]} />
          <Text style={styles.legendText}>{text}</Text>
        </View>
      ))}
      {children}
    </View>
  );
}

export const LEGENDS = {
  shots: [
    ['#fff', 'Agua'],
    [colors.accent, 'Tocado'],
    [colors.sunk, 'Hundido'],
  ],
  mine: [
    [colors.ink, 'Barco'],
    [colors.accent, 'Tocado'],
    [colors.sunk, 'Hundido'],
  ],
  revealed: [
    ['#6B8498', 'Barco revelado'],
    [colors.accent, 'Tocado'],
    [colors.sunk, 'Hundido'],
  ],
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  label: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  cell: { borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6, marginTop: 10, alignItems: 'center' },
  swatch: { width: 14, height: 14, borderRadius: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,.25)' },
  legendText: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
});
