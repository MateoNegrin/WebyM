# Batalla Naval — Web y Móvil

Proyecto del curso **Desarrollo Web y Mobile** (segundo semestre 2026). Es una aplicación para jugar a la **Batalla Naval** y armar torneos entre varios jugadores. Tiene dos *frontends* escritos en JavaScript:

- **Web** con **React** (responsiva), con todas las funcionalidades de los tres roles: Jugador, Organizador y Admin.
- **Móvil** con **React Native** (Expo, para Android), con las vistas y funcionalidades del rol Jugador.

Ambas interfaces se comunican con la **API REST provista por la cátedra** y se autentican con **JWT**.

---

## Índice

1. [Estructura del monorepo](#estructura-del-monorepo)
2. [Instrucciones para ejecutar](#instrucciones-para-ejecutar)
3. [Funcionalidades implementadas](#funcionalidades-implementadas)
4. [Decisiones técnicas](#decisiones-técnicas)
5. [Limitaciones conocidas de la API y cómo se resolvieron](#limitaciones-conocidas-de-la-api-y-cómo-se-resolvieron)

---

## Estructura del monorepo

El repositorio parte de la plantilla de la cátedra y es un monorepo con **npm workspaces**. Todo el código está en `packages/`:

```
dwym-project-2026sem2-main/
├── docs/               Enunciado (PDF y Markdown) y diseños
└── packages/
    ├── web/            React + Vite + React Router (todos los roles)
    ├── mobile/         React Native + Expo + Expo Router (rol Jugador, Android)
    ├── core/           JS puro: cliente de la API, reglas del juego, estados y textos
    ├── hooks/          React compartido: sesión (zustand), consultas y mutaciones (react-query)
    └── mock-api/       Implementación local de la API del enunciado (para desarrollo)
```

| Paquete | Qué contiene | Lo usan |
| --- | --- | --- |
| `@batalla/core` | `createApiClient` (un método por endpoint), validación de flotas, resultado de disparos, cálculo del turno, estados de partida, historial, etiquetas en español | web, móvil, mock-api |
| `@batalla/hooks` | Store de sesión con **zustand** (`useSessionStore`: usuario y token, persistido), `SessionProvider` (cliente de la API y react-query), `useSession` (login/logout), `useMatch` con *polling*, `usePlacement` (ubicación de barcos), resto de consultas y mutaciones | web, móvil |
| `@batalla/mock-api` | Servidor Express en memoria que replica la API (rutas, roles, códigos 400/401/403/404 y validaciones de la sección 6.5) | desarrollo y tests |

---

## Instrucciones para ejecutar

### Requisitos

- **Node.js 20 o superior** (probado con Node 22) y npm 10.
- Para el móvil: la app **Expo Go** en un celular Android, o un **emulador de Android** (Android Studio).

### 1. Instalar dependencias

Desde la carpeta `dwym-project-2026sem2-main/` (instala todos los workspaces):

```bash
npm install
```

### 2. Configurar la API

Cada app lee la URL de la API y el `x-api-key` de un archivo `.env`. Hay un ejemplo en cada app:

```bash
cp packages/web/.env.example packages/web/.env
```

```bash
cp packages/mobile/.env.example packages/mobile/.env
```

| Variable | Web (`packages/web/.env`) | Móvil (`packages/mobile/.env`) |
| --- | --- | --- |
| URL base de la API (sin `/api`) | `VITE_API_BASE_URL` | `EXPO_PUBLIC_API_BASE_URL` |
| Identificador de base de datos (`x-api-key`) | `VITE_API_KEY` | `EXPO_PUBLIC_API_KEY` |

Por defecto se usa la **API de la cátedra** (`https://dwym.hardc0de.com`). Solo hay que completar `VITE_API_KEY` / `EXPO_PUBLIC_API_KEY` con el identificador asignado al equipo. Se puede explorar la API en `https://dwym.hardc0de.com/explorer`. Los usuarios precargados son `admin@example.com`, `org1@example.com` y `player1@example.com` a `player3@example.com`, y la contraseña de cada uno es lo que está a la izquierda de la `@`.

Para desarrollar sin la API de la cátedra, se puede usar la API local del paso 3: URL `http://localhost:4000` y clave `dev`.

> En el **emulador de Android**, el `localhost` de la computadora es `10.0.2.2`. En un **celular físico**, se usa la IP de la computadora en la red local, por ejemplo `http://192.168.1.10:4000`.

### 3. (Opcional) Levantar la API local

```bash
npm run dev:api
```

Queda escuchando en `http://localhost:4000` con datos de ejemplo. Todos los usuarios tienen la contraseña **`123456`**:

| Usuario | Rol | Para probar |
| --- | --- | --- |
| `lucia@correo.uy` | Jugador | Partidas en todos los estados: su turno, colocar flota, esperando, victoria y derrota por abandono. Tiene una invitación pendiente. |
| `diego@correo.uy`, `sofia@correo.uy`, `camila@correo.uy`, `mateo@correo.uy`, `ana@correo.uy`, `nicolas@correo.uy` | Jugador | Rivales |
| `mauro@correo.uy`, `marta@correo.uy` | Organizador | Torneos "Copa Almirante" y "Liga del Puerto" (mauro), "Torneo de Primavera" (marta) |
| `admin@correo.uy` | Admin | Gestión de usuarios |

Los datos viven en memoria y se reinician al reiniciar el servidor. Variables opcionales: `PORT`, `MOCK_API_KEYS` (claves aceptadas, separadas por coma) y `JWT_SECRET`.

### 4. Web

```bash
npm run dev:web
```

Abre `http://localhost:5173`. Para generar la versión de producción (queda en `packages/web/dist/`):

```bash
npm run build:web
```

### 5. Móvil (Android)

```bash
npm run dev:mobile
```

Expo muestra un código QR. Se puede escanear con **Expo Go** en el celular, o presionar **`a`** para abrir el emulador de Android. Todas las dependencias nativas que usa la app (SecureStore, SVG, fuentes) vienen incluidas en Expo Go.

Para generar un **APK instalable** con EAS Build (requiere una cuenta de Expo):

```bash
npm run build:android -w @dwym-project-2026sem1/mobile
```

### 6. Tests

```bash
npm test
```

Corre los tests de `core`: reglas del juego, turnos, historial y cliente HTTP. También corre los de `hooks`: el store de sesión de zustand (carga, persistencia y cierre de sesión). Y los de `mock-api`: un flujo completo de torneo contra el servidor real usando el cliente de `core`, con login, invitaciones, partida, disparos hasta hundir la flota, permisos y errores.

---

## Funcionalidades implementadas

Cada historia de usuario del enunciado, con la pantalla que la resuelve.

### Todos los roles

| Historia | Web | Móvil |
| --- | --- | --- |
| Ingresar con correo y contraseña | `/ingresar`. Muestra el error de la API si las credenciales no son válidas. | Pantalla *Ingresar* |
| Cerrar sesión | Botón *Cerrar sesión* en el cabezal. Llama a `DELETE /api/me/session` y borra el token del store de sesión (y de `localStorage`). | Pestaña *Perfil* → *Cerrar sesión*. Borra el token de SecureStore. |

### Jugador

| Historia | Dónde |
| --- | --- |
| Ver los torneos a los que fue invitado | *Inicio*: invitaciones pendientes y ya respondidas, con el nombre del torneo y la fecha |
| Aceptar / rechazar una invitación | *Inicio*, botones *Aceptar* / *Rechazar* (rechazar pide confirmación) |
| Ver las partidas en las que participa, terminadas o no | *Partidas*, con filtro Todas / En curso / Terminadas. Primero aparecen las que requieren una acción (*Tu turno*, *Colocar flota*). |
| Entrar a una partida en curso y ver los disparos de ambos con sus resultados | Pantalla de partida: tablero rival con mis disparos, tablero propio con los del rival y log de jugadas |
| Hacer una jugada si es su turno | **Ubicar la flota**: tocar el tablero, rotar, quitar, ubicar al azar y confirmar. **Disparar**: elegir una casilla del tablero rival y presionar *Disparar*. |
| Ver una partida terminada: resultado e historial completo | Banner de *Victoria* / *Derrota*, ambas flotas reveladas e historial desde la ubicación de las flotas (`GET /api/matches/:id/moves`) |
| (extra) Ver un torneo | Partidas del torneo, ganador y estado de la invitación propia |

La partida abierta se consulta **cada 3 segundos** (`GET /api/matches/:id`), como pide el enunciado. Así el jugador ve el disparo del rival y el cambio de turno sin recargar. El *polling* se detiene al salir de la pantalla, cuando la partida termina y, en el móvil, cuando la app pasa a segundo plano.

### Organizador (web)

Puede hacer todo lo que hace un Jugador y además:

| Historia | Dónde |
| --- | --- |
| Definir torneos con nombre | *Organizar* → *Nuevo torneo*. El nombre se puede editar después. |
| Invitar jugadores a un torneo | *Gestionar torneo* → *Invitaciones*. El selector excluye al organizador y a quienes ya están invitados. |
| Revocar una invitación | Botón *Revocar*. Se deshabilita si el jugador ya jugó partidas del torneo, que es la regla de la API. A quien rechazó se lo puede *Volver a invitar*. |
| Armar partidas con jugadores que aceptaron | *Partidas*: selectores de Jugador Norte y Sur, solo con invitaciones aceptadas |
| Definir una partida como abandonada por un jugador | Botones *Abandona X*: llaman a `POST /api/matches/:id/end` dando como ganador al otro |
| Definir el ganador del torneo | *Ganador del torneo*: solo ofrece jugadores que ganaron al menos una partida del torneo |
| (extra) Eliminar partidas y torneos | Con confirmación |

### Admin (web)

Puede hacer todo lo que hace un Organizador y además:

| Historia | Dónde |
| --- | --- |
| Agregar usuarios con correo, contraseña y rol | *Usuarios* → *Nuevo usuario* |
| Modificar la contraseña o el rol de un usuario | *Usuarios* → *Editar* |
| Quitar usuarios | *Quitar*, con confirmación. Si el usuario participó de partidas, se muestra el error de la API. No permite quitarse a sí mismo. |

### Detalles de usabilidad

- Diseño propio, el sistema visual "carta náutica", aplicado igual en web y móvil: tipografías Barlow, Barlow Condensed e IBM Plex Mono, la paleta tinta, mar y naranja, y botones de al menos 44 px.
- La web es **responsiva**: el cabezal, las grillas y las tablas se adaptan a pantallas de celular.
- Estados de carga, vacíos y error en cada sección, con *Reintentar*. Los errores 400 de la API (`{ error }`) se muestran tal cual al usuario.
- Accesibilidad: etiquetas en los formularios, casillas del tablero con nombre accesible ("C5, Tocado"), foco visible y regiones *live* para el cambio de turno.
- Ubicar la flota en la web: vista previa al pasar el mouse (en rojo si no entra), tecla **R** para rotar y botón *Ubicar al azar*.
- El tablero se dibuja con el tamaño y los barcos que devuelve `GET /api/board`, sin asumir 10×10.

---

## Decisiones técnicas

**Monorepo con npm workspaces.** El enunciado pide dos *frontends* sobre la misma API. Con un monorepo, la lógica que no depende de la interfaz se escribe y se prueba una sola vez. Se eligió npm, y no pnpm o yarn, porque viene con Node y Expo detecta los monorepos de npm sin configuración extra de Metro.

**`@batalla/core` en JavaScript puro.** Las reglas del juego viven aquí: validar una flota, calcular de quién es el turno (Norte dispara primero y luego se alterna), derivar el estado de una partida para un usuario, armar el historial y nombrar las casillas ("A1"). No dependen de React ni de la plataforma, así que web y móvil se comportan igual y se prueban con tests unitarios rápidos. El cliente HTTP también está aquí: agrega `x-api-key` y `Authorization: Bearer`, y convierte las respuestas de error en `ApiError` con un mensaje para el usuario.

**Sesión con zustand.** El usuario y el token (el `Login` que devuelve `PUT /api/me/session`) viven en un store global de [zustand](https://zustand-demo.pmnd.rs) (`packages/hooks/src/sessionStore.js`). Usa el middleware `persist` para que la sesión sobreviva a recargas. El almacenamiento se inyecta según la plataforma: `localStorage` en la web y **SecureStore** (cifrado) en el móvil. Se eligió zustand porque es un estado chico y global, que se lee también fuera de React: el cliente HTTP toma el token con `useSessionStore.getState()`, sin *Context* ni *refs*. Los componentes se suscriben solo a lo que usan (`useSessionStore((s) => s.session)`). Un 401 de la API limpia el store y vuelve al login. Al cambiar el token se vacía la caché de react-query, para no mostrar datos de otro usuario.

**`@batalla/hooks` y TanStack Query (react-query).** Se encarga de los datos del servidor: la caché, invalidar datos después de una mutación (por ejemplo, aceptar una invitación refresca *Mis torneos*) y el *polling* de la partida con `refetchInterval`, que se apaga solo cuando la partida termina. `useSession()` combina el store de zustand con el cliente de la API y expone `{ session, ready, api, login, logout }`. `usePlacement` encapsula la interacción para ubicar barcos y la comparten ambas apps.

**Estructura de la plantilla de la cátedra.** Se respetó la estructura y la configuración del repositorio base: `packages/web` (Vite, ESLint y Prettier) y `packages/mobile` (Expo con las pantallas en `app/`, `babel` con el alias `@` y `expo lint`). Los paquetes compartidos se agregaron como workspaces nuevos.

**Web: Vite + React Router 7.** Vite da un arranque rápido y un build simple. Las rutas se protegen por sesión (`RequireSession`) y por rol (`RequireRole`, con la jerarquía jugador < organizador < admin). Los estilos son CSS plano con variables, tomados del sistema visual del diseño. Se eligió CSS plano por ser liviano, sin dependencias y fácil de leer.

**Móvil: Expo + Expo Router.** Es la forma recomendada de crear apps React Native hoy. Permite probar en Android con Expo Go sin compilar código nativo, y generar el APK con EAS. Expo Router organiza las pantallas por archivo: un grupo `(app)` que exige sesión, pestañas `(tabs)` para Inicio, Partidas y Perfil, y pantallas de pila para torneo y partida. La barra de pestañas y los componentes son propios, para respetar el diseño.

**API local (`mock-api`).** No es parte de la entrega obligatoria. Se hizo para poder desarrollar y probar sin depender de la API de la cátedra, y para reproducir casos difíciles: turnos, partidas terminadas por abandono y errores 400. Implementa el contrato del enunciado (rutas, roles, flota rival oculta hasta el final, cada `x-api-key` con su propia base) y reutiliza las reglas de `core`. Las apps no dependen de ella: solo cambia la URL del `.env`.

---

## Limitaciones conocidas de la API y cómo se resolvieron

1. **No hay un endpoint para listar los torneos que organiza un usuario.** `GET /api/me/tournaments` devuelve solo aquellos en los que el usuario *participa*. La web guarda localmente, por usuario y por `x-api-key`, los ids de los torneos que el organizador crea o abre. Además permite *Abrir un torneo por id* para recuperar uno creado desde otro navegador. Si la API devolviera también los torneos organizados en `GET /api/me/tournaments`, la web los incorpora automáticamente.
2. **Los jugadores no pueden ver los correos de otros usuarios.** `GET /api/users` es solo para organizadores. Por eso un Jugador ve a sus rivales como "Jugador 1A2B" (los últimos caracteres del id). Los organizadores y admins ven los correos.
3. **La flota del rival es `null` hasta que la partida termina.** Mientras nadie disparó, no se puede saber si el rival ya ubicó sus barcos. En ese caso la interfaz lo dice ("Esperando al rival", o "Tu turno" con una aclaración). Si el disparo llega antes de tiempo, se muestra el error de la API.
4. **Barcos hundidos del rival en una partida en curso.** La API marca como `sunk` solo la casilla del disparo que hundió el barco. Para mostrar el barco completo, se extiende esa marca a los tocados contiguos en línea recta. Si dos barcos tocados están pegados, puede no ser exacto. Al terminar la partida se usa la flota revelada y el dibujo es exacto.

---

## Actualización del _fork_

Si se modifica el código en el repo original, se puede actualizar el fork con los siguientes comandos:

+ Respaldar el estado actual del repo forkeado.

+ Conectar su fork con el repo original: `git remote add upstream https://github.com/ucu-fit-dwym/dwym-project-2026sem2.git`

+ Verificar que upstream haya sido agregado: `git remote -v`

+ Traer los cambios de main upstream a su repo local: `git fetch upstream main`

+ Cambiar a su rama local main: `git checkout main`

+ Hacer merge de los cambios: `git merge upstream/main`

