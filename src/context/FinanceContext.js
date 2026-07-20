import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';

const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
  const { user } = useAuth();
  const [initialBalance, setInitialBalanceState] = useState(null);
  const [currentBalance, setCurrentBalanceState] = useState(null);
  const [isFinanceLoading, setIsFinanceLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);
  const [goals, setGoals] = useState([]);
  const [isGoalsLoading, setIsGoalsLoading] = useState(false);

  const fetchTransactions = async () => {
    if (!user) return;
    setIsTransactionsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/transactions/${user.email}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.log('Error fetching transactions from backend:', error);
    } finally {
      setIsTransactionsLoading(false);
    }
  };

  const fetchGoals = async () => {
    if (!user) return;
    setIsGoalsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/goals/${user.email}`);
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.log('Error fetching goals from backend:', error);
    } finally {
      setIsGoalsLoading(false);
    }
  };

  // Load finance data whenever the user logs in or switches accounts (hit backend API)
  useEffect(() => {
    const loadFinanceData = async () => {
      if (!user) {
        setInitialBalanceState(null);
        setCurrentBalanceState(null);
        setTransactions([]);
        setGoals([]);
        setIsFinanceLoading(false);
        return;
      }

      setIsFinanceLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/finance/${user.email}`);
        if (response.ok) {
          const data = await response.json();
          setInitialBalanceState(data.initialBalance !== undefined ? data.initialBalance : null);
          setCurrentBalanceState(data.currentBalance !== undefined ? data.currentBalance : null);
        } else {
          setInitialBalanceState(null);
          setCurrentBalanceState(null);
        }
        await fetchTransactions();
        await fetchGoals();
      } catch (error) {
        console.log('Error loading finance data from backend:', error);
        // Fallback or error state
        setInitialBalanceState(null);
        setCurrentBalanceState(null);
      } finally {
        setIsFinanceLoading(false);
      }
    };

    loadFinanceData();
  }, [user]);

  // Set the initial balance (onboarding phase - hit backend API)
  const setInitialBalance = async (amount) => {
    if (!user) return;
    try {
      const numericAmount = parseFloat(amount);
      const response = await fetch(`${API_URL}/api/finance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          amount: numericAmount,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save balance');
      }

      setInitialBalanceState(numericAmount);
      setCurrentBalanceState(numericAmount);
    } catch (error) {
      console.log('Error saving initial balance:', error);
      throw error;
    }
  };

  // Reset data (helper for testing and clearing data - hit backend API)
  const resetFinanceData = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/api/finance/${user.email}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset balance');
      }

      setInitialBalanceState(null);
      setCurrentBalanceState(null);
    } catch (error) {
      console.log('Error resetting finance data:', error);
    }
  };

  // Add a new transaction (hit backend API)
  const addTransaction = async (transactionData) => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          ...transactionData
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save transaction');
      }

      const data = await response.json();
      // Update local state with the new balance returned from backend
      if (data.newBalance !== undefined) {
        setCurrentBalanceState(data.newBalance);
      }

      // Refresh the transactions history list
      await fetchTransactions();

      return data;
    } catch (error) {
      console.log('Error saving transaction:', error);
      throw error;
    }
  };

  // Add a new goal
  const addGoal = async ({ title, emoji, targetAmount, deadline }) => {
    if (!user) return;
    const response = await fetch(`${API_URL}/api/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, title, emoji, targetAmount, deadline }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create goal');
    }
    await fetchGoals();
  };

  // Add savings to a goal
  const updateGoalSaving = async (goalId, amount) => {
    if (!user) return;
    const response = await fetch(`${API_URL}/api/goals/${goalId}/save`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update goal');
    }
    await fetchGoals();
  };

  // Delete a goal
  const deleteGoal = async (goalId) => {
    if (!user) return;
    const response = await fetch(`${API_URL}/api/goals/${goalId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete goal');
    }
    await fetchGoals();
  };
// ---------- Payment‑Gateway helper functions ----------
import { GATEWAY_URL } from '../config';

// Top‑up via QR‑IS (Xendit) – creates invoice and returns externalId & QR URL
export const topupViaGateway = async (email, amount) => {
  const resp = await fetch(`${GATEWAY_URL}/api/topup/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, amount }),
  });
  if (!resp.ok) throw new Error('Failed to create top‑up');
  const data = await resp.json();
  return data; // { invoiceUrl, externalId }
};

// Poll Xendit invoice status until PAID (simple interval, 5 s)
export const pollTopupStatus = async (externalId, onUpdate) => {
  const interval = setInterval(async () => {
    const resp = await fetch(`${GATEWAY_URL}/api/topup/status/${externalId}`);
    if (!resp.ok) return;
    const { status } = await resp.json();
    if (onUpdate) onUpdate(status);
    if (status === 'PAID') clearInterval(interval);
  }, 5000);
};

// Transfer saldo ke pengguna lain
export const transferTo = async (senderEmail, receiverEmail, amount) => {
  const resp = await fetch(`${GATEWAY_URL}/api/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senderEmail, receiverEmail, amount }),
  });
  if (!resp.ok) throw new Error('Transfer failed');
  return await resp.json();
};

// Get / set budget limits
export const getBudgetLimits = async (email) => {
  const resp = await fetch(`${GATEWAY_URL}/api/budget/${email}`);
  if (!resp.ok) throw new Error('Failed to fetch limits');
  const { limits } = await resp.json();
  return limits;
};

export const setBudgetLimit = async (email, category, limitAmount) => {
  const resp = await fetch(`${GATEWAY_URL}/api/budget`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, category, limitAmount }),
  });
  if (!resp.ok) throw new Error('Failed to set limit');
  return await resp.json();
};

// Monthly report – total spending per category (gateway could implement aggregation later)
export const getMonthlyReport = async (email, month, year) => {
  const resp = await fetch(`${GATEWAY_URL}/api/report/${email}?month=${month}&year=${year}`);
  if (!resp.ok) throw new Error('Failed to fetch report');
  return await resp.json();
};

// -----------------------------------------------------------

  return (
    <FinanceContext.Provider
      value={{
        initialBalance,
        currentBalance,
        isFinanceLoading,
        transactions,
        isTransactionsLoading,
        goals,
        isGoalsLoading,
        setInitialBalance,
        resetFinanceData,
        addTransaction,
        fetchTransactions,
        fetchGoals,
        addGoal,
        updateGoalSaving,
        deleteGoal,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
export default FinanceContext;
