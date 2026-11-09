import { useMemo } from 'react';
import { useMyTournaments, useSession } from '@batalla/hooks';
import { apiConfig } from '../config.js';
import { useOrganisedTournamentIds } from '../lib/organisedTournaments.js';

/** Torneos del organizador: los recordados localmente + los que la API asocie al usuario. */
export function useOrganisedTournaments() {
  const { session } = useSession();
  const registry = useOrganisedTournamentIds(apiConfig.apiKey, session.userId);
  const { data: participating } = useMyTournaments();
  const ids = useMemo(() => {
    const fromApi = (participating ?? []).filter((t) => t.organisedBy === session.userId).map((t) => t.id);
    return [...new Set([...registry.ids, ...fromApi])];
  }, [registry.ids, participating, session.userId]);
  return { ids, remember: registry.add, forget: registry.remove };
}
