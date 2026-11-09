import { useCallback, useContext } from 'react';
import { ToastContext } from './toastContext.js';

/** show(mensaje, 'err' | 'ok') */
export const useToast = () => useContext(ToastContext);

/**
 * Ejecuta una mutación mostrando el error (o un mensaje de éxito) como aviso.
 * Devuelve una función para usar en onClick.
 */
export function useActionRunner() {
  const toast = useToast();
  return useCallback(
    (mutation, variables, { confirm, success } = {}) =>
      () => {
        if (confirm && !window.confirm(confirm)) return;
        mutation.mutate(variables, {
          onSuccess: () => success && toast(success, 'ok'),
          onError: (e) => toast(e.message),
        });
      },
    [toast],
  );
}
