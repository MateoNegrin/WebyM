import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@batalla/hooks';
import { Alert, Button, Field, Heading, T } from '../components/ui.jsx';
import { BrandMark, HeroArt } from '../components/icons.jsx';
import { colors, fonts } from '../components/theme.js';

export default function LoginScreen() {
  const { session, ready, login } = useSession();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (ready && session) return <Redirect href="/" />;

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/');
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.paper }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: colors.ink, paddingHorizontal: 24, paddingTop: insets.top + 32, paddingBottom: 36, gap: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <BrandMark />
            <T style={{ color: '#fff', fontFamily: fonts.condensed, fontSize: 20, letterSpacing: 1.2, textTransform: 'uppercase' }}>Batalla Naval</T>
          </View>
          <HeroArt />
          <Heading size={44} style={{ color: '#fff', lineHeight: 46 }}>
            Hunde la flota rival
          </Heading>
        </View>
        <View style={{ padding: 24, paddingTop: 28 }}>
          <Heading size={30} style={{ marginBottom: 20 }}>
            Ingresar
          </Heading>
          <Field
            label="Correo electrónico"
            placeholder="nombre@correo.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            label="Contraseña"
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={onSubmit}
            returnKeyType="go"
          />
          {error && (
            <Alert tone="err" style={{ marginBottom: 16 }}>
              {error}
            </Alert>
          )}
          <Button title="Ingresar" variant="acc" onPress={onSubmit} loading={submitting} disabled={!email || !password} />
          <T variant="small" style={{ marginTop: 18 }}>
            ¿No tienes cuenta? Pídele a un administrador que te cree una.
          </T>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
