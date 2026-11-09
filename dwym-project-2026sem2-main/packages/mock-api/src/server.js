import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 4000);
const apiKeys = (process.env.MOCK_API_KEYS ?? 'dev').split(',').map((k) => k.trim()).filter(Boolean);

createApp({ apiKeys, secret: process.env.JWT_SECRET ?? 'mock-secret' }).listen(port, () => {
  console.log(`Mock API escuchando en http://localhost:${port} (x-api-key: ${apiKeys.join(', ')})`);
  console.log('Usuarios de ejemplo: admin@correo.uy, mauro@correo.uy, lucia@correo.uy… (contraseña 123456)');
});
