import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Transaction } from '../types';
import { loadTransactions, saveTransactions } from '../storage/storage';

interface TransactionsContextValue {
  transactions: Transaction[];
  loading: boolean;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (
    id: string,
    data: Omit<Transaction, 'id' | 'createdAt'>,
  ) => void;
  deleteTransaction: (id: string) => void;
  getById: (id: string) => Transaction | undefined;
}

const TransactionsContext = createContext<TransactionsContextValue | undefined>(
  undefined,
);

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Muat data saat aplikasi pertama dibuka
  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await loadTransactions();
      if (mounted) {
        setTransactions(data);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Setiap perubahan langsung disimpan ke penyimpanan lokal
  const commit = useCallback((next: Transaction[]) => {
    setTransactions(next);
    saveTransactions(next);
  }, []);

  const addTransaction = useCallback(
    (data: Omit<Transaction, 'id' | 'createdAt'>) => {
      setTransactions((prev) => {
        const next = [
          { ...data, id: generateId(), createdAt: new Date().toISOString() },
          ...prev,
        ];
        saveTransactions(next);
        return next;
      });
    },
    [],
  );

  const updateTransaction = useCallback(
    (id: string, data: Omit<Transaction, 'id' | 'createdAt'>) => {
      setTransactions((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, ...data } : t));
        saveTransactions(next);
        return next;
      });
    },
    [],
  );

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTransactions(next);
      return next;
    });
  }, []);

  const getById = useCallback(
    (id: string) => transactions.find((t) => t.id === id),
    [transactions],
  );

  const value = useMemo(
    () => ({
      transactions,
      loading,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      getById,
    }),
    [transactions, loading, addTransaction, updateTransaction, deleteTransaction, getById],
  );

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions(): TransactionsContextValue {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    throw new Error('useTransactions harus dipakai di dalam TransactionsProvider');
  }
  return ctx;
}
