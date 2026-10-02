import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { fonts } from '../../../theme/tokens';
import { ContractorJob } from './ContractorDashboardTab';
import { MapPinIcon, ClockIcon } from '../../../components/ContractorIcons';

interface ContractorJobsTabProps {
  jobs: ContractorJob[];
  onToggleMilestone: (jobId: string, milestoneId: string) => void;
  onCompleteJob: (jobId: string) => void;
}

export const ContractorJobsTab: React.FC<ContractorJobsTabProps> = ({
  jobs,
  onToggleMilestone,
  onCompleteJob,
}) => {
  const [activeSegment, setActiveSegment] = useState<'active' | 'scheduled' | 'completed'>(
    'active'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = jobs.filter((j) => {
    const matchesSegment =
      activeSegment === 'active'
        ? j.status === 'active'
        : activeSegment === 'scheduled'
        ? j.status === 'scheduled'
        : j.status === 'completed';

    const matchesSearch =
      searchQuery.trim() === '' ||
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSegment && matchesSearch;
  });

  const activeCount = jobs.filter((j) => j.status === 'active').length;
  const scheduledCount = jobs.filter((j) => j.status === 'scheduled').length;
  const completedCount = jobs.filter((j) => j.status === 'completed').length;

  return (
    <View style={styles.container}>
      {/* SEGMENTED FILTER BAR */}
      <View style={styles.segmentContainer}>
        <Pressable
          style={[styles.segmentBtn, activeSegment === 'active' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('active')}
        >
          <Text
            style={[
              styles.segmentText,
              activeSegment === 'active' && styles.segmentTextActive,
            ]}
          >
            Active ({activeCount})
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.segmentBtn,
            activeSegment === 'scheduled' && styles.segmentBtnActive,
          ]}
          onPress={() => setActiveSegment('scheduled')}
        >
          <Text
            style={[
              styles.segmentText,
              activeSegment === 'scheduled' && styles.segmentTextActive,
            ]}
          >
            Scheduled ({scheduledCount})
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.segmentBtn,
            activeSegment === 'completed' && styles.segmentBtnActive,
          ]}
          onPress={() => setActiveSegment('completed')}
        >
          <Text
            style={[
              styles.segmentText,
              activeSegment === 'completed' && styles.segmentTextActive,
            ]}
          >
            Completed ({completedCount})
          </Text>
        </Pressable>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by title, client, or site..."
          placeholderTextColor="#71717A"
          selectionColor="#FFFFFF"
          cursorColor="#FFFFFF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* JOBS LIST */}
      <ScrollView
        contentContainerStyle={styles.scrollList}
        showsVerticalScrollIndicator={false}
      >
        {filteredJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching jobs found' : `No ${activeSegment} jobs`}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? 'Try searching with a different client name or address.'
                : activeSegment === 'active'
                ? 'Accept incoming job leads from your Dashboard to start a project.'
                : 'All jobs will appear here as they are scheduled or completed.'}
            </Text>
          </View>
        ) : (
          filteredJobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.cardHeader}>
                <View>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        job.status === 'active'
                          ? styles.badgeActive
                          : job.status === 'scheduled'
                          ? styles.badgeScheduled
                          : styles.badgeCompleted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          job.status === 'active'
                            ? styles.badgeTextActive
                            : job.status === 'scheduled'
                            ? styles.badgeTextScheduled
                            : styles.badgeTextCompleted,
                        ]}
                      >
                        {job.status.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.categoryText}>{job.category}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{job.title}</Text>
                  <Text style={styles.clientText}>Client: {job.clientName}</Text>
                </View>

                <View style={styles.payoutBadge}>
                  <Text style={styles.payoutLabel}>Total</Text>
                  <Text style={styles.payoutVal}>₹{job.payout.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <MapPinIcon size={13} color="#71717A" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {job.location}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <ClockIcon size={13} color="#71717A" />
                  <Text style={styles.metaText}>{job.scheduledTime}</Text>
                </View>
              </View>

              {/* ACTIVE PROGRESS & CHECKLIST */}
              {job.status === 'active' && (
                <View style={styles.activeDetails}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[styles.progressBarFill, { width: `${job.progress}%` }]}
                    />
                  </View>
                  <Text style={styles.progressLabel}>{job.progress}% Milestones Completed</Text>

                  <View style={styles.checklist}>
                    {job.milestones.map((m) => (
                      <Pressable
                        key={m.id}
                        style={styles.checkItem}
                        onPress={() => onToggleMilestone(job.id, m.id)}
                      >
                        <View style={[styles.checkbox, m.done && styles.checkboxDone]}>
                          {m.done && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text
                          style={[styles.checkLabel, m.done && styles.checkLabelDone]}
                        >
                          {m.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.activeActions}>
                    <Pressable
                      style={styles.actionBtnOutline}
                      onPress={() =>
                        Alert.alert('Calling Client', `Dialing ${job.clientPhone}`)
                      }
                    >
                      <Text style={styles.actionBtnOutlineText}>📞 Call</Text>
                    </Pressable>

                    <Pressable
                      style={styles.actionBtnComplete}
                      onPress={() => {
                        Alert.alert(
                          'Complete Project',
                          `Mark "${job.title}" as completed and submit final invoice for ₹${job.payout.toLocaleString(
                            'en-IN'
                          )}?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Submit Invoice',
                              onPress: () => onCompleteJob(job.id),
                            },
                          ]
                        );
                      }}
                    >
                      <Text style={styles.actionBtnCompleteText}>Finish Job ✓</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* SCHEDULED ACTIONS */}
              {job.status === 'scheduled' && (
                <View style={styles.scheduledActions}>
                  <Pressable
                    style={styles.actionBtnOutline}
                    onPress={() =>
                      Alert.alert(
                        'Site Directions',
                        `Opening map navigation to: ${job.location}`
                      )
                    }
                  >
                    <Text style={styles.actionBtnOutlineText}>📍 Directions</Text>
                  </Pressable>

                  <Pressable
                    style={styles.actionBtnSolid}
                    onPress={() =>
                      Alert.alert(
                        'Arrival Confirmed',
                        'Client notified that you are en route to the site.'
                      )
                    }
                  >
                    <Text style={styles.actionBtnSolidText}>I am En Route ➔</Text>
                  </Pressable>
                </View>
              )}

              {/* COMPLETED DETAILS */}
              {job.status === 'completed' && (
                <View style={styles.completedBanner}>
                  <Text style={styles.completedText}>✓ Paid & Settled</Text>
                  <Text style={styles.ratingText}>5.0 ★ Client Review</Text>
                </View>
              )}
            </View>
          ))
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
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#111317',
    borderRadius: 10,
    padding: 4,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  segmentBtnActive: {
    backgroundColor: '#202530',
  },
  segmentText: {
    fontFamily: fonts.bodyMedium,
    color: '#71717A',
    fontSize: 12,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.displayBold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111317',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13,
    paddingVertical: 10,
  },
  clearText: {
    color: '#71717A',
    fontSize: 12,
    padding: 4,
  },
  scrollList: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 6,
  },
  emptySub: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  jobCard: {
    backgroundColor: '#111317',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  badgeScheduled: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  badgeCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusBadgeText: {
    fontFamily: fonts.displayBold,
    fontSize: 9.5,
    letterSpacing: 0.6,
  },
  badgeTextActive: {
    color: '#10B981',
  },
  badgeTextScheduled: {
    color: '#F59E0B',
  },
  badgeTextCompleted: {
    color: '#A1A1AA',
  },
  categoryText: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
  },
  cardTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 3,
  },
  clientText: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 12,
  },
  payoutBadge: {
    alignItems: 'flex-end',
  },
  payoutLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10,
  },
  payoutVal: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 11.5,
  },
  activeDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E222A',
  },
  progressBarBg: {
    height: 5,
    backgroundColor: '#1C2028',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10.5,
    textAlign: 'right',
    marginBottom: 8,
  },
  checklist: {
    backgroundColor: '#0C0D11',
    borderRadius: 8,
    padding: 10,
    gap: 7,
    marginBottom: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
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
    fontSize: 10,
    fontWeight: 'bold',
  },
  checkLabel: {
    fontFamily: fonts.body,
    color: '#D4D4D8',
    fontSize: 12,
  },
  checkLabelDone: {
    color: '#71717A',
    textDecorationLine: 'line-through',
  },
  activeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnOutline: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#191C24',
    borderWidth: 1,
    borderColor: '#262C38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnOutlineText: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 12,
  },
  actionBtnComplete: {
    flex: 1.4,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnCompleteText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 12,
  },
  scheduledActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E222A',
  },
  actionBtnSolid: {
    flex: 1.4,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSolidText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 12,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0C0D11',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  completedText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 11.5,
  },
  ratingText: {
    fontFamily: fonts.bodyMedium,
    color: '#F59E0B',
    fontSize: 11.5,
  },
});
