import { StyleSheet } from 'react-native';

const baseButton = {
  paddingHorizontal: 30,
  paddingVertical: 15,
  borderRadius: 8,
  marginBottom: 15,
};

export const styles = StyleSheet.create({
  primaryButton: {
    ...baseButton,
    backgroundColor: '#000099',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  normalText: {
    fontSize: 14,
    color: '#222',
    paddingBottom: 20,
  },
});
