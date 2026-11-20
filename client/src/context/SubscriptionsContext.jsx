import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { subscriptionApi } from '../api/endpoints';
import { parseApiError } from '../api/client';

const SubscriptionsContext = createContext(null);

/*
 * Holds the signed-in user's subscriptions (fetched from the API) and the
 * state of the shared add / edit / details dialogs, so any page can open them.
 */
export function SubscriptionsProvider({ children }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  const [form, setForm] = useState({ open: false, subscription: null });
  const [detailsId, setDetailsId] = useState(null);

  const load = useCallback(async () => {
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    try {
      const data = await subscriptionApi.list();
      setSubscriptions(data.subscriptions);
      setError('');
      setStatus('ready');
    } catch (err) {
      setError(parseApiError(err).message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(async (payload) => {
    const { subscription } = await subscriptionApi.create(payload);
    setSubscriptions((list) => [subscription, ...list]);
    return subscription;
  }, []);

  const update = useCallback(async (id, payload) => {
    const { subscription } = await subscriptionApi.update(id, payload);
    setSubscriptions((list) => list.map((s) => (s.id === id ? subscription : s)));
    return subscription;
  }, []);

  const remove = useCallback(async (id) => {
    await subscriptionApi.remove(id);
    setSubscriptions((list) => list.filter((s) => s.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      subscriptions,
      status,
      error,
      reload: load,
      create,
      update,
      remove,
      form,
      openCreate: () => setForm({ open: true, subscription: null }),
      openEdit: (subscription) => setForm({ open: true, subscription }),
      closeForm: () => setForm((f) => ({ ...f, open: false })),
      detailsSubscription: subscriptions.find((s) => s.id === detailsId) || null,
      openDetails: (subscription) => setDetailsId(subscription.id),
      closeDetails: () => setDetailsId(null),
    }),
    [subscriptions, status, error, load, create, update, remove, form, detailsId],
  );

  return <SubscriptionsContext.Provider value={value}>{children}</SubscriptionsContext.Provider>;
}

export function useSubscriptions() {
  const context = useContext(SubscriptionsContext);
  if (!context) throw new Error('useSubscriptions must be used inside <SubscriptionsProvider>');
  return context;
}
