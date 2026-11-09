/** Configuración de la API desde variables de entorno de Expo (.env, prefijo EXPO_PUBLIC_). */
export const apiConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://dwym.hardc0de.com',
  apiKey: process.env.EXPO_PUBLIC_API_KEY || '',
};
