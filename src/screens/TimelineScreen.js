import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useFinance } from '../context/FinanceContext';
import { useDrawer } from '../context/DrawerContext';

const CATEGORY_MAP = {
  food: { icon: 'restaurant', label: 'Makanan', color: '#ffb142' },
  shopping: { icon: 'bag-handle', label: 'Belanja', color: '#ff5252' },
  transport: { icon: 'train', label: 'Transportasi', color: '#ffda79' },
  home: { icon: 'home', label: 'Rumah', color: '#8c7ae6' },
  bills: { icon: 'receipt', label: 'Tagihan', color: '#00cec9' },
  entertainment: { icon: 'film', label: 'Hiburan', color: '#ffb8b8' },
  car: { icon: 'car', label: 'Mobil', color: '#34ace0' },
  travel: { icon: 'airplane', label: 'Perjalanan', color: '#ff7979' },
  family: { icon: 'people', label: 'Keluarga', color: '#706fd3' },
  health: { icon: 'medkit', label: 'Kesehatan', color: '#ff5252' },
  education: { icon: 'school', label: 'Pendidikan', color: '#33d9b2' },
  groceries: { icon: 'cart', label: 'Bahan Makanan', color: '#ffda79' },
  salary: { icon: 'cash', label: 'Gaji', color: '#10ac84' },
  business: { icon: 'briefcase', label: 'Bisnis', color: '#f39c12' },
  gift: { icon: 'gift', label: 'Hadiah', color: '#1abc9c' },
  investment: { icon: 'trending-up', label: 'Investasi', color: '#3498db' },
  other_income: { icon: 'wallet', label: 'Lainnya', color: '#95a5a6' },
};

const TimelineScreen = ({ navigation }) => {
  const { t, locale } = useLanguage();
  const { initialBalance, currentBalance, transactions, fetchTransactions, isTransactionsLoading } = useFinance();
  const { openDrawer } = useDrawer();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }, [fetchTransactions]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Calculate live stats from database-connected transactions
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(tx => {
      if (tx.type === 'income') totalIncome += tx.amount;
      else if (tx.type === 'expense') totalExpense += tx.amount;
    });
    return { totalIncome, totalExpense, count: transactions.length };
  }, [transactions]);

  const recentTransactions = useMemo(() => transactions.slice(0, 3), [transactions]);

  const getCategoryDetails = (catId, type) => {
    if (CATEGORY_MAP[catId]) return CATEGORY_MAP[catId];
    return {
      icon: type === 'income' ? 'wallet' : 'cash',
      label: catId || 'Lainnya',
      color: '#95a5a6',
    };
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f7a5a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuBtn}>
          <Ionicons name="menu" size={24} color="#10ac84" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('tab_timeline')}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#10ac84" />
        </TouchableOpacity>
      </View>


      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10ac84']} />
        }
      >

        {/* ── Balance Card ── */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>
            {locale === 'id' ? 'SALDO ANDA SAAT INI' : 'YOUR CURRENT BALANCE'}
          </Text>
          <Text style={styles.balanceValue}>{formatCurrency(currentBalance)}</Text>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceRow}>
            <Ionicons name="wallet-outline" size={14} color="#e6f7f3" style={{ marginRight: 5 }} />
            <Text style={styles.initialBalanceLabel}>
              {locale === 'id' ? 'Saldo Awal: ' : 'Initial Balance: '}
              <Text style={styles.initialBalanceVal}>{formatCurrency(initialBalance)}</Text>
            </Text>
            <View style={styles.txCountBadge}>
              <Text style={styles.txCountText}>
                {stats.count} {locale === 'id' ? 'Transaksi' : 'Transactions'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Financial Summary ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {locale === 'id' ? 'Ringkasan Keuangan' : 'Financial Summary'}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          {/* Income Card */}
          <View style={[styles.summaryCard, { borderLeftColor: '#10ac84' }]}>
            <View style={[styles.summaryIconCircle, { backgroundColor: '#e6f7f3' }]}>
              <Ionicons name="arrow-down-circle" size={22} color="#10ac84" />
            </View>
            <Text style={styles.summaryType}>
              {locale === 'id' ? 'Pemasukan' : 'Income'}
            </Text>
            <Text style={[styles.summaryAmount, { color: '#10ac84' }]}>
              {isTransactionsLoading
                ? '...'
                : formatCurrency(stats.totalIncome)}
            </Text>
          </View>

          {/* Expense Card */}
          <View style={[styles.summaryCard, { borderLeftColor: '#ff5252' }]}>
            <View style={[styles.summaryIconCircle, { backgroundColor: '#fff0f0' }]}>
              <Ionicons name="arrow-up-circle" size={22} color="#ff5252" />
            </View>
            <Text style={styles.summaryType}>
              {locale === 'id' ? 'Pengeluaran' : 'Expense'}
            </Text>
            <Text style={[styles.summaryAmount, { color: '#ff5252' }]}>
              {isTransactionsLoading
                ? '...'
                : formatCurrency(stats.totalExpense)}
            </Text>
          </View>
        </View>

        {/* ── Recent Transactions ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {locale === 'id' ? 'Transaksi Terbaru' : 'Recent Transactions'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Activity')}>
            <Text style={styles.seeAllText}>
              {locale === 'id' ? 'Lihat Semua' : 'See All'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentCard}>
          {isTransactionsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#10ac84" size="small" />
            </View>
          ) : recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={36} color="#cbd5e1" />
              <Text style={styles.emptyStateText}>
                {locale === 'id' ? 'Belum ada transaksi' : 'No transactions yet'}
              </Text>
            </View>
          ) : (
            recentTransactions.map((item, index) => {
              const cat = getCategoryDetails(item.category, item.type);
              const isExpense = item.type === 'expense';
              return (
                <View key={item.id}>
                  <View style={styles.txRow}>
                    <View style={[styles.txIconCircle, { backgroundColor: cat.color + '20' }]}>
                      <Ionicons name={cat.icon} size={20} color={cat.color} />
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txCategory}>{cat.label}</Text>
                      {item.notes ? (
                        <Text style={styles.txNotes} numberOfLines={1}>{item.notes}</Text>
                      ) : null}
                      <Text style={styles.txDate}>{formatDate(item.date)}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: isExpense ? '#ff5252' : '#10ac84' }]}>
                      {isExpense ? '-' : '+'}{formatCurrency(item.amount)}
                    </Text>
                  </View>
                  {index < recentTransactions.length - 1 && <View style={styles.txDivider} />}
                </View>
              );
            })
          )}
        </View>

        {/* ── Add Transaction Button ── */}
        <TouchableOpacity
          style={styles.addManualBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddTransaction')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#10ac84" style={{ marginRight: 8 }} />
          <Text style={styles.addManualBtnText}>{t('btn_add_manual')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  menuBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#e6f7f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 16,
  },


  // Balance Card
  balanceCard: {
    backgroundColor: '#10ac84',
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#10ac84',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#e6f7f3',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 14,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  initialBalanceLabel: {
    fontSize: 12,
    color: '#e6f7f3',
    fontWeight: '500',
    flex: 1,
  },
  initialBalanceVal: {
    fontWeight: '700',
    color: '#ffffff',
  },
  txCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  txCountText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10ac84',
  },

  // Summary Cards
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryType: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 15,
    fontWeight: '800',
  },

  // Recent Transactions
  recentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  txIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  txNotes: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  txDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 3,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  txDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 14,
  },

  // Add Manual Button
  addManualBtn: {
    backgroundColor: '#e6f7f3',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#10ac84',
    marginBottom: 10,
  },
  addManualBtnText: {
    color: '#10ac84',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default TimelineScreen;
