import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import {
  FadeInSlide,
  SpringPressable,
} from '../../../components/AnimatedComponents';

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
      {/* 1. TOP HEADER WITH CIRCULAR CONTROLS */}
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
            <Text style={styles.headerTitle}>Daily Work Audit</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              End-of-Day Inspection & Billing Audit
            </Text>
          </View>

          <View style={styles.headerRightPlaceholder} />
        </View>
      </FadeInSlide>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. TODAY'S FINANCIAL RECONCILIATION SUMMARY */}
        <FadeInSlide delay={80} distance={14}>
          <View style={styles.reconciliationCard}>
            <View style={styles.recRow}>
              <View style={styles.recCol}>
                <Text style={styles.recLabel}>WORK DONE TODAY</Text>
                <Text style={styles.recValGreen} numberOfLines={1}>
                  ₹{totalWorkValueToday.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.recSub}>Contract Output</Text>
              </View>
              <View style={styles.recDivider} />
              <View style={styles.recCol}>
                <Text style={styles.recLabel}>CREW WAGES</Text>
                <Text style={styles.recValRed} numberOfLines={1}>
                  -₹{totalWageToday.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.recSub}>Today&apos;s Payroll</Text>
              </View>
              <View style={styles.recDivider} />
              <View style={styles.recCol}>
                <Text style={styles.recLabel}>NET MARGIN</Text>
                <Text
                  style={[
                    styles.recValMargin,
                    netContractorMarginToday >= 0 ? styles.recValGreen : styles.recValRed,
                  ]}
                  numberOfLines={1}
                >
                  ₹{netContractorMarginToday.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.recSub}>Gross Profit</Text>
              </View>
            </View>
          </View>
        </FadeInSlide>

        {/* 3. SECTION HEADER */}
        <FadeInSlide delay={120} distance={14}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MEASURED QUANTITIES TODAY</Text>
            <Text style={styles.sectionSub}>Enter units completed during today&apos;s shift</Text>
          </View>
        </FadeInSlide>

        {/* 4. WORK INSPECTION INPUT CARDS */}
        <View style={styles.itemsList}>
          {project.scopeItems.map((item, idx) => {
            const enteredQty = parseFloat(quantitiesToday[item.id] || '0');
            const calculatedVal =
              !isNaN(enteredQty) && enteredQty > 0 ? enteredQty * item.ratePerUnit : 0;
            const remaining = Math.max(0, item.quantity - item.completedQuantity);

            return (
              <FadeInSlide key={item.id} delay={140 + idx * 40} distance={14}>
                <View style={styles.inspectionCard}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.itemNameText}>{item.name}</Text>
                      <Text style={styles.itemMetaText}>
                        Total: {item.quantity} {item.unit} • Done: {item.completedQuantity} • Left: {remaining} {item.unit}
                      </Text>
                    </View>
                    <View style={styles.rateTag}>
                      <Text style={styles.rateTagText}>
                        ₹{item.ratePerUnit} / {item.unit.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inputRow}>
                    <View style={styles.inputCol}>
                      <Text style={styles.inputLabel}>Quantity Done Today ({item.unit})</Text>
                      <TextInput
                        style={styles.qtyInput}
                        placeholder={`0 ${item.unit}`}
                        placeholderTextColor="#55555C"
                        keyboardType="numeric"
                        value={quantitiesToday[item.id] || ''}
                        onChangeText={(t) => handleQtyChange(item.id, t)}
                      />
                    </View>

                    <View style={styles.valPreviewCol}>
                      <Text style={styles.inputLabel}>Value Generated</Text>
                      <View style={styles.valPreviewBox}>
                        <Text style={styles.valPreviewText}>
                          ₹{calculatedVal.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </FadeInSlide>
            );
          })}
        </View>

        {/* 5. VERIFICATION & BILL GENERATE CTA */}
        <FadeInSlide delay={200} distance={14}>
          <SpringPressable
            style={styles.verifyActionBtn}
            onPress={handleVerifyAndGenerateDailyBill}
            scaleTo={0.96}
          >
            <CheckCircleIcon size={18} color="#000000" />
            <Text style={styles.verifyActionBtnText}>
              Verify Work & Lock Daily Bill (₹{totalWorkValueToday.toLocaleString('en-IN')})
            </Text>
          </SpringPressable>
        </FadeInSlide>

        {/* 6. VERIFIED HISTORICAL SITE LOGS */}
        {project.dailyReports.length > 0 && (
          <FadeInSlide delay={240} distance={14}>
            <View style={styles.historySection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>PREVIOUS AUDITED LOGS</Text>
                <Text style={styles.sectionSub}>{project.dailyReports.length} records</Text>
              </View>

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
                      <Text style={styles.historyMetricLabel}>WORK DONE</Text>
                      <Text style={styles.historyMetricValGreen}>
                        ₹{report.totalWorkValueToday.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.historyMetric}>
                      <Text style={styles.historyMetricLabel}>WAGES PAID</Text>
                      <Text style={styles.historyMetricValRed}>
                        -₹{report.totalWorkerWageToday.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.historyMetric}>
                      <Text style={styles.historyMetricLabel}>NET MARGIN</Text>
                      <Text style={styles.historyMetricValGold}>
                        ₹{report.contractorMarginToday.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </FadeInSlide>
        )}

        <View style={{ height: 60 }} />
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
  headerRightPlaceholder: {
    width: 44,
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

  // RECONCILIATION SUMMARY CARD
  reconciliationCard: {
    backgroundColor: '#16161A',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222228',
    marginBottom: 16,
  },
  recRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recCol: {
    flex: 1,
    alignItems: 'center',
  },
  recDivider: {
    width: 1,
    backgroundColor: '#222228',
  },
  recLabel: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 9.5,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  recValGreen: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 15,
    marginBottom: 2,
  },
  recValRed: {
    fontFamily: fonts.displayBold,
    color: '#EF4444',
    fontSize: 15,
    marginBottom: 2,
  },
  recValMargin: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    marginBottom: 2,
  },
  recSub: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 10,
  },

  // SECTION HEADERS
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  sectionSub: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 10.5,
  },

  // ITEMS LIST
  itemsList: {
    gap: 12,
    marginBottom: 18,
  },
  inspectionCard: {
    backgroundColor: '#16161A',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222228',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemNameText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 4,
  },
  itemMetaText: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 10.5,
  },
  rateTag: {
    backgroundColor: '#1F1F26',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A34',
  },
  rateTagText: {
    fontFamily: fonts.bodyMedium,
    color: '#8E8E93',
    fontSize: 10.5,
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
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 10,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  qtyInput: {
    backgroundColor: '#0C0C0E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262632',
    color: '#FFFFFF',
    fontFamily: fonts.displayBold,
    fontSize: 13.5,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  valPreviewCol: {
    flex: 1,
  },
  valPreviewBox: {
    backgroundColor: '#111114',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222228',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valPreviewText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 13.5,
  },

  // VERIFY CTA
  verifyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 8,
    marginBottom: 24,
  },
  verifyActionBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 13,
  },

  // HISTORY SECTION
  historySection: {
    gap: 10,
  },
  historyCard: {
    backgroundColor: '#16161A',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222228',
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222228',
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDateText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 12,
  },
  historyVerifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  historyVerifiedBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  historyMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyMetric: {
    flex: 1,
    alignItems: 'center',
  },
  historyMetricLabel: {
    fontFamily: fonts.displayBold,
    color: '#636366',
    fontSize: 9,
    letterSpacing: 0.4,
    marginBottom: 2,
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
