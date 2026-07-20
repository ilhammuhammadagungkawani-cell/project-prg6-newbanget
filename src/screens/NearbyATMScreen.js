import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  ActivityIndicator, Alert, StatusBar, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLanguage } from '../context/LanguageContext';

const NearbyATMScreen = ({ navigation }) => {
  const { locale } = useLanguage();
  const [location, setLocation] = useState(null);
  const [atms, setAtms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingATMs, setLoadingATMs] = useState(false);
  const [error, setError] = useState('');
  const [selectedATM, setSelectedATM] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    requestLocationAndFetch();
  }, []);

  const requestLocationAndFetch = async () => {
    setLoading(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(locale === 'id'
          ? 'Izin lokasi ditolak. Aktifkan lokasi di pengaturan perangkat.'
          : 'Location permission denied. Enable location in device settings.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc.coords);
      fetchNearbyATMs(loc.coords.latitude, loc.coords.longitude);
    } catch (err) {
      setError(locale === 'id' ? 'Gagal mendapatkan lokasi.' : 'Failed to get location.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyATMs = async (lat, lon) => {
    setLoadingATMs(true);
    try {
      const radius = 2000; // 2km radius
      const query = `
        [out:json][timeout:15];
        (
          node["amenity"="atm"](around:${radius},${lat},${lon});
          node["amenity"="bank"](around:${radius},${lat},${lon});
        );
        out body;
      `;
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });
      const data = await res.json();
      const results = (data.elements || []).map((el, i) => ({
        id: el.id?.toString() || i.toString(),
        name: el.tags?.name || el.tags?.operator || (el.tags?.amenity === 'bank' ? 'Bank' : 'ATM'),
        type: el.tags?.amenity,
        lat: el.lat,
        lon: el.lon,
        distance: calcDistance(lat, lon, el.lat, el.lon),
      })).sort((a, b) => a.distance - b.distance).slice(0, 20);
      setAtms(results);
    } catch (err) {
      console.log('Error fetching ATMs:', err);
    } finally {
      setLoadingATMs(false);
    }
  };

  const calcDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const formatDistance = (m) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;

  const centerOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude, longitude: location.longitude,
        latitudeDelta: 0.015, longitudeDelta: 0.015,
      }, 800);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#10ac84" />
        <Text style={styles.loadingText}>
          {locale === 'id' ? 'Mendapatkan lokasi Anda...' : 'Getting your location...'}
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <View style={styles.errorIcon}>
          <Ionicons name="location-outline" size={48} color="#94a3b8" />
        </View>
        <Text style={styles.errorTitle}>{locale === 'id' ? 'Lokasi Tidak Tersedia' : 'Location Unavailable'}</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={requestLocationAndFetch}>
          <Text style={styles.retryBtnText}>{locale === 'id' ? 'Coba Lagi' : 'Try Again'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {locale === 'id' ? 'ATM & Bank Terdekat' : 'Nearby ATM & Banks'}
        </Text>
        <TouchableOpacity onPress={requestLocationAndFetch} style={styles.refreshMapBtn}>
          <Ionicons name="refresh-outline" size={20} color="#10ac84" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      {location && (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {/* Radius circle */}
          <Circle
            center={{ latitude: location.latitude, longitude: location.longitude }}
            radius={2000}
            fillColor="rgba(16,172,132,0.06)"
            strokeColor="rgba(16,172,132,0.3)"
            strokeWidth={1}
          />

          {/* ATM / Bank markers */}
          {atms.map((atm) => (
            <Marker
              key={atm.id}
              coordinate={{ latitude: atm.lat, longitude: atm.lon }}
              onPress={() => setSelectedATM(atm)}
            >
              <View style={[styles.markerBubble, { backgroundColor: atm.type === 'bank' ? '#3b82f6' : '#10ac84' }]}>
                <Ionicons name={atm.type === 'bank' ? 'business' : 'card'} size={14} color="#fff" />
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {/* Center button */}
      <TouchableOpacity style={styles.centerBtn} onPress={centerOnUser}>
        <Ionicons name="locate" size={22} color="#10ac84" />
      </TouchableOpacity>

      {/* Loading ATMs overlay */}
      {loadingATMs && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#10ac84" />
          <Text style={styles.loadingOverlayText}>
            {locale === 'id' ? 'Mencari ATM terdekat...' : 'Finding nearby ATMs...'}
          </Text>
        </View>
      )}

      {/* Selected ATM info card */}
      {selectedATM && (
        <View style={styles.infoCard}>
          <View style={styles.infoCardIcon}>
            <Ionicons
              name={selectedATM.type === 'bank' ? 'business' : 'card-outline'}
              size={24}
              color={selectedATM.type === 'bank' ? '#3b82f6' : '#10ac84'}
            />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardName} numberOfLines={1}>{selectedATM.name}</Text>
            <Text style={styles.infoCardType}>
              {selectedATM.type === 'bank' ? '🏦 Bank' : '🏧 ATM'} · {formatDistance(selectedATM.distance)}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedATM(null)}>
            <Ionicons name="close-circle" size={22} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      )}

      {/* ATM count badge */}
      {!loadingATMs && atms.length > 0 && (
        <View style={styles.countBadge}>
          <Ionicons name="location" size={13} color="#10ac84" style={{ marginRight: 4 }} />
          <Text style={styles.countBadgeText}>
            {atms.length} {locale === 'id' ? 'lokasi ditemukan dalam radius 2 km' : 'locations found within 2 km'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 32 },
  loadingText: { marginTop: 16, fontSize: 15, color: '#64748b', fontWeight: '500' },
  errorIcon: { width: 88, height: 88, borderRadius: 28, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  errorTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  errorText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 24, backgroundColor: '#10ac84', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  header: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#0f172a' },
  refreshMapBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#e6f7f3', justifyContent: 'center', alignItems: 'center' },

  map: { flex: 1 },

  markerBubble: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#ffffff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4,
  },

  centerBtn: {
    position: 'absolute', bottom: 140, right: 16,
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },

  loadingOverlay: {
    position: 'absolute', top: 70, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ffffff', paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  loadingOverlayText: { marginLeft: 8, fontSize: 13, color: '#334155', fontWeight: '600' },

  infoCard: {
    position: 'absolute', bottom: 80, left: 16, right: 16,
    backgroundColor: '#ffffff', borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  infoCardIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoCardContent: { flex: 1 },
  infoCardName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  infoCardType: { fontSize: 13, color: '#64748b', marginTop: 2 },

  countBadge: {
    position: 'absolute', bottom: 26, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#e6f7f3', paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1, borderColor: '#10ac84',
  },
  countBadgeText: { fontSize: 12, color: '#10ac84', fontWeight: '700' },
});

export default NearbyATMScreen;
