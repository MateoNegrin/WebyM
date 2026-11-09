/** Piezas de interfaz chicas y reutilizables del sistema visual. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ToastContext } from '../hooks/toastContext.js';

export function BrandMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <rect x="1" y="1" width="26" height="26" rx="4" fill="none" stroke="#fff" strokeWidth="2" />
      <path d="M1 10h26M1 19h26M10 1v26M19 1v26" stroke="#fff" strokeOpacity=".35" />
      <circle cx="14.5" cy="14.5" r="4" fill="#F2762E" />
    </svg>
  );
}

export const Chip = ({ tone = '', children, ...rest }) => (
  <span className={`chip ${tone}`.trim()} {...rest}>
    {children}
  </span>
);

/** Migas de pan: [{ to?, label }] */
export function Crumbs({ items }) {
  return (
    <nav className="crumb" aria-label="Ruta">
      {items.map((c, i) => (
        <span key={i}>
          {i > 0 && ' / '}
          {c.to ? <Link to={c.to}>{c.label}</Link> : c.label}
        </span>
      ))}
    </nav>
  );
}

/** Encabezado de página con migas opcionales y contenido a la derecha. */
export function PageHead({ title, sub, crumbs, aside }) {
  return (
    <>
      {crumbs && <Crumbs items={crumbs} />}
      <div className="pagehead">
        <div>
          <h1>{title}</h1>
          {sub && <p className="sub">{sub}</p>}
        </div>
        {aside}
      </div>
    </>
  );
}

export function Card({ title, lead, titleAside, children, className = '', ...rest }) {
  return (
    <section className={`card ${className}`.trim()} {...rest}>
      {title &&
        (titleAside ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <h2>{title}</h2>
            {titleAside}
          </div>
        ) : (
          <h2>{title}</h2>
        ))}
      {lead && <p className="lead">{lead}</p>}
      {children}
    </section>
  );
}

export const Loading = ({ label = 'Cargando…' }) => (
  <div className="center" role="status">
    <span className="spinner" aria-hidden="true" />
    {label}
  </div>
);

export function ErrorState({ error, onRetry }) {
  return (
    <div className="alert err" role="alert" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ flex: 1 }}>{error?.message ?? 'Ocurrió un error.'}</span>
      {onRetry && (
        <button className="btn sm out" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}

export const Empty = ({ children }) => <div className="empty">{children}</div>;

/** Muestra carga / error de una consulta de react-query y si no, el contenido. */
export function QueryState({ query, children, loading }) {
  if (query.isPending) return loading ?? <Loading />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  return children(query.data);
}

// --- avisos flotantes ---


export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef();
  const show = useCallback((message, tone = 'err') => {
    clearTimeout(timer.current);
    setToast({ message, tone });
    timer.current = setTimeout(() => setToast(null), 4500);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite">
        {toast && (
          <div className={`alert toast ${toast.tone}`} role={toast.tone === 'err' ? 'alert' : 'status'}>
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
