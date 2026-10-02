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
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from '../../../components/ContractorIcons';

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
    date:
      'Today, ' +
      new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    verifiedBy: 'General Prime Contractor Verified',
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
  const [quantitiesToday, setQuantitiesToday] = useState<{ [key: string]: string }>({});

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
        'No Measurements Entered',
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

    onSaveDailyReport(report);
    Alert.alert(
      'Daily Work Verified',
      `Site work audit verified at ₹${totalWorkValueToday.toLocaleString('en-IN')}.\nWorker Wages: -₹${totalWageToday.toLocaleString('en-IN')}\nContractor Net Margin: +₹${netContractorMarginToday.toLocaleString('en-IN')}`
    );
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
          <Text style={styles.headerTitle}>Daily Work Verification</Text>
          <Text style={styles.headerSub}>End-of-Day Inspection & Billing Audit</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TODAY'S FINANCIAL RECONCILIATION SUMMARY */}
        <View style={styles.reconciliationCard}>
          <View style={styles.recRow}>
            <View style={styles.recCol}>
              <Text style={styles.recLabel}>Work Done Today</Text>
              <Text style={styles.recValGreen}>
                ₹{totalWorkValueToday.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.recSub}>Contract Output</Text>
            </View>
            <View style={styles.recDivider} />
            <View style={styles.recCol}>
              <Text style={styles.recLabel}>Worker Wages</Text>
              <Text style={styles.recValRed}>
                -₹{totalWageToday.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.recSub}>Today&apos;s Payroll</Text>
            </View>
            <View style={styles.recDivider} />
            <View style={styles.recCol}>
              <Text style={styles.recLabel}>Net Margin</Text>
              <Text style={netContractorMarginToday >= 0 ? styles.recValGold : styles.recValRed}>
                ₹{netContractorMarginToday.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.recSub}>Gross Profit</Text>
            </View>
          </View>
        </View>

        {/* WORK INSPECTION INPUTS FOR EACH REQUIREMENT */}
        <Text style={styles.sectionHeaderTitle}>Site Inspection: Quantities Completed Today</Text>
        <Text style={styles.sectionHeaderSub}>
          Enter measured progress for each trade item executed on site during today&apos;s shift
        </Text>

        <View style={styles.itemsList}>
          {project.scopeItems.map((item) => {
            const enteredQty = parseFloat(quantitiesToday[item.id] || '0');
            const calculatedVal =
              !isNaN(enteredQty) && enteredQty > 0 ? enteredQty * item.ratePerUnit : 0;
            const remaining = Math.max(0, item.quantity - item.completedQuantity);

            return (
              <View key={item.id} style={styles.inspectionCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemNameText}>{item.name}</Text>
                    <Text style={styles.itemMetaText}>
                      Contract: {item.quantity} {item.unit} • Completed: {item.completedQuantity} {item.unit} • Remaining: {remaining} {item.unit}
                    </Text>
                  </View>
                  <View style={styles.rateTag}>
                    <Text style={styles.rateTagText}>
                      ₹{item.ratePerUnit}/{item.unit}
                    </Text>
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Quantity Done Today ({item.unit})</Text>
                    <TextInput
                      style={styles.qtyInput}
                      placeholder={`0 ${item.unit}`}
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      value={quantitiesToday[item.id] || ''}
                      onChangeText={(t) => handleQtyChange(item.id, t)}
                    />
                  </View>

                  <View style={styles.valPreviewCol}>
                    <Text style={styles.inputLabel}>Today&apos;s Value</Text>
                    <View style={styles.valPreviewBox}>
                      <Text style={styles.valPreviewText}>
                        ₹{calculatedVal.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* VERIFICATION & BILL GENERATE CTA BUTTON */}
        <Pressable
          style={styles.verifyActionBtn}
          onPress={handleVerifyAndGenerateDailyBill}
        >
          <CheckCircleIcon size={18} color="#0B0E14" />
          <Text style={styles.verifyActionBtnText}>
            Verify Work & Lock Today&apos;s Daily Bill (₹{totalWorkValueToday.toLocaleString('en-IN')})
          </Text>
        </Pressable>

        {/* RECENT INSPECTION AUDIT LOGS */}
        {project.dailyReports.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionHeaderTitle}>Verified Daily Site Logs</Text>
            {project.dailyReports.map((report) => (
              <View key={report.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View style={styles.historyHeaderLeft}>
                    <ShieldCheckIcon size={14} color="#10B981" />
                    <Text style={styles.historyDateText}>{report.date}</Text>
                  </View>
                  <View style={styles.historyVerifiedBadge}>
                    <Text style={styles.historyVerifiedBadgeText}>VERIFIED</Text>
                  </View>
                </View>

                <View style={styles.historyMetricsRow}>
                  <View style={styles.historyMetric}>
                    <Text style={styles.historyMetricLabel}>Work Done</Text>
                    <Text style={styles.historyMetricValGreen}>
                      ₹{report.totalWorkValueToday.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.historyMetric}>
                    <Text style={styles.historyMetricLabel}>Wages Paid</Text>
                    <Text style={styles.historyMetricValRed}>
                      ₹{report.totalWorkerWageToday.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.historyMetric}>
                    <Text style={styles.historyMetricLabel}>Net Margin</Text>
                    <Text style={styles.historyMetricValGold}>
                      ₹{report.contractorMarginToday.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  reconciliationCard: {
    backgroundColor: '#111622',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E2638',
    marginBottom: 16,
  },
  recRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recCol: {
    flex: 1,
  },
  recDivider: {
    width: 1,
    backgroundColor: '#1E2638',
    marginHorizontal: 10,
  },
  recLabel: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 9.5,
    marginBottom: 2,
  },
  recValGreen: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 14.5,
    marginBottom: 1,
  },
  recValRed: {
    fontFamily: fonts.displayBold,
    color: '#EF4444',
    fontSize: 14.5,
    marginBottom: 1,
  },
  recValGold: {
    fontFamily: fonts.displayBold,
    color: '#F59E0B',
    fontSize: 14.5,
    marginBottom: 1,
  },
  recSub: {
    fontFamily: fonts.body,
    color: '#94A3B8',
    fontSize: 9.5,
  },
  sectionHeaderTitle: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 13.5,
    marginBottom: 2,
  },
  sectionHeaderSub: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 11,
    marginBottom: 12,
  },
  itemsList: {
    gap: 10,
    marginBottom: 18,
  },
  inspectionCard: {
    backgroundColor: '#111622',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E2638',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  itemNameText: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 13,
    marginBottom: 2,
  },
  itemMetaText: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 10,
  },
  rateTag: {
    backgroundColor: '#161D2C',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#242F44',
  },
  rateTagText: {
    fontFamily: fonts.displayBold,
    color: '#38BDF8',
    fontSize: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  inputCol: {
    flex: 1.2,
  },
  inputLabel: {
    fontFamily: fonts.body,
    color: '#94A3B8',
    fontSize: 10,
    marginBottom: 4,
  },
  qtyInput: {
    backgroundColor: '#151C2C',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#28354D',
    color: '#F8FAFC',
    fontFamily: fonts.displayBold,
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  valPreviewCol: {
    flex: 1,
  },
  valPreviewBox: {
    backgroundColor: '#0E121B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A2130',
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valPreviewText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 13,
  },
  verifyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 22,
  },
  verifyActionBtnText: {
    fontFamily: fonts.displayBold,
    color: '#0B0E14',
    fontSize: 12.5,
  },
  historySection: {
    gap: 10,
  },
  historyCard: {
    backgroundColor: '#111622',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E2638',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2130',
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDateText: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 12,
  },
  historyVerifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyVerifiedBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  historyMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyMetric: {
    flex: 1,
  },
  historyMetricLabel: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 9.5,
    marginBottom: 1,
  },
  historyMetricValGreen: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 12.5,
  },
  historyMetricValRed: {
    fontFamily: fonts.displayBold,
    color: '#EF4444',
    fontSize: 12.5,
  },
  historyMetricValGold: {
    fontFamily: fonts.displayBold,
    color: '#F59E0B',
    fontSize: 12.5,
  },
});
