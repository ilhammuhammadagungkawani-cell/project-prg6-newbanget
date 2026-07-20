import React, { useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  Dimensions, Animated, TouchableWithoutFeedback, ScrollView, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useDrawer } from '../context/DrawerContext';
import MainTabNavigator from './MainTabNavigator';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.78; // Lebar drawer 78% dari lebar layar

const CustomDrawerNavigator = ({ navigation }) => {
  const { user, logoutUser } = useAuth();
  const { locale, changeLanguage } = useLanguage();
  const { isDrawerOpen, closeDrawer } = useDrawer();

  // Nilai animasi untuk slide-in X translation
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  // Nilai animasi untuk kepekatan overlay background
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isDrawerOpen) {
      // Buka drawer
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Tutup drawer
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDrawerOpen]);

  const menuItems = [
    {
      icon: 'home-outline',
      label: locale === 'id' ? 'Beranda' : 'Home',
      color: '#10ac84',
      bg: '#e6f7f3',
      onPress: () => {
        closeDrawer();
      },
    },
    {
      icon: 'map-outline',
      label: locale === 'id' ? 'ATM & Bank Terdekat' : 'Nearby ATM & Banks',
      color: '#3b82f6',
      bg: '#dbeafe',
      onPress: () => {
        closeDrawer();
        navigation.navigate('NearbyATM');
      },
    },
    {
      icon: 'language-outline',
      label: locale === 'id' ? 'Bahasa Indonesia 🇮🇩' : 'Indonesian 🇮🇩',
      color: '#f59e0b',
      bg: '#fef3c7',
      onPress: () => changeLanguage('id'),
      active: locale === 'id',
    },
    {
      icon: 'language-outline',
      label: locale === 'id' ? 'Bahasa Inggris 🇬🇧' : 'English 🇬🇧',
      color: '#6366f1',
      bg: '#ede9fe',
      onPress: () => changeLanguage('en'),
      active: locale === 'en',
    },
  ];

  return (
    <View style={styles.container}>
      {/* 1. Main Screens (Tab Navigator) */}
      <View style={styles.mainScreen}>
        <MainTabNavigator />
      </View>

      {/* 2. Semi-transparent black overlay */}
      {isDrawerOpen && (
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[styles.overlay, { opacity: opacityAnim }]} />
        </TouchableWithoutFeedback>
      )}

      {/* 3. Animated Slide-in Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.drawerContainer}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.drawerAvatar}>
              {user?.profilePhoto ? (
                <Image source={{ uri: user.profilePhoto }} style={styles.drawerAvatarImage} />
              ) : (
                <Text style={styles.drawerAvatarText}>
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : 'M'}
                </Text>
              )}
            </View>

            <Text style={styles.drawerName}>{user?.name || 'Mahasiswa'}</Text>
            <Text style={styles.drawerEmail}>{user?.email || ''}</Text>
            <View style={styles.drawerBadge}>
              <Ionicons name="school-outline" size={12} color="#10ac84" style={{ marginRight: 4 }} />
              <Text style={styles.drawerBadgeText}>Find Mahasiswa</Text>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.drawerMenu} showsVerticalScrollIndicator={false}>
            <Text style={styles.drawerMenuSection}>
              {locale === 'id' ? 'MENU UTAMA' : 'MAIN MENU'}
            </Text>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.drawerMenuItem, item.active && styles.drawerMenuItemActive]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.drawerMenuIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={[styles.drawerMenuLabel, item.active && { color: '#10ac84', fontWeight: '800' }]}>
                  {item.label}
                </Text>
                {item.active && <Ionicons name="checkmark-circle" size={18} color="#10ac84" />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Logout */}
          <TouchableOpacity
            style={styles.drawerLogout}
            onPress={() => {
              closeDrawer();
              logoutUser();
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 10 }} />
            <Text style={styles.drawerLogoutText}>{locale === 'id' ? 'Keluar' : 'Logout'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  mainScreen: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 99,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#ffffff',
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerContainer: {
    flex: 1,
  },
  drawerHeader: {
    backgroundColor: '#10ac84',
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomRightRadius: 28,
  },
  drawerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  drawerAvatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  drawerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  drawerEmail: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  drawerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  drawerBadgeText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '700',
  },
  drawerMenu: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  drawerMenuSection: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 8,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
  },
  drawerMenuItemActive: {
    backgroundColor: '#f0fdf9',
  },
  drawerMenuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  drawerMenuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  drawerLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  drawerLogoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ef4444',
  },
});

export default CustomDrawerNavigator;
