/** Configuración de la API, tomada de las variables de entorno de Vite (.env). */
export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://dwym.hardc0de.com',
  apiKey: import.meta.env.VITE_API_KEY || '',
};
