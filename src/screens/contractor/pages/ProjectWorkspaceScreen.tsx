import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { fonts } from '../../../theme/tokens';
import {
  ContractorProjectDetail,
  ProjectScopeItem,
  WorkerRecord,
  AttendanceEntry,
  DailyWorkReport,
  ClientTransaction,
  ProjectChatState,
} from '../../../types/contractor';
import {
  MapPinIcon,
  CrewIcon,
  FileTextIcon,
  RulerSquareIcon,
  CheckCircleIcon,
  CurrencyRupeeIcon,
  ArrowLeftIcon,
  PhoneIcon,
  CopyIcon,
  SlidersIcon,
  ArrowUpIcon,
} from '../../../components/ContractorIcons';
import { FolderCard } from '../../../components/FolderCard';
import {
  FadeInSlide,
  SpringPressable,
  PulsingDot,
} from '../../../components/AnimatedComponents';
import { ScopeRequirementsScreen } from './ScopeRequirementsScreen';
import { WorkerAttendanceScreen } from './WorkerAttendanceScreen';
import { DailyWorkVerificationScreen } from './DailyWorkVerificationScreen';
import { FinancialLedgerScreen } from './FinancialLedgerScreen';
import { PdfBillModal } from './PdfBillModal';
import { ProjectChatScreen } from './ProjectChatScreen';

interface ProjectWorkspaceScreenProps {
  project: ContractorProjectDetail;
  onBack: () => void;
  onUpdateProject: (updated: ContractorProjectDetail) => void;
}

type SubScreenType = 'overview' | 'scope' | 'attendance' | 'daily_verification' | 'ledger' | 'chat';

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

  const executionPct = totalScopeValue > 0 ? Math.round((totalCompletedValue / totalScopeValue) * 100) : 0;
  const workersOnSiteToday = project.todayAttendance.filter((a) => a.status === 'present').length;

  const handleCopyCode = () => {
    Alert.alert('Client Code Copied', `Code ${project.clientCode} copied to clipboard.`);
  };

  const handleCallClient = () => {
    Alert.alert('Call Client', `Dialing ${project.clientName} at ${project.clientPhone}...`);
  };

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

  const handleUpdateChatState = (updatedChatState: ProjectChatState) => {
    const updated: ContractorProjectDetail = {
      ...project,
      chatState: updatedChatState,
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

  if (subScreen === 'chat') {
    return (
      <ProjectChatScreen
        project={project}
        onBack={() => setSubScreen('overview')}
        onUpdateChatState={handleUpdateChatState}
      />
    );
  }

  return (
    <View style={styles.rootContainer}>
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

          <Text style={styles.headerTitle} numberOfLines={1}>
            Site Workspace
          </Text>

          <View style={styles.headerRightControls}>
            <SpringPressable
              style={styles.clientCodeBadge}
              onPress={handleCopyCode}
              scaleTo={0.94}
              hitSlop={6}
            >
              <Text style={styles.clientCodeText}>{project.clientCode}</Text>
              <CopyIcon size={12} color="#FFFFFF" />
            </SpringPressable>

            <SpringPressable
              style={styles.circleHeaderBtn}
              onPress={handleCallClient}
              scaleTo={0.92}
              hitSlop={8}
            >
              <PhoneIcon size={15} color="#FFFFFF" />
            </SpringPressable>
          </View>
        </View>
      </FadeInSlide>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. PROJECT HERO COCKPIT CARD */}
        <FadeInSlide delay={100} distance={18}>
          <View style={styles.projectHeroCard}>
            <View style={styles.heroStatusRow}>
              <View style={styles.statusTag}>
                <PulsingDot size={6} color="#10B981" />
                <Text style={styles.statusTagText}>ACTIVE SITE</Text>
              </View>
              <Text style={styles.startDateText}>Started {project.startDate}</Text>
            </View>

            <Text style={styles.heroProjectTitle}>{project.projectName}</Text>

            <View style={styles.clientInfoRow}>
              <Text style={styles.clientNameText}>Client: {project.clientName}</Text>
              <Text style={styles.clientPhoneText}>({project.clientPhone})</Text>
            </View>

            <View style={styles.addressRow}>
              <MapPinIcon size={13} color="#7E7E86" />
              <Text style={styles.addressText} numberOfLines={1}>
                {project.siteAddress}
              </Text>
            </View>

            {/* Progress Track */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Execution Progress</Text>
                <Text style={styles.progressValue}>{executionPct}% Completed</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(executionPct, 100)}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </FadeInSlide>

        {/* 3. 2-COLUMN FINANCIAL KPI FOLDER CARDS (MATCHING REFERENCE) */}
        <FadeInSlide delay={160} distance={20}>
          <View style={styles.gridRow}>
            <View style={styles.gridColumn}>
              <FolderCard
                title="Work Done"
                subtitle={`₹${(totalCompletedValue / 100000).toFixed(1)}L (${executionPct}%)`}
                icon={<RulerSquareIcon size={20} color="#7E7E86" />}
                onPress={() => setSubScreen('scope')}
              />
            </View>

            <View style={styles.gridColumn}>
              <FolderCard
                title="Cash Collected"
                subtitle={`₹${(totalReceivedFromClient / 100000).toFixed(1)}L`}
                icon={<CurrencyRupeeIcon size={20} color="#7E7E86" />}
                onPress={() => setSubScreen('ledger')}
              />
            </View>
          </View>
        </FadeInSlide>

        {/* 4. MIDDLE HORIZONTAL PILL CARD FOR RA BILL PDF (MATCHING REFERENCE) */}
        <FadeInSlide delay={220} distance={20}>
          <SpringPressable
            style={styles.middlePillCard}
            onPress={() => setShowPdfModal(true)}
            scaleTo={0.97}
          >
            <View style={styles.middlePillLeft}>
              <Text style={styles.middlePillTitle}>Generate RA Bill PDF</Text>
              <Text style={styles.middlePillSubtitle}>
                Itemized measurement invoice with digital seal
              </Text>
            </View>

            <View style={styles.middlePillRight}>
              <View style={styles.countBadge}>
                <FileTextIcon size={15} color="#FFFFFF" />
              </View>
              <View style={styles.middleIconWrapper}>
                <SlidersIcon size={15} color="#5A5A64" />
              </View>
            </View>
          </SpringPressable>
        </FadeInSlide>

        {/* 5. 2-COLUMN MANAGEMENT MODULES GRID (MATCHING REFERENCE) */}
        <FadeInSlide delay={280} distance={20}>
          <View style={styles.gridRow}>
            <View style={styles.gridColumn}>
              <FolderCard
                title="Scope & Rates"
                subtitle={`${project.scopeItems.length} items`}
                icon={<RulerSquareIcon size={20} color="#7E7E86" />}
                badgeCount={project.scopeItems.length}
                onPress={() => setSubScreen('scope')}
              />
            </View>

            <View style={styles.gridColumn}>
              <FolderCard
                title="Site Crew"
                subtitle={`${workersOnSiteToday}/${project.workers.length} on site`}
                icon={<CrewIcon size={20} color="#7E7E86" />}
                badgeCount={workersOnSiteToday}
                onPress={() => setSubScreen('attendance')}
              />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridColumn}>
              <FolderCard
                title="Daily Logs"
                subtitle={`${project.dailyReports.length} audits verified`}
                icon={<CheckCircleIcon size={20} color="#7E7E86" />}
                badgeCount={project.dailyReports.length}
                onPress={() => setSubScreen('daily_verification')}
              />
            </View>

            <View style={styles.gridColumn}>
              <FolderCard
                title="Site Ledger"
                subtitle={`${project.transactions.length} records`}
                icon={<CurrencyRupeeIcon size={20} color="#7E7E86" />}
                badgeCount={project.transactions.length}
                onPress={() => setSubScreen('ledger')}
              />
            </View>
          </View>
        </FadeInSlide>
      </ScrollView>

      {/* 6. FLOATING BOTTOM SPOTLIGHT CARD FOR SITE TEAM CHAT (MATCHING REFERENCE) */}
      <FadeInSlide delay={340} distance={30} style={styles.floatingCardWrapper}>
        <SpringPressable
          style={styles.floatingCard}
          onPress={() => setSubScreen('chat')}
          scaleTo={0.98}
        >
          {/* Top Drag Handle Notch Pill */}
          <View style={styles.dragHandle} />

          <View style={styles.floatingCardContent}>
            <View style={styles.floatingCardTextCol}>
              <Text style={styles.floatingCardMetric}>Site Team Feed</Text>
              <View style={styles.statusSubRow}>
                <PulsingDot size={6} color="#10B981" />
                <Text style={styles.floatingCardSub} numberOfLines={1}>
                  {project.chatState?.messages?.length || 0} messages · Live site chat
                </Text>
              </View>
            </View>

            {/* Circular Action Button with Arrow Up */}
            <SpringPressable
              style={styles.floatingActionCircle}
              onPress={() => setSubScreen('chat')}
              scaleTo={0.90}
              hitSlop={6}
            >
              <ArrowUpIcon size={20} color="#FFFFFF" />
            </SpringPressable>
          </View>
        </SpringPressable>
      </FadeInSlide>

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
  rootContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#121216',
    backgroundColor: '#000000',
  },
  circleHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C1C22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#24242C',
  },
  circleHeaderBtnPressed: {
    backgroundColor: '#2A2A32',
    transform: [{ scale: 0.95 }],
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clientCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C22',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#24242C',
    gap: 6,
  },
  clientCodeText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 160,
  },
  projectHeroCard: {
    backgroundColor: '#16161A',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#222228',
    marginBottom: 14,
  },
  heroStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusTagText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  startDateText: {
    fontFamily: fonts.body,
    color: '#7E7E86',
    fontSize: 12,
  },
  heroProjectTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 22,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  clientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  clientNameText: {
    fontFamily: fonts.bodyMedium,
    color: '#E2E2E8',
    fontSize: 13,
  },
  clientPhoneText: {
    fontFamily: fonts.body,
    color: '#7E7E86',
    fontSize: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  addressText: {
    fontFamily: fonts.body,
    color: '#7E7E86',
    fontSize: 12.5,
    flex: 1,
  },
  progressContainer: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#222228',
    paddingTop: 14,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#8E8E93',
    fontSize: 12,
  },
  progressValue: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 12.5,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#202028',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  gridColumn: {
    flex: 1,
  },
  middlePillCard: {
    backgroundColor: '#16161A',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#222228',
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  middlePillLeft: {
    flex: 1,
    gap: 3,
  },
  middlePillTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16.5,
    letterSpacing: -0.2,
  },
  middlePillSubtitle: {
    fontFamily: fonts.body,
    color: '#7E7E86',
    fontSize: 12.5,
  },
  middlePillRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#202026',
    borderWidth: 1,
    borderColor: '#2C2C34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleIconWrapper: {
    opacity: 0.7,
  },
  floatingCardWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 18,
    right: 18,
  },
  floatingCard: {
    backgroundColor: '#1F1F25',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#2A2A34',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4C4C56',
    alignSelf: 'center',
    marginBottom: 12,
  },
  floatingCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floatingCardTextCol: {
    flex: 1,
    gap: 2,
  },
  floatingCardMetric: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 24,
    letterSpacing: -0.4,
  },
  statusSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  floatingCardSub: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 13,
  },
  floatingActionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#34343E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#42424E',
  },
});

