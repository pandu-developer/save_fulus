import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { SavingsEntry, SavingsGoal } from '../types';
import { loadGoals, saveGoals } from '../storage/storage';

type NewGoal = Omit<SavingsGoal, 'id' | 'createdAt' | 'entries'> & {
  entries?: SavingsEntry[];
};

interface GoalsContextValue {
  goals: SavingsGoal[];
  loading: boolean;
  addGoal: (data: NewGoal) => void;
  updateGoal: (
    id: string,
    data: Partial<Omit<SavingsGoal, 'id' | 'createdAt' | 'entries'>>,
  ) => void;
  deleteGoal: (id: string) => void;
  addEntry: (goalId: string, amount: number) => void;
  deleteEntry: (goalId: string, entryId: string) => void;
  getGoalById: (id: string) => SavingsGoal | undefined;
}

const GoalsContext = createContext<GoalsContextValue | undefined>(undefined);

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await loadGoals();
      if (mounted) {
        setGoals(data);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const addGoal = useCallback((data: NewGoal) => {
    setGoals((prev) => {
      const next = [
        {
          ...data,
          entries: data.entries ?? [],
          id: genId(),
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ];
      saveGoals(next);
      return next;
    });
  }, []);

  const updateGoal = useCallback(
    (
      id: string,
      data: Partial<Omit<SavingsGoal, 'id' | 'createdAt' | 'entries'>>,
    ) => {
      setGoals((prev) => {
        const next = prev.map((g) => (g.id === id ? { ...g, ...data } : g));
        saveGoals(next);
        return next;
      });
    },
    [],
  );

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => {
      const next = prev.filter((g) => g.id !== id);
      saveGoals(next);
      return next;
    });
  }, []);

  const addEntry = useCallback((goalId: string, amount: number) => {
    if (!amount) return;
    setGoals((prev) => {
      const next = prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              entries: [
                ...g.entries,
                { id: genId(), amount, date: new Date().toISOString() },
              ],
            }
          : g,
      );
      saveGoals(next);
      return next;
    });
  }, []);

  const deleteEntry = useCallback((goalId: string, entryId: string) => {
    setGoals((prev) => {
      const next = prev.map((g) =>
        g.id === goalId
          ? { ...g, entries: g.entries.filter((e) => e.id !== entryId) }
          : g,
      );
      saveGoals(next);
      return next;
    });
  }, []);

  const getGoalById = useCallback(
    (id: string) => goals.find((g) => g.id === id),
    [goals],
  );

  const value = useMemo(
    () => ({
      goals,
      loading,
      addGoal,
      updateGoal,
      deleteGoal,
      addEntry,
      deleteEntry,
      getGoalById,
    }),
    [goals, loading, addGoal, updateGoal, deleteGoal, addEntry, deleteEntry, getGoalById],
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals(): GoalsContextValue {
  const ctx = useContext(GoalsContext);
  if (!ctx) {
    throw new Error('useGoals harus dipakai di dalam GoalsProvider');
  }
  return ctx;
}
