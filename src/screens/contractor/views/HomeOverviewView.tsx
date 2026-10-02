import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { fonts } from '../../../theme/tokens';
import { User } from '../../../types/auth';
import { ContractorProjectDetail } from '../../../types/contractor';
import {
  SlidersIcon,
  PlusIcon,
  ArrowUpIcon,
  BuildingIcon,
  CrewIcon,
  ClockIcon,
  BriefcaseIcon,
} from '../../../components/ContractorIcons';
import { FolderCard } from '../../../components/FolderCard';
import {
  FadeInSlide,
  SpringPressable,
  PulsingDot,
} from '../../../components/AnimatedComponents';
import { isSupabaseConfigured } from '../../../services/supabaseClient';

interface HomeOverviewViewProps {
  user: User;
  projects: ContractorProjectDetail[];
  onSelectProject: (projectId: string) => void;
  onOpenSchedule: () => void;
  onOpenJobs: () => void;
  onOpenNewJob?: () => void;
}

export const HomeOverviewView: React.FC<HomeOverviewViewProps> = ({
  user,
  projects,
  onSelectProject,
  onOpenSchedule,
  onOpenJobs,
  onOpenNewJob,
}) => {
  const activeJob = projects.find((p) => p.status === 'active') || projects[0];
  const activeProjectsCount = projects.filter((p) => p.status === 'active').length;
  const totalCrewCount = projects.reduce((acc, p) => acc + (p.workers?.length || 0), 0);
  const totalVerifiedReports = projects.reduce((acc, p) => acc + (p.dailyReports?.length || 0), 0);
  const isCloud = isSupabaseConfigured();

  return (
    <View style={styles.rootContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. TOP HEADER WITH CIRCULAR BUTTONS (MATCHING REFERENCE) */}
        <FadeInSlide delay={40} distance={14}>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Overview</Text>
              <View style={styles.syncBadge}>
                <PulsingDot color={isCloud ? '#10B981' : '#38BDF8'} size={6} />
                <Text style={styles.syncBadgeText}>
                  {isCloud ? 'Cloud' : 'Local'}
                </Text>
              </View>
            </View>

            <View style={styles.headerControls}>
              {/* Filter / Sliders Circular Button */}
              <SpringPressable
                style={styles.circleButton}
                onPress={onOpenSchedule}
                scaleTo={0.92}
                hitSlop={8}
              >
                <SlidersIcon size={18} color="#FFFFFF" />
              </SpringPressable>

              {/* Plus Circular Button */}
              <SpringPressable
                style={styles.circleButton}
                onPress={onOpenNewJob}
                scaleTo={0.92}
                hitSlop={8}
              >
                <PlusIcon size={16} color="#FFFFFF" />
              </SpringPressable>
            </View>
          </View>
        </FadeInSlide>

        {/* 2. TOP 2-COLUMN FOLDER CARDS (MATCHING REFERENCE) */}
        <FadeInSlide delay={120} distance={20}>
          <View style={styles.gridRow}>
            <View style={styles.gridColumn}>
              <FolderCard
                title="Active Sites"
                subtitle={activeProjectsCount > 0 ? `${activeProjectsCount} running` : 'No sites'}
                icon={<BuildingIcon size={20} color="#7E7E86" />}
                onPress={onOpenJobs}
              />
            </View>

            <View style={styles.gridColumn}>
              <FolderCard
                title="Site Crew"
                subtitle={totalCrewCount > 0 ? `${totalCrewCount} on roster` : '4 standby'}
                icon={<CrewIcon size={20} color="#7E7E86" />}
                onPress={() => {
                  if (activeJob) {
                    onSelectProject(activeJob.id);
                  } else {
                    onOpenJobs();
                  }
                }}
              />
            </View>
          </View>
        </FadeInSlide>

        {/* 3. MIDDLE HORIZONTAL PILL CARD (MATCHING REFERENCE) */}
        <FadeInSlide delay={200} distance={20}>
          <SpringPressable
            style={styles.middlePillCard}
            onPress={onOpenSchedule}
            scaleTo={0.97}
          >
            <View style={styles.middlePillLeft}>
              <Text style={styles.middlePillTitle}>Daily Schedule</Text>
              <Text style={styles.middlePillSubtitle}>2 site visits scheduled</Text>
            </View>

            <View style={styles.middlePillRight}>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>2</Text>
              </View>
              <View style={styles.middleIconWrapper}>
                <SlidersIcon size={15} color="#5A5A64" />
              </View>
            </View>
          </SpringPressable>
        </FadeInSlide>

        {/* 4. SECOND ROW 2-COLUMN FOLDER CARDS */}
        <FadeInSlide delay={280} distance={20}>
          <View style={styles.gridRow}>
            <View style={styles.gridColumn}>
              <FolderCard
                title="Daily Logs"
                subtitle={totalVerifiedReports > 0 ? `${totalVerifiedReports} verified` : 'Today pending'}
                icon={<ClockIcon size={20} color="#7E7E86" />}
                onPress={() => {
                  if (activeJob) {
                    onSelectProject(activeJob.id);
                  } else {
                    onOpenJobs();
                  }
                }}
              />
            </View>

            <View style={styles.gridColumn}>
              <FolderCard
                title="Contracts"
                subtitle={`${projects.length} project${projects.length > 1 ? 's' : ''}`}
                icon={<BriefcaseIcon size={20} color="#7E7E86" />}
                onPress={onOpenJobs}
              />
            </View>
          </View>
        </FadeInSlide>
      </ScrollView>

      {/* 5. FLOATING BOTTOM SPOTLIGHT CARD (MATCHING REFERENCE) */}
      {activeJob && (
        <FadeInSlide delay={340} distance={30} style={styles.floatingCardWrapper}>
          <SpringPressable
            style={styles.floatingCard}
            onPress={() => onSelectProject(activeJob.id)}
            scaleTo={0.98}
          >
            {/* Top Drag Handle Notch Pill */}
            <View style={styles.dragHandle} />

            <View style={styles.floatingCardContent}>
              <View style={styles.floatingCardTextCol}>
                <Text style={styles.floatingCardMetric}>17:20</Text>
                <View style={styles.statusSubRow}>
                  <PulsingDot size={6} color="#10B981" />
                  <Text style={styles.floatingCardSub} numberOfLines={1}>
                    {activeJob.projectName.split(' ')[0]} focus · In progress
                  </Text>
                </View>
              </View>

              {/* Circular Action Button with Arrow Up */}
              <SpringPressable
                style={styles.floatingActionCircle}
                onPress={() => onSelectProject(activeJob.id)}
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
    paddingBottom: 180, // Generous padding so content scrolls above floating card
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 30,
    letterSpacing: -0.6,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#16161A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222228',
  },
  syncBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 10,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C1C22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#24242C',
  },
  circleButtonPressed: {
    backgroundColor: '#2A2A32',
    transform: [{ scale: 0.95 }],
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
  countBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  middleIconWrapper: {
    opacity: 0.7,
  },
  floatingCardWrapper: {
    position: 'absolute',
    bottom: 76, // Sits right above the minimal bottom navigation bar
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
    fontSize: 28,
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
