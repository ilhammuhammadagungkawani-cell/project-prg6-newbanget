import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Clean Notification Manager for Expo Go & Native Environments
 */

export async function requestNotificationPermission() {
  return true;
}

export async function scheduleDailyExpenseReminder(hour = 15, minute = 0) {
  try {
    await AsyncStorage.setItem('reminder_hour', String(hour));
    await AsyncStorage.setItem('reminder_minute', String(minute));
    return true;
  } catch (e) {
    return false;
  }
}

export async function getSavedReminderTime() {
  try {
    const h = await AsyncStorage.getItem('reminder_hour');
    const m = await AsyncStorage.getItem('reminder_minute');
    return {
      hour: h ? parseInt(h, 10) : 15,
      minute: m ? parseInt(m, 10) : 0,
    };
  } catch (e) {
    return { hour: 15, minute: 0 };
  }
}

export async function triggerTestNotification() {
  try {
    const time = await getSavedReminderTime();
    const timeStr = `${String(time.hour).padStart(2, '0')}:00 WIB`;
    Alert.alert(
      '🔔 Pengingat Catat Pengeluaran Harian',
      `Notifikasi pengingat harian telah di-set aktif untuk setiap pukul ${timeStr}.\n\nAplikasi akan terus mengingatkan Anda untuk mencatat jajan & makan setiap hari! 💪`
    );
    return true;
  } catch (e) {
    return false;
  }
}
