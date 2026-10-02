import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { fonts } from '../../../theme/tokens';
import { ContractorProjectDetail, ClientTransaction } from '../../../types/contractor';
import {
  ArrowLeftIcon,
  PlusIcon,
  CloseIcon,
  CurrencyRupeeIcon,
  CheckIcon,
} from '../../../components/ContractorIcons';

interface FinancialLedgerScreenProps {
  project: ContractorProjectDetail;
  onBack: () => void;
  onAddTransaction: (tx: Omit<ClientTransaction, 'id'>) => void;
}

export const FinancialLedgerScreen: React.FC<FinancialLedgerScreenProps> = ({
  project,
  onBack,
  onAddTransaction,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'client' | 'worker'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [txType, setTxType] = useState<ClientTransaction['type']>('received_from_client');
  const [amountStr, setAmountStr] = useState('');
  const [noteStr, setNoteStr] = useState('');
  const [payerRecipient, setPayerRecipient] = useState('');

  const totalReceivedFromClient = project.transactions
    .filter((t) => t.type === 'received_from_client')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaidToWorkers = project.transactions
    .filter((t) => t.type === 'paid_to_worker')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashflowBalance = totalReceivedFromClient - totalPaidToWorkers;

  const filteredTransactions = project.transactions.filter((t) => {
    if (filterType === 'client') return t.type === 'received_from_client';
    if (filterType === 'worker') return t.type === 'paid_to_worker';
    return true;
  });

  const handleSaveTransaction = () => {
    const amt = parseFloat(amountStr);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid transaction amount.');
      return;
    }
    if (!noteStr.trim()) {
      Alert.alert('Missing Note', 'Please provide a note or purpose for this entry.');
      return;
    }

    onAddTransaction({
      date: 'Today, ' + new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      amount: amt,
      type: txType,
      note: noteStr.trim(),
      recipientOrPayer:
        payerRecipient.trim() ||
        (txType === 'received_from_client' ? `Client: ${project.clientName}` : 'Workforce Payroll'),
      referenceNo: `REF-${Date.now().toString().slice(-6)}`,
    });

    setAmountStr('');
    setNoteStr('');
    setPayerRecipient('');
    setShowAddModal(false);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.topHeader}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <ArrowLeftIcon size={16} color="#94A3B8" />
          <Text style={styles.backBtnText}>Workspace</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Financial Ledger</Text>
          <Text style={styles.headerSub}>Client Collections vs Worker Wages</Text>
        </View>

        <Pressable style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <PlusIcon size={14} color="#0B0E14" />
          <Text style={styles.addBtnText}>Entry</Text>
        </Pressable>
      </View>

      {/* CASHFLOW KPI SUMMARY */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.sumCol}>
            <Text style={styles.sumLabel}>Received from Client</Text>
            <Text style={styles.sumGreen}>
              ₹{totalReceivedFromClient.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.sumSub}>Client: {project.clientName}</Text>
          </View>
          <View style={styles.sumDivider} />
          <View style={styles.sumCol}>
            <Text style={styles.sumLabel}>Paid to Workers</Text>
            <Text style={styles.sumRed}>
              ₹{totalPaidToWorkers.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.sumSub}>{project.workers.length} Workers Payroll</Text>
          </View>
        </View>

        <View style={styles.netSurplusBar}>
          <Text style={styles.netSurplusLabel}>Net Operating Balance:</Text>
          <Text style={styles.netSurplusVal}>
            ₹{netCashflowBalance.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* FILTER BUTTONS */}
      <View style={styles.filterBar}>
        <Pressable
          style={[styles.filterBtn, filterType === 'all' && styles.filterBtnActive]}
          onPress={() => setFilterType('all')}
        >
          <Text
            style={[styles.filterBtnText, filterType === 'all' && styles.filterBtnTextActive]}
          >
            All ({project.transactions.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterBtn, filterType === 'client' && styles.filterBtnActive]}
          onPress={() => setFilterType('client')}
        >
          <Text
            style={[styles.filterBtnText, filterType === 'client' && styles.filterBtnTextActive]}
          >
            Client Inflows
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterBtn, filterType === 'worker' && styles.filterBtnActive]}
          onPress={() => setFilterType('worker')}
        >
          <Text
            style={[styles.filterBtnText, filterType === 'worker' && styles.filterBtnTextActive]}
          >
            Crew Outflows
          </Text>
        </Pressable>
      </View>

      {/* TRANSACTION LIST */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredTransactions.map((tx) => {
          const isInflow = tx.type === 'received_from_client';

          return (
            <View key={tx.id} style={styles.txCard}>
              <View style={styles.txTopRow}>
                <View style={styles.txLeftGroup}>
                  <View
                    style={[
                      styles.txBadge,
                      isInflow ? styles.txBadgeInflow : styles.txBadgeOutflow,
                    ]}
                  >
                    <Text
                      style={[
                        styles.txBadgeText,
                        isInflow ? styles.txBadgeTextInflow : styles.txBadgeTextOutflow,
                      ]}
                    >
                      {isInflow ? 'CLIENT INFLOW' : 'CREW OUTFLOW'}
                    </Text>
                  </View>
                  <Text style={styles.txRefText}>{tx.referenceNo}</Text>
                </View>

                <Text style={isInflow ? styles.txAmountGreen : styles.txAmountRed}>
                  {isInflow ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                </Text>
              </View>

              <Text style={styles.txNoteText}>{tx.note}</Text>

              <View style={styles.txFooterRow}>
                <Text style={styles.txRecipientText}>{tx.recipientOrPayer}</Text>
                <Text style={styles.txDateText}>{tx.date}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ADD TRANSACTION MODAL */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalTopRow}>
              <View style={styles.modalIconBox}>
                <CurrencyRupeeIcon size={18} color="#38BDF8" />
              </View>
              <Pressable onPress={() => setShowAddModal(false)} hitSlop={8}>
                <CloseIcon size={18} color="#94A3B8" />
              </Pressable>
            </View>

            <Text style={styles.modalTitle}>Record Financial Entry</Text>
            <Text style={styles.modalDesc}>
              Log client payment receipt or crew payroll wage payout for this site.
            </Text>

            <Text style={styles.inputLabel}>Transaction Type</Text>
            <View style={styles.typeSelectorRow}>
              <Pressable
                style={[
                  styles.typePill,
                  txType === 'received_from_client' && styles.typePillInflowActive,
                ]}
                onPress={() => setTxType('received_from_client')}
              >
                <Text
                  style={[
                    styles.typePillText,
                    txType === 'received_from_client' && styles.typePillTextInflow,
                  ]}
                >
                  Received from Client
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.typePill,
                  txType === 'paid_to_worker' && styles.typePillOutflowActive,
                ]}
                onPress={() => setTxType('paid_to_worker')}
              >
                <Text
                  style={[
                    styles.typePillText,
                    txType === 'paid_to_worker' && styles.typePillTextOutflow,
                  ]}
                >
                  Paid to Worker
                </Text>
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 50000"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              value={amountStr}
              onChangeText={setAmountStr}
            />

            <Text style={styles.inputLabel}>Description / Purpose</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Milestone 2 Advance for Material & Flooring"
              placeholderTextColor="#64748B"
              value={noteStr}
              onChangeText={setNoteStr}
            />

            <Text style={styles.inputLabel}>
              {txType === 'received_from_client' ? 'Received From' : 'Paid To (Worker Name)'}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={
                txType === 'received_from_client'
                  ? `Client: ${project.clientName}`
                  : 'e.g. Rameshwar Yadav (Mason)'
              }
              placeholderTextColor="#64748B"
              value={payerRecipient}
              onChangeText={setPayerRecipient}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleSaveTransaction}>
                <CheckIcon size={14} color="#0B0E14" />
                <Text style={styles.confirmBtnText}>Save Entry</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E14',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2638',
    backgroundColor: '#0E121B',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  backBtnText: {
    fontFamily: fonts.displayBold,
    color: '#94A3B8',
    fontSize: 12.5,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 14.5,
  },
  headerSub: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 10.5,
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    gap: 4,
  },
  addBtnText: {
    fontFamily: fonts.displayBold,
    color: '#0B0E14',
    fontSize: 11.5,
  },
  summaryCard: {
    backgroundColor: '#111622',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E2638',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  sumCol: {
    flex: 1,
  },
  sumDivider: {
    width: 1,
    backgroundColor: '#1E2638',
    marginHorizontal: 12,
  },
  sumLabel: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 10,
    marginBottom: 2,
  },
  sumGreen: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 16,
    marginBottom: 2,
  },
  sumRed: {
    fontFamily: fonts.displayBold,
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 2,
  },
  sumSub: {
    fontFamily: fonts.body,
    color: '#94A3B8',
    fontSize: 9.5,
  },
  netSurplusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1A2130',
    paddingTop: 8,
  },
  netSurplusLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#94A3B8',
    fontSize: 11,
  },
  netSurplusVal: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 14,
  },
  filterBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#0E121B',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  filterBtnActive: {
    backgroundColor: '#1E2638',
  },
  filterBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#64748B',
    fontSize: 11,
  },
  filterBtnTextActive: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 10,
  },
  txCard: {
    backgroundColor: '#111622',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E2638',
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  txLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  txBadgeInflow: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  txBadgeOutflow: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  txBadgeText: {
    fontFamily: fonts.displayBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  txBadgeTextInflow: {
    color: '#10B981',
  },
  txBadgeTextOutflow: {
    color: '#EF4444',
  },
  txRefText: {
    fontFamily: fonts.mono,
    color: '#64748B',
    fontSize: 10,
  },
  txAmountGreen: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 14,
  },
  txAmountRed: {
    fontFamily: fonts.displayBold,
    color: '#EF4444',
    fontSize: 14,
  },
  txNoteText: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 12.5,
    marginBottom: 6,
  },
  txFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1A2130',
    paddingTop: 6,
  },
  txRecipientText: {
    fontFamily: fonts.body,
    color: '#94A3B8',
    fontSize: 11,
  },
  txDateText: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 10.5,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#0E121B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#242F44',
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1E2638',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 16,
    marginBottom: 4,
  },
  modalDesc: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 14,
  },
  inputLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 5,
    marginTop: 8,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  typePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#151C2C',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#28354D',
  },
  typePillInflowActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10B981',
  },
  typePillOutflowActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#EF4444',
  },
  typePillText: {
    fontFamily: fonts.displayBold,
    color: '#64748B',
    fontSize: 10.5,
  },
  typePillTextInflow: {
    color: '#10B981',
  },
  typePillTextOutflow: {
    color: '#EF4444',
  },
  textInput: {
    backgroundColor: '#151C2C',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#28354D',
    color: '#F8FAFC',
    fontFamily: fonts.body,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  cancelBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#94A3B8',
    fontSize: 12.5,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 5,
  },
  confirmBtnText: {
    fontFamily: fonts.displayBold,
    color: '#0B0E14',
    fontSize: 12.5,
  },
});
