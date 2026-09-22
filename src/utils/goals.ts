import { SavingsGoal } from '../types';

// Total yang sudah terkumpul (jumlah semua entri tabungan)
export function savedAmount(goal: SavingsGoal): number {
  return goal.entries.reduce((sum, e) => sum + e.amount, 0);
}

// Sisa yang masih perlu ditabung (minimal 0)
export function remaining(goal: SavingsGoal): number {
  return Math.max(goal.targetAmount - savedAmount(goal), 0);
}

// Progres 0..1
export function progress(goal: SavingsGoal): number {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(savedAmount(goal) / goal.targetAmount, 1);
}

export function isCompleted(goal: SavingsGoal): boolean {
  return goal.targetAmount > 0 && savedAmount(goal) >= goal.targetAmount;
}
