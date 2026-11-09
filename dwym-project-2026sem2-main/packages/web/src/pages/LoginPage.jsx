import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '@batalla/hooks';
import { BrandMark } from '../components/ui.jsx';

/** Ilustración del diseño: flota sobre la carta náutica. */
function HeroArt() {
  return (
    <svg className="art" width="320" height="320" viewBox="0 0 320 320" aria-hidden="true" style={{ maxWidth: '100%', height: 'auto' }}>
      <defs>
        <pattern id="g" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0V32" fill="none" stroke="#2C557A" />
        </pattern>
      </defs>
      <rect width="320" height="320" fill="#0F2D49" />
      <rect width="320" height="320" fill="url(#g)" />
      <rect x="33" y="33" width="158" height="30" rx="4" fill="#3E6D91" />
      <rect x="225" y="65" width="30" height="126" rx="4" fill="#3E6D91" />
      <rect x="65" y="161" width="94" height="30" rx="4" fill="#3E6D91" />
      <rect x="97" y="225" width="94" height="30" rx="4" fill="#3E6D91" />
      <rect x="33" y="289" width="62" height="30" rx="4" fill="#3E6D91" />
      <rect x="225" y="97" width="30" height="30" fill="#C2410C" />
      <path d="M233 105l14 14M247 105l-14 14" stroke="#fff" strokeWidth="3" />
      <rect x="129" y="33" width="30" height="30" fill="#C2410C" />
      <path d="M137 41l14 14M151 41l-14 14" stroke="#fff" strokeWidth="3" />
      <circle cx="48" cy="209" r="5" fill="#7FA6C2" />
      <circle cx="176" cy="113" r="5" fill="#7FA6C2" />
      <circle cx="272" cy="241" r="5" fill="#7FA6C2" />
      <circle cx="112" cy="273" r="5" fill="#7FA6C2" />
    </svg>
  );
}

export function LoginPage() {
  const { session, ready, login } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (ready && session) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      <section className="hero">
        <div className="brand">
          <BrandMark size={32} />
          Batalla Naval
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, alignItems: 'flex-start' }}>
          <HeroArt />
          <h1>Hunde la flota rival</h1>
          <p style={{ color: '#C9D8E3', fontSize: 18, maxWidth: 460 }}>
            Juega partidas de Batalla Naval y arma torneos entre varios jugadores.
          </p>
        </div>
      </section>
      <section className="form">
        <form style={{ width: '100%', maxWidth: 400 }} onSubmit={onSubmit} noValidate>
          <h2 style={{ fontSize: 40, marginBottom: 8 }}>Ingresar</h2>
          <p className="muted" style={{ marginBottom: 28 }}>
            Usa el correo y la contraseña con los que te registraron.
          </p>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              className="input"
              id="email"
              type="email"
              placeholder="nombre@correo.com"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="pass">Contraseña</label>
            <input
              className="input"
              id="pass"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="alert err" role="alert" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}
          <button className="btn acc block" type="submit" disabled={submitting || !email || !password}>
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>
          <p className="muted sm" style={{ marginTop: 20 }}>
            ¿No tienes cuenta? Pídele a un administrador que te cree una.
          </p>
        </form>
      </section>
    </div>
  );
}
