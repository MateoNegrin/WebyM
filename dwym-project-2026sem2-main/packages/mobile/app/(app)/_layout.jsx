import { Redirect, Stack } from 'expo-router';
import { useSession } from '@batalla/hooks';
import { Loading } from '../../components/ui.jsx';
import { colors } from '../../components/theme.js';

/** Todo lo que está dentro de (app) requiere sesión iniciada. */
export default function AuthenticatedLayout() {
  const { session, ready } = useSession();
  if (!ready) return <Loading />;
  if (!session) return <Redirect href="/ingresar" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />;
}
