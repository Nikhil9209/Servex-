import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { fonts } from '../../../theme/tokens';
import {
  ContractorProjectDetail,
  ProjectScopeItem,
  WorkerRecord,
  AttendanceEntry,
  DailyWorkReport,
  ClientTransaction,
} from '../../../types/contractor';
import { MapPinIcon, CrewIcon } from '../../../components/ContractorIcons';
import { ScopeRequirementsScreen } from './ScopeRequirementsScreen';
import { WorkerAttendanceScreen } from './WorkerAttendanceScreen';
import { DailyWorkVerificationScreen } from './DailyWorkVerificationScreen';
import { FinancialLedgerScreen } from './FinancialLedgerScreen';
import { PdfBillModal } from './PdfBillModal';

interface ProjectWorkspaceScreenProps {
  project: ContractorProjectDetail;
  onBack: () => void;
  onUpdateProject: (updated: ContractorProjectDetail) => void;
}

type SubScreenType = 'overview' | 'scope' | 'attendance' | 'daily_verification' | 'ledger';

export const ProjectWorkspaceScreen: React.FC<ProjectWorkspaceScreenProps> = ({
  project,
  onBack,
  onUpdateProject,
}) => {
  const [subScreen, setSubScreen] = useState<SubScreenType>('overview');
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Financial calculations
  const totalScopeValue = project.scopeItems.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalCompletedValue = project.scopeItems.reduce(
    (sum, item) => sum + item.completedQuantity * item.ratePerUnit,
    0
  );

  const totalReceivedFromClient = project.transactions
    .filter((t) => t.type === 'received_from_client')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaidToWorkers = project.transactions
    .filter((t) => t.type === 'paid_to_worker')
    .reduce((sum, t) => sum + t.amount, 0);

  const balanceDue = totalCompletedValue - totalReceivedFromClient;

  // Handlers for updating sub-components
  const handleAddScopeItem = (newItem: Omit<ProjectScopeItem, 'id' | 'completedQuantity'>) => {
    const created: ProjectScopeItem = {
      ...newItem,
      id: `sc-${Date.now()}`,
      completedQuantity: 0,
    };
    const updated: ContractorProjectDetail = {
      ...project,
      scopeItems: [...project.scopeItems, created],
    };
    onUpdateProject(updated);
  };

  const handleAddWorker = (newWorker: Omit<WorkerRecord, 'id'>) => {
    const created: WorkerRecord = {
      ...newWorker,
      id: `w-${Date.now()}`,
    };
    const newAttendance: AttendanceEntry = {
      workerId: created.id,
      workerName: created.name,
      role: created.role,
      dailyWage: created.dailyWage,
      date: 'Today',
      status: 'present',
      checkInTime: '09:00 AM',
      proofVerified: false,
      proofNote: 'Newly enrolled',
      wageCalculated: created.dailyWage,
    };
    const updated: ContractorProjectDetail = {
      ...project,
      workers: [...project.workers, created],
      todayAttendance: [...project.todayAttendance, newAttendance],
    };
    onUpdateProject(updated);
  };

  const handleUpdateAttendance = (newAttendanceList: AttendanceEntry[]) => {
    const updated: ContractorProjectDetail = {
      ...project,
      todayAttendance: newAttendanceList,
    };
    onUpdateProject(updated);
  };

  const handleSaveDailyReport = (report: DailyWorkReport) => {
    // Update completed quantity on scope items according to today's report
    const updatedScope = project.scopeItems.map((item) => {
      const match = report.items.find((i) => i.scopeItemId === item.id);
      if (match) {
        return {
          ...item,
          completedQuantity: Math.min(item.quantity, item.completedQuantity + match.qtyDoneToday),
        };
      }
      return item;
    });

    const updated: ContractorProjectDetail = {
      ...project,
      scopeItems: updatedScope,
      dailyReports: [report, ...project.dailyReports],
    };
    onUpdateProject(updated);
  };

  const handleAddTransaction = (newTx: Omit<ClientTransaction, 'id'>) => {
    const created: ClientTransaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
    };
    const updated: ContractorProjectDetail = {
      ...project,
      transactions: [created, ...project.transactions],
    };
    onUpdateProject(updated);
  };

  // Sub-screens routing
  if (subScreen === 'scope') {
    return (
      <ScopeRequirementsScreen
        project={project}
        onBack={() => setSubScreen('overview')}
        onAddScopeItem={handleAddScopeItem}
      />
    );
  }

  if (subScreen === 'attendance') {
    return (
      <WorkerAttendanceScreen
        project={project}
        onBack={() => setSubScreen('overview')}
        onAddWorker={handleAddWorker}
        onUpdateAttendance={handleUpdateAttendance}
      />
    );
  }

  if (subScreen === 'daily_verification') {
    return (
      <DailyWorkVerificationScreen
        project={project}
        onBack={() => setSubScreen('overview')}
        onSaveDailyReport={handleSaveDailyReport}
      />
    );
  }

  if (subScreen === 'ledger') {
    return (
      <FinancialLedgerScreen
        project={project}
        onBack={() => setSubScreen('overview')}
        onAddTransaction={handleAddTransaction}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* TOP HEADER */}
      <View style={styles.topHeader}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backBtnText}>‹ Back to Projects</Text>
        </Pressable>
        <View style={styles.clientCodeBadge}>
          <Text style={styles.clientCodeText}>CODE: {project.clientCode}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* PROJECT PARTICULARS CARD */}
        <View style={styles.projectHeroCard}>
          <View style={styles.heroStatusRow}>
            <View style={styles.activeTag}>
              <View style={styles.greenPulse} />
              <Text style={styles.activeTagText}>LINKED CLIENT PROJECT</Text>
            </View>
            <Text style={styles.startDateText}>Started: {project.startDate}</Text>
          </View>

          <Text style={styles.heroProjectTitle}>{project.projectName}</Text>
          <Text style={styles.heroClientName}>Client: {project.clientName}</Text>

          <View style={styles.heroAddressRow}>
            <MapPinIcon size={13} color="#71717A" />
            <Text style={styles.heroAddressText} numberOfLines={1}>
              {project.siteAddress}
            </Text>
          </View>

          <View style={styles.workforceBar}>
            <CrewIcon size={14} color="#FFFFFF" />
            <Text style={styles.workforceText}>
              {project.workers.length} Workers Enrolled • {project.todayAttendance.filter((a) => a.status === 'present').length} On Site Today
            </Text>
          </View>
        </View>

        {/* WORK COMPLETED & CASHFLOW SUMMARY */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>Work Done Till Date</Text>
              <Text style={styles.kpiVal}>₹{totalCompletedValue.toLocaleString('en-IN')}</Text>
              <Text style={styles.kpiSub}>Scope: ₹{totalScopeValue.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>Received from Client</Text>
              <Text style={styles.kpiValGreen}>
                ₹{totalReceivedFromClient.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.kpiSub}>Paid to Workers: ₹{totalPaidToWorkers.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Current Balance Payable by Client:</Text>
            <Text style={styles.balanceAmount}>
              ₹{Math.max(0, balanceDue).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* ONE-CLICK CREATE BILL PDF CTA */}
        <Pressable
          style={styles.oneClickPdfBtn}
          onPress={() => setShowPdfModal(true)}
        >
          <View style={styles.oneClickPdfIconBox}>
            <Text style={styles.oneClickPdfIcon}>📄</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.oneClickPdfTitle}>1-Click Generate Bill PDF</Text>
            <Text style={styles.oneClickPdfSub}>
              Itemized measurement sheet of all work done till date with unit rates
            </Text>
          </View>
          <Text style={styles.oneClickPdfArrow}>➔</Text>
        </Pressable>

        {/* DEDICATED SEPARATE PAGES NAVIGATION */}
        <Text style={styles.sectionHeaderTitle}>Project Management Modules</Text>

        <View style={styles.modulesStack}>
          {/* 1. Requirements & Scope of Work */}
          <Pressable
            style={styles.moduleCard}
            onPress={() => setSubScreen('scope')}
          >
            <View style={styles.moduleIconBox}>
              <Text style={styles.moduleIcon}>📐</Text>
            </View>
            <View style={styles.moduleInfo}>
              <Text style={styles.moduleTitle}>Requirements & Rates</Text>
              <Text style={styles.moduleDesc}>
                Add items, dimensions, and rates per sqft or rft ({project.scopeItems.length} items defined)
              </Text>
            </View>
            <Text style={styles.moduleChevron}>›</Text>
          </Pressable>

          {/* 2. Workforce & Daily Attendance */}
          <Pressable
            style={styles.moduleCard}
            onPress={() => setSubScreen('attendance')}
          >
            <View style={styles.moduleIconBox}>
              <Text style={styles.moduleIcon}>👷‍♂️</Text>
            </View>
            <View style={styles.moduleInfo}>
              <Text style={styles.moduleTitle}>Workers & Attendance</Text>
              <Text style={styles.moduleDesc}>
                Mark present/absent with on-time proof verification ({project.workers.length} crew members)
              </Text>
            </View>
            <Text style={styles.moduleChevron}>›</Text>
          </Pressable>

          {/* 3. Daily Work Verification */}
          <Pressable
            style={styles.moduleCard}
            onPress={() => setSubScreen('daily_verification')}
          >
            <View style={styles.moduleIconBox}>
              <Text style={styles.moduleIcon}>✓</Text>
            </View>
            <View style={styles.moduleInfo}>
              <Text style={styles.moduleTitle}>Daily Work Verification</Text>
              <Text style={styles.moduleDesc}>
                End-of-day site inspection and auto-generate today&apos;s daily bill
              </Text>
            </View>
            <Text style={styles.moduleChevron}>›</Text>
          </Pressable>

          {/* 4. Financial Ledger */}
          <Pressable
            style={styles.moduleCard}
            onPress={() => setSubScreen('ledger')}
          >
            <View style={styles.moduleIconBox}>
              <Text style={styles.moduleIcon}>💰</Text>
            </View>
            <View style={styles.moduleInfo}>
              <Text style={styles.moduleTitle}>Financial Ledger</Text>
              <Text style={styles.moduleDesc}>
                Track client payments received vs. wages paid to your workers
              </Text>
            </View>
            <Text style={styles.moduleChevron}>›</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* PDF BILL MODAL */}
      <PdfBillModal
        visible={showPdfModal}
        project={project}
        onClose={() => setShowPdfModal(false)}
      />
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
    paddingHorizontal: 6,
  },
  backBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 13.5,
  },
  clientCodeBadge: {
    backgroundColor: '#1E232E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A3240',
  },
  clientCodeText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 36,
  },
  projectHeroCard: {
    backgroundColor: '#111317',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#20242D',
    marginBottom: 14,
  },
  heroStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 6,
  },
  greenPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeTagText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 9.5,
    letterSpacing: 0.6,
  },
  startDateText: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
  },
  heroProjectTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 3,
  },
  heroClientName: {
    fontFamily: fonts.bodyMedium,
    color: '#D4D4D8',
    fontSize: 13,
    marginBottom: 6,
  },
  heroAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  heroAddressText: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11.5,
  },
  workforceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161A22',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    gap: 8,
  },
  workforceText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 11.5,
  },
  kpiCard: {
    backgroundColor: '#111317',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#20242D',
    marginBottom: 14,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  kpiCol: {
    flex: 1,
  },
  kpiDivider: {
    width: 1,
    backgroundColor: '#20242D',
    marginHorizontal: 12,
  },
  kpiLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10.5,
    marginBottom: 3,
  },
  kpiVal: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 2,
  },
  kpiValGreen: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 16,
    marginBottom: 2,
  },
  kpiSub: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E232E',
    paddingTop: 8,
  },
  balanceLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 11.5,
  },
  balanceAmount: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  oneClickPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
    gap: 12,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  oneClickPdfIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oneClickPdfIcon: {
    fontSize: 18,
  },
  oneClickPdfTitle: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 14,
    marginBottom: 2,
  },
  oneClickPdfSub: {
    fontFamily: fonts.body,
    color: '#475569',
    fontSize: 11,
    lineHeight: 15,
  },
  oneClickPdfArrow: {
    fontSize: 16,
    color: '#000000',
    fontWeight: 'bold',
  },
  sectionHeaderTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 10,
  },
  modulesStack: {
    gap: 10,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111317',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#20242D',
    gap: 12,
  },
  moduleIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1A1E26',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#242A36',
  },
  moduleIcon: {
    fontSize: 17,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13.5,
    marginBottom: 2,
  },
  moduleDesc: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
    lineHeight: 15,
  },
  moduleChevron: {
    fontFamily: fonts.displayBold,
    color: '#71717A',
    fontSize: 20,
    paddingRight: 4,
  },
});
