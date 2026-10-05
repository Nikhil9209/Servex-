import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import {
  FadeInSlide,
  SpringPressable,
} from '../../../components/AnimatedComponents';
import { useContractor } from '../../../context/ContractorContext';

interface FinancialLedgerScreenProps {
  project: ContractorProjectDetail;
  onBack: () => void;
  onAddTransaction: (tx: Omit<ClientTransaction, 'id'>) => void;
  onVoidTransaction?: (transactionId: string, reason?: string) => void;
  onDeleteTransaction?: (transactionId: string) => void;
}

export const FinancialLedgerScreen: React.FC<FinancialLedgerScreenProps> = ({
  project,
  onBack,
  onAddTransaction,
  onVoidTransaction,
  onDeleteTransaction,
}) => {
  const { getProjectFinancialSummary } = useContractor();
  const [serverSummary, setServerSummary] = useState<{
    totalReceived: number;
    totalWagesPaid: number;
    netBalance: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    if (getProjectFinancialSummary) {
      getProjectFinancialSummary(project.id)
        .then((res) => {
          if (active && res) {
            setServerSummary({
              totalReceived: res.totalReceived,
              totalWagesPaid: res.totalWagesPaid,
              netBalance: res.netBalance,
            });
          }
        })
        .catch(() => {
          // Keep local calculation fallback
        });
    }
    return () => {
      active = false;
    };
  }, [project.id, project.transactions, getProjectFinancialSummary]);

  const [filterType, setFilterType] = useState<'all' | 'client' | 'worker'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [txType, setTxType] = useState<ClientTransaction['type']>('received_from_client');
  const [amountStr, setAmountStr] = useState('');
  const [noteStr, setNoteStr] = useState('');
  const [payerRecipient, setPayerRecipient] = useState('');

  const unvoidedTransactions = project.transactions.filter((t) => !t.isVoided);

  const localTotalReceived = unvoidedTransactions
    .filter((t) => t.type === 'received_from_client')
    .reduce((sum, t) => sum + t.amount, 0);

  const localTotalPaidToWorkers = unvoidedTransactions
    .filter((t) => t.type === 'paid_to_worker')
    .reduce((sum, t) => sum + t.amount, 0);

  const localNetCashflowBalance = localTotalReceived - localTotalPaidToWorkers;

  const totalReceivedFromClient = serverSummary?.totalReceived ?? localTotalReceived;
  const totalPaidToWorkers = serverSummary?.totalWagesPaid ?? localTotalPaidToWorkers;
  const netCashflowBalance = serverSummary?.netBalance ?? localNetCashflowBalance;

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
      {/* 1. TOP HEADER WITH CIRCULAR BUTTONS */}
      <FadeInSlide delay={40} distance={14}>
        <View style={styles.topHeader}>
          <SpringPressable
            style={styles.circleHeaderBtn}
            onPress={onBack}
            scaleTo={0.92}
            hitSlop={8}
          >
            <ArrowLeftIcon size={18} color="#FFFFFF" />
          </SpringPressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Financial Ledger</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              Cash Inflows & Wage Disbursements
            </Text>
          </View>

          <SpringPressable
            style={styles.circleAddBtn}
            onPress={() => setShowAddModal(true)}
            scaleTo={0.92}
            hitSlop={8}
          >
            <PlusIcon size={18} color="#000000" />
          </SpringPressable>
        </View>
      </FadeInSlide>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. DUAL CASHFLOW KPI CARDS */}
        <FadeInSlide delay={80} distance={14}>
          <View style={styles.kpiRow}>
            {/* CASH COLLECTED */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>CASH COLLECTED</Text>
              <Text style={[styles.kpiValue, { color: '#10B981' }]} numberOfLines={1}>
                ₹{totalReceivedFromClient.toLocaleString('en-IN')}
              </Text>
              <View style={styles.kpiSubRow}>
                <Text style={styles.kpiSubText} numberOfLines={1}>
                  {project.clientName}
                </Text>
              </View>
            </View>

            {/* WAGES PAID */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>WAGES PAID</Text>
              <Text style={[styles.kpiValue, { color: '#F59E0B' }]} numberOfLines={1}>
                ₹{totalPaidToWorkers.toLocaleString('en-IN')}
              </Text>
              <View style={styles.kpiSubRow}>
                <Text style={styles.kpiSubText}>
                  {project.workers.length} Crew Payroll
                </Text>
              </View>
            </View>
          </View>
        </FadeInSlide>

        {/* 3. NET OPERATING BALANCE CARD */}
        <FadeInSlide delay={120} distance={14}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View>
                <Text style={styles.balanceLabel}>NET SITE CASH BALANCE</Text>
                <Text style={styles.balanceSub}>Retained liquid margin on site</Text>
              </View>
              <View style={[styles.statusPill, netCashflowBalance >= 0 ? styles.statusPillGreen : styles.statusPillAmber]}>
                <Text style={[styles.statusPillText, netCashflowBalance >= 0 ? styles.statusPillTextGreen : styles.statusPillTextAmber]}>
                  {netCashflowBalance >= 0 ? 'Surplus Inflow' : 'Wage Deficit'}
                </Text>
              </View>
            </View>

            <Text style={styles.balanceValue}>
              ₹{netCashflowBalance.toLocaleString('en-IN')}
            </Text>
          </View>
        </FadeInSlide>

        {/* 4. FILTER TABS */}
        <FadeInSlide delay={160} distance={14}>
          <View style={styles.filterRow}>
            <SpringPressable
              style={[styles.filterPill, filterType === 'all' && styles.filterPillActive]}
              onPress={() => setFilterType('all')}
              scaleTo={0.96}
            >
              <Text style={[styles.filterPillText, filterType === 'all' && styles.filterPillTextActive]}>
                All ({project.transactions.length})
              </Text>
            </SpringPressable>

            <SpringPressable
              style={[styles.filterPill, filterType === 'client' && styles.filterPillActive]}
              onPress={() => setFilterType('client')}
              scaleTo={0.96}
            >
              <Text style={[styles.filterPillText, filterType === 'client' && styles.filterPillTextActive]}>
                Client Receipts
              </Text>
            </SpringPressable>

            <SpringPressable
              style={[styles.filterPill, filterType === 'worker' && styles.filterPillActive]}
              onPress={() => setFilterType('worker')}
              scaleTo={0.96}
            >
              <Text style={[styles.filterPillText, filterType === 'worker' && styles.filterPillTextActive]}>
                Crew Outflows
              </Text>
            </SpringPressable>
          </View>
        </FadeInSlide>

        {/* 5. TRANSACTION LIST */}
        {filteredTransactions.map((tx, idx) => {
          const isInflow = tx.type === 'received_from_client';

          return (
            <FadeInSlide key={tx.id} delay={180 + idx * 40} distance={14}>
              <View style={styles.txCard}>
                <View style={styles.txTopRow}>
                  <View style={styles.txBadgeGroup}>
                    <View
                      style={[
                        styles.txBadge,
                        tx.isVoided
                          ? styles.txBadgeVoided
                          : isInflow
                          ? styles.txBadgeInflow
                          : styles.txBadgeOutflow,
                      ]}
                    >
                      <Text
                        style={[
                          styles.txBadgeText,
                          tx.isVoided
                            ? styles.txBadgeTextVoided
                            : isInflow
                            ? styles.txBadgeTextInflow
                            : styles.txBadgeTextOutflow,
                        ]}
                      >
                        {tx.isVoided ? 'VOIDED / REVERSED' : isInflow ? 'CLIENT INFLOW' : 'CREW OUTFLOW'}
                      </Text>
                    </View>
                    <Text style={styles.txRefText}>{tx.referenceNo}</Text>
                  </View>

                  <Text
                    style={[
                      styles.txAmount,
                      tx.isVoided
                        ? styles.txAmountVoided
                        : isInflow
                        ? styles.txAmountGreen
                        : styles.txAmountAmber,
                    ]}
                  >
                    {tx.isVoided ? '₹' : isInflow ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                  </Text>
                </View>

                <Text style={[styles.txNoteText, tx.isVoided && styles.txNoteVoided]}>
                  {tx.isVoided ? `[VOIDED: ${tx.voidReason || 'Reversed'}] ${tx.note}` : tx.note}
                </Text>

                <View style={styles.txFooterRow}>
                  <Text style={styles.txRecipientText} numberOfLines={1}>
                    {tx.recipientOrPayer}
                  </Text>
                  <View style={styles.txFooterRight}>
                    <Text style={styles.txDateText}>{tx.date}</Text>
                    {onVoidTransaction && !tx.isVoided && (
                      <SpringPressable
                        style={styles.txVoidBtn}
                        onPress={() => {
                          Alert.alert(
                            'Void Transaction',
                            `Are you sure you want to void ${tx.referenceNo} (₹${tx.amount.toLocaleString('en-IN')})? This will reverse its financial impact while preserving the audit record.`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Void Entry',
                                style: 'destructive',
                                onPress: () => onVoidTransaction(tx.id, 'Voided by contractor'),
                              },
                            ]
                          );
                        }}
                        scaleTo={0.9}
                        hitSlop={8}
                      >
                        <Text style={styles.txVoidBtnText}>Void</Text>
                      </SpringPressable>
                    )}
                  </View>
                </View>
              </View>
            </FadeInSlide>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 6. FLOATING BOTTOM BAR */}
      <FadeInSlide delay={200} distance={20}>
        <View style={styles.floatingBottomBar}>
          <View style={styles.floatingLeft}>
            <Text style={styles.floatingTitle}>{filteredTransactions.length} Transactions Logged</Text>
            <Text style={styles.floatingSubtitle}>Immutable site financial ledger</Text>
          </View>
          <SpringPressable
            style={styles.floatingAddBtn}
            onPress={() => setShowAddModal(true)}
            scaleTo={0.94}
          >
            <PlusIcon size={16} color="#000000" />
            <Text style={styles.floatingAddBtnText}>Record Entry</Text>
          </SpringPressable>
        </View>
      </FadeInSlide>

      {/* 7. ADD TRANSACTION MODAL */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalTopRow}>
              <View style={styles.modalIconBox}>
                <CurrencyRupeeIcon size={18} color="#FFFFFF" />
              </View>
              <SpringPressable
                onPress={() => setShowAddModal(false)}
                style={styles.modalCloseBtn}
                scaleTo={0.9}
                hitSlop={8}
              >
                <CloseIcon size={16} color="#8E8E93" />
              </SpringPressable>
            </View>

            <Text style={styles.modalTitle}>Record Financial Entry</Text>
            <Text style={styles.modalDesc}>
              Log client payment receipt or crew payroll wage payout for this site.
            </Text>

            {/* Type selector */}
            <Text style={styles.inputLabel}>TRANSACTION TYPE</Text>
            <View style={styles.typeSelectorRow}>
              <SpringPressable
                style={[
                  styles.typePill,
                  txType === 'received_from_client' && styles.typePillActive,
                ]}
                onPress={() => setTxType('received_from_client')}
                scaleTo={0.96}
              >
                <Text
                  style={[
                    styles.typePillText,
                    txType === 'received_from_client' && styles.typePillTextActive,
                  ]}
                >
                  Cash Received (Client)
                </Text>
              </SpringPressable>

              <SpringPressable
                style={[
                  styles.typePill,
                  txType === 'paid_to_worker' && styles.typePillActive,
                ]}
                onPress={() => setTxType('paid_to_worker')}
                scaleTo={0.96}
              >
                <Text
                  style={[
                    styles.typePillText,
                    txType === 'paid_to_worker' && styles.typePillTextActive,
                  ]}
                >
                  Wage Paid (Crew)
                </Text>
              </SpringPressable>
            </View>

            {/* Amount input */}
            <Text style={styles.inputLabel}>AMOUNT (₹)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 50000"
              placeholderTextColor="#55555C"
              keyboardType="numeric"
              value={amountStr}
              onChangeText={setAmountStr}
            />

            {/* Note input */}
            <Text style={styles.inputLabel}>PURPOSE / NOTE</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Milestone 2 Advance for Material & Flooring"
              placeholderTextColor="#55555C"
              value={noteStr}
              onChangeText={setNoteStr}
            />

            {/* Recipient / Payer */}
            <Text style={styles.inputLabel}>
              {txType === 'received_from_client' ? 'RECEIVED FROM' : 'PAID TO (WORKER NAME)'}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={
                txType === 'received_from_client'
                  ? `Client: ${project.clientName}`
                  : 'e.g. Rameshwar Yadav (Mason)'
              }
              placeholderTextColor="#55555C"
              value={payerRecipient}
              onChangeText={setPayerRecipient}
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <SpringPressable
                style={styles.cancelBtn}
                onPress={() => setShowAddModal(false)}
                scaleTo={0.95}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </SpringPressable>

              <SpringPressable
                style={styles.confirmBtn}
                onPress={handleSaveTransaction}
                scaleTo={0.95}
              >
                <CheckIcon size={14} color="#000000" />
                <Text style={styles.confirmBtnText}>Save Entry</Text>
              </SpringPressable>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#000000',
  },
  circleHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: '#222228',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 2,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },

  // DUAL KPI CARDS
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#16161A',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222228',
  },
  kpiLabel: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  kpiValue: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  kpiSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiSubText: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 11,
  },

  // BALANCE CARD
  balanceCard: {
    backgroundColor: '#16161A',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#222228',
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  balanceLabel: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  balanceSub: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  statusPillAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  statusPillText: {
    fontFamily: fonts.displayBold,
    fontSize: 10,
  },
  statusPillTextGreen: {
    color: '#10B981',
  },
  statusPillTextAmber: {
    color: '#F59E0B',
  },
  balanceValue: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 26,
    letterSpacing: -0.6,
  },

  // FILTER ROW
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    backgroundColor: '#16161A',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222228',
  },
  filterPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  filterPillText: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 11.5,
  },
  filterPillTextActive: {
    color: '#000000',
  },

  // TX CARDS
  txCard: {
    backgroundColor: '#16161A',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222228',
    marginBottom: 12,
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  txBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  txBadgeInflow: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  txBadgeOutflow: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  txBadgeVoided: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  txBadgeText: {
    fontFamily: fonts.displayBold,
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  txBadgeTextInflow: {
    color: '#10B981',
  },
  txBadgeTextOutflow: {
    color: '#F59E0B',
  },
  txBadgeTextVoided: {
    color: '#EF4444',
  },
  txRefText: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 10.5,
  },
  txAmount: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    letterSpacing: -0.3,
  },
  txAmountGreen: {
    color: '#10B981',
  },
  txAmountAmber: {
    color: '#F59E0B',
  },
  txAmountVoided: {
    color: '#636366',
    textDecorationLine: 'line-through',
  },
  txNoteText: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  txNoteVoided: {
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  txFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1F1F24',
    paddingTop: 10,
  },
  txFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txVoidBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#261414',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4A1D1D',
  },
  txVoidBtnText: {
    fontFamily: fonts.displayBold,
    color: '#EF4444',
    fontSize: 10,
  },
  txRecipientText: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 11,
    flex: 1,
    marginRight: 8,
  },
  txDateText: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 10.5,
  },

  // FLOATING BOTTOM BAR
  floatingBottomBar: {
    position: 'absolute',
    bottom: 24,
    left: 18,
    right: 18,
    backgroundColor: '#16161A',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#262630',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  floatingLeft: {
    flex: 1,
    marginRight: 12,
  },
  floatingTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13,
  },
  floatingSubtitle: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 10.5,
    marginTop: 2,
  },
  floatingAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
  },
  floatingAddBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 12,
  },

  // MODAL STYLING
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#16161A',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: '#262632',
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#222228',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#222228',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 17,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  modalDesc: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 10.5,
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 10,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  typePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    backgroundColor: '#1C1C22',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262630',
  },
  typePillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  typePillText: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 11,
  },
  typePillTextActive: {
    color: '#000000',
  },
  textInput: {
    backgroundColor: '#0C0C0E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262632',
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13.5,
    paddingHorizontal: 14,
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
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#8E8E93',
    fontSize: 13,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 14,
    gap: 6,
  },
  confirmBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 13,
  },
});
