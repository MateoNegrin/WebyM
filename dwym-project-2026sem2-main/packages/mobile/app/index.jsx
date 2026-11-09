import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../common/styles';

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Welcome</Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push('/home')}
      >
        <Text style={styles.buttonText}>Get in</Text>
      </TouchableOpacity>
    </View>
  );
}
