import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { API_URL, GATEWAY_URL } from '../config';


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

      // Refresh both current balance and transactions history list
      await refreshFinance();
    } catch (error) {
      console.log('Error adding transaction:', error);
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

  // Function to refresh finance data and transactions manually (e.g. after topup / transfer)
  const refreshFinance = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/api/finance/${user.email}`);
      if (response.ok) {
        const data = await response.json();
        setInitialBalanceState(data.initialBalance !== undefined ? data.initialBalance : null);
        setCurrentBalanceState(data.currentBalance !== undefined ? data.currentBalance : null);
      }
      await fetchTransactions();
    } catch (e) {
      console.log('Error refreshing finance:', e);
    }
  };

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
        refreshFinance,
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

// ---------- Midtrans Payment Gateway helper functions ----------

// Top-up via Midtrans (creates Snap transaction token & redirect URL)
export const topupViaGateway = async (email, amount) => {
  const resp = await fetch(`${API_URL}/api/topup/midtrans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, amount }),
  });
  if (!resp.ok) {
    const errorData = await resp.json();
    throw new Error(errorData.error || 'Failed to create top-up transaction');
  }
  const data = await resp.json();
  return data; // { orderId, token, redirectUrl, status }
};

// Poll Midtrans topup status until PAID (interval 3s)
export const pollTopupStatus = async (orderId, onUpdate) => {
  const interval = setInterval(async () => {
    try {
      const resp = await fetch(`${API_URL}/api/topup/status/${orderId}`);
      if (!resp.ok) return;
      const data = await resp.json();
      if (onUpdate) onUpdate(data.status);
      if (data.status === 'PAID' || data.status === 'SETTLEMENT') {
        clearInterval(interval);
      }
    } catch (e) {
      console.log('Error polling topup status:', e);
    }
  }, 3000);
  return interval;
};

// Transfer Saldo E-Wallet ke Rekening Bank
export const transferToBank = async (email, bankCode, accountNumber, accountName, amount, notes) => {
  const resp = await fetch(`${API_URL}/api/transfer/bank`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, bankCode, accountNumber, accountName, amount, notes }),
  });
  if (!resp.ok) {
    const errData = await resp.json();
    throw new Error(errData.error || 'Transfer ke bank gagal');
  }
  return await resp.json();
};

// Transfer saldo ke pengguna lain (internal sesama akun app)
export const transferTo = async (senderEmail, receiverEmail, amount, notes) => {
  const resp = await fetch(`${API_URL}/api/transfer/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senderEmail, receiverEmail, amount, notes }),
  });
  if (!resp.ok) {
    const errData = await resp.json();
    throw new Error(errData.error || 'Transfer sesama akun gagal');
  }
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

export const useFinance = () => useContext(FinanceContext);
export default FinanceContext;

