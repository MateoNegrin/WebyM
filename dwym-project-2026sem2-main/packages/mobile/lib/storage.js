import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Dónde persiste el store de sesión (zustand) en el móvil: SecureStore, que
 * guarda el JWT cifrado en el dispositivo. Al cerrar sesión se borra, así nadie
 * más puede usar la app con esa cuenta.
 * (En la vista previa web, donde SecureStore no existe, se usa localStorage.)
 */
const secureStorage = {
  getItem: (name) => SecureStore.getItemAsync(name),
  setItem: (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: (name) => SecureStore.deleteItemAsync(name),
};

export const sessionPersistence = Platform.OS === 'web' ? globalThis.localStorage : secureStorage;
