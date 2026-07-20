import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';

const EXPENSE_CATEGORIES = [
  { id: 'food', icon: 'restaurant', label: 'Makanan', color: '#ffb142' },
  { id: 'shopping', icon: 'bag-handle', label: 'Belanja', color: '#ff5252' },
  { id: 'transport', icon: 'train', label: 'Transportasi', color: '#ffda79' },
  { id: 'home', icon: 'home', label: 'Rumah', color: '#8c7ae6' },
  { id: 'bills', icon: 'receipt', label: 'Tagihan', color: '#00cec9' },
  { id: 'entertainment', icon: 'film', label: 'Hiburan', color: '#ffb8b8' },
  { id: 'car', icon: 'car', label: 'Mobil', color: '#34ace0' },
  { id: 'travel', icon: 'airplane', label: 'Perjalanan', color: '#ff7979' },
  { id: 'family', icon: 'people', label: 'Keluarga', color: '#706fd3' },
  { id: 'health', icon: 'medkit', label: 'Kesehatan', color: '#ff5252' },
  { id: 'education', icon: 'school', label: 'Pendidikan', color: '#33d9b2' },
  { id: 'groceries', icon: 'cart', label: 'Bahan Makanan', color: '#ffda79' },
];

const INCOME_CATEGORIES = [
  { id: 'salary', icon: 'cash', label: 'Gaji', color: '#10ac84' },
  { id: 'business', icon: 'briefcase', label: 'Bisnis', color: '#f39c12' },
  { id: 'gift', icon: 'gift', label: 'Hadiah', color: '#1abc9c' },
  { id: 'investment', icon: 'trending-up', label: 'Investasi', color: '#3498db' },
  { id: 'other_income', icon: 'wallet', label: 'Lainnya', color: '#95a5a6' },
];

const AddTransactionScreen = ({ navigation }) => {
  const { addTransaction } = useFinance();
  const { locale } = useLanguage();

  const [activeTab, setActiveTab] = useState('expense'); // expense, income, transfer
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDateLabel = (d) => {
    const today = new Date();
    if (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    ) {
      return locale === 'id' ? 'Hari ini' : 'Today';
    }
    return d.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const categories = activeTab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSave = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Silakan masukkan nominal yang valid.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Error', 'Silakan pilih kategori transaksi.');
      return;
    }

    setIsSubmitting(true);
    try {
      // addTransaction function will be implemented in FinanceContext
      await addTransaction({
        type: activeTab, // 'expense' or 'income'
        amount: parseFloat(amount),
        category: selectedCategory.id,
        notes: note,
        wallet: 'Tabungan Kost', // default wallet linked to database balance
        date: date.toISOString()
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Gagal menyimpan transaksi.');
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambahkan Transaksi</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.amountContainer}>
        <TextInput
          style={styles.amountInput}
          placeholder="0"
          placeholderTextColor="rgba(255,255,255,0.7)"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <Text style={styles.currencyText}>Rp</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          
          {/* Quick Input Fields */}
          <View style={styles.quickInputs}>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7} style={styles.inputRow}>
              <Ionicons name="calendar" size={24} color="#10ac84" style={styles.inputIcon} />
              <Text style={styles.inputLabel}>Tanggal</Text>
              <Text style={styles.inputValue}>{formatDateLabel(date)} &gt;</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setDate(selectedDate);
                  }
                }}
              />
            )}
            <View style={styles.divider} />
            <View style={styles.inputRow}>
              <Ionicons name="pencil" size={24} color="#10ac84" style={styles.inputIcon} />
              <TextInput
                style={styles.noteInput}
                placeholder="Tulis catatan"
                value={note}
                onChangeText={setNote}
              />
            </View>
          </View>

          {/* Magic Scan Button */}
          <View style={styles.magicScanContainer}>
            <TouchableOpacity style={styles.magicScanBtn}>
              <Ionicons name="camera-outline" size={20} color="#10ac84" />
              <Text style={styles.magicScanText}>Magic AI Scan</Text>
            </TouchableOpacity>
          </View>

          {/* Categories Section */}
          <View style={styles.categorySection}>
            <View style={styles.categoryHeaderRow}>
              <Text style={styles.categorySectionTitle}>Kategori Transaksi</Text>
              <View style={styles.categoryActions}>
                <Ionicons name="settings-outline" size={20} color="#636e72" style={{ marginRight: 15 }} />
                <Ionicons name="checkmark-circle" size={20} color="#b2bec3" />
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'expense' && styles.activeTab]}
                onPress={() => { setActiveTab('expense'); setSelectedCategory(null); }}
              >
                <Text style={[styles.tabText, activeTab === 'expense' && styles.activeTabText]}>
                  Pengeluaran
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'income' && styles.activeTab]}
                onPress={() => { setActiveTab('income'); setSelectedCategory(null); }}
              >
                <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>
                  Pendapatan
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'transfer' && styles.activeTab]}
                onPress={() => { setActiveTab('transfer'); setSelectedCategory(null); }}
              >
                <Text style={[styles.tabText, activeTab === 'transfer' && styles.activeTabText]}>
                  Transfer
                </Text>
              </TouchableOpacity>
            </View>

            {/* Grid */}
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryItem}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <View style={[styles.iconCircle, selectedCategory?.id === cat.id && styles.selectedIconCircle]}>
                    <Ionicons name={cat.icon} size={24} color={cat.color} />
                  </View>
                  <Text style={[styles.categoryLabel, selectedCategory?.id === cat.id && styles.selectedCategoryLabel]} numberOfLines={1}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Simpan Transaksi</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10ac84', // top background is green
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  closeBtn: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  amountInput: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginRight: 10,
    minWidth: 100,
    textAlign: 'right',
  },
  currencyText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '500',
    marginTop: 10,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  quickInputs: {
    padding: 20,
    paddingTop: 30,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 15,
  },
  inputLabel: {
    flex: 1,
    fontSize: 16,
    color: '#2d3436',
  },
  inputValue: {
    fontSize: 16,
    color: '#636e72',
  },
  noteInput: {
    flex: 1,
    fontSize: 16,
    color: '#2d3436',
  },
  divider: {
    height: 1,
    backgroundColor: '#dfe6e9',
    marginLeft: 40,
  },
  magicScanContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  magicScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  magicScanText: {
    color: '#10ac84',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 15,
  },
  categorySection: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  categorySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  categoryActions: {
    flexDirection: 'row',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f2f6',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 21,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#747d8c',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2d3436',
    fontWeight: 'bold',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  categoryItem: {
    width: '25%', // 4 items per row
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedIconCircle: {
    borderWidth: 2,
    borderColor: '#10ac84',
    backgroundColor: '#e6f7f3',
  },
  categoryLabel: {
    fontSize: 12,
    color: '#636e72',
    textAlign: 'center',
  },
  selectedCategoryLabel: {
    color: '#10ac84',
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
  },
  saveBtn: {
    backgroundColor: '#10ac84',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddTransactionScreen;
