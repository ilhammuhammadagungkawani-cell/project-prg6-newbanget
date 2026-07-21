import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useFinance, topupViaGateway, pollTopupStatus, transferToBank, transferTo } from '../context/FinanceContext';
import { API_URL } from '../config';

const { width } = Dimensions.get('window');
const cardWidth = (width - 52) / 2; // Two columns grid with margins

const WalletScreen = () => {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const { currentBalance, setInitialBalance, refreshFinance, transactions } = useFinance();

  // State Topup
  const [isTopupModalVisible, setIsTopupModalVisible] = useState(false);
  const [topupAmount, setTopupAmount] = useState('50000');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [snapRedirectUrl, setSnapRedirectUrl] = useState(null);

  // State Transfer
  const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
  const [transferMode, setTransferMode] = useState('user'); // 'user' (Internal sesama app) or 'bank'
  const [receiverEmail, setReceiverEmail] = useState('');
  const [selectedBank, setSelectedBank] = useState('bca');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);

  const bankOptions = [
    { code: 'bca', name: 'Bank BCA', color: '#0066ae' },
    { code: 'mandiri', name: 'Bank Mandiri', color: '#003d79' },
    { code: 'bri', name: 'Bank BRI', color: '#00529c' },
    { code: 'bni', name: 'Bank BNI', color: '#f15a24' },
    { code: 'permata', name: 'Bank Permata', color: '#007b3d' },
    { code: 'gopay', name: 'GoPay / Bank Jago', color: '#00aed6' },
  ];

  const handleTopupSubmit = async () => {
    const amountNum = parseFloat(topupAmount);
    if (!amountNum || amountNum < 1000) {
      Alert.alert(locale === 'id' ? 'Peringatan' : 'Warning', locale === 'id' ? 'Minimal Topup Rp 1.000' : 'Minimum Topup is Rp 1,000');
      return;
    }

    if (!user?.email) {
      Alert.alert('Error', 'User session error');
      return;
    }

    setIsProcessing(true);
    try {
      const data = await topupViaGateway(user.email, amountNum);
      setActiveOrderId(data.orderId);
      setSnapRedirectUrl(data.redirectUrl);

      // Open Midtrans Snap Payment Page in Browser
      if (data.redirectUrl) {
        await Linking.openURL(data.redirectUrl);
      }

      // Start polling for payment completion
      pollTopupStatus(data.orderId, async (status) => {
        if (status === 'PAID' || status === 'SETTLEMENT') {
          Alert.alert('Berhasil! 🎉', locale === 'id' ? 'Pembayaran Midtrans Sukses! Saldo Anda telah bertambah.' : 'Midtrans Payment Successful! Your balance has been updated.');
          setIsTopupModalVisible(false);
          setIsProcessing(false);
          await refreshFinance();
        }
      });
    } catch (err) {
      console.log('Topup error:', err);
      Alert.alert('Error', err.message || 'Gagal memproses pembayaran Midtrans');
      setIsProcessing(false);
    }
  };

  const handleSimulatePayment = async () => {
    const amountNum = parseFloat(topupAmount);
    if (!amountNum || amountNum < 1000) {
      Alert.alert('Peringatan', 'Minimal Topup Rp 1.000');
      return;
    }

    setIsProcessing(true);
    try {
      let targetOrderId = activeOrderId;

      // If user hasn't clicked "Bayar via Midtrans" yet, create the topup order first automatically!
      if (!targetOrderId) {
        const data = await topupViaGateway(user.email, amountNum);
        targetOrderId = data.orderId;
        setActiveOrderId(data.orderId);
      }

      const resp = await fetch(`${API_URL}/api/topup/simulate-pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: targetOrderId }),
      });

      if (resp.ok) {
        Alert.alert('Sukses Testing! 🎉', `Simulasi pembayaran Midtrans berhasil. Saldo sebesar Rp ${amountNum.toLocaleString('id-ID')} telah ditambahkan!`);
        setIsTopupModalVisible(false);
        setActiveOrderId(null);
        await refreshFinance();
      } else {
        const errData = await resp.json();
        Alert.alert('Error', errData.error || 'Gagal simulasi bayar');
      }
    } catch (e) {
      console.log('Simulation error:', e);
      Alert.alert('Error', 'Gagal simulasi bayar');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyAccount = async () => {
    if (!accountNumber || accountNumber.length < 5) {
      Alert.alert('Peringatan', 'Masukkan nomor rekening yang valid (min. 5 digit)');
      return;
    }
    setIsVerifyingAccount(true);
    try {
      const resp = await fetch(`${API_URL}/api/transfer/check-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankCode: selectedBank, accountNumber }),
      });
      const data = await resp.json();
      if (resp.ok && data.accountName) {
        setAccountVerified(true);
        setAccountName(data.accountName);
        Alert.alert('Rekening Ditemukan! ✅', `Pemilik: ${data.accountName} (${data.bankCode})`);
      } else {
        Alert.alert('Gagal', data.error || 'Nomor rekening tidak ditemukan');
      }
    } catch (e) {
      Alert.alert('Error', 'Gagal terhubung ke server verifikasi rekening');
    } finally {
      setIsVerifyingAccount(false);
    }
  };

  const handleTransferSubmit = async () => {
    const amtNum = parseFloat(transferAmount);
    if (!amtNum || amtNum <= 0) {
      Alert.alert('Peringatan', 'Masukkan nominal transfer yang valid');
      return;
    }
    if (amtNum > (currentBalance || 0)) {
      Alert.alert('Saldo Tidak Cukup', 'Saldo E-Wallet Anda tidak mencukupi untuk transaksi ini.');
      return;
    }
    if (securityPin.length < 4) {
      Alert.alert('PIN Diperlukan', 'Masukkan 6 angka PIN keamanan Anda');
      return;
    }

    setIsProcessing(true);
    try {
      if (transferMode === 'user') {
        if (!receiverEmail) {
          Alert.alert('Peringatan', 'Masukkan email penerima sesama pengguna app');
          setIsProcessing(false);
          return;
        }
        const res = await transferTo(user.email, receiverEmail, amtNum, transferNotes);
        Alert.alert('Transfer Berhasil! 🚀', `Rp ${amtNum.toLocaleString('id-ID')} telah dikirim ke ${res.receiver.name} (${res.receiver.email})`);
      } else {
        await transferToBank(
          user.email,
          selectedBank,
          accountNumber,
          accountName || 'Penerima Transfer',
          amtNum,
          transferNotes
        );
        Alert.alert('Transfer Berhasil! 🚀', `Rp ${amtNum.toLocaleString('id-ID')} telah dikirim ke ${selectedBank.toUpperCase()} (${accountNumber})`);
      }

      setIsTransferModalVisible(false);
      setTransferAmount('');
      setReceiverEmail('');
      setAccountNumber('');
      setAccountName('');
      setSecurityPin('');
      setAccountVerified(false);
      await refreshFinance();
    } catch (err) {
      Alert.alert('Gagal Transfer', err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.headerTitle}>{t('tab_wallet')} & E-Wallet</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Real-time E-Wallet Main Card */}
        <View style={styles.mainEwalletCard}>
          <View style={styles.ewalletHeader}>
            <View>
              <Text style={styles.ewalletLabel}>Saldo E-Wallet Saya</Text>
              <Text style={styles.ewalletBalanceText}>
                {formatCurrency(currentBalance)}
              </Text>
            </View>
            <View style={styles.badgeActive}>
              <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
              <Text style={styles.badgeActiveText}>Aktif</Text>
            </View>
          </View>

          {/* Action Row Buttons (Top Up & Transfer) */}
          <View style={styles.mainActionRow}>
            <TouchableOpacity
              style={[styles.mainActionBtn, { backgroundColor: '#0284c7' }]}
              activeOpacity={0.85}
              onPress={() => setIsTopupModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={22} color="#ffffff" />
              <Text style={styles.mainActionText}>Top Up (Midtrans)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mainActionBtn, { backgroundColor: '#0d9488' }]}
              activeOpacity={0.85}
              onPress={() => setIsTransferModalVisible(true)}
            >
              <Ionicons name="arrow-up-circle-outline" size={22} color="#ffffff" />
              <Text style={styles.mainActionText}>Transfer Bank</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Dompet & Rekening Terhubung</Text>

        {/* Grid Wallets */}
        <View style={styles.gridContainer}>
          <View style={[styles.walletCard, { borderColor: '#0d9488' }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>E-Wallet Utama</Text>
              <Text style={styles.cardTransactions}>Midtrans Connected</Text>
            </View>
            <View style={[styles.balanceBadge, { backgroundColor: '#ccfbf1' }]}>
              <Text style={[styles.balanceText, { color: '#0f766e' }]} numberOfLines={1}>
                {formatCurrency(currentBalance)}
              </Text>
            </View>
            <View style={styles.iconRow}>
              <Ionicons name="wallet-outline" size={20} color="#0d9488" />
            </View>
          </View>

          <View style={styles.walletCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>Tabungan Bank</Text>
              <Text style={styles.cardTransactions}>Disbursement Ready</Text>
            </View>
            <View style={[styles.balanceBadge, { backgroundColor: '#f1f5f9' }]}>
              <Text style={[styles.balanceText, { color: '#334155' }]} numberOfLines={1}>
                Rp 0
              </Text>
            </View>
            <View style={styles.iconRow}>
              <Ionicons name="business-outline" size={20} color="#64748b" />
            </View>
          </View>
        </View>

        {/* Recent Wallet & Financial Activity */}
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Aktivitas Keuangan Terbaru</Text>
        </View>

        {transactions && transactions.length > 0 ? (
          transactions.slice(0, 5).map((item, idx) => (
            <View key={item.id || idx} style={styles.txRow}>
              <View style={[
                styles.txIconContainer,
                { backgroundColor: item.type === 'income' ? '#dcfce7' : '#fee2e2' }
              ]}>
                <Ionicons
                  name={item.type === 'income' ? 'arrow-down' : 'arrow-up'}
                  size={18}
                  color={item.type === 'income' ? '#16a34a' : '#dc2626'}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.txNotes} numberOfLines={1}>
                  {item.notes || item.category || 'Transaksi'}
                </Text>
                <Text style={styles.txDate}>
                  {item.date ? new Date(item.date).toLocaleDateString('id-ID') : 'Hari ini'} • {item.wallet || 'Wallet'}
                </Text>
              </View>
              <Text style={[
                styles.txAmount,
                { color: item.type === 'income' ? '#16a34a' : '#dc2626' }
              ]}>
                {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Belum ada transaksi terbaru.</Text>
        )}

        {/* Modal Topup Midtrans */}
        <Modal
          visible={isTopupModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsTopupModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>💳 Top Up via Midtrans</Text>
                <TouchableOpacity onPress={() => setIsTopupModalVisible(false)}>
                  <Ionicons name="close-circle" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>
                {locale === 'id' ? 'Nominal Top Up (Rp)' : 'Top Up Amount (IDR)'}
              </Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={topupAmount}
                onChangeText={setTopupAmount}
                placeholder="50000"
              />

              <View style={styles.presetContainer}>
                {['10000', '25000', '50000', '100000', '250000'].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.presetChip, topupAmount === amt && styles.presetChipActive]}
                    onPress={() => setTopupAmount(amt)}
                  >
                    <Text style={[styles.presetChipText, topupAmount === amt && styles.presetChipTextActive]}>
                      Rp {parseInt(amt).toLocaleString('id-ID')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.payBtn}
                activeOpacity={0.85}
                onPress={handleTopupSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="qr-code-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.payBtnText}>
                      {locale === 'id' ? 'Bayar via Midtrans' : 'Pay via Midtrans'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {activeOrderId && (
                <TouchableOpacity
                  style={styles.simulateBtn}
                  onPress={handleSimulatePayment}
                  disabled={isProcessing}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#16a34a" style={{ marginRight: 6 }} />
                  <Text style={styles.simulateBtnText}>
                    {locale === 'id' ? 'Simulasi Bayar Lunas (Testing)' : 'Simulate Paid (Testing)'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>

        {/* Modal Transfer */}
        <Modal
          visible={isTransferModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsTransferModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>💸 Transfer Saldo</Text>
                <TouchableOpacity onPress={() => setIsTransferModalVisible(false)}>
                  <Ionicons name="close-circle" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Mode Switcher */}
              <View style={styles.modeTabContainer}>
                <TouchableOpacity
                  style={[styles.modeTabBtn, transferMode === 'user' && styles.modeTabBtnActive]}
                  onPress={() => setTransferMode('user')}
                >
                  <Ionicons name="people-outline" size={16} color={transferMode === 'user' ? '#0d9488' : '#64748b'} />
                  <Text style={[styles.modeTabText, transferMode === 'user' && styles.modeTabTextActive]}>
                    Sesama Akun App
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeTabBtn, transferMode === 'bank' && styles.modeTabBtnActive]}
                  onPress={() => setTransferMode('bank')}
                >
                  <Ionicons name="business-outline" size={16} color={transferMode === 'bank' ? '#0d9488' : '#64748b'} />
                  <Text style={[styles.modeTabText, transferMode === 'bank' && styles.modeTabTextActive]}>
                    Rekening Bank
                  </Text>
                </TouchableOpacity>
              </View>

              {transferMode === 'user' ? (
                <>
                  <Text style={styles.inputLabel}>Email Penerima (Sesama App):</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={receiverEmail}
                    onChangeText={setReceiverEmail}
                    placeholder="contoh: budi@gmail.com"
                  />
                </>
              ) : (
                <>
                  {/* Bank Selection List */}
                  <Text style={styles.inputLabel}>Pilih Bank Tujuan:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                    {bankOptions.map((b) => (
                      <TouchableOpacity
                        key={b.code}
                        style={[
                          styles.bankChip,
                          selectedBank === b.code && { borderColor: b.color, backgroundColor: '#f0f9ff' }
                        ]}
                        onPress={() => {
                          setSelectedBank(b.code);
                          setAccountVerified(false);
                        }}
                      >
                        <Text style={[
                          styles.bankChipText,
                          selectedBank === b.code && { color: b.color, fontWeight: '800' }
                        ]}>
                          {b.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Account Number & Check */}
                  <Text style={styles.inputLabel}>Nomor Rekening:</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <TextInput
                      style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                      keyboardType="numeric"
                      value={accountNumber}
                      onChangeText={(val) => {
                        setAccountNumber(val);
                        setAccountVerified(false);
                      }}
                      placeholder="1234567890"
                    />
                    <TouchableOpacity
                      style={styles.verifyBtn}
                      onPress={handleVerifyAccount}
                      disabled={isVerifyingAccount}
                    >
                      {isVerifyingAccount ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.verifyBtnText}>Cek Rekening</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {accountVerified && (
                    <View style={styles.verifiedBox}>
                      <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      <Text style={styles.verifiedText}>A.N: {accountName}</Text>
                    </View>
                  )}
                </>
              )}

              {/* Amount */}
              <Text style={styles.inputLabel}>Nominal Transfer (Rp):</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={transferAmount}
                onChangeText={setTransferAmount}
                placeholder="100000"
              />

              {/* Security PIN */}
              <Text style={styles.inputLabel}>PIN Keamanan (6-Digit):</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                secureTextEntry
                maxLength={6}
                value={securityPin}
                onChangeText={setSecurityPin}
                placeholder="******"
              />

              <TouchableOpacity
                style={[styles.payBtn, { backgroundColor: '#0d9488' }]}
                activeOpacity={0.85}
                onPress={handleTransferSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="paper-plane-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.payBtnText}>Kirim Uang Sekarang</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  screenHeader: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 16,
  },
  mainEwalletCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  ewalletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  ewalletLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  ewalletBalanceText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
  },
  badgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#166534',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  badgeActiveText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '700',
  },
  mainActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mainActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 14,
    gap: 6,
  },
  mainActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  walletCard: {
    flex: 1,
    height: 125,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    justifyContent: 'space-between',
  },
  cardHeader: {
    width: '100%',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  cardTransactions: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  balanceBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  activityHeader: {
    marginTop: 8,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  txIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txNotes: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  txDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginVertical: 16,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modeTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  modeTabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  modeTabTextActive: {
    color: '#0d9488',
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
    marginTop: 6,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  presetChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  bankChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  bankChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  verifyBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  verifiedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  verifiedText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '700',
  },
  payBtn: {
    backgroundColor: '#0052cc',
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  payBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  simulateBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 10,
  },
  simulateBtnText: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default WalletScreen;
