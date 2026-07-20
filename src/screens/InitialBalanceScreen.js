import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useFinance } from '../context/FinanceContext';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

const InitialBalanceScreen = () => {
  const { t, locale, changeLanguage } = useLanguage();
  const { setInitialBalance } = useFinance();
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setError('');
    const numericVal = parseFloat(balance);
    if (isNaN(numericVal) || numericVal <= 0) {
      setError(t('err_invalid_balance'));
      return;
    }

    setLoading(true);
    try {
      await setInitialBalance(numericVal);
    } catch (err) {
      console.log(err);
      setError('Failed to save balance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    const nextLang = locale === 'id' ? 'en' : 'id';
    changeLanguage(nextLang);
  };

  const formatPreview = (value) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parsed);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* Language Toggle Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage} activeOpacity={0.7}>
              <Ionicons name="globe-outline" size={16} color="#10ac84" style={{ marginRight: 4 }} />
              <Text style={styles.langToggleText}>{locale === 'id' ? 'ID' : 'EN'}</Text>
              <View style={styles.langDivider} />
              <Text style={styles.langToggleInactiveText}>{locale === 'id' ? 'EN' : 'ID'}</Text>
            </TouchableOpacity>
          </View>

          {/* Heading and Graphic Header */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBg}>
              <Ionicons name="cash" size={40} color="#ffffff" />
            </View>
            <Text style={styles.title}>{t('initial_balance_title')}</Text>
            <Text style={styles.subtitle}>{t('initial_balance_subtitle')}</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <CustomInput
              label={t('initial_balance_title')}
              value={balance}
              onChangeText={(text) => {
                // Ensure only digits can be entered
                const filtered = text.replace(/[^0-9]/g, '');
                setBalance(filtered);
              }}
              placeholder={t('placeholder_balance')}
              iconName="cash-outline"
              keyboardType="number-pad"
              error={error}
            />

            {/* Live visual preview of formatted currency */}
            {balance ? (
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>
                  {locale === 'id' ? 'Format Tampilan:' : 'Visual Format:'}
                </Text>
                <Text style={styles.previewText}>{formatPreview(balance)}</Text>
              </View>
            ) : null}

            <CustomButton
              title={t('btn_save_continue')}
              onPress={handleSave}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 12,
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
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#10ac84',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10ac84',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  previewContainer: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#b2ebd9',
  },
  previewLabel: {
    fontSize: 12,
    color: '#0e7057',
    fontWeight: '600',
  },
  previewText: {
    fontSize: 18,
    color: '#10ac84',
    fontWeight: '700',
    marginTop: 4,
  },
});

export default InitialBalanceScreen;
