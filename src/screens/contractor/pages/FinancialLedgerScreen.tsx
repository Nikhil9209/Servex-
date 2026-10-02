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
          <Text style={styles.backBtnText}>‹ Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Financial Ledger</Text>
          <Text style={styles.headerSub}>Client Payments vs Worker Wages</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addBtnText}>+ Entry</Text>
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
            All Entries ({project.transactions.length})
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
            Worker Wages
          </Text>
        </Pressable>
      </View>

      {/* TRANSACTIONS TIMELINE */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredTransactions.map((tx) => (
          <View key={tx.id} style={styles.txCard}>
            <View style={styles.txHeader}>
              <View
                style={[
                  styles.txTypeBadge,
                  tx.type === 'received_from_client'
                    ? styles.badgeClient
                    : styles.badgeWorker,
                ]}
              >
                <Text
                  style={[
                    styles.txTypeBadgeText,
                    tx.type === 'received_from_client'
                      ? styles.badgeTextClient
                      : styles.badgeTextWorker,
                  ]}
                >
                  {tx.type === 'received_from_client'
                    ? '↓ RECEIVED FROM CLIENT'
                    : '↑ PAID TO WORKERS'}
                </Text>
              </View>
              <Text style={styles.txDate}>{tx.date}</Text>
            </View>

            <View style={styles.txBody}>
              <View style={{ flex: 1 }}>
                <Text style={styles.txNote}>{tx.note}</Text>
                <Text style={styles.txParty}>{tx.recipientOrPayer}</Text>
                <Text style={styles.txRef}>Ref: {tx.referenceNo}</Text>
              </View>

              <Text
                style={[
                  styles.txAmount,
                  tx.type === 'received_from_client'
                    ? styles.txAmountGreen
                    : styles.txAmountRed,
                ]}
              >
                {tx.type === 'received_from_client' ? '+' : '-'}₹
                {tx.amount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* RECORD TRANSACTION MODAL */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Financial Entry</Text>
            <Text style={styles.modalDesc}>
              Track payments received from client or wage disbursements to your workers.
            </Text>

            <Text style={styles.inputLabel}>Transaction Type</Text>
            <View style={styles.typeSelectorRow}>
              <Pressable
                style={[
                  styles.typeBtn,
                  txType === 'received_from_client' && styles.typeBtnClientActive,
                ]}
                onPress={() => setTxType('received_from_client')}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    txType === 'received_from_client' && styles.typeBtnTextActive,
                  ]}
                >
                  Received from Client
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.typeBtn,
                  txType === 'paid_to_worker' && styles.typeBtnWorkerActive,
                ]}
                onPress={() => setTxType('paid_to_worker')}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    txType === 'paid_to_worker' && styles.typeBtnTextActive,
                  ]}
                >
                  Paid to Workers
                </Text>
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 50000"
              placeholderTextColor="#71717A"
              keyboardType="numeric"
              value={amountStr}
              onChangeText={setAmountStr}
            />

            <Text style={styles.inputLabel}>Purpose / Note</Text>
            <TextInput
              style={styles.textInput}
              placeholder={
                txType === 'received_from_client'
                  ? 'e.g. Stage 2 Milestone Payment'
                  : 'e.g. Weekly Mason & Helper Wages'
              }
              placeholderTextColor="#71717A"
              value={noteStr}
              onChangeText={setNoteStr}
            />

            <Text style={styles.inputLabel}>Payer / Recipient (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder={
                txType === 'received_from_client'
                  ? project.clientName
                  : 'Workforce Crew'
              }
              placeholderTextColor="#71717A"
              value={payerRecipient}
              onChangeText={setPayerRecipient}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSaveTransaction}>
                <Text style={styles.saveBtnText}>Save Entry</Text>
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
    backgroundColor: '#000000',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#161920',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 14,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  headerSub: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 7,
  },
  addBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 12,
  },
  summaryCard: {
    backgroundColor: '#111317',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sumCol: {
    flex: 1,
  },
  sumDivider: {
    width: 1,
    backgroundColor: '#20242D',
    marginHorizontal: 14,
  },
  sumLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10.5,
    marginBottom: 3,
  },
  sumGreen: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 18,
    marginBottom: 2,
  },
  sumRed: {
    fontFamily: fonts.displayBold,
    color: '#EF4444',
    fontSize: 18,
    marginBottom: 2,
  },
  sumSub: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10.5,
  },
  netSurplusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1E232E',
    paddingTop: 10,
  },
  netSurplusLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 12,
  },
  netSurplusVal: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#111317',
    borderRadius: 8,
    padding: 3,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterBtnActive: {
    backgroundColor: '#202530',
  },
  filterBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#71717A',
    fontSize: 11,
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.displayBold,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 10,
  },
  txCard: {
    backgroundColor: '#111317',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeClient: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  badgeWorker: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  txTypeBadgeText: {
    fontFamily: fonts.displayBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  badgeTextClient: {
    color: '#10B981',
  },
  badgeTextWorker: {
    color: '#EF4444',
  },
  txDate: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10.5,
  },
  txBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  txNote: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13,
    marginBottom: 2,
  },
  txParty: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 11,
    marginBottom: 2,
  },
  txRef: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10,
  },
  txAmount: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
  },
  txAmountGreen: {
    color: '#10B981',
  },
  txAmountRed: {
    color: '#EF4444',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F1116',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#242833',
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 17,
    marginBottom: 4,
  },
  modalDesc: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 11.5,
    marginBottom: 6,
    marginTop: 8,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#232730',
  },
  typeBtnClientActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  typeBtnWorkerActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  typeBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#71717A',
    fontSize: 11.5,
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.displayBold,
  },
  textInput: {
    backgroundColor: '#161920',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#232730',
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cancelBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  saveBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 13,
  },
});
