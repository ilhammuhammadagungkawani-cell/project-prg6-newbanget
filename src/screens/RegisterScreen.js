import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

const RegisterScreen = ({ navigation }) => {
  const { t, locale, changeLanguage } = useLanguage();
  const { registerUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  // Form errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [pinError, setPinError] = useState('');
  const [confirmPinError, setConfirmPinError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setPinError('');
    setConfirmPinError('');
    setGeneralError('');

    if (!name.trim()) {
      setNameError(t('err_empty_name'));
      isValid = false;
    }

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

    if (!confirmPassword) {
      setConfirmPasswordError(t('err_empty_password'));
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(t('err_mismatch_password'));
      isValid = false;
    }

    if (!pin) {
      setPinError(locale === 'id' ? 'PIN Keamanan tidak boleh kosong' : 'Security PIN is required');
      isValid = false;
    } else if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      setPinError(locale === 'id' ? 'PIN harus berupa 6 angka' : 'PIN must be 6 digits');
      isValid = false;
    }

    if (!confirmPin) {
      setConfirmPinError(locale === 'id' ? 'Konfirmasi PIN tidak boleh kosong' : 'Confirm PIN is required');
      isValid = false;
    } else if (pin !== confirmPin) {
      setConfirmPinError(locale === 'id' ? 'PIN tidak cocok' : 'PIN does not match');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await registerUser(name, email, password, pin);
      Alert.alert(
        locale === 'id' ? 'Berhasil' : 'Success',
        t('success_register'),
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      if (error.message === 'email_exists') {
        setGeneralError(t('err_email_exists'));
      } else {
        setGeneralError(error.message || 'An unexpected error occurred. Please try again.');
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
              <Ionicons name="person-add" size={30} color="#ffffff" />
            </View>
            <Text style={styles.brandTitle}>{t('register_title')}</Text>
            <Text style={styles.brandSubtitle}>{t('register_subtitle')}</Text>
          </View>

          {/* Register Card */}
          <View style={styles.card}>
            {generalError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color="#d63031" style={{ marginRight: 8 }} />
                <Text style={styles.errorBannerText}>{generalError}</Text>
              </View>
            ) : null}

            <CustomInput
              label={t('label_name')}
              value={name}
              onChangeText={setName}
              placeholder={t('placeholder_name')}
              iconName="person-outline"
              error={nameError}
            />

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

            <CustomInput
              label={t('label_confirm_password')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('placeholder_confirm_password')}
              iconName="lock-closed-outline"
              secureTextEntry={true}
              error={confirmPasswordError}
            />

            <CustomInput
              label={locale === 'id' ? 'PIN Keamanan (6 Digit)' : 'Security PIN (6 Digits)'}
              value={pin}
              onChangeText={setPin}
              placeholder={locale === 'id' ? 'Masukkan 6 angka PIN' : 'Enter 6-digit PIN'}
              iconName="keypad-outline"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry={true}
              error={pinError}
            />

            <CustomInput
              label={locale === 'id' ? 'Konfirmasi PIN (6 Digit)' : 'Confirm Security PIN'}
              value={confirmPin}
              onChangeText={setConfirmPin}
              placeholder={locale === 'id' ? 'Ulangi 6 angka PIN' : 'Repeat 6-digit PIN'}
              iconName="keypad-outline"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry={true}
              error={confirmPinError}
            />

            <CustomButton
              title={t('btn_register')}
              onPress={handleRegister}
              loading={loading}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>{t('link_has_account')}</Text>
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
    marginTop: 10,
    marginBottom: 20,
  },
  logoIconBg: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#10ac84',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10ac84',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
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

export default RegisterScreen;
