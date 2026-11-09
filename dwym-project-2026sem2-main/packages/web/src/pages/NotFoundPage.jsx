import { Link } from 'react-router-dom';
import { PageHead } from '../components/ui.jsx';

export function NotFoundPage() {
  return (
    <>
      <PageHead title="No encontrado" sub="La página no existe o no tienes acceso a ella." />
      <Link className="btn" to="/">
        Volver al inicio
      </Link>
    </>
  );
}
