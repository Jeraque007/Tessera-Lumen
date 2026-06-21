import { useState } from 'react';
import paymentService from '../services/payment';
import { useApp } from '../context/AppContext';

export function usePurchase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useApp();

  const purchase = async (productId, type = 0) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.processPurchase(productId, type, user);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { purchase, loading, error };
}
