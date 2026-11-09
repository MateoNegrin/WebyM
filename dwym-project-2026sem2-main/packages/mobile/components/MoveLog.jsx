import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SHOT_LABELS, SHOT_TONES } from '@batalla/core';
import { Chip, T } from './ui.jsx';
import { colors, fonts } from './theme.js';

/** Lista de jugadas: { n, who, coord?, result?, kind? } */
export function MoveLog({ entries, maxHeight = 240, emptyText = 'Todavía no hay disparos.' }) {
  if (entries.length === 0) return <T variant="small">{emptyText}</T>;
  return (
    <ScrollView style={[styles.log, { maxHeight }]} nestedScrollEnabled>
      {entries.map((m) => (
        <View key={m.n} style={styles.row}>
          <Text style={styles.n}>#{m.n}</Text>
          <Text style={styles.who} numberOfLines={1}>
            <Text style={{ fontFamily: fonts.semibold }}>{m.who}</Text> · <Text style={{ fontFamily: fonts.mono }}>{m.kind === 'fleet' ? 'Flota' : m.coord}</Text>
          </Text>
          {m.kind === 'fleet' ? <Chip tone="line">Ubicada</Chip> : <Chip tone={SHOT_TONES[m.result]}>{SHOT_LABELS[m.result]}</Chip>}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  log: { borderWidth: 1, borderColor: colors.line, borderRadius: 8, backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  n: { width: 32, fontFamily: fonts.mono, fontSize: 13, color: colors.muted },
  who: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
});
