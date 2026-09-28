import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmountSheet } from '@/components/AmountSheet';
import { OptionSheet } from '@/components/OptionSheet';
import { Divider } from '@/components/ui/Divider';
import { ScreenHeader, SectionTitle } from '@/components/ui/Headers';
import { ListRow } from '@/components/ui/ListRow';
import { Segmented } from '@/components/ui/Segmented';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { Txt } from '@/components/ui/Txt';
import { BackupError, backupFilename, buildBackupJson, buildCsv, parseBackup } from '@/data/backup';
import { buildSampleData } from '@/data/sample';
import { useCategories, useCategoryMap, useMethodMap, useMethods } from '@/data/selectors';
import { getSnapshot, replaceAll, resetAll, updateSettings, useStore } from '@/data/store';
import type { Settings, ThemeMode } from '@/data/types';
import { confirmAction } from '@/lib/confirm';
import { exportTextFile, pickTextFile } from '@/lib/files';
import { rupiah } from '@/lib/format';
import { cancelDailyReminder, reminderSupported, scheduleDailyReminder } from '@/lib/reminder';
import { useAppTheme } from '@/theme/ThemeProvider';
import { font, gutter, hairline } from '@/theme/tokens';

const REMINDER_TIMES = [19, 20, 21, 22];
const pad = (n: number) => String(n).padStart(2, '0');

export default function Profil() {
  const { c, isDark } = useAppTheme();
  const router = useRouter();
  const toast = useToast();
  const settings = useStore((s) => s.settings);
  const txs = useStore((s) => s.transactions);
  const categories = useCategories();
  const methods = useMethods();
  const catMap = useCategoryMap();
  const methodMap = useMethodMap();

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(settings.name);
  const [amountSheet, setAmountSheet] = useState<'initial' | 'monthly' | null>(null);
  const [timeSheet, setTimeSheet] = useState(false);
  const [about, setAbout] = useState(false);

  const saveName = () => {
    updateSettings({ name: draftName.trim() });
    setEditingName(false);
  };

  const toggleReminder = async (on: boolean) => {
    if (!on) {
      await cancelDailyReminder();
      updateSettings({ reminderEnabled: false });
      toast({ message: 'Pengingat harian dimatikan.' });
      return;
    }
    const result = await scheduleDailyReminder(settings.reminderHour, settings.reminderMinute);
    if (result === 'ok') {
      updateSettings({ reminderEnabled: true });
      toast({ message: `Pengingat aktif setiap pukul ${pad(settings.reminderHour)}.${pad(settings.reminderMinute)}.` });
    } else if (result === 'denied') {
      toast({ message: 'Izin notifikasi belum diberikan. Aktifkan lewat pengaturan HP.' });
    } else {
      toast({ message: 'Pengingat belum bisa dipasang di perangkat ini.' });
    }
  };

  const setReminderTime = async (hour: number) => {
    setTimeSheet(false);
    updateSettings({ reminderHour: hour, reminderMinute: 0 });
    if (settings.reminderEnabled) {
      const result = await scheduleDailyReminder(hour, 0);
      toast({ message: result === 'ok' ? `Pengingat dipindah ke pukul ${pad(hour)}.00.` : 'Gagal memperbarui pengingat.' });
    }
  };

  const exportCsv = async () => {
    if (txs.length === 0) {
      toast({ message: 'Belum ada transaksi untuk diekspor.' });
      return;
    }
    try {
      const res = await exportTextFile(
        backupFilename('csv'),
        buildCsv(txs, catMap, methodMap),
        'text/csv',
        'public.comma-separated-values-text',
      );
      if (res === 'downloaded') toast({ message: 'File CSV diunduh.' });
      if (res === 'unavailable') toast({ message: 'Fitur berbagi tidak tersedia di perangkat ini.' });
    } catch {
      toast({ message: 'Ekspor gagal. Coba lagi sebentar.' });
    }
  };

  const backup = async () => {
    try {
      const res = await exportTextFile(backupFilename('json'), buildBackupJson(getSnapshot()), 'application/json', 'public.json');
      if (res === 'downloaded') toast({ message: 'File backup diunduh. Simpan di tempat yang aman.' });
      if (res === 'unavailable') toast({ message: 'Fitur berbagi tidak tersedia di perangkat ini.' });
    } catch {
      toast({ message: 'Backup gagal dibuat. Coba lagi sebentar.' });
    }
  };

  const restore = async () => {
    try {
      const text = await pickTextFile();
      if (text === null) return;
      const snap = parseBackup(text);
      const ok = await confirmAction({
        title: 'Pulihkan backup?',
        message: `Data saat ini (${txs.length} transaksi) akan diganti dengan isi backup (${snap.transactions.length} transaksi).`,
        confirmLabel: 'Pulihkan',
        destructive: true,
      });
      if (!ok) return;
      replaceAll({ ...snap, settings: { ...snap.settings, themeMode: settings.themeMode } });
      toast({ message: `Backup dipulihkan: ${snap.transactions.length} transaksi.` });
    } catch (e) {
      toast({ message: e instanceof BackupError ? e.message : 'File tidak bisa dibaca.' });
    }
  };

  const loadSample = async () => {
    const hasData = txs.length > 0;
    if (hasData) {
      const ok = await confirmAction({
        title: 'Isi dengan data contoh?',
        message: 'Semua data saat ini akan diganti dengan data contoh 3 bulan. Buat backup dulu bila perlu.',
        confirmLabel: 'Ganti data',
        destructive: true,
      });
      if (!ok) return;
    }
    replaceAll(buildSampleData(new Date(), { name: settings.name, themeMode: settings.themeMode }));
    toast({ message: 'Data contoh dimuat.' });
  };

  const wipe = async () => {
    const ok = await confirmAction({
      title: 'Hapus semua data?',
      message: 'Transaksi, budget, impian, dan kategori buatanmu akan dihapus permanen dari perangkat ini.',
      confirmLabel: 'Hapus semua',
      destructive: true,
    });
    if (!ok) return;
    await cancelDailyReminder();
    resetAll();
    toast({ message: 'Semua data sudah dihapus.' });
  };

  const initial = settings.name.trim().charAt(0).toUpperCase();
  const switchProps = {
    trackColor: { false: c.lineStrong, true: c.accent },
    thumbColor: '#FFFFFF',
    ios_backgroundColor: c.lineStrong,
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Profil" />

        <View style={styles.profile}>
          <View style={[styles.avatar, { backgroundColor: c.accentSoft }]}>
            {initial ? (
              <Txt variant="heading" color={c.accent}>
                {initial}
              </Txt>
            ) : (
              <Ionicons name="person-outline" size={22} color={c.accent} />
            )}
          </View>
          {editingName ? (
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              autoFocus
              maxLength={24}
              placeholder="Nama panggilan"
              placeholderTextColor={c.ink3}
              returnKeyType="done"
              onSubmitEditing={saveName}
              onBlur={saveName}
              keyboardAppearance={isDark ? 'dark' : 'light'}
              accessibilityLabel="Nama panggilan"
              style={[styles.nameInput, { color: c.ink, borderBottomColor: c.accent }]}
            />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Ubah nama panggilan"
              onPress={() => {
                setDraftName(settings.name);
                setEditingName(true);
              }}
              style={styles.flex}
            >
              <Txt variant="heading">{settings.name || 'Tambahkan nama'}</Txt>
              <Txt variant="label" tone="ink2">
                Dipakai untuk sapaan di Beranda · ketuk untuk mengubah
              </Txt>
            </Pressable>
          )}
        </View>

        <SectionTitle title="Keuangan" />
        <ListRow
          icon="wallet-outline"
          label="Saldo awal"
          value={rupiah(settings.initialBalance)}
          description="Uang yang sudah ada sebelum mulai mencatat."
          onPress={() => setAmountSheet('initial')}
        />
        <Divider inset={gutter + 34} />
        <ListRow
          icon="speedometer-outline"
          label="Target budget bulanan"
          value={settings.monthlyBudget > 0 ? rupiah(settings.monthlyBudget) : 'Belum diatur'}
          onPress={() => setAmountSheet('monthly')}
        />
        <Divider inset={gutter + 34} />
        <ListRow
          icon="pricetags-outline"
          label="Kategori"
          value={`${categories.length} kategori`}
          onPress={() => router.push('/kategori')}
        />
        <Divider inset={gutter + 34} />
        <ListRow
          icon="card-outline"
          label="Metode pembayaran"
          value={`${methods.length} metode`}
          onPress={() => router.push('/metode')}
        />
        <Divider inset={gutter + 34} />
        <ListRow icon="cash-outline" label="Mata uang" value="Rupiah (Rp)" />

        <SectionTitle title="Tampilan & privasi" />
        <View style={styles.themeRow}>
          <Txt weight="medium" style={styles.themeLabel}>
            Tema
          </Txt>
          <View style={styles.flex}>
            <Segmented<ThemeMode>
              accessibilityLabel="Tema"
              value={settings.themeMode}
              onChange={(v) => updateSettings({ themeMode: v })}
              options={[
                { value: 'system', label: 'Sistem' },
                { value: 'light', label: 'Terang' },
                { value: 'dark', label: 'Gelap' },
              ]}
            />
          </View>
        </View>
        <Divider inset={gutter} />
        <ListRow
          icon="eye-off-outline"
          label="Sembunyikan nominal"
          description="Saldo di Beranda tampil sebagai Rp•••••• — berguna di tempat umum."
          accessory={
            <Switch
              {...switchProps}
              value={settings.hideAmounts}
              onValueChange={(v) => updateSettings({ hideAmounts: v })}
              accessibilityLabel="Sembunyikan nominal"
            />
          }
        />
        <Divider inset={gutter + 34} />
        <ListRow icon="lock-closed-outline" label="Penyimpanan" value="Hanya di perangkat ini" />

        {reminderSupported ? (
          <>
            <SectionTitle title="Pengingat" />
            <ListRow
              icon="notifications-outline"
              label="Pengingat harian"
              description="Satu notifikasi tiap malam untuk mencatat pengeluaran hari itu."
              accessory={
                <Switch
                  {...switchProps}
                  value={settings.reminderEnabled}
                  onValueChange={toggleReminder}
                  accessibilityLabel="Pengingat harian"
                />
              }
            />
            <Divider inset={gutter + 34} />
            <ListRow
              icon="time-outline"
              label="Jam pengingat"
              value={`${pad(settings.reminderHour)}.${pad(settings.reminderMinute)}`}
              onPress={() => setTimeSheet(true)}
            />
          </>
        ) : null}

        <SectionTitle title="Data" />
        <ListRow icon="document-text-outline" label="Ekspor transaksi (CSV)" description="Bisa dibuka di Excel atau Google Sheets." onPress={exportCsv} />
        <Divider inset={gutter + 34} />
        <ListRow icon="cloud-upload-outline" label="Buat backup" description="Simpan file .json di Drive, email, atau chat." onPress={backup} />
        <Divider inset={gutter + 34} />
        <ListRow icon="cloud-download-outline" label="Pulihkan dari backup" onPress={restore} />
        <Divider inset={gutter + 34} />
        <ListRow icon="flask-outline" label="Isi dengan data contoh" description="Untuk mencoba fitur tanpa data asli." onPress={loadSample} />
        <Divider inset={gutter + 34} />
        <ListRow icon="trash-outline" label="Hapus semua data" destructive onPress={wipe} />

        <SectionTitle title="Tentang" />
        <ListRow icon="information-circle-outline" label="Tentang aplikasi" onPress={() => setAbout(true)} />
        <Divider inset={gutter + 34} />
        <ListRow icon="code-outline" label="Versi" value={Constants.expoConfig?.version ?? '1.0.0'} />
      </ScrollView>

      <AmountSheet
        visible={amountSheet !== null}
        title={amountSheet === 'initial' ? 'Saldo awal' : 'Target budget bulanan'}
        helper={
          amountSheet === 'initial'
            ? 'Total uang (tunai + rekening + e-wallet) saat mulai memakai aplikasi.'
            : 'Batas total pengeluaran setiap bulan.'
        }
        allowZero
        initial={amountSheet === 'initial' ? settings.initialBalance : settings.monthlyBudget}
        onClose={() => setAmountSheet(null)}
        onSubmit={(v) => {
          const patch: Partial<Settings> = amountSheet === 'initial' ? { initialBalance: v } : { monthlyBudget: v };
          updateSettings(patch);
          setAmountSheet(null);
          toast({ message: amountSheet === 'initial' ? 'Saldo awal disimpan.' : 'Target budget disimpan.' });
        }}
      />

      <OptionSheet
        visible={timeSheet}
        title="Jam pengingat"
        selectedId={String(settings.reminderHour)}
        options={REMINDER_TIMES.map((h) => ({ id: String(h), label: `${pad(h)}.00`, icon: 'time-outline' as const }))}
        onSelect={(id) => setReminderTime(Number(id))}
        onClose={() => setTimeSheet(false)}
      />

      <Sheet visible={about} onClose={() => setAbout(false)} title="Tentang Pencatat Uang">
        <View style={styles.about}>
          <Txt tone="ink2">
            Pencatat keuangan pribadi untuk mencatat pemasukan dan pengeluaran dengan cepat, mengatur budget
            bulanan, dan melihat kebiasaan belanja.
          </Txt>
          <Txt tone="ink2">
            Semua data tersimpan hanya di perangkat ini. Tidak ada akun, iklan, atau pelacakan. Buat backup
            secara berkala supaya datamu aman saat ganti HP.
          </Txt>
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 48 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: gutter, paddingTop: 8, paddingBottom: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  nameInput: {
    flex: 1,
    fontFamily: font.semibold,
    fontSize: 17,
    paddingVertical: 8,
    borderBottomWidth: hairline * 3,
  },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: gutter, paddingVertical: 10 },
  themeLabel: { width: 52 },
  about: { paddingHorizontal: gutter, paddingBottom: 12, gap: 12 },
});
