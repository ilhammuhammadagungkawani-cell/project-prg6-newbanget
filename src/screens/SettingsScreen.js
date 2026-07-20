import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  ScrollView, StatusBar, Image, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { API_URL } from '../config';

const SettingsScreen = ({ navigation }) => {
  const { t, locale, changeLanguage } = useLanguage();
  const { user, logoutUser, updateUserProfilePhoto } = useAuth();
  const { resetFinanceData } = useFinance();

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (user?.profilePhoto) {
      setProfilePhoto(user.profilePhoto);
    } else if (user?.email) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/${user.email}/profile`);
      if (res.ok) {
        const data = await res.json();
        if (data.profilePhoto) {
          setProfilePhoto(data.profilePhoto);
          updateUserProfilePhoto(data.profilePhoto);
        }
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

        {/* ── Navigation Section ── */}
        <Text style={styles.sectionLabel}>{locale === 'id' ? 'Fitur' : 'Features'}</Text>
        <View style={styles.settingsGroup}>
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
