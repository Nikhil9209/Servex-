import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { fonts } from '../../../theme/tokens';
import { ContractorProjectDetail } from '../../../types/contractor';
import {
  SlidersIcon,
  PlusIcon,
  LinkIcon,
  BuildingIcon,
  ArrowUpIcon,
} from '../../../components/ContractorIcons';
import { FolderCard } from '../../../components/FolderCard';
import {
  FadeInSlide,
  SpringPressable,
  PulsingDot,
} from '../../../components/AnimatedComponents';

interface JobsListViewProps {
  projects: ContractorProjectDetail[];
  onSelectProject: (projectId: string) => void;
  onOpenJoinModal?: () => void;
  onOpenCreateModal: () => void;
}

type SiteFilterTab = 'active' | 'upcoming' | 'completed';

export const JobsListView: React.FC<JobsListViewProps> = ({
  projects,
  onSelectProject,
  onOpenJoinModal,
  onOpenCreateModal,
}) => {
  const [filter, setFilter] = useState<SiteFilterTab>('active');

  const filteredSites = projects.filter((p) => {
    if (filter === 'active') return p.status === 'active';
    if (filter === 'upcoming') return p.status === 'upcoming';
    if (filter === 'completed') return p.status === 'completed';
    return true;
  });

  const activeSite = filteredSites[0] || projects.find((p) => p.status === 'active') || projects[0];

  // Helper to chunk sites into pairs for 2-column grid
  const chunkedSites: ContractorProjectDetail[][] = [];
  for (let i = 0; i < filteredSites.length; i += 2) {
    chunkedSites.push(filteredSites.slice(i, i + 2));
  }

  return (
    <View style={styles.rootContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. TOP HEADER WITH CIRCULAR BUTTONS (MATCHING REFERENCE) */}
        <FadeInSlide delay={40} distance={14}>
          <View style={styles.topHeader}>
            <View>
              <Text style={styles.pageTitle}>Sites</Text>
              <Text style={styles.pageSub}>
                {projects.length} project site{projects.length > 1 ? 's' : ''} assigned
              </Text>
            </View>

            <View style={styles.headerActions}>
              {onOpenJoinModal && (
                <SpringPressable
                  style={styles.circleHeaderBtn}
                  onPress={onOpenJoinModal}
                  scaleTo={0.92}
                  hitSlop={8}
                >
                  <LinkIcon size={16} color="#FFFFFF" />
                </SpringPressable>
              )}

              <SpringPressable
                style={styles.circleHeaderBtn}
                onPress={onOpenCreateModal}
                scaleTo={0.92}
                hitSlop={8}
              >
                <PlusIcon size={16} color="#FFFFFF" />
              </SpringPressable>
            </View>
          </View>
        </FadeInSlide>

        {/* 2. MINIMAL FILTER TABS (MATCHING REFERENCE) */}
        <FadeInSlide delay={100} distance={16}>
          <View style={styles.filterRow}>
            <SpringPressable
              style={[styles.filterPill, filter === 'active' && styles.filterPillActive]}
              onPress={() => setFilter('active')}
              scaleTo={0.95}
            >
              <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
                Active ({projects.filter((p) => p.status === 'active').length})
              </Text>
            </SpringPressable>

            <SpringPressable
              style={[styles.filterPill, filter === 'upcoming' && styles.filterPillActive]}
              onPress={() => setFilter('upcoming')}
              scaleTo={0.95}
            >
              <Text style={[styles.filterText, filter === 'upcoming' && styles.filterTextActive]}>
                Upcoming ({projects.filter((p) => p.status === 'upcoming').length})
              </Text>
            </SpringPressable>

            <SpringPressable
              style={[styles.filterPill, filter === 'completed' && styles.filterPillActive]}
              onPress={() => setFilter('completed')}
              scaleTo={0.95}
            >
              <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
                Completed
              </Text>
            </SpringPressable>
          </View>
        </FadeInSlide>

        {/* 3. 2-COLUMN FOLDER CARDS GRID FOR SITES (MATCHING REFERENCE) */}
        <FadeInSlide delay={160} distance={20}>
          {filteredSites.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No {filter} sites</Text>
              <Text style={styles.emptySub}>
                {filter === 'active'
                  ? 'Connect a client project code or create a new site.'
                  : `You currently have no ${filter} site contracts.`}
              </Text>
            </View>
          ) : (
            chunkedSites.map((pair, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.gridRow}>
                {pair.map((site) => {
                  const completedVal = site.scopeItems.reduce(
                    (sum, item) => sum + item.completedQuantity * item.ratePerUnit,
                    0
                  );
                  const totalVal = site.scopeItems.reduce((sum, item) => sum + item.totalAmount, 0);
                  const progressPct = totalVal > 0 ? Math.round((completedVal / totalVal) * 100) : 0;

                  return (
                    <View key={site.id} style={styles.gridColumn}>
                      <FolderCard
                        title={site.projectName}
                        subtitle={`${progressPct}% · ${site.workers.length} crew`}
                        icon={<BuildingIcon size={20} color="#7E7E86" />}
                        badgeCount={site.workers.length}
                        onPress={() => onSelectProject(site.id)}
                      />
                    </View>
                  );
                })}
                {pair.length === 1 && <View style={styles.gridColumn} />}
              </View>
            ))
          )}
        </FadeInSlide>

        {/* 4. MIDDLE HORIZONTAL PILL CARD FOR CLIENT CODE CONNECT */}
        <FadeInSlide delay={220} distance={20}>
          <SpringPressable
            style={styles.middlePillCard}
            onPress={onOpenJoinModal}
            scaleTo={0.97}
          >
            <View style={styles.middlePillLeft}>
              <Text style={styles.middlePillTitle}>Join via Client Code</Text>
              <Text style={styles.middlePillSubtitle}>Link to your client&apos;s site workspace</Text>
            </View>

            <View style={styles.middlePillRight}>
              <View style={styles.countBadge}>
                <LinkIcon size={14} color="#FFFFFF" />
              </View>
              <View style={styles.middleIconWrapper}>
                <SlidersIcon size={15} color="#5A5A64" />
              </View>
            </View>
          </SpringPressable>
        </FadeInSlide>
      </ScrollView>

      {/* 5. FLOATING BOTTOM SPOTLIGHT CARD (MATCHING REFERENCE) */}
      {activeSite && (
        <FadeInSlide delay={280} distance={30} style={styles.floatingCardWrapper}>
          <SpringPressable
            style={styles.floatingCard}
            onPress={() => onSelectProject(activeSite.id)}
            scaleTo={0.98}
          >
            {/* Top Drag Handle Notch Pill */}
            <View style={styles.dragHandle} />

            <View style={styles.floatingCardContent}>
              <View style={styles.floatingCardTextCol}>
                <Text style={styles.floatingCardMetric}>
                  {activeSite.projectName.split(' ')[0]} Site
                </Text>
                <View style={styles.statusSubRow}>
                  <PulsingDot size={6} color="#10B981" />
                  <Text style={styles.floatingCardSub} numberOfLines={1}>
                    {activeSite.siteAddress.split(',')[0]} · In progress
                  </Text>
                </View>
              </View>

              {/* Circular Action Button with Arrow Up */}
              <SpringPressable
                style={styles.floatingActionCircle}
                onPress={() => onSelectProject(activeSite.id)}
                scaleTo={0.90}
                hitSlop={6}
              >
                <ArrowUpIcon size={20} color="#FFFFFF" />
              </SpringPressable>
            </View>
          </SpringPressable>
        </FadeInSlide>
      )}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 180, // Content scrolls cleanly above floating spotlight card
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  pageTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 32,
    letterSpacing: -0.6,
  },
  pageSub: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: '#222228',
  },
  filterPillActive: {
    backgroundColor: '#24242C',
    borderColor: '#383842',
  },
  filterText: {
    fontFamily: fonts.bodyMedium,
    color: '#8E8E93',
    fontSize: 12.5,
  },
  filterTextActive: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  gridColumn: {
    flex: 1,
  },
  emptyCard: {
    backgroundColor: '#16161A',
    borderRadius: 22,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222228',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 6,
  },
  emptySub: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
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
    bottom: 76,
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
    fontSize: 26,
    letterSpacing: -0.5,
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
