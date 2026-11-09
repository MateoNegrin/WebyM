import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../common/styles';
import { useRouter } from 'expo-router';

export default function Stickers() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Desarrollo Web y Mobile - Proyecto 2026 sem 1</Text>
      <Text style={styles.normalText}>Por favor, lea el archivo README.md para más información.</Text>
      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={() => router.push('/')}
      >
        <Text style={styles.buttonText}>Get out</Text>
      </TouchableOpacity>
    </View>
  );
};
