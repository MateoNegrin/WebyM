/**
 * Rutas HTTP del mock, siguiendo la sección 6 del enunciado (incluidos los
 * códigos 401/403/404 sin contenido y los 400 con { error }).
 */
import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import { hasRole } from '@batalla/core';
import { BadRequest, BOARD, createStore, withoutPassword } from './store.js';
import { seed } from './seed.js';

class HttpStatus extends Error {
  constructor(status) {
    super(String(status));
    this.status = status;
  }
}
const fail = (status) => {
  throw new HttpStatus(status);
};

/**
 * @param {object} [options]
 * @param {string[]} [options.apiKeys]  claves válidas; cada una tiene su base de datos
 * @param {string} [options.secret]     secreto para firmar los JWT
 * @param {boolean} [options.withSeed]  cargar datos de ejemplo
 */
export function createApp({ apiKeys = ['dev'], secret = 'mock-secret', withSeed = true } = {}) {
  const stores = new Map();
  const storeFor = (key) => {
    if (!stores.has(key)) {
      const store = createStore();
      if (withSeed) seed(store);
      stores.set(key, store);
    }
    return stores.get(key);
  };

  const app = express();
  app.use(cors());
  app.use(express.json());

  // 1) x-api-key: se controla antes que cualquier otra cosa.
  app.use('/api', (req, res, next) => {
    const key = req.get('x-api-key');
    if (!key || !apiKeys.includes(key)) return res.status(404).end();
    req.store = storeFor(key);
    next();
  });

  // 2) Sesión (todas las rutas menos PUT /api/me/session).
  const auth = (req, res, next) => {
    const header = req.get('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    try {
      const payload = jwt.verify(token ?? '', secret);
      const user = req.store.findUser(payload.sub);
      if (!user || !req.store.db.sessions.has(payload.jti)) fail(401);
      req.user = user;
      req.sessionId = payload.jti;
      next();
    } catch {
      res.status(401).end();
    }
  };
  const role = (required) => (req, res, next) => (hasRole(req.user.role, required) ? next() : res.status(403).end());

  const api = express.Router();

  // --- helpers de visibilidad ---
  const manages = (user, t) => user.role === 'admin' || t.organisedBy === user.id;
  const canSeeTournament = (store, user, t) => manages(user, t) || store.isParticipant(user.id, t.id);
  const tournamentOr404 = (req, check) => {
    const t = req.store.findTournament(req.params.id);
    if (!t || !check(req.store, req.user, t)) fail(404);
    return t;
  };
  const sideOf = (m, user) => (m.playerNorth === user.id ? 'north' : m.playerSouth === user.id ? 'south' : null);
  const canSeeMatch = (store, user, m) => sideOf(m, user) || manages(user, store.findTournament(m.tournament));
  const matchOr404 = (req, check = canSeeMatch) => {
    const m = req.store.findMatch(req.params.id);
    if (!m || !check(req.store, req.user, m)) fail(404);
    return m;
  };
  /** La flota del rival se oculta hasta que la partida termina. */
  const present = (m, user) => {
    const side = sideOf(m, user);
    if (!side || m.winner) return m;
    return side === 'north' ? { ...m, fleetSouth: null } : { ...m, fleetNorth: null };
  };
  const invitationVisible = (store, user, inv) =>
    inv.invitedUser === user.id || inv.invitingUser === user.id || manages(user, store.findTournament(inv.tournament));

  // --- todos los usuarios ---
  api.put('/me/session', (req, res) => {
    const { email, password } = req.body ?? {};
    const user = req.store.authenticate(email, password);
    const jti = randomUUID();
    req.store.db.sessions.add(jti);
    const token = jwt.sign({ sub: user.id, role: user.role, jti }, secret, { expiresIn: '12h' });
    res.json({ email: user.email, role: user.role, token, userId: user.id });
  });
  api.use(auth);
  api.get('/me', (req, res) => res.json(withoutPassword(req.user)));
  api.delete('/me/session', (req, res) => {
    req.store.db.sessions.delete(req.sessionId);
    res.status(204).end();
  });

  // --- jugadores ---
  api.get('/board', (req, res) => res.json(BOARD));
  api.get('/me/invitations', (req, res) => res.json(req.store.db.invitations.filter((i) => i.invitedUser === req.user.id)));
  api.get('/me/matches', (req, res) =>
    res.json(req.store.db.matches.filter((m) => sideOf(m, req.user)).map((m) => present(m, req.user))),
  );
  api.get('/me/tournaments', (req, res) => {
    const ids = req.store.db.invitations.filter((i) => i.invitedUser === req.user.id && i.acceptedAt).map((i) => i.tournament);
    res.json(req.store.db.tournaments.filter((t) => ids.includes(t.id)));
  });
  api.get('/invitations/:id', (req, res) => {
    const inv = req.store.findInvitation(req.params.id);
    if (!inv || !invitationVisible(req.store, req.user, inv)) fail(404);
    res.json(inv);
  });
  for (const action of ['accept', 'reject']) {
    api.post(`/invitations/:id/${action}`, (req, res) => {
      const inv = req.store.findInvitation(req.params.id);
      if (!inv || inv.invitedUser !== req.user.id) fail(404);
      res.json(req.store.respondInvitation(inv, action === 'accept'));
    });
  }
  api.get('/matches/:id', (req, res) => res.json(present(matchOr404(req), req.user)));
  api.get('/matches/:id/moves', (req, res) => res.json(req.store.movesOf(matchOr404(req))));
  api.post('/matches/:id/moves', (req, res) => {
    const m = matchOr404(req);
    const side = sideOf(m, req.user);
    if (!side) throw new BadRequest('Solo los jugadores de la partida pueden hacer jugadas.');
    res.json(present(req.store.play(m, side, req.body), req.user));
  });
  api.get('/tournaments/:id', (req, res) => res.json(tournamentOr404(req, canSeeTournament)));
  api.get('/tournaments/:id/matches', (req, res) => {
    const t = tournamentOr404(req, canSeeTournament);
    res.json(req.store.db.matches.filter((m) => m.tournament === t.id).map((m) => present(m, req.user)));
  });

  // --- organizadores ---
  const organiser = role('organiser');
  api.put('/invitations', organiser, (req, res) => {
    const { invitedUser, tournament } = req.body ?? {};
    const t = req.store.findTournament(tournament);
    if (t && !manages(req.user, t)) fail(404);
    res.status(201).json(req.store.invite(req.user, invitedUser, tournament));
  });
  api.delete('/invitations/:id', organiser, (req, res) => {
    const inv = req.store.findInvitation(req.params.id);
    if (!inv || !manages(req.user, req.store.findTournament(inv.tournament))) fail(404);
    req.store.deleteInvitation(inv);
    res.status(204).end();
  });
  const managedMatch = (req) => matchOr404(req, (store, user, m) => manages(user, store.findTournament(m.tournament)));
  api.delete('/matches/:id', organiser, (req, res) => {
    req.store.deleteMatch(managedMatch(req));
    res.status(204).end();
  });
  api.post('/matches/:id/end', organiser, (req, res) => res.json(req.store.endMatch(managedMatch(req), req.body?.winner)));
  api.put('/tournaments', organiser, (req, res) => res.status(201).json(req.store.createTournament(req.user, req.body?.name)));
  api.patch('/tournaments/:id', organiser, (req, res) =>
    res.json(req.store.updateTournament(tournamentOr404(req, (s, u, t) => manages(u, t)), req.body ?? {})),
  );
  api.delete('/tournaments/:id', organiser, (req, res) => {
    req.store.deleteTournament(tournamentOr404(req, (s, u, t) => manages(u, t)));
    res.status(204).end();
  });
  api.get('/tournaments/:id/invitations', organiser, (req, res) => {
    const t = tournamentOr404(req, (s, u, x) => manages(u, x));
    res.json(req.store.db.invitations.filter((i) => i.tournament === t.id));
  });
  api.put('/tournaments/:id/matches', organiser, (req, res) => {
    const t = tournamentOr404(req, (s, u, x) => manages(u, x));
    res.status(201).json(req.store.createMatch(t, req.body ?? {}));
  });
  api.get('/users', organiser, (req, res) => res.json(req.store.db.users.map(withoutPassword)));

  // --- admins ---
  const admin = role('admin');
  const userOr404 = (req) => req.store.findUser(req.params.id) ?? fail(404);
  api.put('/users', admin, (req, res) => res.status(201).json(withoutPassword(req.store.createUser(req.body ?? {}))));
  api.get('/users/:id', admin, (req, res) => res.json(withoutPassword(userOr404(req))));
  api.patch('/users/:id', admin, (req, res) => res.json(withoutPassword(req.store.updateUser(userOr404(req), req.body ?? {}))));
  api.delete('/users/:id', admin, (req, res) => {
    req.store.deleteUser(userOr404(req));
    res.status(204).end();
  });

  app.use('/api', api);
  app.use('/api', (req, res) => res.status(404).end());

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof BadRequest) return res.status(400).json({ error: err.message });
    if (err instanceof HttpStatus) return res.status(err.status).end();
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'El cuerpo no es JSON válido.' });
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  });

  return app;
}
