/** Componentes base del sistema visual para React Native. */
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackIcon, BrandMark } from './icons.jsx';
import { chipTones, colors, fonts } from './theme.js';

export function T({ style, variant = 'body', ...rest }) {
  return <Text style={[styles[variant], style]} {...rest} />;
}

export const Heading = ({ size = 22, style, ...rest }) => <T variant="heading" style={[{ fontSize: size }, style]} {...rest} />;

export function Chip({ tone = '', children, style }) {
  const t = chipTones[tone] ?? chipTones[''];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg, borderColor: t.border ?? t.bg }, style]}>
      <Text style={[styles.chipText, { color: t.fg }]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

/**
 * Botón con las variantes del diseño: primary (tinta), acc (naranja),
 * out (contorno), dng (peligro).
 */
export function Button({ title, onPress, variant = 'primary', disabled, loading, style, small, accessibilityLabel }) {
  const v = disabled ? 'disabled' : variant;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={({ pressed }) => [styles.btn, small && styles.btnSmall, buttonVariants[v], pressed && !disabled && { opacity: 0.8 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'out' || variant === 'dng' ? colors.ink : '#fff'} />
      ) : (
        <Text style={[styles.btnText, { color: buttonText[v] }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const buttonVariants = {
  primary: { backgroundColor: colors.ink, borderColor: colors.ink },
  acc: { backgroundColor: colors.accent, borderColor: colors.accent },
  out: { backgroundColor: 'transparent', borderColor: colors.ink },
  dng: { backgroundColor: 'transparent', borderColor: colors.bad },
  disabled: { backgroundColor: colors.disabled, borderColor: colors.disabled },
};
const buttonText = { primary: '#fff', acc: '#fff', out: colors.ink, dng: colors.bad, disabled: colors.disabledText };

export function Card({ children, style, onPress, highlight, flat, accessibilityLabel }) {
  const cardStyle = [styles.card, highlight && styles.cardHighlight, flat && { backgroundColor: 'transparent' }, style];
  if (!onPress) return <View style={cardStyle}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [...cardStyle, pressed && { backgroundColor: colors.seaLight }]}
    >
      {children}
    </Pressable>
  );
}

/** Fila típica de listado: título, subtítulo y chip a la derecha. */
export function ListCard({ title, subtitle, chip, tone, onPress, highlight, flat }) {
  return (
    <Card onPress={onPress} highlight={highlight} flat={flat} style={styles.listCard} accessibilityLabel={`${title}. ${subtitle ?? ''}. ${chip ?? ''}`}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <T variant="bold" numberOfLines={1}>
          {title}
        </T>
        {subtitle ? (
          <T variant="small" numberOfLines={1}>
            {subtitle}
          </T>
        ) : null}
      </View>
      {chip ? <Chip tone={tone}>{chip}</Chip> : null}
    </Card>
  );
}

export function Alert({ children, tone = 'info', style }) {
  const palette = { info: [colors.seaLight, colors.ink], err: [colors.badLight, '#6E1D10'], ok: [colors.okLight, '#0F3D29'] }[tone];
  return (
    <View style={[styles.alert, { backgroundColor: palette[0] }, style]} accessibilityRole={tone === 'err' ? 'alert' : undefined}>
      <Text style={[styles.body, { color: palette[1], fontSize: 15 }]}>{children}</Text>
    </View>
  );
}

export function Field({ label, ...inputProps }) {
  return (
    <View style={{ gap: 6, marginBottom: 16 }}>
      <T variant="label">{label}</T>
      <TextInput style={styles.input} placeholderTextColor={colors.field} accessibilityLabel={label} {...inputProps} />
    </View>
  );
}

/** Control segmentado (filtros, tableros). */
export function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.seg} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.segItem, on && { backgroundColor: colors.ink }]}
          >
            <Text style={[styles.btnText, { color: on ? '#fff' : colors.ink }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Cabezal oscuro: con marca (pantallas de pestañas) o con botón de volver. */
export function Header({ title, subtitle, back }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.mhead, { paddingTop: insets.top + 10 }]}>
      {back ? (
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={styles.back}
          hitSlop={8}
        >
          <BackIcon />
        </Pressable>
      ) : (
        <BrandMark size={26} />
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.mheadTitle} numberOfLines={1}>
          {title ?? 'Batalla Naval'}
        </Text>
        {subtitle ? (
          <Text style={styles.mheadSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** Contenido desplazable con el padding del diseño. */
export function Screen({ children, title, sub, refreshControl, contentStyle }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={[styles.screen, contentStyle]} refreshControl={refreshControl}>
      {title && (
        <View style={{ paddingTop: 8, paddingBottom: 4 }}>
          <Heading size={34}>{title}</Heading>
          {sub ? <T variant="small" style={{ marginTop: 6 }}>{sub}</T> : null}
        </View>
      )}
      {children}
    </ScrollView>
  );
}

export const Section = ({ title, aside, children, style }) => (
  <View style={[{ gap: 10 }, style]}>
    {title && (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Heading>{title}</Heading>
        {aside}
      </View>
    )}
    {children}
  </View>
);

export const Empty = ({ children }) => (
  <View style={styles.empty}>
    <T variant="muted" style={{ textAlign: 'center' }}>
      {children}
    </T>
  </View>
);

export const Loading = ({ label = 'Cargando…' }) => (
  <View style={styles.center}>
    <ActivityIndicator color={colors.sea} size="large" />
    <T variant="muted" style={{ marginTop: 12 }}>
      {label}
    </T>
  </View>
);

export function ErrorState({ error, onRetry }) {
  return (
    <View style={{ gap: 10 }}>
      <Alert tone="err">{error?.message ?? 'Ocurrió un error.'}</Alert>
      {onRetry && <Button title="Reintentar" variant="out" onPress={onRetry} small />}
    </View>
  );
}

/** Carga / error de una consulta de react-query, o el contenido. */
export function QueryState({ query, children }) {
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  return children(query.data);
}

const styles = StyleSheet.create({
  body: { fontFamily: fonts.regular, fontSize: 16, color: colors.ink, lineHeight: 22 },
  bold: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, lineHeight: 22 },
  label: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  small: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, lineHeight: 20 },
  muted: { fontFamily: fonts.regular, fontSize: 16, color: colors.muted, lineHeight: 22 },
  xs: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  mono: { fontFamily: fonts.mono, color: colors.ink },
  heading: { fontFamily: fonts.condensed, textTransform: 'uppercase', letterSpacing: 0.4, color: colors.ink, lineHeight: undefined },
  chip: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999, borderWidth: 1, alignSelf: 'flex-start' },
  chipText: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 19 },
  btn: { minHeight: 48, paddingHorizontal: 18, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  btnSmall: { minHeight: 44, paddingHorizontal: 14 },
  btnText: { fontFamily: fonts.semibold, fontSize: 16 },
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 10, padding: 16 },
  cardHighlight: { borderColor: colors.accent, borderWidth: 2 },
  listCard: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68 },
  alert: { padding: 12, borderRadius: 8 },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: colors.field,
    borderRadius: 8,
    backgroundColor: '#fff',
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  seg: { flexDirection: 'row', borderWidth: 1.5, borderColor: colors.ink, borderRadius: 8, overflow: 'hidden' },
  segItem: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  mhead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: colors.ink, minHeight: 64 },
  mheadTitle: { fontFamily: fonts.condensed, fontSize: 20, letterSpacing: 0.8, textTransform: 'uppercase', color: '#fff' },
  mheadSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.navText },
  back: { width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' },
  screen: { padding: 20, paddingTop: 16, gap: 16 },
  empty: { padding: 24, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.field, borderRadius: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
});

export { styles as textStyles };
