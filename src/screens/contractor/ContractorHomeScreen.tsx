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
import { ContractorDashboardTab, ContractorJob } from './tabs/ContractorDashboardTab';
import { ContractorJobsTab } from './tabs/ContractorJobsTab';
import { ContractorEarningsTab } from './tabs/ContractorEarningsTab';
import { ContractorProfileTab } from './tabs/ContractorProfileTab';

export interface ContractorHomeScreenProps {
  user: User;
  onLogout: () => void;
  onReplaySplash?: () => void;
}

type TabType = 'dashboard' | 'jobs' | 'earnings' | 'profile';

const INITIAL_JOBS: ContractorJob[] = [
  {
    id: 'job-1',
    title: 'Commercial 3-Phase Distribution Panel Install',
    clientName: 'Rohan Singhania',
    clientPhone: '+91 98201 12345',
    category: 'Electrical & Structural',
    location: 'Bandra Kurla Complex, Tower B, Level 4',
    distance: '3.2 km away',
    payout: 6800,
    scheduledTime: 'Today • In Progress',
    status: 'active',
    progress: 75,
    milestones: [
      { id: 'm1', label: 'Site Hazard & Arc Flash Assessment', done: true },
      { id: 'm2', label: 'Main 3-Phase Busbar Isolation', done: true },
      { id: 'm3', label: '415V Panel Termination & Gland Fitting', done: true },
      { id: 'm4', label: 'Insulation Resistance & Megger Testing', done: false },
    ],
  },
  {
    id: 'job-2',
    title: 'High-Rise Central HVAC Motor Rewind',
    clientName: 'Priya Varma (Lodha Bellissimo)',
    clientPhone: '+91 98202 23456',
    category: 'HVAC & Climate',
    location: 'Lower Parel, Mumbai',
    distance: '5.8 km',
    payout: 12500,
    scheduledTime: 'Tomorrow, 09:30 AM',
    status: 'scheduled',
    progress: 0,
    milestones: [
      { id: 'm2-1', label: 'Motor Disconnect & Stator Pull', done: false },
      { id: 'm2-2', label: 'Class H Copper Coil Winding', done: false },
      { id: 'm2-3', label: 'Varnish Dip & Thermal Bake', done: false },
      { id: 'm2-4', label: 'Dynamometer Load Test', done: false },
    ],
  },
  {
    id: 'job-3',
    title: 'Structural Conduit & Heavy Cable Tray Run',
    clientName: 'Karan Johar Logistics Hub',
    clientPhone: '+91 98203 34567',
    category: 'Industrial Infrastructure',
    location: 'Andheri East Industrial Zone',
    distance: '8.1 km',
    payout: 9200,
    scheduledTime: 'Wed, 11:00 AM',
    status: 'scheduled',
    progress: 0,
    milestones: [
      { id: 'm3-1', label: 'Ceiling Anchor Hilti Pull Test', done: false },
      { id: 'm3-2', label: 'Perforated Cable Tray Alignment', done: false },
      { id: 'm3-3', label: 'Armored Cable Pull & Grounding', done: false },
    ],
  },
  {
    id: 'job-4',
    title: 'Main Incomer Surge Protector Retrofit',
    clientName: 'Dr. Alok Nath',
    clientPhone: '+91 98204 45678',
    category: 'Power Protection',
    location: 'Colaba Causeway, Mumbai',
    distance: '12 km',
    payout: 4500,
    scheduledTime: 'Completed Yesterday',
    status: 'completed',
    progress: 100,
    milestones: [
      { id: 'm4-1', label: 'SPD Enclosure Mount', done: true },
      { id: 'm4-2', label: 'Neutral-Earth Reference Bonding', done: true },
      { id: 'm4-3', label: 'Live Transient Test', done: true },
    ],
  },
];

const INITIAL_INCOMING_LEAD: ContractorJob = {
  id: 'lead-godrej',
  title: 'Emergency Transformer Phase Imbalance',
  clientName: 'Godrej Properties Site Office',
  clientPhone: '+91 98205 56789',
  category: 'Emergency Dispatch',
  location: 'Vikhroli West, Industrial Site 4',
  distance: '2.1 km away',
  payout: 8500,
  scheduledTime: 'Immediate Dispatch Needed',
  status: 'lead',
  progress: 0,
  milestones: [
    { id: 'l1', label: 'Emergency Site Entry & Lockout', done: false },
    { id: 'l2', label: 'Thermal Imaging Inspection', done: false },
    { id: 'l3', label: 'Phase Tap Changer Calibration', done: false },
  ],
};

export const ContractorHomeScreen: React.FC<ContractorHomeScreenProps> = ({
  user,
  onLogout,
  onReplaySplash,
}) => {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isOnline, setIsOnline] = useState(true);
  const [jobs, setJobs] = useState<ContractorJob[]>(INITIAL_JOBS);
  const [incomingLead, setIncomingLead] = useState<ContractorJob | null>(INITIAL_INCOMING_LEAD);

  const activeJobs = jobs.filter((j) => j.status === 'active');

  const handleToggleOnline = () => {
    setIsOnline((prev) => !prev);
  };

  const handleAcceptLead = (jobId: string) => {
    if (!incomingLead || incomingLead.id !== jobId) return;

    const acceptedJob: ContractorJob = {
      ...incomingLead,
      status: 'active',
      scheduledTime: 'Today • In Progress',
      progress: 0,
    };

    setJobs((prev) => [acceptedJob, ...prev]);
    setIncomingLead(null);
    setCurrentTab('jobs');
  };

  const handleDeclineLead = (_jobId: string) => {
    setIncomingLead(null);
  };

  const handleToggleMilestone = (jobId: string, milestoneId: string) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;

        const updatedMilestones = job.milestones.map((m) =>
          m.id === milestoneId ? { ...m, done: !m.done } : m
        );

        const doneCount = updatedMilestones.filter((m) => m.done).length;
        const newProgress = Math.round((doneCount / updatedMilestones.length) * 100);

        return {
          ...job,
          milestones: updatedMilestones,
          progress: newProgress,
        };
      })
    );
  };

  const handleCompleteJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        return {
          ...job,
          status: 'completed',
          progress: 100,
          milestones: job.milestones.map((m) => ({ ...m, done: true })),
        };
      })
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* TOP BRAND STATUS BAR */}
      <View style={styles.appHeader}>
        <View style={styles.brandTitleRow}>
          <Text style={styles.brandServex}>SERVEX</Text>
          <View style={styles.suiteTag}>
            <Text style={styles.suiteTagText}>CONTRACTOR SUITE</Text>
          </View>
        </View>
        <Text style={styles.activeTabTitle}>
          {currentTab === 'dashboard'
            ? 'Command Center'
            : currentTab === 'jobs'
            ? 'Job Sites & Tasks'
            : currentTab === 'earnings'
            ? 'Revenue & Payouts'
            : 'Contractor Profile'}
        </Text>
      </View>

      {/* ACTIVE TAB CONTENT */}
      <View style={styles.tabContentArea}>
        {currentTab === 'dashboard' && (
          <ContractorDashboardTab
            user={user}
            isOnline={isOnline}
            onToggleOnline={handleToggleOnline}
            incomingLead={incomingLead}
            onAcceptLead={handleAcceptLead}
            onDeclineLead={handleDeclineLead}
            activeJobs={activeJobs}
            onToggleMilestone={handleToggleMilestone}
            onSelectTab={setCurrentTab}
          />
        )}

        {currentTab === 'jobs' && (
          <ContractorJobsTab
            jobs={jobs}
            onToggleMilestone={handleToggleMilestone}
            onCompleteJob={handleCompleteJob}
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

        {/* Jobs Tab */}
        <Pressable
          style={styles.tabItem}
          onPress={() => setCurrentTab('jobs')}
          accessibilityRole="button"
          accessibilityLabel="Jobs"
        >
          <View>
            <JobsTabIcon
              size={20}
              color={currentTab === 'jobs' ? '#FFFFFF' : '#71717A'}
              focused={currentTab === 'jobs'}
            />
            {activeJobs.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{activeJobs.length}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'jobs' && styles.tabLabelActive,
            ]}
          >
            Jobs
          </Text>
        </Pressable>

        {/* Earnings Tab */}
        <Pressable
          style={styles.tabItem}
          onPress={() => setCurrentTab('earnings')}
          accessibilityRole="button"
          accessibilityLabel="Earnings"
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
            Earnings
          </Text>
        </Pressable>

        {/* Profile Tab */}
        <Pressable
          style={styles.tabItem}
          onPress={() => setCurrentTab('profile')}
          accessibilityRole="button"
          accessibilityLabel="Profile"
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
            Profile
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
    color: '#A1A1AA',
    fontSize: 9,
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
