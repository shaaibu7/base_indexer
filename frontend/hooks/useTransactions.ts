import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface Transaction {
  id: string | number;
  hash?: string;
  from: string;
  to: string;
  value: string;
  blockNumber?: number;
  timestamp: string | Date;
  status?: 'success' | 'failed' | 'pending';
}

export function useTransactions(limit = 10) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/transactions/recent?limit=${limit}`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to fetch transactions', error);
      toast.error('Could not load recent transactions');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, refresh: fetchTransactions };
}
