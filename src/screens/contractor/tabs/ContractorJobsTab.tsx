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
import { ContractorProject } from './ContractorDashboardTab';
import { MapPinIcon, CrewIcon } from '../../../components/ContractorIcons';

interface ContractorJobsTabProps {
  projects: ContractorProject[];
  onToggleMilestone: (projectId: string, milestoneId: string) => void;
  onIssueBill: (projectId: string) => void;
}

export const ContractorJobsTab: React.FC<ContractorJobsTabProps> = ({
  projects,
  onToggleMilestone,
  onIssueBill,
}) => {
  const [activeSegment, setActiveSegment] = useState<'active' | 'tender' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter((p) => {
    const matchesSegment = p.status === activeSegment;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientDeveloper.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.siteLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.crewLead.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSegment && matchesSearch;
  });

  const activeCount = projects.filter((p) => p.status === 'active').length;
  const tenderCount = projects.filter((p) => p.status === 'tender').length;
  const completedCount = projects.filter((p) => p.status === 'completed').length;

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
            Active Contracts ({activeCount})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentBtn, activeSegment === 'tender' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('tender')}
        >
          <Text
            style={[
              styles.segmentText,
              activeSegment === 'tender' && styles.segmentTextActive,
            ]}
          >
            Tenders & Bids ({tenderCount})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentBtn, activeSegment === 'completed' && styles.segmentBtnActive]}
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
          placeholder="Search contracts by project, developer, site, or foreman..."
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

      {/* CONTRACTS / PROJECTS LIST */}
      <ScrollView
        contentContainerStyle={styles.scrollList}
        showsVerticalScrollIndicator={false}
      >
        {filteredProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching contracts found' : `No ${activeSegment} projects`}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? 'Try searching with a different developer or project title.'
                : activeSegment === 'tender'
                ? 'Commercial RFPs and tenders from builders will appear here for bidding.'
                : 'All contracts and submittals will appear here once mobilized.'}
            </Text>
          </View>
        ) : (
          filteredProjects.map((project) => (
            <View key={project.id} style={styles.projectCard}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        project.status === 'active'
                          ? styles.badgeActive
                          : project.status === 'tender'
                          ? styles.badgeTender
                          : styles.badgeCompleted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          project.status === 'active'
                            ? styles.badgeTextActive
                            : project.status === 'tender'
                            ? styles.badgeTextTender
                            : styles.badgeTextCompleted,
                        ]}
                      >
                        {project.status === 'active'
                          ? 'IN EXECUTION'
                          : project.status === 'tender'
                          ? 'OPEN TENDER BID'
                          : 'COMMISSIONED & SETTLED'}
                      </Text>
                    </View>
                    <Text style={styles.clientTag}>
                      Developer: {project.clientDeveloper}
                    </Text>
                  </View>
                  <Text style={styles.projectTitleText}>{project.projectTitle}</Text>
                </View>

                <View style={styles.contractValueBox}>
                  <Text style={styles.valSubText}>Contract Value</Text>
                  <Text style={styles.valPrimaryText}>
                    ₹{(project.contractValue / 100000).toFixed(1)}L
                  </Text>
                </View>
              </View>

              {/* SITE LOCATION & WORKFORCE CREW ALLOCATION */}
              <View style={styles.siteInfoRow}>
                <View style={styles.siteItem}>
                  <MapPinIcon size={13} color="#71717A" />
                  <Text style={styles.siteText} numberOfLines={1}>
                    {project.siteLocation}
                  </Text>
                </View>
              </View>

              <View style={styles.crewAllocationRow}>
                <View style={styles.crewBadge}>
                  <CrewIcon size={13} color="#FFFFFF" />
                  <Text style={styles.crewBadgeText}>
                    {project.crewAssignedCount > 0
                      ? `${project.crewAssignedCount} Field Workers`
                      : '0 Workers Allocated'}
                  </Text>
                </View>
                <Text style={styles.foremanBadgeText}>
                  Foreman: {project.crewLead}
                </Text>
              </View>

              {/* PROGRESS & STAGES */}
              {project.status === 'active' && (
                <View style={styles.executionDetails}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${project.progressPct}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressPercent}>
                      {project.progressPct}% Complete
                    </Text>
                    <Text style={styles.progressBilled}>
                      Progress Billed: ₹{(project.progressiveBilled / 100000).toFixed(1)}L
                    </Text>
                  </View>

                  {/* STAGE MILESTONES */}
                  <View style={styles.milestonesBox}>
                    {project.milestones.map((m) => (
                      <Pressable
                        key={m.id}
                        style={styles.milestoneItem}
                        onPress={() => onToggleMilestone(project.id, m.id)}
                      >
                        <View style={[styles.mCheck, m.completed && styles.mCheckDone]}>
                          {m.completed && <Text style={styles.mCheckSymbol}>✓</Text>}
                        </View>
                        <View style={styles.mItemContent}>
                          <Text
                            style={[
                              styles.mItemTitle,
                              m.completed && styles.mItemTitleDone,
                            ]}
                          >
                            {m.title}
                          </Text>
                          <Text style={styles.mItemStage}>
                            Stage: {m.stage} • {m.certifiedByArchitect ? 'PMC Certified ✓' : 'Awaiting Sign-off'}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>

                  {/* CONTRACTOR CONTRACT ACTIONS */}
                  <View style={styles.contractActionsRow}>
                    <Pressable
                      style={styles.contractActionSecondary}
                      onPress={() =>
                        Alert.alert(
                          'Workforce Allocation',
                          `Current deployment for ${project.projectTitle}:\n\n• Foreman: ${project.crewLead}\n• Tradesmen: 4 Electricians\n• Riggers & Laborers: 8 Workers\n\nReassign workers?`
                        )
                      }
                    >
                      <Text style={styles.contractActionSecondaryText}>👷 Manage Crew</Text>
                    </Pressable>

                    <Pressable
                      style={styles.contractActionPrimary}
                      onPress={() => onIssueBill(project.id)}
                    >
                      <Text style={styles.contractActionPrimaryText}>Issue RA Bill ➔</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* TENDER BID ACTIONS */}
              {project.status === 'tender' && (
                <View style={styles.tenderDetails}>
                  <Text style={styles.tenderScopeText}>
                    Scope: High-voltage panel installation, substation grounding, cable tray networks, and local utility compliance certification.
                  </Text>
                  <View style={styles.tenderActionsRow}>
                    <Pressable
                      style={styles.tenderBtnOutline}
                      onPress={() =>
                        Alert.alert(
                          'Download CAD & Specs',
                          `Architectural CAD & BOQ documents for ${project.projectTitle} downloaded to Contractor Drive.`
                        )
                      }
                    >
                      <Text style={styles.tenderBtnOutlineText}>📐 Review BOQ & Specs</Text>
                    </Pressable>

                    <Pressable
                      style={styles.tenderBtnSolid}
                      onPress={() =>
                        Alert.alert(
                          'Submit Commercial Tender',
                          `Submitting formal contractor bid for ₹${(project.contractValue / 100000).toFixed(1)} Lakhs to ${project.clientDeveloper}. Proceed?`
                        )
                      }
                    >
                      <Text style={styles.tenderBtnSolidText}>Submit Tender Bid ➔</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* COMPLETED SETTLEMENT */}
              {project.status === 'completed' && (
                <View style={styles.completedBanner}>
                  <Text style={styles.completedBannerText}>
                    ✓ Final Completion Handover Certified • 100% Retained Funds Released
                  </Text>
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
    fontSize: 11,
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
    fontSize: 12.5,
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
    gap: 14,
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
  projectCard: {
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
  headerLeft: {
    flex: 1,
    marginRight: 10,
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
  badgeTender: {
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
  badgeTextTender: {
    color: '#F59E0B',
  },
  badgeTextCompleted: {
    color: '#A1A1AA',
  },
  clientTag: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 11,
  },
  projectTitleText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15.5,
    lineHeight: 20,
  },
  contractValueBox: {
    alignItems: 'flex-end',
  },
  valSubText: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10,
  },
  valPrimaryText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
  },
  siteInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  siteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  siteText: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 11.5,
  },
  crewAllocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161A22',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 8,
    marginBottom: 12,
  },
  crewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  crewBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 11.5,
  },
  foremanBadgeText: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 11.5,
  },
  executionDetails: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E232E',
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#1E232E',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressPercent: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 11,
  },
  progressBilled: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10.5,
  },
  milestonesBox: {
    backgroundColor: '#0C0D11',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  mCheck: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#3F4450',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  mCheckDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  mCheckSymbol: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mItemContent: {
    flex: 1,
  },
  mItemTitle: {
    fontFamily: fonts.displayBold,
    color: '#D4D4D8',
    fontSize: 12,
  },
  mItemTitleDone: {
    color: '#71717A',
  },
  mItemStage: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10.5,
  },
  contractActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contractActionSecondary: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#181C24',
    borderWidth: 1,
    borderColor: '#262C38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractActionSecondaryText: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 12,
  },
  contractActionPrimary: {
    flex: 1.3,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractActionPrimaryText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 12,
  },
  tenderDetails: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E232E',
  },
  tenderScopeText: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  tenderActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tenderBtnOutline: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#181C24',
    borderWidth: 1,
    borderColor: '#262C38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tenderBtnOutlineText: {
    fontFamily: fonts.bodyMedium,
    color: '#D4D4D8',
    fontSize: 12,
  },
  tenderBtnSolid: {
    flex: 1.2,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tenderBtnSolidText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 12,
  },
  completedBanner: {
    backgroundColor: '#0C0D11',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  completedBannerText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 11.5,
    textAlign: 'center',
  },
});
