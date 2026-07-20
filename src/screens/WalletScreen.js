import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useFinance } from '../context/FinanceContext';

const { width } = Dimensions.get('window');
const cardWidth = (width - 52) / 2; // Two columns grid with margins

const WalletScreen = () => {
  const { t, locale } = useLanguage();
  const { currentBalance } = useFinance();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Mock wallets structure matching reference screenshot 2
  const wallets = [
    {
      id: 'family',
      title: locale === 'id' ? 'Dompet Keluarga' : 'Family Wallet',
      transactions: 31,
      balance: 12500000,
      color: '#e6f7f3',
      textColor: '#10ac84',
      isGroup: true,
    },
    {
      id: 'bank',
      title: locale === 'id' ? 'Rekening Bank' : 'Bank Account',
      transactions: 2991,
      balance: 85200000,
      color: '#f1f5f9',
      textColor: '#334155',
      iconName: 'business-outline',
    },
    {
      id: 'kos',
      title: locale === 'id' ? 'Tabungan Kost' : 'Boarding Savings',
      transactions: 321,
      balance: currentBalance, // Use current user balance
      color: '#fff5f5',
      textColor: '#ff7675',
      iconName: 'home-outline',
    },
    {
      id: 'personal',
      title: locale === 'id' ? 'Keuangan Pribadi' : 'Personal Finance',
      transactions: 2214,
      balance: 5200000,
      color: '#f0fdf4',
      textColor: '#10ac84',
      iconName: 'person-outline',
    },
  ];

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.headerTitle}>{t('tab_wallet')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Grid Wallets Container */}
        <View style={styles.gridContainer}>
          {wallets.map((wallet) => (
            <View key={wallet.id} style={styles.walletCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {wallet.title}
                </Text>
                <Text style={styles.cardTransactions}>
                  {wallet.transactions} {t('transactions_count')}
                </Text>
              </View>

              <View style={[styles.balanceBadge, { backgroundColor: wallet.color }]}>
                <Text style={[styles.balanceText, { color: wallet.textColor }]} numberOfLines={1}>
                  {formatCurrency(wallet.balance)}
                </Text>
              </View>

              {wallet.isGroup ? (
                /* Group member profile avatars mock */
                <View style={styles.avatarRow}>
                  <View style={[styles.avatar, { backgroundColor: '#ff7675', zIndex: 3 }]}>
                    <Text style={styles.avatarInitial}>A</Text>
                  </View>
                  <View style={[styles.avatar, { backgroundColor: '#74b9ff', left: -10, zIndex: 2 }]}>
                    <Text style={styles.avatarInitial}>B</Text>
                  </View>
                  <View style={[styles.avatar, { backgroundColor: '#fdcb6e', left: -20, zIndex: 1 }]}>
                    <Text style={styles.avatarInitial}>C</Text>
                  </View>
                </View>
              ) : (
                /* Non-group icon layout */
                <View style={styles.iconRow}>
                  <Ionicons name={wallet.iconName || 'wallet-outline'} size={18} color="#64748b" />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Marketing description matching reference screenshot 2 */}
        <View style={styles.descSection}>
          <Text style={styles.descTitle}>
            {locale === 'id' ? 'Lihat uangmu di satu tempat' : 'See your money in one place'}
          </Text>
          <Text style={styles.descText}>
            {locale === 'id' 
              ? 'Atur keuanganmu: gunakan dompet untuk uang tunai, rekening bank, tabungan, kripto dan mata uang berbeda untuk gambaran menyeluruh.'
              : 'Manage your finances: use wallets for cash, bank accounts, savings, crypto and different currencies for a comprehensive overview.'
            }
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.btnSection}>
          <TouchableOpacity style={styles.connectBankBtn} activeOpacity={0.85}>
            <Text style={styles.connectBankBtnText}>{t('btn_connect_bank')}</Text>
            <Ionicons name="link-outline" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.addManualBtn} activeOpacity={0.85}>
            <Text style={styles.addManualBtnText}>{t('btn_add_manual')}</Text>
            <Ionicons name="add" size={18} color="#10ac84" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

      </ScrollView>
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
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  walletCard: {
    width: cardWidth,
    height: 150,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  cardHeader: {
    width: '100%',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  cardTransactions: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  balanceBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  balanceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  descSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  descTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  btnSection: {
    width: '100%',
    marginVertical: 16,
  },
  connectBankBtn: {
    backgroundColor: '#10ac84',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10ac84',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  connectBankBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  addManualBtn: {
    backgroundColor: '#e6f7f3',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#10ac84',
  },
  addManualBtnText: {
    color: '#10ac84',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default WalletScreen;
