import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  ScrollView, StatusBar, Image, Alert, ActivityIndicator, Modal, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { API_URL } from '../config';

import { scheduleDailyExpenseReminder, triggerTestNotification, getSavedReminderTime } from '../services/NotificationService';

const SettingsScreen = ({ navigation }) => {
  const { t, locale, changeLanguage } = useLanguage();
  const { user, logoutUser, updateUserProfilePhoto } = useAuth();
  const { resetFinanceData } = useFinance();

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [userBankName, setUserBankName] = useState('');
  const [userBankAccount, setUserBankAccount] = useState('');
  const [reminderTime, setReminderTime] = useState({ hour: 15, minute: 0 });

  useEffect(() => {
    // Load saved reminder time and schedule notification
    const initReminder = async () => {
      const savedTime = await getSavedReminderTime();
      setReminderTime(savedTime);
      scheduleDailyExpenseReminder(savedTime.hour, savedTime.minute);
    };
    initReminder();
  }, []);

  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  const handleSelectHour = async (h) => {
    await scheduleDailyExpenseReminder(h, 0);
    setReminderTime({ hour: h, minute: 0 });
    setIsTimePickerVisible(false);
    Alert.alert(
      'Berhasil Disimpan! 🎉',
      `Notifikasi pengingat harian telah di-set untuk pukul ${String(h).padStart(2, '0')}:00 WIB setiap hari.`
    );
  };

  useEffect(() => {
    if (user?.email) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const encodedEmail = encodeURIComponent(user.email.trim().toLowerCase());
      const res = await fetch(`${API_URL}/api/users/${encodedEmail}/profile`);
      if (res.ok) {
        const data = await res.json();
        if (data.profilePhoto) {
          setProfilePhoto(data.profilePhoto);
          updateUserProfilePhoto(data.profilePhoto);
        }
        if (data.bankName) setUserBankName(data.bankName);
        if (data.bankAccount) setUserBankAccount(data.bankAccount);
      }
    } catch (e) { /* silent */ }
  };

  const handlePickPhoto = () => {
    Alert.alert(
      locale === 'id' ? 'Ubah Foto Profil' : 'Change Profile Photo',
      '',
      [
        {
          text: locale === 'id' ? '📷 Kamera' : '📷 Camera',
          onPress: () => openCamera(),
        },
        {
          text: locale === 'id' ? '🖼️ Galeri' : '🖼️ Gallery',
          onPress: () => openGallery(),
        },
        { text: locale === 'id' ? 'Batal' : 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(locale === 'id' ? 'Izin kamera ditolak' : 'Camera permission denied');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: [ImagePicker.MediaType.IMAGE],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      uploadPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(locale === 'id' ? 'Izin galeri ditolak' : 'Gallery permission denied');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.IMAGE],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      uploadPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const uploadPhoto = async (base64Photo) => {
    setUploadingPhoto(true);
    try {
      const res = await fetch(`${API_URL}/api/users/${user.email}/photo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePhoto: base64Photo }),
      });
      if (res.ok) {
        setProfilePhoto(base64Photo);
        updateUserProfilePhoto(base64Photo);
        Alert.alert('✅', locale === 'id' ? 'Foto profil berhasil diperbarui!' : 'Profile photo updated!');
      }
    } catch (e) {
      Alert.alert('Error', locale === 'id' ? 'Gagal mengupload foto.' : 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };


  const handleResetBalance = () => {
    Alert.alert(
      locale === 'id' ? 'Reset Saldo?' : 'Reset Balance?',
      locale === 'id' ? 'Semua data keuangan akan direset. Lanjutkan?' : 'All finance data will be reset. Continue?',
      [
        { text: locale === 'id' ? 'Batal' : 'Cancel', style: 'cancel' },
        { text: locale === 'id' ? 'Reset' : 'Reset', style: 'destructive', onPress: resetFinanceData },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      locale === 'id' ? 'Keluar?' : 'Logout?',
      locale === 'id' ? 'Apakah Anda yakin ingin keluar?' : 'Are you sure you want to logout?',
      [
        { text: locale === 'id' ? 'Batal' : 'Cancel', style: 'cancel' },
        { text: locale === 'id' ? 'Keluar' : 'Logout', style: 'destructive', onPress: logoutUser },
      ]
    );
  };

  const [isBankModalVisible, setIsBankModalVisible] = useState(false);
  const [inputBankName, setInputBankName] = useState('BCA');
  const [inputBankAccount, setInputBankAccount] = useState('');

  const handleSaveBankModal = async () => {
    if (!inputBankAccount || inputBankAccount.trim().length < 5) {
      Alert.alert('Peringatan', 'Masukkan nomor rekening yang valid (minimal 5 digit).');
      return;
    }
    if (!user || !user.email) {
      Alert.alert('Error', 'Sesi login tidak ditemukan. Silakan re-login.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/users/update-bank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          bankName: inputBankName,
          bankAccount: inputBankAccount.trim()
        }),
      });
      const rawText = await res.text();
      let data = {};
      try {
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        console.log('Backend response is non-JSON:', rawText);
      }

      if (res.ok) {
        setUserBankName(inputBankName);
        setUserBankAccount(inputBankAccount.trim());
        setIsBankModalVisible(false);
        Alert.alert('Berhasil! 🎉', `Rekening ${inputBankName} - ${inputBankAccount.trim()} tersimpan ke database.`);
      } else {
        Alert.alert('Gagal', data.error || `Server Error (${res.status})`);
      }
    } catch (e) {
      console.log('Error saving bank account:', e);
      Alert.alert('Error', `Terjadi kesalahan: ${e.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings_title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Profile Card ── */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8} style={styles.avatarWrapper}>
            {uploadingPhoto ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator color="#10ac84" />
              </View>
            ) : profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : 'M'}
                </Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={14} color="#ffffff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>{user?.name || 'Mahasiswa'}</Text>
          <Text style={styles.profileEmail}>{user?.email || ''}</Text>

          {/* User Bank Account Info */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setInputBankName(userBankName || 'BCA');
              setInputBankAccount(userBankAccount || '');
              setIsBankModalVisible(true);
            }}
            style={{
              marginTop: 12,
              padding: 10,
              backgroundColor: '#f1f5f9',
              borderRadius: 12,
              width: '100%',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#cbd5e1'
            }}
          >
            <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>Rekening Utama Saya (Ketuk untuk ubah):</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0d9488', marginTop: 2 }}>
              {userBankAccount ? `${userBankName || 'BCA'} - ${userBankAccount}` : '+ Tambah Nomor Rekening Saya'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePickPhoto} style={styles.changePhotoBtn}>
            <Text style={styles.changePhotoText}>
              {locale === 'id' ? 'Ubah Foto Profil' : 'Change Profile Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Language Section ── */}
        <Text style={styles.sectionLabel}>{t('language_setting')}</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingsRow} onPress={() => changeLanguage('id')} activeOpacity={0.7}>
            <View style={styles.settingsRowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: '#fef3c7' }]}>
                <Text style={{ fontSize: 16 }}>🇮🇩</Text>
              </View>
              <Text style={styles.settingsRowText}>{t('active_lang_id')}</Text>
            </View>
            <Ionicons name={locale === 'id' ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={locale === 'id' ? '#10ac84' : '#cbd5e1'} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity style={styles.settingsRow} onPress={() => changeLanguage('en')} activeOpacity={0.7}>
            <View style={styles.settingsRowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: '#dbeafe' }]}>
                <Text style={{ fontSize: 16 }}>🇬🇧</Text>
              </View>
              <Text style={styles.settingsRowText}>{t('active_lang_en')}</Text>
            </View>
            <Ionicons name={locale === 'en' ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={locale === 'en' ? '#10ac84' : '#cbd5e1'} />
          </TouchableOpacity>
        </View>

        {/* ── Navigation & Reminder Section ── */}
        <Text style={styles.sectionLabel}>{locale === 'id' ? 'Pengingat Harian & Fitur' : 'Daily Reminder & Features'}</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => setIsTimePickerVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="time-outline" size={18} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.settingsRowText}>
                  {locale === 'id' ? 'Atur Jam Pengingat Harian' : 'Set Daily Reminder Time'}
                </Text>
                <Text style={{ fontSize: 11, color: '#0d9488', fontWeight: '600' }}>
                  {`Jam Aktif: Pukul ${String(reminderTime.hour).padStart(2, '0')}:00 WIB (Ketuk untuk ubah)`}
                </Text>
              </View>
            </View>
            <Ionicons name="create-outline" size={20} color="#0d9488" />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={async () => {
              const success = await triggerTestNotification();
              if (success) {
                Alert.alert(
                  '🔔 Uji Notifikasi Terkirim!',
                  `Periksa System Bar / Layar Kunci HP Anda!\n\nNotifikasi pengingat harian telah aktif dan akan muncul otomatis setiap pukul ${String(reminderTime.hour).padStart(2, '0')}:00 WIB.`
                );
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="notifications" size={18} color="#10ac84" />
              </View>
              <View>
                <Text style={styles.settingsRowText}>
                  {locale === 'id' ? 'Tes Notifikasi HP Sekarang' : 'Test HP Push Notification'}
                </Text>
                <Text style={{ fontSize: 11, color: '#64748b' }}>
                  {locale === 'id' ? 'Ketuk untuk mencoba notifikasi di HP' : 'Tap to trigger test push alert'}
                </Text>
              </View>
            </View>
            <Ionicons name="paper-plane-outline" size={18} color="#10ac84" />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => navigation.navigate('NearbyATM')}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="map" size={18} color="#10ac84" />
              </View>
              <Text style={styles.settingsRowText}>
                {locale === 'id' ? 'ATM & Bank Terdekat' : 'Nearby ATM & Banks'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* ── Danger Zone ── */}
        <Text style={styles.sectionLabel}>{locale === 'id' ? 'Data' : 'Data'}</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingsRow} onPress={handleResetBalance} activeOpacity={0.7}>
            <View style={styles.settingsRowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="refresh-circle-outline" size={18} color="#f59e0b" />
              </View>
              <Text style={[styles.settingsRowText, { color: '#f59e0b' }]}>
                {locale === 'id' ? 'Reset Saldo' : 'Reset Balance'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* ── Logout Button ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>{t('btn_logout')}</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal Edit Rekening Bank */}
      <Modal
        visible={isBankModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsBankModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>🏦 Atur Rekening Bank Utama</Text>
              <TouchableOpacity onPress={() => setIsBankModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 }}>Pilih Nama Bank:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {['BCA', 'MANDIRI', 'BNI', 'BRI', 'SEABANK'].map((b) => (
                <TouchableOpacity
                  key={b}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: inputBankName === b ? '#0d9488' : '#e2e8f0',
                    backgroundColor: inputBankName === b ? '#ccfbf1' : '#f8fafc',
                  }}
                  onPress={() => setInputBankName(b)}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: inputBankName === b ? '#0f766e' : '#64748b' }}>
                    {b}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 }}>Nomor Rekening Bank:</Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              borderWidth: 1,
              borderColor: '#cbd5e1',
              borderRadius: 12,
              paddingHorizontal: 12,
              marginBottom: 20,
            }}>
              <Ionicons name="card-outline" size={20} color="#0d9488" style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, height: 48, fontSize: 15, fontWeight: '600', color: '#0f172a' }}
                keyboardType="numeric"
                value={inputBankAccount}
                onChangeText={setInputBankAccount}
                placeholder="Contoh: 1234567890"
              />
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#0d9488',
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: 'center',
              }}
              onPress={handleSaveBankModal}
            >
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>Simpan Rekening ke Database</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Time Selector */}
      <Modal
        visible={isTimePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsTimePickerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>⏰ Pilih Jam Pengingat (Format 24 Jam)</Text>
              <TouchableOpacity onPress={() => setIsTimePickerVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingVertical: 10 }}>
              {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                <TouchableOpacity
                  key={h}
                  style={{
                    width: '28%',
                    paddingVertical: 14,
                    backgroundColor: reminderTime.hour === h ? '#0d9488' : '#f8fafc',
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: reminderTime.hour === h ? '#0d9488' : '#e2e8f0',
                    alignItems: 'center',
                  }}
                  onPress={() => handleSelectHour(h)}
                >
                  <Text style={{ fontSize: 16, fontWeight: '800', color: reminderTime.hour === h ? '#ffffff' : '#0f172a' }}>
                    {`${String(h).padStart(2, '0')}:00`}
                  </Text>
                  <Text style={{ fontSize: 10, color: reminderTime.hour === h ? '#ccfbf1' : '#64748b', marginTop: 2 }}>
                    {h >= 18 ? 'Malam' : h >= 15 ? 'Sore' : h >= 12 ? 'Siang' : h >= 5 ? 'Pagi' : 'Dini Hari'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    height: 56, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 24 },

  profileCard: {
    backgroundColor: '#ffffff', borderRadius: 24, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2, marginBottom: 28,
  },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatarImage: { width: 88, height: 88, borderRadius: 28, borderWidth: 3, borderColor: '#e6f7f3' },
  avatarPlaceholder: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: '#e6f7f3', justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#e6f7f3',
  },
  avatarInitial: { fontSize: 30, fontWeight: '800', color: '#10ac84' },
  cameraOverlay: {
    position: 'absolute', bottom: -2, right: -2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#10ac84', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#ffffff',
  },
  profileName: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  profileEmail: { fontSize: 14, color: '#64748b', fontWeight: '500', marginTop: 4 },
  changePhotoBtn: { marginTop: 12, paddingVertical: 6, paddingHorizontal: 16 },
  changePhotoText: { color: '#10ac84', fontWeight: '700', fontSize: 13 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 10, marginLeft: 4,
  },
  settingsGroup: {
    backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02,
    shadowRadius: 8, elevation: 1, marginBottom: 24, overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  settingsRowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  settingsRowText: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  rowDivider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 16 },

  logoutBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fef2f2', paddingVertical: 16, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#fecaca',
  },
  logoutBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
});

export default SettingsScreen;
