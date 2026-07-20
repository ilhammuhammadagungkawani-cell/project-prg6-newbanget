import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import CustomButton from '../components/CustomButton';

const HomeScreen = () => {
  const { t, locale, changeLanguage } = useLanguage();
  const { user, logoutUser } = useAuth();
  const { initialBalance, currentBalance, resetFinanceData } = useFinance();

  const [exchangeRates, setExchangeRates] = useState(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const [rateError, setRateError] = useState('');

  // Fetch exchange rate from external API
  const fetchRates = async () => {
    setLoadingRate(true);
    setRateError('');
    try {
      // Free open exchange rate API (no key required)
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      setExchangeRates(data);
    } catch (error) {
      console.log('Error fetching currency rates:', error);
      setRateError(locale === 'id' ? 'Gagal mengambil data kurs' : 'Failed to retrieve exchange rates');
    } finally {
      setLoadingRate(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [locale]);

  const toggleLanguage = () => {
    const nextLang = locale === 'id' ? 'en' : 'id';
    changeLanguage(nextLang);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Top Header Row */}
        <View style={styles.topHeader}>
          <Text style={styles.appLogoText}>{t('app_name')}</Text>
          <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage} activeOpacity={0.7}>
            <Ionicons name="globe-outline" size={16} color="#10ac84" style={{ marginRight: 4 }} />
            <Text style={styles.langToggleText}>{locale === 'id' ? 'ID' : 'EN'}</Text>
            <View style={styles.langDivider} />
            <Text style={styles.langToggleInactiveText}>{locale === 'id' ? 'EN' : 'ID'}</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeLabel}>{t('welcome_user')}</Text>
            <Text style={styles.userName}>{user ? user.name : 'Mahasiswa'}</Text>
          </View>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {user && user.name ? user.name.substring(0, 2).toUpperCase() : 'M'}
            </Text>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>
              {locale === 'id' ? 'SALDO ANDA SAAT INI' : 'YOUR CURRENT BALANCE'}
            </Text>
            <TouchableOpacity onPress={resetFinanceData} style={styles.resetButton} activeOpacity={0.7}>
              <Ionicons name="refresh-circle-outline" size={20} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.resetText}>{locale === 'id' ? 'Reset Saldo' : 'Reset Balance'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceValue}>{formatCurrency(currentBalance)}</Text>
          <View style={styles.balanceFooter}>
            <Ionicons name="wallet-outline" size={16} color="#e6f7f3" style={{ marginRight: 6 }} />
            <Text style={styles.initialBalanceLabel}>
              {locale === 'id' ? 'Saldo Awal: ' : 'Initial Balance: '}
              <Text style={styles.initialBalanceVal}>{formatCurrency(initialBalance)}</Text>
            </Text>
          </View>
        </View>

        {/* Phase 2 Status Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color="#10ac84" style={{ marginRight: 10 }} />
          <Text style={styles.infoBannerText}>
            {locale === 'id' 
              ? 'Fase 2 Berhasil! Saldo Awal Anda telah tercatat secara persisten per akun.' 
              : 'Phase 2 Success! Your Initial Balance has been recorded persistently per account.'}
          </Text>
        </View>

        {/* External API Integration Card (Currency Exchange) */}
        <View style={styles.apiCard}>
          <View style={styles.apiHeader}>
            <View style={styles.apiTitleContainer}>
              <Ionicons name="trending-up" size={20} color="#10ac84" style={{ marginRight: 8 }} />
              <Text style={styles.apiTitle}>
                {locale === 'id' ? 'Informasi Kurs Rupiah' : 'Rupiah Exchange Rates'}
              </Text>
            </View>
            <TouchableOpacity onPress={fetchRates} disabled={loadingRate}>
              <Ionicons 
                name="refresh" 
                size={18} 
                color={loadingRate ? '#cbd5e1' : '#10ac84'} 
              />
            </TouchableOpacity>
          </View>

          {loadingRate ? (
            <View style={styles.apiLoadingContainer}>
              <ActivityIndicator color="#10ac84" size="small" />
              <Text style={styles.apiLoadingText}>{t('currency_rate_loading')}</Text>
            </View>
          ) : rateError ? (
            <Text style={styles.apiErrorText}>{rateError}</Text>
          ) : (
            <View style={styles.ratesContainer}>
              <View style={styles.rateRow}>
                <Text style={styles.currencyName}>1 USD (United States Dollar)</Text>
                <Text style={styles.currencyVal}>
                  {exchangeRates ? formatCurrency(exchangeRates.rates.IDR) : 'Rp0'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.rateRow}>
                <Text style={styles.currencyName}>1 EUR (Euro)</Text>
                <Text style={styles.currencyVal}>
                  {exchangeRates && exchangeRates.rates.EUR ? 
                    formatCurrency(exchangeRates.rates.IDR / exchangeRates.rates.EUR) : 'Rp0'
                  }
                </Text>
              </View>
              <Text style={styles.updateTime}>
                {locale === 'id' ? 'Pembaruan terakhir: ' : 'Last updated: '}
                {exchangeRates ? new Date(exchangeRates.time_last_update_utc).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
                  day: 'numeric', month: 'short', year: 'numeric'
                }) : '-'}
              </Text>
            </View>
          )}
        </View>

        {/* Log Out Button */}
        <CustomButton
          title={t('btn_logout')}
          onPress={logoutUser}
          style={styles.logoutBtn}
          textStyle={styles.logoutBtnText}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 20,
  },
  appLogoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10ac84',
    letterSpacing: 0.5,
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  langToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10ac84',
  },
  langDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 6,
  },
  langToggleInactiveText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  welcomeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#e6f7f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10ac84',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f7f3',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#b2ebd9',
  },
  infoBannerText: {
    color: '#0e7057',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  apiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 24,
  },
  apiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  apiTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apiTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  apiLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  apiLoadingText: {
    marginLeft: 8,
    color: '#64748b',
    fontSize: 14,
  },
  apiErrorText: {
    color: '#d63031',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 12,
  },
  ratesContainer: {
    paddingVertical: 4,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  currencyName: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  currencyVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  updateTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 12,
    textAlign: 'right',
  },
  logoutBtn: {
    backgroundColor: '#fecaca',
    shadowColor: '#fca5a5',
    elevation: 1,
  },
  logoutBtnText: {
    color: '#b91c1c',
  },
  balanceCard: {
    backgroundColor: '#10ac84',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#10ac84',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e6f7f3',
    letterSpacing: 1,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  resetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginVertical: 4,
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 12,
  },
  initialBalanceLabel: {
    fontSize: 13,
    color: '#e6f7f3',
    fontWeight: '500',
  },
  initialBalanceVal: {
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default HomeScreen;
