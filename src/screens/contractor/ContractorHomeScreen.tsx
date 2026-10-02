import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fonts } from '../../theme/tokens';
import { User } from '../../types/auth';
import {
  DashboardTabIcon,
  JobsTabIcon,
  EarningsTabIcon,
  ProfileTabIcon,
} from '../../components/ContractorIcons';
import { ContractorDashboardTab, ContractorProject } from './tabs/ContractorDashboardTab';
import { ContractorJobsTab } from './tabs/ContractorJobsTab';
import { ContractorEarningsTab } from './tabs/ContractorEarningsTab';
import { ContractorProfileTab } from './tabs/ContractorProfileTab';

export interface ContractorHomeScreenProps {
  user: User;
  onLogout: () => void;
  onReplaySplash?: () => void;
}

type TabType = 'dashboard' | 'jobs' | 'earnings' | 'profile';

const INITIAL_PROJECTS: ContractorProject[] = [
  {
    id: 'proj-bkc',
    clientDeveloper: 'Sunil Rao Commercial Towers',
    projectTitle: 'BKC Commercial Tower 3-Phase HT Busbar & Substation',
    contractValue: 2400000,
    progressiveBilled: 1800000,
    siteLocation: 'Bandra Kurla Complex, Tower B, Level 4',
    crewLead: 'Suresh Nair (Foreman)',
    crewAssignedCount: 12,
    status: 'active',
    progressPct: 75,
    safetyScore: 100,
    milestones: [
      { id: 'm1', title: 'Site Hazard & Arc Flash Assessment', stage: 'Engineering', completed: true, certifiedByArchitect: true },
      { id: 'm2', title: 'Main 3-Phase Busbar Isolation & Gland Fitting', stage: 'Civil & HT', completed: true, certifiedByArchitect: true },
      { id: 'm3', title: '415V HT Panel Termination & Breakers', stage: 'Electrical', completed: true, certifiedByArchitect: true },
      { id: 'm4', title: 'Insulation Resistance & Megger Testing', stage: 'Commissioning', completed: false, certifiedByArchitect: false },
    ],
  },
  {
    id: 'proj-lodha',
    clientDeveloper: 'Lodha Developers Ltd.',
    projectTitle: 'Lodha Bellissimo Central HVAC Telemetry & Chillers',
    contractValue: 1850000,
    progressiveBilled: 1250000,
    siteLocation: 'Lower Parel Commercial Zone, Mumbai',
    crewLead: 'Vikram Seth (Foreman)',
    crewAssignedCount: 8,
    status: 'active',
    progressPct: 67,
    safetyScore: 100,
    milestones: [
      { id: 'l1', title: 'Chiller Plant Stator Pull & Rigging', stage: 'Mechanical', completed: true, certifiedByArchitect: true },
      { id: 'l2', title: 'Copper Coil Rewind & Varnish Dip', stage: 'Electrical', completed: true, certifiedByArchitect: true },
      { id: 'l3', title: 'BMS Telemetry & Variable Air Damper Sensor Calibration', stage: 'Automation', completed: false, certifiedByArchitect: false },
    ],
  },
  {
    id: 'proj-andheri',
    clientDeveloper: 'Karan Johar Logistics Hub',
    projectTitle: 'Industrial Armored Conduit & Heavy Cable Tray Network',
    contractValue: 920000,
    progressiveBilled: 790000,
    siteLocation: 'Andheri East Industrial Zone, Sector 4',
    crewLead: 'Pravin Jadhav (Foreman)',
    crewAssignedCount: 8,
    status: 'active',
    progressPct: 85,
    safetyScore: 100,
    milestones: [
      { id: 'a1', title: 'Hilti Pull Testing on Overhead Trusses', stage: 'Structural', completed: true, certifiedByArchitect: true },
      { id: 'a2', title: 'Perforated Heavy Tray Alignment', stage: 'Installation', completed: true, certifiedByArchitect: true },
      { id: 'a3', title: 'Earthing Continuity & Final PMC Handover', stage: 'Testing', completed: false, certifiedByArchitect: false },
    ],
  },
  {
    id: 'proj-godrej-tender',
    clientDeveloper: 'Godrej Properties Ltd.',
    projectTitle: 'Godrej Horizon Phase-2: HT Substation & Distribution Tender',
    contractValue: 1850000,
    progressiveBilled: 0,
    siteLocation: 'Vikhroli West Commercial Site 4, Mumbai',
    crewLead: 'Unassigned (Bidding Stage)',
    crewAssignedCount: 0,
    status: 'tender',
    progressPct: 0,
    safetyScore: 100,
    milestones: [
      { id: 'g1', title: 'BOQ Estimation & Substation Drawings', stage: 'Tender Prep', completed: false, certifiedByArchitect: false },
      { id: 'g2', title: 'PMC Tender Bid Submission', stage: 'Bidding', completed: false, certifiedByArchitect: false },
    ],
  },
  {
    id: 'proj-colaba-done',
    clientDeveloper: 'Dr. Alok Nath Healthcare Campus',
    projectTitle: 'Main Incomer Surge Protector & Harmonic Filter Retrofit',
    contractValue: 450000,
    progressiveBilled: 450000,
    siteLocation: 'Colaba Causeway, Mumbai',
    crewLead: 'Suresh Nair',
    crewAssignedCount: 4,
    status: 'completed',
    progressPct: 100,
    safetyScore: 100,
    milestones: [
      { id: 'c1', title: 'SPD Enclosure Mount', stage: 'Installation', completed: true, certifiedByArchitect: true },
      { id: 'c2', title: 'Transient Surge Calibration & Handover', stage: 'Commissioning', completed: true, certifiedByArchitect: true },
    ],
  },
];

export const ContractorHomeScreen: React.FC<ContractorHomeScreenProps> = ({
  user,
  onLogout,
  onReplaySplash,
}) => {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isOperating, setIsOperating] = useState(true);
  const [projects, setProjects] = useState<ContractorProject[]>(INITIAL_PROJECTS);

  const activeProjects = projects.filter((p) => p.status === 'active');

  const handleToggleOperating = () => {
    setIsOperating((prev) => !prev);
  };

  const handleTenderTapped = (_tenderId: string) => {
    setCurrentTab('jobs');
  };

  const handleToggleMilestone = (projectId: string, milestoneId: string) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;

        const updatedMilestones = proj.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );

        const doneCount = updatedMilestones.filter((m) => m.completed).length;
        const newProgress = Math.round((doneCount / updatedMilestones.length) * 100);

        return {
          ...proj,
          milestones: updatedMilestones,
          progressPct: newProgress,
        };
      })
    );
  };

  const handleIssueBill = (projectId: string) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          progressiveBilled: Math.min(proj.contractValue, proj.progressiveBilled + 300000),
        };
      })
    );
    setCurrentTab('earnings');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* TOP BRAND STATUS BAR */}
      <View style={styles.appHeader}>
        <View style={styles.brandTitleRow}>
          <Text style={styles.brandServex}>SERVEX</Text>
          <View style={styles.suiteTag}>
            <Text style={styles.suiteTagText}>PRIME CONTRACTOR SUITE</Text>
          </View>
        </View>
        <Text style={styles.activeTabTitle}>
          {currentTab === 'dashboard'
            ? 'Command Center'
            : currentTab === 'jobs'
            ? 'Commercial Contracts'
            : currentTab === 'earnings'
            ? 'RA Billing & Financials'
            : 'Company & Workforce'}
        </Text>
      </View>

      {/* ACTIVE TAB CONTENT */}
      <View style={styles.tabContentArea}>
        {currentTab === 'dashboard' && (
          <ContractorDashboardTab
            user={user}
            isOperating={isOperating}
            onToggleOperating={handleToggleOperating}
            tenderTapped={handleTenderTapped}
            activeProjects={activeProjects}
            onToggleMilestone={handleToggleMilestone}
            onSelectTab={setCurrentTab}
          />
        )}

        {currentTab === 'jobs' && (
          <ContractorJobsTab
            projects={projects}
            onToggleMilestone={handleToggleMilestone}
            onIssueBill={handleIssueBill}
          />
        )}

        {currentTab === 'earnings' && <ContractorEarningsTab />}

        {currentTab === 'profile' && (
          <ContractorProfileTab
            user={user}
            onLogout={onLogout}
            onReplaySplash={onReplaySplash}
          />
        )}
      </View>

      {/* BOTTOM TAB NAVIGATION BAR */}
      <View style={styles.bottomTabBar}>
        {/* Dashboard Tab */}
        <Pressable
          style={styles.tabItem}
          onPress={() => setCurrentTab('dashboard')}
          accessibilityRole="button"
          accessibilityLabel="Dashboard"
        >
          <DashboardTabIcon
            size={20}
            color={currentTab === 'dashboard' ? '#FFFFFF' : '#71717A'}
            focused={currentTab === 'dashboard'}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'dashboard' && styles.tabLabelActive,
            ]}
          >
            Dashboard
          </Text>
        </Pressable>

        {/* Commercial Contracts Tab */}
        <Pressable
          style={styles.tabItem}
          onPress={() => setCurrentTab('jobs')}
          accessibilityRole="button"
          accessibilityLabel="Contracts"
        >
          <View>
            <JobsTabIcon
              size={20}
              color={currentTab === 'jobs' ? '#FFFFFF' : '#71717A'}
              focused={currentTab === 'jobs'}
            />
            {activeProjects.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{activeProjects.length}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'jobs' && styles.tabLabelActive,
            ]}
          >
            Contracts
          </Text>
        </Pressable>

        {/* Financials Tab */}
        <Pressable
          style={styles.tabItem}
          onPress={() => setCurrentTab('earnings')}
          accessibilityRole="button"
          accessibilityLabel="Financials"
        >
          <EarningsTabIcon
            size={20}
            color={currentTab === 'earnings' ? '#FFFFFF' : '#71717A'}
            focused={currentTab === 'earnings'}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'earnings' && styles.tabLabelActive,
            ]}
          >
            Financials
          </Text>
        </Pressable>

        {/* Company & Workforce Tab */}
        <Pressable
          style={styles.tabItem}
          onPress={() => setCurrentTab('profile')}
          accessibilityRole="button"
          accessibilityLabel="Company"
        >
          <ProfileTabIcon
            size={20}
            color={currentTab === 'profile' ? '#FFFFFF' : '#71717A'}
            focused={currentTab === 'profile'}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'profile' && styles.tabLabelActive,
            ]}
          >
            Company
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#161920',
    backgroundColor: '#000000',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandServex: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 1.5,
  },
  suiteTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  suiteTagText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 8.5,
    letterSpacing: 0.8,
  },
  activeTabTitle: {
    fontFamily: fonts.bodyMedium,
    color: '#71717A',
    fontSize: 12,
  },
  tabContentArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0B0C0F',
    borderTopWidth: 1,
    borderTopColor: '#1B1F27',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 22 : 12,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 64,
  },
  tabLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#71717A',
    fontSize: 10.5,
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontFamily: fonts.displayBold,
  },
  tabBadge: {
    position: 'absolute',
    top: -3,
    right: -7,
    backgroundColor: '#10B981',
    width: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontFamily: fonts.displayBold,
  },
});
