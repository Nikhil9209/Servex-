import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { fonts } from '../../../theme/tokens';
import {
  ContractorProjectDetail,
  DailyWorkReport,
  DailyWorkVerificationItem,
} from '../../../types/contractor';

interface DailyWorkVerificationScreenProps {
  project: ContractorProjectDetail;
  onBack: () => void;
  onSaveDailyReport: (report: DailyWorkReport) => void;
}

function generateDailyReportObject(
  items: DailyWorkVerificationItem[],
  totalWorkValueToday: number,
  totalWageToday: number,
  netContractorMarginToday: number
): DailyWorkReport {
  return {
    id: `daily-${Date.now()}`,
    date: 'Today, ' + new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    verifiedBy: 'Contractor Verified',
    items,
    totalWorkValueToday,
    totalWorkerWageToday: totalWageToday,
    contractorMarginToday: netContractorMarginToday,
    isVerified: true,
  };
}

export const DailyWorkVerificationScreen: React.FC<DailyWorkVerificationScreenProps> = ({
  project,
  onBack,
  onSaveDailyReport,
}) => {
  // Map of scopeItemId -> quantity verified today
  const [quantitiesToday, setQuantitiesToday] = useState<{ [key: string]: string }>({});
  const [generatedReport, setGeneratedReport] = useState<DailyWorkReport | null>(null);

  const totalWageToday = project.todayAttendance.reduce(
    (sum, a) => sum + a.wageCalculated,
    0
  );

  const handleQtyChange = (itemId: string, text: string) => {
    setQuantitiesToday((prev) => ({
      ...prev,
      [itemId]: text,
    }));
  };

  // Calculate items with entered progress
  const activeItemsToday: DailyWorkVerificationItem[] = project.scopeItems
    .map((item) => {
      const qty = parseFloat(quantitiesToday[item.id] || '0');
      if (isNaN(qty) || qty <= 0) return null;
      return {
        scopeItemId: item.id,
        name: item.name,
        unit: item.unit,
        qtyDoneToday: qty,
        ratePerUnit: item.ratePerUnit,
        totalValueToday: Math.round(qty * item.ratePerUnit),
      };
    })
    .filter((item): item is DailyWorkVerificationItem => item !== null);

  const totalWorkValueToday = activeItemsToday.reduce(
    (sum, item) => sum + item.totalValueToday,
    0
  );
  const netContractorMarginToday = totalWorkValueToday - totalWageToday;

  const handleVerifyAndGenerateDailyBill = () => {
    if (activeItemsToday.length === 0) {
      Alert.alert(
        'No Work Entered',
        'Please enter the quantity of work completed today for at least one requirement item.'
      );
      return;
    }

    const report = generateDailyReportObject(
      activeItemsToday,
      totalWorkValueToday,
      totalWageToday,
      netContractorMarginToday
    );

    setGeneratedReport(report);
    onSaveDailyReport(report);
    Alert.alert(
      'Daily Bill Generated ✓',
      `Today's work verified at ₹${totalWorkValueToday.toLocaleString('en-IN')}.\nWorker Wages: -₹${totalWageToday.toLocaleString('en-IN')}\nContractor Net Margin: +₹${netContractorMarginToday.toLocaleString('en-IN')}`
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.topHeader}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Daily Work Verification</Text>
          <Text style={styles.headerSub}>End-of-Day Inspection & Billing</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TODAY'S FINANCIAL RECONCILIATION SUMMARY */}
        <View style={styles.reconciliationCard}>
          <View style={styles.recRow}>
            <View>
              <Text style={styles.recLabel}>Work Executed Today</Text>
              <Text style={styles.recValGreen}>
                ₹{totalWorkValueToday.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.recDivider} />
            <View>
              <Text style={styles.recLabel}>Today&apos;s Worker Wages</Text>
              <Text style={styles.recValRed}>
                -₹{totalWageToday.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.recDivider} />
            <View>
              <Text style={styles.recLabel}>Contractor Net Margin</Text>
              <Text style={netContractorMarginToday >= 0 ? styles.recValGold : styles.recValRed}>
                ₹{netContractorMarginToday.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* WORK INSPECTION INPUTS FOR EACH REQUIREMENT */}
        <Text style={styles.sectionTitle}>Verify Quantities Completed Today</Text>
        <Text style={styles.sectionSub}>
          Input today&apos;s physical progress measured on site to calculate daily billing value.
        </Text>

        <View style={styles.scopeList}>
          {project.scopeItems.map((item) => {
            const enteredQty = parseFloat(quantitiesToday[item.id] || '0') || 0;
            const enteredVal = enteredQty * item.ratePerUnit;

            return (
              <View key={item.id} style={styles.scopeCard}>
                <View style={styles.scopeHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scopeName}>{item.name}</Text>
                    <Text style={styles.scopeRate}>
                      Agreed Rate: ₹{item.ratePerUnit} / {item.unit.toUpperCase()} • Scope: {item.quantity} {item.unit}
                    </Text>
                  </View>
                  <View style={styles.scopeCompletedBadge}>
                    <Text style={styles.scopeCompletedText}>
                      Done: {item.completedQuantity} {item.unit}
                    </Text>
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputFieldLabel}>Quantity Executed Today ({item.unit})</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder={`e.g. 150 ${item.unit}`}
                      placeholderTextColor="#71717A"
                      keyboardType="numeric"
                      value={quantitiesToday[item.id] || ''}
                      onChangeText={(val) => handleQtyChange(item.id, val)}
                    />
                  </View>

                  <View style={styles.calculatedValBox}>
                    <Text style={styles.calcValLabel}>Today&apos;s Value</Text>
                    <Text style={styles.calcValAmount}>
                      ₹{enteredVal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* VERIFICATION & GENERATE DAILY BILL CTA */}
        <Pressable
          style={styles.generateDailyBillBtn}
          onPress={handleVerifyAndGenerateDailyBill}
        >
          <Text style={styles.generateDailyBillText}>
            ✓ Verify Work & Generate Today&apos;s Daily Bill
          </Text>
        </Pressable>

        {/* GENERATED DAILY BILL PREVIEW IF VERIFIED */}
        {generatedReport && (
          <View style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <View style={styles.receiptCheckPill}>
                <Text style={styles.receiptCheckText}>VERIFIED DAILY BILL</Text>
              </View>
              <Text style={styles.receiptDate}>{generatedReport.date}</Text>
            </View>

            <Text style={styles.receiptProjectTitle}>{project.projectName}</Text>
            <Text style={styles.receiptClientCode}>Client Code: {project.clientCode}</Text>

            <View style={styles.receiptTable}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableColHeader, { flex: 2 }]}>Item</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'right' }]}>Rate</Text>
                <Text style={[styles.tableColHeader, { flex: 1.2, textAlign: 'right' }]}>Amount</Text>
              </View>

              {generatedReport.items.map((item, i) => (
                <View key={i} style={styles.tableDataRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                    {item.qtyDoneToday} {item.unit}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                    ₹{item.ratePerUnit}
                  </Text>
                  <Text style={[styles.tableCellBold, { flex: 1.2, textAlign: 'right' }]}>
                    ₹{item.totalValueToday.toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.receiptTotalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalRowLabel}>Total Work Output Value:</Text>
                <Text style={styles.totalRowVal}>
                  ₹{generatedReport.totalWorkValueToday.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalRowLabel}>Worker Wages Deducted:</Text>
                <Text style={styles.totalRowValRed}>
                  -₹{generatedReport.totalWorkerWageToday.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.grandTotalLabel}>Contractor Net Profit Today:</Text>
                <Text style={styles.grandTotalVal}>
                  ₹{generatedReport.contractorMarginToday.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 36,
  },
  reconciliationCard: {
    backgroundColor: '#111317',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#20242D',
    marginBottom: 16,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#20242D',
  },
  recLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10,
    marginBottom: 3,
  },
  recValGreen: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 15,
  },
  recValRed: {
    fontFamily: fonts.displayBold,
    color: '#EF4444',
    fontSize: 15,
  },
  recValGold: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14.5,
    marginBottom: 2,
  },
  sectionSub: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11.5,
    marginBottom: 12,
  },
  scopeList: {
    gap: 12,
    marginBottom: 18,
  },
  scopeCard: {
    backgroundColor: '#111317',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  scopeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  scopeName: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13.5,
    marginBottom: 2,
  },
  scopeRate: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
  },
  scopeCompletedBadge: {
    backgroundColor: '#1A1E26',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scopeCompletedText: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 10.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputWrapper: {
    flex: 1.4,
  },
  inputFieldLabel: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 11,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#161920',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#232730',
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  calculatedValBox: {
    flex: 1,
    backgroundColor: '#0C0D11',
    borderRadius: 8,
    padding: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 38,
  },
  calcValLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 9.5,
  },
  calcValAmount: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 13,
  },
  generateDailyBillBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  generateDailyBillText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 13.5,
    letterSpacing: 0.3,
  },
  receiptCard: {
    backgroundColor: '#111317',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262D3B',
    marginBottom: 20,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptCheckPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  receiptCheckText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  receiptDate: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
  },
  receiptProjectTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 2,
  },
  receiptClientCode: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 11.5,
    marginBottom: 12,
  },
  receiptTable: {
    backgroundColor: '#0C0D11',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1E232E',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableColHeader: {
    fontFamily: fonts.bodyMedium,
    color: '#71717A',
    fontSize: 10.5,
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  tableCell: {
    fontFamily: fonts.body,
    color: '#D4D4D8',
    fontSize: 11,
  },
  tableCellBold: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 11,
  },
  receiptTotalsBox: {
    backgroundColor: '#0C0D11',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRowLabel: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 11.5,
  },
  totalRowVal: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 12.5,
  },
  totalRowValRed: {
    fontFamily: fonts.displayBold,
    color: '#EF4444',
    fontSize: 12.5,
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#1E232E',
    marginVertical: 4,
  },
  grandTotalLabel: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 12.5,
  },
  grandTotalVal: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14.5,
  },
});
