import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useFinance } from '../context/FinanceContext';

const CATEGORY_MAP = {
  // Expenses
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
  // Income
  salary: { icon: 'cash', label: 'Gaji', color: '#10ac84' },
  business: { icon: 'briefcase', label: 'Bisnis', color: '#f39c12' },
  gift: { icon: 'gift', label: 'Hadiah', color: '#1abc9c' },
  investment: { icon: 'trending-up', label: 'Investasi', color: '#3498db' },
  other_income: { icon: 'wallet', label: 'Lainnya', color: '#95a5a6' },
};

const ActivityScreen = () => {
  const { t, locale } = useLanguage();
  const { transactions, fetchTransactions, isTransactionsLoading } = useFinance();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const getCategoryDetails = (catId, type) => {
    if (CATEGORY_MAP[catId]) return CATEGORY_MAP[catId];
    return {
      icon: type === 'income' ? 'wallet' : 'cash',
      label: catId ? catId.charAt(0).toUpperCase() + catId.slice(1) : 'Lainnya',
      color: '#95a5a6',
    };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.iconBg}>
        <Ionicons name="receipt-outline" size={48} color="#94a3b8" />
      </View>
      <Text style={styles.emptyTitle}>
        {locale === 'id' ? 'Belum Ada Transaksi' : 'No Transactions Yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {locale === 'id'
          ? 'Transaksi manual Anda akan muncul di sini setelah Anda menambahkannya.'
          : 'Your manual transactions will appear here once you add them.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={styles.screenHeader}>
        <Text style={styles.headerTitle}>{t('activity_title')}</Text>
      </View>

      {isTransactionsLoading && transactions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10ac84" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isTransactionsLoading}
              onRefresh={fetchTransactions}
              colors={['#10ac84']}
            />
          }
          renderItem={({ item }) => {
            const cat = getCategoryDetails(item.category, item.type);
            const isExpense = item.type === 'expense';
            return (
              <View style={styles.transactionRow}>
                <View style={[styles.categoryCircle, { backgroundColor: cat.color + '15' }]}>
                  <Ionicons name={cat.icon} size={22} color={cat.color} />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                  {item.notes ? (
                    <Text style={styles.notesText} numberOfLines={1}>
                      {item.notes}
                    </Text>
                  ) : null}
                  <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                </View>
                <View style={styles.amountContainer}>
                  <Text style={[styles.amountText, { color: isExpense ? '#ff5252' : '#10ac84' }]}>
                    {isExpense ? '-' : '+'}{formatCurrency(item.amount)}
                  </Text>
                  <Text style={styles.walletText}>{item.wallet}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  screenHeader: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  notesText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
  },
  walletText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  iconBg: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default ActivityScreen;
