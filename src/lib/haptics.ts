import * as Haptics from 'expo-haptics';

// Getaran singkat sebagai umpan balik. Selalu aman dipanggil — kegagalan diabaikan.
const ignore = () => {};

export const haptic = {
  /** Tombol keypad / pilihan kecil */
  tap: () => {
    Haptics.selectionAsync().catch(ignore);
  },
  /** Transaksi tersimpan */
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignore);
  },
  /** Input belum lengkap */
  warn: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(ignore);
  },
};
