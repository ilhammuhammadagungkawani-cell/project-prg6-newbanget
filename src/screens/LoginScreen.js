import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

const LoginScreen = ({ navigation }) => {
  const { t, locale, changeLanguage } = useLanguage();
  const { loginUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Form errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    if (!email.trim()) {
      setEmailError(t('err_empty_email'));
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError(t('err_invalid_email'));
        isValid = false;
      }
    }

    if (!password) {
      setPasswordError(t('err_empty_password'));
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError(t('err_short_password'));
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await loginUser(email, password);
      // Success will update AuthState, AppNavigator handles routing to Home
    } catch (error) {
      if (error.message === 'failed_login') {
        setGeneralError(t('err_failed_login'));
      } else {
        setGeneralError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    const nextLang = locale === 'id' ? 'en' : 'id';
    changeLanguage(nextLang);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* Header Bar with Language Toggle */}
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage} activeOpacity={0.7}>
              <Ionicons name="globe-outline" size={16} color="#10ac84" style={{ marginRight: 4 }} />
              <Text style={styles.langToggleText}>
                {locale === 'id' ? 'ID' : 'EN'}
              </Text>
              <View style={styles.langDivider} />
              <Text style={styles.langToggleInactiveText}>
                {locale === 'id' ? 'EN' : 'ID'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Logo Brand */}
          <View style={styles.brandContainer}>
            <View style={styles.logoIconBg}>
              <Ionicons name="wallet" size={40} color="#ffffff" />
            </View>
            <Text style={styles.brandTitle}>{t('app_name')}</Text>
            <Text style={styles.brandSubtitle}>{t('app_subtitle')}</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.loginTitle}>{t('login_title')}</Text>
            <Text style={styles.loginSubtitle}>{t('login_subtitle')}</Text>

            {generalError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color="#d63031" style={{ marginRight: 8 }} />
                <Text style={styles.errorBannerText}>{generalError}</Text>
              </View>
            ) : null}

            <CustomInput
              label={t('label_email')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('placeholder_email')}
              iconName="mail-outline"
              error={emailError}
              keyboardType="email-address"
            />

            <CustomInput
              label={t('label_password')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('placeholder_password')}
              iconName="lock-closed-outline"
              secureTextEntry={true}
              error={passwordError}
            />

            <CustomButton
              title={t('btn_login')}
              onPress={handleLogin}
              loading={loading}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>{t('link_no_account')}</Text>
            </TouchableOpacity>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  brandContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  logoIconBg: {
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
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 4,
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
  loginTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  loginSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    marginBottom: 20,
  },
  errorBannerText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10ac84',
  },
});

export default LoginScreen;
