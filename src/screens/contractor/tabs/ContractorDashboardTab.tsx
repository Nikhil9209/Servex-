import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { fonts } from '../../../theme/tokens';
import { User } from '../../../types/auth';
import { MapPinIcon, CrewIcon, BuildingIcon } from '../../../components/ContractorIcons';

export interface ContractorProject {
  id: string;
  clientDeveloper: string;
  projectTitle: string;
  contractValue: number;
  progressiveBilled: number;
  siteLocation: string;
  crewLead: string;
  crewAssignedCount: number;
  status: 'active' | 'tender' | 'completed';
  progressPct: number;
  safetyScore: number;
  milestones: {
    id: string;
    title: string;
    stage: string;
    completed: boolean;
    certifiedByArchitect: boolean;
  }[];
}

interface ContractorDashboardTabProps {
  user: User;
  isOperating: boolean;
  onToggleOperating: () => void;
  tenderTapped: (tenderId: string) => void;
  activeProjects: ContractorProject[];
  onToggleMilestone: (projectId: string, milestoneId: string) => void;
  onSelectTab: (tab: 'dashboard' | 'jobs' | 'earnings' | 'profile') => void;
}

export const ContractorDashboardTab: React.FC<ContractorDashboardTabProps> = ({
  user,
  isOperating,
  onToggleOperating,
  tenderTapped,
  activeProjects,
  onToggleMilestone,
  onSelectTab,
}) => {
  const primaryProject = activeProjects[0];
  const totalCrewDeployed = activeProjects.reduce((sum, p) => sum + p.crewAssignedCount, 0);
  const totalContractPortfolio = activeProjects.reduce((sum, p) => sum + p.contractValue, 0);

  const handleContractorTool = (tool: string) => {
    Alert.alert(`Servex Prime Tool: ${tool}`, `Launching ${tool} module for authorized general contractors.`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* PRIME CONTRACTOR FIRM STATUS BAR */}
      <View style={styles.statusBar}>
        <View style={styles.contractorBadgeGroup}>
          <View style={styles.avatarPill}>
            <Text style={styles.avatarInitial}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>
          <View>
            <Text style={styles.contractorName} numberOfLines={1}>
              {user.name ? `${user.name} Contracting & Infra` : 'Prime Contracting Group'}
            </Text>
            <View style={styles.tradeTagRow}>
              <View style={styles.tradeBadge}>
                <Text style={styles.tradeBadgeText}>CLASS-1 PRIME CONTRACTOR</Text>
              </View>
              <Text style={styles.zoneText}>• Metro Sector</Text>
            </View>
          </View>
        </View>

        {/* Operating / Mobilized Switch */}
        <Pressable
          style={[styles.statusToggle, isOperating ? styles.toggleOperating : styles.toggleStandby]}
          onPress={onToggleOperating}
          accessibilityRole="switch"
          accessibilityLabel={isOperating ? 'Sites Mobilized' : 'Standby'}
        >
          <View style={[styles.statusDot, isOperating ? styles.dotOperating : styles.dotStandby]} />
          <Text style={[styles.statusText, isOperating ? styles.textOperating : styles.textStandby]}>
            {isOperating ? 'MOBILIZED' : 'STANDBY'}
          </Text>
        </Pressable>
      </View>

      {/* EXECUTIVE CONTRACTOR KPIS */}
      <View style={styles.metricsGrid}>
        <Pressable style={styles.metricCard} onPress={() => onSelectTab('earnings')}>
          <Text style={styles.metricLabel}>Active Portfolio</Text>
          <Text style={styles.metricValue}>
            ₹{(totalContractPortfolio / 100000).toFixed(1)}L
          </Text>
          <Text style={styles.metricTrend}>3 Active Sites</Text>
        </Pressable>

        <Pressable style={styles.metricCard} onPress={() => onSelectTab('jobs')}>
          <Text style={styles.metricLabel}>Crew Deployed</Text>
          <Text style={styles.metricValue}>{totalCrewDeployed} Workers</Text>
          <Text style={styles.metricTrend}>Across 3 Foreman Teams</Text>
        </Pressable>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Safety Audit</Text>
          <Text style={styles.metricValue}>100%</Text>
          <Text style={styles.metricTrend}>Zero Site Incidents</Text>
        </View>
      </View>

      {/* COMMERCIAL PROJECT TENDER ALERT (HIGH-VALUE CONTRACT BIDDING) */}
      <View style={styles.tenderContainer}>
        <View style={styles.tenderHeader}>
          <View style={styles.tenderBadge}>
            <BuildingIcon size={12} color="#F59E0B" />
            <Text style={styles.tenderBadgeText}>NEW COMMERCIAL TENDER RFP</Text>
          </View>
          <Text style={styles.tenderCountdown}>Bidding closes in 48h</Text>
        </View>

        <Text style={styles.tenderTitle}>
          Godrej Horizon Phase-2: HT Substation & 3-Phase Busbar Infrastructure
        </Text>
        <Text style={styles.tenderClient}>
          Client Developer: Godrej Properties Ltd. • PMC: Larsen & Toubro
        </Text>

        <View style={styles.tenderMetaRow}>
          <View style={styles.tenderMetaItem}>
            <MapPinIcon size={13} color="#A1A1AA" />
            <Text style={styles.tenderMetaText}>Vikhroli Commercial Zone, Mumbai</Text>
          </View>
        </View>

        <View style={styles.tenderFooter}>
          <View>
            <Text style={styles.tenderValLabel}>Contract Estimate</Text>
            <Text style={styles.tenderValAmount}>₹18,50,000</Text>
          </View>

          <View style={styles.tenderActions}>
            <Pressable
              style={styles.reviewSpecsBtn}
              onPress={() => tenderTapped('godrej-horizon')}
            >
              <Text style={styles.reviewSpecsBtnText}>Review BOQ & CAD</Text>
            </Pressable>

            <Pressable
              style={styles.submitBidBtn}
              onPress={() =>
                Alert.alert(
                  'Submit Contractor Tender',
                  'Submit formal bid proposal for Godrej Horizon Phase-2 at ₹18,50,000?'
                )
              }
            >
              <Text style={styles.submitBidBtnText}>Submit Bid ➔</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* PRIMARY ACTIVE CONTRACT / SITE MANAGEMENT */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Prime Project Execution</Text>
        <Pressable onPress={() => onSelectTab('jobs')}>
          <Text style={styles.sectionAction}>All Contracts ({activeProjects.length}) ➔</Text>
        </Pressable>
      </View>

      {primaryProject && (
        <View style={styles.activeProjectCard}>
          <View style={styles.projectHeaderRow}>
            <View>
              <View style={styles.statusPillActive}>
                <Text style={styles.statusPillActiveText}>ACTIVE CONTRACT</Text>
              </View>
              <Text style={styles.projectTitle}>{primaryProject.projectTitle}</Text>
              <Text style={styles.developerText}>
                Developer: {primaryProject.clientDeveloper}
              </Text>
            </View>

            <View style={styles.valBox}>
              <Text style={styles.valBoxLabel}>Contract Value</Text>
              <Text style={styles.valBoxAmount}>
                ₹{(primaryProject.contractValue / 100000).toFixed(1)} Lakhs
              </Text>
            </View>
          </View>

          {/* SITE & WORKFORCE CREW BADGE */}
          <View style={styles.crewDeploymentBar}>
            <View style={styles.crewInfoItem}>
              <CrewIcon size={14} color="#FFFFFF" />
              <Text style={styles.crewInfoText}>
                {primaryProject.crewAssignedCount} Workers On-Site
              </Text>
            </View>
            <Text style={styles.crewDot}>•</Text>
            <Text style={styles.foremanText}>
              Site Supervisor: {primaryProject.crewLead}
            </Text>
          </View>

          {/* PROGRESS BAR & MILESTONES */}
          <View style={styles.progressSection}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${primaryProject.progressPct}%` },
                ]}
              />
            </View>
            <View style={styles.progressMeta}>
              <Text style={styles.progressPercentText}>
                {primaryProject.progressPct}% Milestones Handover
              </Text>
              <Text style={styles.billedText}>
                Billed: ₹{(primaryProject.progressiveBilled / 100000).toFixed(1)}L / ₹
                {(primaryProject.contractValue / 100000).toFixed(1)}L
              </Text>
            </View>
          </View>

          {/* CONTRACTOR MILESTONES VERIFICATION */}
          <View style={styles.milestoneList}>
            {primaryProject.milestones.map((m) => (
              <Pressable
                key={m.id}
                style={styles.milestoneRow}
                onPress={() => onToggleMilestone(primaryProject.id, m.id)}
              >
                <View style={[styles.mCheckbox, m.completed && styles.mCheckboxDone]}>
                  {m.completed && <Text style={styles.mCheckmark}>✓</Text>}
                </View>
                <View style={styles.mTextGroup}>
                  <Text style={[styles.mTitle, m.completed && styles.mTitleDone]}>
                    {m.title}
                  </Text>
                  <Text style={styles.mStage}>
                    Stage: {m.stage} • {m.certifiedByArchitect ? 'Certified by Architect ✓' : 'Pending Client PMC Sign-off'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* CONTRACTOR OPERATIONS BAR */}
          <View style={styles.operationsActionRow}>
            <Pressable
              style={styles.opBtnSecondary}
              onPress={() =>
                Alert.alert(
                  'Crew Roster',
                  `Deploying / Reassigning ${primaryProject.crewAssignedCount} workers on site with Foreman ${primaryProject.crewLead}.`
                )
              }
            >
              <Text style={styles.opBtnSecondaryText}>👷 Reassign Crew</Text>
            </Pressable>

            <Pressable
              style={styles.opBtnSecondary}
              onPress={() =>
                Alert.alert(
                  'Daily Safety Log',
                  '12 worker helmet/harness audits logged today with zero OSHA non-compliance.'
                )
              }
            >
              <Text style={styles.opBtnSecondaryText}>📋 Safety Log</Text>
            </Pressable>

            <Pressable
              style={styles.opBtnPrimary}
              onPress={() =>
                Alert.alert(
                  'Issue Running Account (RA) Bill',
                  `Generate next milestone progressive billing invoice for ₹4,50,000 to ${primaryProject.clientDeveloper}?`
                )
              }
            >
              <Text style={styles.opBtnPrimaryText}>Issue RA Bill ➔</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* CONTRACTOR MANAGEMENT MODULES */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>General Contractor Systems</Text>
      </View>

      <View style={styles.modulesGrid}>
        <Pressable
          style={styles.moduleBox}
          onPress={() => handleContractorTool('Workforce & Labor Roster')}
        >
          <Text style={styles.moduleIcon}>👷‍♂️</Text>
          <Text style={styles.moduleName}>Crew Dispatch</Text>
          <Text style={styles.moduleSub}>Assign workers to sites</Text>
        </Pressable>

        <Pressable
          style={styles.moduleBox}
          onPress={() => handleContractorTool('Bill of Quantities (BOQ)')}
        >
          <Text style={styles.moduleIcon}>📦</Text>
          <Text style={styles.moduleName}>Material Orders</Text>
          <Text style={styles.moduleSub}>Bulk steel, wire & cement</Text>
        </Pressable>

        <Pressable
          style={styles.moduleBox}
          onPress={() => handleContractorTool('Structural CAD Telemetry')}
        >
          <Text style={styles.moduleIcon}>📐</Text>
          <Text style={styles.moduleName}>CAD Blueprints</Text>
          <Text style={styles.moduleSub}>Architectural 5D specs</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111317',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#20242D',
    marginBottom: 16,
  },
  contractorBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarPill: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1C2028',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A303C',
    marginRight: 12,
  },
  avatarInitial: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 17,
  },
  contractorName: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14.5,
    letterSpacing: 0.2,
  },
  tradeTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  tradeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tradeBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 0.6,
  },
  zoneText: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  toggleOperating: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  toggleStandby: {
    backgroundColor: 'rgba(113, 113, 122, 0.12)',
    borderColor: 'rgba(113, 113, 122, 0.3)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotOperating: {
    backgroundColor: '#10B981',
  },
  dotStandby: {
    backgroundColor: '#71717A',
  },
  statusText: {
    fontFamily: fonts.displayBold,
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  textOperating: {
    color: '#10B981',
  },
  textStandby: {
    color: '#71717A',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#111317',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  metricLabel: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 11,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 17,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  metricTrend: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10,
  },
  tenderContainer: {
    backgroundColor: '#13161D',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262D3B',
    marginBottom: 20,
  },
  tenderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tenderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 6,
  },
  tenderBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#F59E0B',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  tenderCountdown: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 11,
  },
  tenderTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  tenderClient: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 12,
    marginBottom: 8,
  },
  tenderMetaRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tenderMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tenderMetaText: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11.5,
  },
  tenderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1E232E',
    paddingTop: 12,
  },
  tenderValLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10,
  },
  tenderValAmount: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 18,
  },
  tenderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewSpecsBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#2A303C',
  },
  reviewSpecsBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#D4D4D8',
    fontSize: 12,
  },
  submitBidBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  submitBidBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  sectionAction: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 12,
  },
  activeProjectCard: {
    backgroundColor: '#111317',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#20242D',
    marginBottom: 20,
  },
  projectHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  statusPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  statusPillActiveText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 9.5,
    letterSpacing: 0.6,
  },
  projectTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15.5,
    marginBottom: 2,
  },
  developerText: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 12,
  },
  valBox: {
    alignItems: 'flex-end',
  },
  valBoxLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10,
  },
  valBoxAmount: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
  },
  crewDeploymentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161A22',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 14,
    gap: 8,
  },
  crewInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  crewInfoText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 12,
  },
  crewDot: {
    color: '#52525B',
    fontSize: 10,
  },
  foremanText: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 12,
  },
  progressSection: {
    marginBottom: 14,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#1C2028',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPercentText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 11,
  },
  billedText: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10.5,
  },
  milestoneList: {
    backgroundColor: '#0C0D11',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  mCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#3F4450',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  mCheckboxDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  mCheckmark: {
    color: '#000000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  mTextGroup: {
    flex: 1,
  },
  mTitle: {
    fontFamily: fonts.displayBold,
    color: '#D4D4D8',
    fontSize: 12.5,
    marginBottom: 1,
  },
  mTitleDone: {
    color: '#71717A',
  },
  mStage: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
  },
  operationsActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  opBtnSecondary: {
    flex: 1,
    backgroundColor: '#181C24',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#252B38',
  },
  opBtnSecondaryText: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 11.5,
  },
  opBtnPrimary: {
    flex: 1.3,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opBtnPrimaryText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 12,
  },
  modulesGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  moduleBox: {
    flex: 1,
    backgroundColor: '#111317',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#20242D',
  },
  moduleIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  moduleName: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 11.5,
    marginBottom: 2,
    textAlign: 'center',
  },
  moduleSub: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 9.5,
    textAlign: 'center',
  },
});
