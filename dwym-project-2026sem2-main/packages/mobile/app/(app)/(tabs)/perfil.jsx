import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ROLE_LABELS, ROLE_TONES } from '@batalla/core';
import { useSession } from '@batalla/hooks';
import { Button, Card, Chip, Header, Heading, Screen, T } from '../../../components/ui.jsx';

export default function ProfileScreen() {
  const { session, logout } = useSession();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const onLogout = async () => {
    setLeaving(true);
    await logout();
    router.replace('/ingresar');
  };

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <Screen title="Perfil">
        <Card>
          <Heading style={{ marginBottom: 14 }}>Tu sesión</Heading>
          <T variant="small">Correo electrónico</T>
          <T variant="bold" style={{ marginBottom: 12 }}>
            {session.email}
          </T>
          <T variant="small" style={{ marginBottom: 4 }}>
            Rol
          </T>
          <Chip tone={ROLE_TONES[session.role]}>{ROLE_LABELS[session.role]}</Chip>
        </Card>
        <Button title="Cerrar sesión" variant="dng" onPress={onLogout} loading={leaving} />
        <T variant="small">Al cerrar sesión, nadie más podrá usar la aplicación desde este dispositivo.</T>
      </Screen>
    </View>
  );
}
