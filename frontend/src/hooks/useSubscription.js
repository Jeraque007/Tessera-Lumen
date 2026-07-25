import { useState } from 'react';
import paymentService from '../services/payment';
import { useApp } from '../context/AppContext';

export function useSubscription() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useApp();

  const subscribe = async (productId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.processSubscription(productId, user);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading, error };
}
