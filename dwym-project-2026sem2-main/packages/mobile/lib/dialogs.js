import { Alert, Platform } from 'react-native';

/** Diálogo de confirmación nativo (en la vista previa web, window.confirm). */
export function confirmAction({ title, message, confirmText = 'Aceptar', destructive = false, onConfirm }) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

export function showError(title, error) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${error.message}`);
  else Alert.alert(title, error.message);
}
