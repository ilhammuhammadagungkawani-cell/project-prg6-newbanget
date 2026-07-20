import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from '../context/LanguageContext';
import { useFinance } from '../context/FinanceContext';

const EMOJI_OPTIONS = ['🎯', '✈️', '🏖️', '🎓', '🏠', '🚗', '💻', '👗', '🎮', '💍', '🏋️', '📱'];

const BudgetScreen = () => {
  const { locale } = useLanguage();
  const { goals, isGoalsLoading, addGoal, updateGoalSaving, deleteGoal, fetchGoals } = useFinance();

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saveAmount, setSaveAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGoals();
    setRefreshing(false);
  }, [fetchGoals]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(value || 0);

  const formatDate = (d) => {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  // Calculate smart stats for each goal
  const calcStats = (goal) => {
    const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
    const progress = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
    const deadlineDate = new Date(goal.deadline);
    const today = new Date();
    const daysLeft = Math.max(Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24)), 0);
    const weeksLeft = Math.max(Math.ceil(daysLeft / 7), 1);
    const monthsLeft = Math.max(Math.ceil(daysLeft / 30), 1);
    const perDay = daysLeft > 0 ? remaining / daysLeft : remaining;
    const perWeek = remaining / weeksLeft;
    const perMonth = remaining / monthsLeft;
    const isAchieved = goal.savedAmount >= goal.targetAmount;
    const isOverdue = daysLeft === 0 && !isAchieved;
    return { remaining, progress, daysLeft, perDay, perWeek, perMonth, isAchieved, isOverdue };
  };

  const resetForm = () => {
    setTitle('');
    setEmoji('🎯');
    setTargetAmount('');
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    setDeadline(d);
  };

  const handleAddGoal = async () => {
    if (!title.trim()) {
      Alert.alert('Error', locale === 'id' ? 'Nama tujuan tidak boleh kosong.' : 'Goal name is required.');
      return;
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      Alert.alert('Error', locale === 'id' ? 'Masukkan target nominal yang valid.' : 'Enter a valid target amount.');
      return;
    }
    setIsSubmitting(true);
    try {
      await addGoal({
        title: title.trim(),
        emoji,
        targetAmount: parseFloat(targetAmount),
        deadline: deadline.toISOString().split('T')[0],
      });
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      Alert.alert('Error', err.message || 'Gagal menyimpan rencana.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveToGoal = async () => {
    if (!saveAmount || parseFloat(saveAmount) <= 0) {
      Alert.alert('Error', locale === 'id' ? 'Masukkan nominal yang valid.' : 'Enter a valid amount.');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateGoalSaving(selectedGoal.id, parseFloat(saveAmount));
      setShowSaveModal(false);
      setSaveAmount('');
    } catch (err) {
      Alert.alert('Error', err.message || 'Gagal memperbarui tabungan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = (goal) => {
    Alert.alert(
      locale === 'id' ? 'Hapus Rencana?' : 'Delete Goal?',
      locale === 'id' ? `Apakah kamu yakin ingin menghapus "${goal.title}"?` : `Delete "${goal.title}"?`,
      [
        { text: locale === 'id' ? 'Batal' : 'Cancel', style: 'cancel' },
        {
          text: locale === 'id' ? 'Hapus' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try { await deleteGoal(goal.id); }
            catch (err) { Alert.alert('Error', err.message); }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {locale === 'id' ? 'Rencana Tabungan' : 'Savings Goals'}
        </Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Goal List */}
      {isGoalsLoading && goals.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#10ac84" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10ac84']} />
          }
        >
          {goals.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎯</Text>
              <Text style={styles.emptyTitle}>
                {locale === 'id' ? 'Belum Ada Rencana' : 'No Goals Yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {locale === 'id'
                  ? 'Buat rencana tabungan pertama kamu dan\nbiarkan aplikasi menghitung estimasinya!'
                  : 'Create your first savings goal and\nlet the app calculate your estimates!'}
              </Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowAddModal(true)}>
                <Ionicons name="add-circle-outline" size={18} color="#10ac84" style={{ marginRight: 6 }} />
                <Text style={styles.emptyAddBtnText}>
                  {locale === 'id' ? 'Buat Rencana Baru' : 'Create New Goal'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {goals.map((goal) => {
            const { remaining, progress, daysLeft, perDay, perWeek, perMonth, isAchieved, isOverdue } = calcStats(goal);
            return (
              <View key={goal.id} style={[styles.goalCard, isAchieved && styles.goalCardAchieved]}>
                {/* Card Header */}
                <View style={styles.goalCardHeader}>
                  <View style={styles.goalTitleRow}>
                    <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                    <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteGoal(goal)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="trash-outline" size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarBg}>
                  <View style={[
                    styles.progressBarFill,
                    { width: `${progress}%`, backgroundColor: isAchieved ? '#10ac84' : isOverdue ? '#ff5252' : '#10ac84' }
                  ]} />
                </View>
                <Text style={styles.progressPct}>{Math.round(progress)}%</Text>

                {/* Amount Info */}
                <View style={styles.amountRow}>
                  <View>
                    <Text style={styles.amountLabel}>{locale === 'id' ? 'Terkumpul' : 'Saved'}</Text>
                    <Text style={[styles.amountValue, { color: '#10ac84' }]}>{formatCurrency(goal.savedAmount)}</Text>
                  </View>
                  <View style={styles.amountDivider} />
                  <View>
                    <Text style={styles.amountLabel}>{locale === 'id' ? 'Target' : 'Goal'}</Text>
                    <Text style={styles.amountValue}>{formatCurrency(goal.targetAmount)}</Text>
                  </View>
                  <View style={styles.amountDivider} />
                  <View>
                    <Text style={styles.amountLabel}>{locale === 'id' ? 'Sisa' : 'Left'}</Text>
                    <Text style={[styles.amountValue, { color: '#ff5252' }]}>{formatCurrency(remaining)}</Text>
                  </View>
                </View>

                {/* Deadline */}
                <View style={styles.deadlineRow}>
                  <Ionicons name="calendar-outline" size={13} color="#64748b" />
                  <Text style={styles.deadlineText}>
                    {locale === 'id' ? 'Deadline: ' : 'Deadline: '}
                    {formatDate(goal.deadline)}
                    {isAchieved
                      ? ' 🎉'
                      : isOverdue
                      ? (locale === 'id' ? ' — Waktu habis!' : ' — Overdue!')
                      : ` (${daysLeft} ${locale === 'id' ? 'hari lagi' : 'days left'})`}
                  </Text>
                </View>

                {/* Smart Estimate */}
                {!isAchieved && !isOverdue && (
                  <View style={styles.estimateBox}>
                    <Text style={styles.estimateTitle}>
                      {locale === 'id' ? '💡 Estimasi Nabung:' : '💡 Saving Estimate:'}
                    </Text>
                    <View style={styles.estimateRow}>
                      <View style={styles.estimateChip}>
                        <Text style={styles.estimateChipLabel}>{locale === 'id' ? '/hari' : '/day'}</Text>
                        <Text style={styles.estimateChipValue}>{formatCurrency(perDay)}</Text>
                      </View>
                      <View style={styles.estimateChip}>
                        <Text style={styles.estimateChipLabel}>{locale === 'id' ? '/minggu' : '/week'}</Text>
                        <Text style={styles.estimateChipValue}>{formatCurrency(perWeek)}</Text>
                      </View>
                      <View style={styles.estimateChip}>
                        <Text style={styles.estimateChipLabel}>{locale === 'id' ? '/bulan' : '/month'}</Text>
                        <Text style={styles.estimateChipValue}>{formatCurrency(perMonth)}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Action Button */}
                {!isAchieved && (
                  <TouchableOpacity
                    style={styles.saveToGoalBtn}
                    onPress={() => { setSelectedGoal(goal); setShowSaveModal(true); }}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#10ac84" style={{ marginRight: 6 }} />
                    <Text style={styles.saveToGoalBtnText}>
                      {locale === 'id' ? 'Tambah Tabungan' : 'Add Savings'}
                    </Text>
                  </TouchableOpacity>
                )}

                {isAchieved && (
                  <View style={styles.achievedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10ac84" style={{ marginRight: 6 }} />
                    <Text style={styles.achievedText}>
                      {locale === 'id' ? 'Target Tercapai! 🎉' : 'Goal Achieved! 🎉'}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── ADD GOAL MODAL ── */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {locale === 'id' ? '🎯 Buat Rencana Tabungan' : '🎯 Create Savings Goal'}
            </Text>

            {/* Emoji Picker */}
            <Text style={styles.inputLabel}>{locale === 'id' ? 'Pilih Ikon' : 'Choose Icon'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
              {EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiOption, emoji === e && styles.emojiOptionSelected]}
                  onPress={() => setEmoji(e)}
                >
                  <Text style={styles.emojiOptionText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Title */}
            <Text style={styles.inputLabel}>{locale === 'id' ? 'Nama Tujuan' : 'Goal Name'}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={locale === 'id' ? 'cth: Liburan ke Bali' : 'e.g. Bali vacation'}
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />

            {/* Target Amount */}
            <Text style={styles.inputLabel}>{locale === 'id' ? 'Target Nominal (Rp)' : 'Target Amount (Rp)'}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="3000000"
              keyboardType="numeric"
              value={targetAmount}
              onChangeText={setTargetAmount}
            />

            {/* Deadline */}
            <Text style={styles.inputLabel}>{locale === 'id' ? 'Deadline' : 'Deadline'}</Text>
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={18} color="#10ac84" style={{ marginRight: 8 }} />
              <Text style={styles.datePickerBtnText}>{formatDate(deadline)}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={deadline}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setDeadline(selectedDate);
                }}
              />
            )}

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowAddModal(false); resetForm(); }}
              >
                <Text style={styles.cancelBtnText}>{locale === 'id' ? 'Batal' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddGoal} disabled={isSubmitting}>
                {isSubmitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.confirmBtnText}>{locale === 'id' ? 'Simpan' : 'Save'}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── ADD SAVINGS MODAL ── */}
      <Modal visible={showSaveModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: 32 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {selectedGoal?.emoji} {locale === 'id' ? 'Tambah Tabungan' : 'Add Savings'}
            </Text>
            <Text style={styles.modalSubtitle}>{selectedGoal?.title}</Text>

            <Text style={styles.inputLabel}>{locale === 'id' ? 'Nominal (Rp)' : 'Amount (Rp)'}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="100000"
              keyboardType="numeric"
              value={saveAmount}
              onChangeText={setSaveAmount}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowSaveModal(false); setSaveAmount(''); }}
              >
                <Text style={styles.cancelBtnText}>{locale === 'id' ? 'Batal' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveToGoal} disabled={isSubmitting}>
                {isSubmitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.confirmBtnText}>{locale === 'id' ? 'Tambahkan' : 'Add'}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  addBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#10ac84',
    justifyContent: 'center', alignItems: 'center',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginTop: 8, marginBottom: 24 },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#e6f7f3', paddingVertical: 12, paddingHorizontal: 20,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#10ac84',
  },
  emptyAddBtnText: { color: '#10ac84', fontWeight: '700', fontSize: 14 },

  // Goal card
  goalCard: {
    backgroundColor: '#ffffff', borderRadius: 20, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  goalCardAchieved: { borderColor: '#10ac84', borderWidth: 1.5 },
  goalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  goalTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  goalEmoji: { fontSize: 24, marginRight: 10 },
  goalTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1 },

  // Progress bar
  progressBarBg: { height: 10, backgroundColor: '#f1f5f9', borderRadius: 10, overflow: 'hidden', marginBottom: 4 },
  progressBarFill: { height: '100%', borderRadius: 10 },
  progressPct: { fontSize: 12, fontWeight: '700', color: '#64748b', textAlign: 'right', marginBottom: 14 },

  // Amount row
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  amountDivider: { width: 1, height: 32, backgroundColor: '#f1f5f9' },
  amountLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textAlign: 'center', marginBottom: 2 },
  amountValue: { fontSize: 13, fontWeight: '800', color: '#1e293b', textAlign: 'center' },

  // Deadline
  deadlineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  deadlineText: { fontSize: 12, color: '#64748b', fontWeight: '500', marginLeft: 5 },

  // Estimate
  estimateBox: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 14 },
  estimateTitle: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 8 },
  estimateRow: { flexDirection: 'row', gap: 8 },
  estimateChip: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 10, padding: 8,
    alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0',
  },
  estimateChipLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600', marginBottom: 3 },
  estimateChipValue: { fontSize: 11, fontWeight: '800', color: '#0f172a' },

  // Buttons
  saveToGoalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#e6f7f3', paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#10ac84',
  },
  saveToGoalBtnText: { color: '#10ac84', fontWeight: '700', fontSize: 14 },
  achievedBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#e6f7f3', paddingVertical: 10, borderRadius: 12,
  },
  achievedText: { color: '#10ac84', fontWeight: '700', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: '#ffffff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 16 },

  inputLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 14 },
  textInput: {
    backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#0f172a',
  },
  datePickerBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  datePickerBtnText: { fontSize: 15, color: '#0f172a', fontWeight: '500' },

  emojiScroll: { marginBottom: 4 },
  emojiOption: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8fafc',
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  emojiOptionSelected: { borderColor: '#10ac84', backgroundColor: '#e6f7f3' },
  emojiOptionText: { fontSize: 22 },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#f1f5f9', alignItems: 'center',
  },
  cancelBtnText: { color: '#64748b', fontWeight: '700', fontSize: 15 },
  confirmBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#10ac84', alignItems: 'center',
    shadowColor: '#10ac84', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  confirmBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});

export default BudgetScreen;
