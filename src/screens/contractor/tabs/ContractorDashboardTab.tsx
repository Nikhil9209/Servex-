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
import { MapPinIcon, ClockIcon } from '../../../components/ContractorIcons';

export interface ContractorJob {
  id: string;
  clientName: string;
  clientPhone: string;
  title: string;
  category: string;
  location: string;
  distance: string;
  payout: number;
  scheduledTime: string;
  status: 'lead' | 'active' | 'scheduled' | 'completed';
  progress: number;
  milestones: { id: string; label: string; done: boolean }[];
}

interface ContractorDashboardTabProps {
  user: User;
  isOnline: boolean;
  onToggleOnline: () => void;
  incomingLead: ContractorJob | null;
  onAcceptLead: (jobId: string) => void;
  onDeclineLead: (jobId: string) => void;
  activeJobs: ContractorJob[];
  onToggleMilestone: (jobId: string, milestoneId: string) => void;
  onSelectTab: (tab: 'dashboard' | 'jobs' | 'earnings' | 'profile') => void;
}

export const ContractorDashboardTab: React.FC<ContractorDashboardTabProps> = ({
  user,
  isOnline,
  onToggleOnline,
  incomingLead,
  onAcceptLead,
  onDeclineLead,
  activeJobs,
  onToggleMilestone,
  onSelectTab,
}) => {
  const primaryActiveJob = activeJobs[0];

  const handleQuickAction = (action: string) => {
    Alert.alert(action, `Opened ${action} module for active projects.`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* TOP CONTRACTOR STATUS BAR */}
      <View style={styles.statusBar}>
        <View style={styles.contractorBadgeGroup}>
          <View style={styles.avatarPill}>
            <Text style={styles.avatarInitial}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>
          <View>
            <Text style={styles.contractorName} numberOfLines={1}>
              {user.name || 'Contractor Partner'}
            </Text>
            <View style={styles.tradeTagRow}>
              <View style={styles.tradeBadge}>
                <Text style={styles.tradeBadgeText}>VERIFIED PRO</Text>
              </View>
              <Text style={styles.zoneText}>• Metro Zone</Text>
            </View>
          </View>
        </View>

        {/* Online / Offline Switch */}
        <Pressable
          style={[styles.statusToggle, isOnline ? styles.toggleOnline : styles.toggleOffline]}
          onPress={onToggleOnline}
          accessibilityRole="switch"
          accessibilityLabel={isOnline ? 'Online' : 'Offline'}
        >
          <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
          <Text style={[styles.statusText, isOnline ? styles.textOnline : styles.textOffline]}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </Pressable>
      </View>

      {/* METRICS ROW */}
      <View style={styles.metricsGrid}>
        <Pressable style={styles.metricCard} onPress={() => onSelectTab('earnings')}>
          <Text style={styles.metricLabel}>Today&apos;s Payout</Text>
          <Text style={styles.metricValue}>₹8,450</Text>
          <Text style={styles.metricTrend}>+18% vs avg</Text>
        </Pressable>

        <Pressable style={styles.metricCard} onPress={() => onSelectTab('jobs')}>
          <Text style={styles.metricLabel}>Active Jobs</Text>
          <Text style={styles.metricValue}>{activeJobs.length}</Text>
          <Text style={styles.metricTrend}>2 scheduled</Text>
        </Pressable>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Rating</Text>
          <Text style={styles.metricValue}>4.9 ★</Text>
          <Text style={styles.metricTrend}>86 verified reviews</Text>
        </View>
      </View>

      {/* INCOMING CLIENT JOB LEAD ALERT */}
      {incomingLead && isOnline && (
        <View style={styles.leadContainer}>
          <View style={styles.leadHeader}>
            <View style={styles.leadBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.leadBadgeText}>NEW CLIENT REQUEST</Text>
            </View>
            <Text style={styles.leadTimer}>Expires in 4m</Text>
          </View>

          <Text style={styles.leadTitle}>{incomingLead.title}</Text>
          <Text style={styles.leadClient}>Client: {incomingLead.clientName}</Text>

          <View style={styles.leadDetailsRow}>
            <View style={styles.leadDetailItem}>
              <MapPinIcon size={13} color="#A1A1AA" />
              <Text style={styles.leadDetailText}>
                {incomingLead.location} ({incomingLead.distance})
              </Text>
            </View>
          </View>

          <View style={styles.leadDetailsRow}>
            <View style={styles.leadDetailItem}>
              <ClockIcon size={13} color="#A1A1AA" />
              <Text style={styles.leadDetailText}>{incomingLead.scheduledTime}</Text>
            </View>
          </View>

          <View style={styles.leadFooter}>
            <View>
              <Text style={styles.payoutLabel}>Estimated Payout</Text>
              <Text style={styles.payoutAmount}>₹{incomingLead.payout.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.leadActions}>
              <Pressable
                style={styles.declineButton}
                onPress={() => onDeclineLead(incomingLead.id)}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </Pressable>

              <Pressable
                style={styles.acceptButton}
                onPress={() => onAcceptLead(incomingLead.id)}
              >
                <Text style={styles.acceptButtonText}>Accept Job</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* PRIMARY ACTIVE JOB CARD */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Current Job Site</Text>
        <Pressable onPress={() => onSelectTab('jobs')}>
          <Text style={styles.sectionAction}>View All ({activeJobs.length})</Text>
        </Pressable>
      </View>

      {primaryActiveJob ? (
        <View style={styles.activeJobCard}>
          <View style={styles.activeJobTop}>
            <View>
              <View style={styles.activeJobTag}>
                <Text style={styles.activeJobTagText}>IN PROGRESS</Text>
              </View>
              <Text style={styles.activeJobTitle}>{primaryActiveJob.title}</Text>
              <Text style={styles.activeJobClient}>Client: {primaryActiveJob.clientName}</Text>
            </View>
            <View style={styles.activeJobPayoutBox}>
              <Text style={styles.activeJobPayoutLabel}>Fee</Text>
              <Text style={styles.activeJobPayoutVal}>
                ₹{primaryActiveJob.payout.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <View style={styles.locationPill}>
            <MapPinIcon size={12} color="#71717A" />
            <Text style={styles.locationPillText} numberOfLines={1}>
              {primaryActiveJob.location}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[styles.progressBarFill, { width: `${primaryActiveJob.progress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{primaryActiveJob.progress}% Completed</Text>
          </View>

          {/* Interactive Checklist */}
          <View style={styles.checklist}>
            {primaryActiveJob.milestones.map((m) => (
              <Pressable
                key={m.id}
                style={styles.checklistItem}
                onPress={() => onToggleMilestone(primaryActiveJob.id, m.id)}
              >
                <View style={[styles.checkbox, m.done && styles.checkboxDone]}>
                  {m.done && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.checklistLabel, m.done && styles.checklistLabelDone]}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Action Row */}
          <View style={styles.jobActionsRow}>
            <Pressable
              style={styles.secondaryJobAction}
              onPress={() => Alert.alert('Calling Client', `Dialing ${primaryActiveJob.clientPhone}`)}
            >
              <Text style={styles.secondaryJobActionText}>📞 Call Client</Text>
            </Pressable>
            <Pressable
              style={styles.primaryJobAction}
              onPress={() =>
                Alert.alert(
                  'Site Directions',
                  `Opening map directions to: ${primaryActiveJob.location}`
                )
              }
            >
              <Text style={styles.primaryJobActionText}>📍 Navigate to Site</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.noActiveJobCard}>
          <Text style={styles.noActiveJobIcon}>☕</Text>
          <Text style={styles.noActiveJobTitle}>No Active Site Right Now</Text>
          <Text style={styles.noActiveJobDesc}>
            {isOnline
              ? 'You are online and ready to receive instant client booking leads in your service zone.'
              : 'Toggle your status to ONLINE above to start receiving client dispatch requests.'}
          </Text>
        </View>
      )}

      {/* QUICK WORKSPACE TOOLS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Field Operations</Text>
      </View>

      <View style={styles.toolsRow}>
        <Pressable
          style={styles.toolCard}
          onPress={() => handleQuickAction('Daily Site Log')}
        >
          <Text style={styles.toolIcon}>📋</Text>
          <Text style={styles.toolTitle}>Site Log</Text>
          <Text style={styles.toolSub}>Record safety & crew</Text>
        </Pressable>

        <Pressable
          style={styles.toolCard}
          onPress={() => handleQuickAction('Blueprint Telemetry')}
        >
          <Text style={styles.toolIcon}>📐</Text>
          <Text style={styles.toolTitle}>Blueprints</Text>
          <Text style={styles.toolSub}>5D specs & layers</Text>
        </Pressable>

        <Pressable
          style={styles.toolCard}
          onPress={() => handleQuickAction('Smart Quote Generator')}
        >
          <Text style={styles.toolIcon}>⚡</Text>
          <Text style={styles.toolTitle}>Quick Quote</Text>
          <Text style={styles.toolSub}>Instant materials est.</Text>
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
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1E222A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2E3440',
    marginRight: 12,
  },
  avatarInitial: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
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
    fontFamily: fonts.bodyMedium,
    color: '#D4D4D8',
    fontSize: 9.5,
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
  toggleOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  toggleOffline: {
    backgroundColor: 'rgba(113, 113, 122, 0.12)',
    borderColor: 'rgba(113, 113, 122, 0.3)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotOnline: {
    backgroundColor: '#10B981',
  },
  dotOffline: {
    backgroundColor: '#71717A',
  },
  statusText: {
    fontFamily: fonts.displayBold,
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  textOnline: {
    color: '#10B981',
  },
  textOffline: {
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
  leadContainer: {
    backgroundColor: '#14181F',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2C3440',
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  leadBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#F59E0B',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  leadTimer: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 11,
  },
  leadTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15.5,
    marginBottom: 3,
  },
  leadClient: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 12.5,
    marginBottom: 10,
  },
  leadDetailsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  leadDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leadDetailText: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 12,
  },
  leadFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#20242D',
    paddingTop: 12,
    marginTop: 8,
  },
  payoutLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10.5,
  },
  payoutAmount: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 17,
  },
  leadActions: {
    flexDirection: 'row',
    gap: 8,
  },
  declineButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#262A33',
  },
  declineButtonText: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 12.5,
  },
  acceptButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  acceptButtonText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 12.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 6,
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
  activeJobCard: {
    backgroundColor: '#111317',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#20242D',
    marginBottom: 18,
  },
  activeJobTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activeJobTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  activeJobTagText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  activeJobTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 2,
  },
  activeJobClient: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 12,
  },
  activeJobPayoutBox: {
    alignItems: 'flex-end',
  },
  activeJobPayoutLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10,
  },
  activeJobPayoutVal: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161920',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
    marginBottom: 12,
  },
  locationPillText: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 11.5,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#1E222B',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: fonts.bodyMedium,
    color: '#71717A',
    fontSize: 10.5,
    textAlign: 'right',
  },
  checklist: {
    backgroundColor: '#0C0D11',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginBottom: 14,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#3F4450',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#000000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  checklistLabel: {
    fontFamily: fonts.body,
    color: '#D4D4D8',
    fontSize: 12.5,
  },
  checklistLabelDone: {
    color: '#71717A',
    textDecorationLine: 'line-through',
  },
  jobActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryJobAction: {
    flex: 1,
    backgroundColor: '#191C24',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#262C38',
  },
  secondaryJobActionText: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 12.5,
  },
  primaryJobAction: {
    flex: 1.2,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryJobActionText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 12.5,
  },
  noActiveJobCard: {
    backgroundColor: '#111317',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#20242D',
    marginBottom: 18,
  },
  noActiveJobIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  noActiveJobTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14.5,
    marginBottom: 4,
  },
  noActiveJobDesc: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toolCard: {
    flex: 1,
    backgroundColor: '#111317',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#20242D',
  },
  toolIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  toolTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 2,
  },
  toolSub: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 9.5,
    textAlign: 'center',
  },
});
