import React from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  Image, ScrollView
} from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import MainTabNavigator from './MainTabNavigator';

const Drawer = createDrawerNavigator();

// ── Custom Drawer Content ──
const CustomDrawerContent = (props) => {
  const { user, logoutUser } = useAuth();
  const { locale, changeLanguage } = useLanguage();
  const { navigation } = props;

  const menuItems = [
    {
      icon: 'home-outline',
      label: locale === 'id' ? 'Beranda' : 'Home',
      color: '#10ac84',
      bg: '#e6f7f3',
      onPress: () => navigation.navigate('MainTabs'),
    },
    {
      icon: 'map-outline',
      label: locale === 'id' ? 'ATM & Bank Terdekat' : 'Nearby ATM & Banks',
      color: '#3b82f6',
      bg: '#dbeafe',
      onPress: () => navigation.navigate('NearbyATM'),
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
    <View style={styles.drawerContainer}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <View style={styles.drawerAvatar}>
          <Text style={styles.drawerAvatarText}>
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'M'}
          </Text>
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
          {locale === 'id' ? 'MENU' : 'MENU'}
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
      <TouchableOpacity style={styles.drawerLogout} onPress={logoutUser} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 10 }} />
        <Text style={styles.drawerLogoutText}>{locale === 'id' ? 'Keluar' : 'Logout'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// ── Main Drawer Navigator ──
const MainDrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: 300, borderTopRightRadius: 28, borderBottomRightRadius: 28 },
        overlayColor: 'rgba(0,0,0,0.4)',
        swipeEdgeWidth: 60,
      }}
    >
      <Drawer.Screen name="MainTabs" component={MainTabNavigator} />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  drawerHeader: {
    backgroundColor: '#10ac84',
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomRightRadius: 28,
  },
  drawerAvatar: {
    width: 70, height: 70, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  drawerAvatarText: {
    fontSize: 26, fontWeight: '800', color: '#ffffff',
  },
  drawerName: {
    fontSize: 18, fontWeight: '800', color: '#ffffff', marginBottom: 4,
  },
  drawerEmail: {
    fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500',
  },
  drawerBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: 20, marginTop: 12,
  },
  drawerBadgeText: {
    fontSize: 11, color: '#e6f7f3', fontWeight: '700',
  },
  drawerMenu: {
    flex: 1, paddingTop: 24, paddingHorizontal: 16,
  },
  drawerMenuSection: {
    fontSize: 10, fontWeight: '800', color: '#94a3b8',
    letterSpacing: 1.5, marginBottom: 12, marginLeft: 8,
  },
  drawerMenuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 14, marginBottom: 4,
  },
  drawerMenuItemActive: {
    backgroundColor: '#f0fdf9',
  },
  drawerMenuIcon: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  drawerMenuLabel: {
    flex: 1, fontSize: 14, fontWeight: '600', color: '#334155',
  },
  drawerLogout: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, padding: 16, borderRadius: 16,
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
  },
  drawerLogoutText: {
    fontSize: 15, fontWeight: '700', color: '#ef4444',
  },
});

export default MainDrawerNavigator;
