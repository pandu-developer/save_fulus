import { Platform } from 'react-native';

// Notifikasi lokal tidak tersedia di web.
export const reminderSupported = Platform.OS !== 'web';

const CHANNEL_ID = 'pengingat-harian';

// Dimuat hanya saat dibutuhkan, supaya aplikasi tidak menyentuh modul notifikasi
// bagi pengguna yang tidak memakai pengingat.
const load = () => import('expo-notifications');

export type ReminderResult = 'ok' | 'denied' | 'unsupported' | 'error';

export async function configureReminderHandler() {
  if (!reminderSupported) return;
  const Notifications = await load();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<ReminderResult> {
  if (!reminderSupported) return 'unsupported';
  try {
    const Notifications = await load();
    let perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return 'denied';
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Pengingat harian',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Catat pengeluaran hari ini',
        body: 'Ada yang belum tercatat? Cuma butuh beberapa detik.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
    return 'ok';
  } catch (e) {
    console.warn('Gagal menjadwalkan pengingat:', e);
    return 'error';
  }
}

export async function cancelDailyReminder() {
  if (!reminderSupported) return;
  try {
    const Notifications = await load();
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('Gagal membatalkan pengingat:', e);
  }
}
