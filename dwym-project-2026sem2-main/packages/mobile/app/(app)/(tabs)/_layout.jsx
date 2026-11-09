import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router/tabs';
import { GridIcon, HomeIcon, ProfileIcon } from '../../../components/icons.jsx';
import { colors, fonts } from '../../../components/theme.js';

const TABS = [
  { name: 'index', label: 'Inicio', Icon: HomeIcon },
  { name: 'partidas', label: 'Partidas', Icon: GridIcon },
  { name: 'perfil', label: 'Perfil', Icon: ProfileIcon },
];

/** Barra inferior del diseño: fondo tinta, ícono activo en naranja. */
function TabBar({ state, navigateToTab, insets }) {
  return (
    <View style={[styles.bar, { paddingBottom: 10 + insets.bottom }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const focused = state.index === index;
        return (
          <Pressable
            key={route.key}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              if (!focused) navigateToTab(route.key);
            }}
          >
            <tab.Icon color={focused ? colors.flare : colors.navText} />
            <Text style={[styles.label, focused && { color: '#fff' }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.paper } }}>
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.label }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.ink, paddingTop: 6, paddingHorizontal: 8 },
  item: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontFamily: fonts.semibold, fontSize: 12, color: colors.navText },
});
