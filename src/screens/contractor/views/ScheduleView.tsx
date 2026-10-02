import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { fonts } from '../../../theme/tokens';
import { ClockIcon, MapPinIcon, BriefcaseIcon } from '../../../components/ContractorIcons';
import { useContractor } from '../../../context/ContractorContext';
import { FadeInSlide, SpringPressable } from '../../../components/AnimatedComponents';

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  siteName: string;
  location: string;
  tag: string;
}

interface ScheduleDayGroup {
  dayLabel: string;
  items: ScheduleItem[];
}

export const ScheduleView: React.FC = () => {
  const { projects } = useContractor();

  const scheduleGroups = useMemo<ScheduleDayGroup[]>(() => {
    const active = projects.filter((p) => p.status === 'active');
    const upcoming = projects.filter((p) => p.status === 'upcoming');

    const todayItems: ScheduleItem[] = [];

    // Add today's check-ins & audits for all active projects
    active.forEach((p, idx) => {
      const presentCount = p.todayAttendance.filter((a) => a.status === 'present').length;
      todayItems.push({
        id: `today-crew-${p.id}`,
        time: idx === 0 ? '09:00 AM' : '10:00 AM',
        title: `Crew Roll Call (${presentCount} of ${p.workers.length} on-site)`,
        siteName: p.projectName,
        location: p.siteAddress,
        tag: 'Muster',
      });

      if (p.scopeItems.length > 0) {
        todayItems.push({
          id: `today-audit-${p.id}`,
          time: idx === 0 ? '04:30 PM' : '05:15 PM',
          title: `Daily Work Verification & Audit (${p.scopeItems.length} lines)`,
          siteName: p.projectName,
          location: p.siteAddress,
          tag: 'Audit',
        });
      }
    });

    // Add tomorrow's milestones
    const tomorrowItems: ScheduleItem[] = [];
    active.forEach((p) => {
      const pendingScope = p.scopeItems.find((s) => s.completedQuantity < s.quantity);
      if (pendingScope) {
        tomorrowItems.push({
          id: `tmrw-scope-${p.id}`,
          time: '11:00 AM',
          title: `Inspection: ${pendingScope.name}`,
          siteName: p.projectName,
          location: p.siteAddress,
          tag: 'Milestone',
        });
      }
      tomorrowItems.push({
        id: `tmrw-walk-${p.id}`,
        time: '02:30 PM',
        title: `Client Progress Briefing (${p.clientName})`,
        siteName: p.projectName,
        location: `Client: ${p.clientPhone}`,
        tag: 'Client',
      });
    });

    // Upcoming project mobilizations
    const upcomingItems: ScheduleItem[] = [];
    upcoming.forEach((p) => {
      upcomingItems.push({
        id: `up-mob-${p.id}`,
        time: '10:00 AM',
        title: `Site Mobilization & Contractor Handover`,
        siteName: p.projectName,
        location: p.siteAddress,
        tag: 'Mobilization',
      });
    });

    const groups: ScheduleDayGroup[] = [
      {
        dayLabel: 'TODAY · ACTIVE SHIFTS',
        items: todayItems.length > 0 ? todayItems : [
          {
            id: 'fallback-1',
            time: '09:00 AM',
            title: 'Morning Site Muster & Verification',
            siteName: 'No Active Projects',
            location: 'Create or join a project to generate schedule',
            tag: 'General',
          },
        ],
      },
      {
        dayLabel: 'TOMORROW · AUDITS & INSPECTIONS',
        items: tomorrowItems.length > 0 ? tomorrowItems : [
          {
            id: 'fallback-2',
            time: '11:00 AM',
            title: 'Quality Assurance & Measure Checks',
            siteName: 'All Sites Up to Date',
            location: 'HQ Dispatch',
            tag: 'QA',
          },
        ],
      },
    ];

    if (upcomingItems.length > 0) {
      groups.push({
        dayLabel: 'UPCOMING · CONTRACT COMMENCEMENTS',
        items: upcomingItems,
      });
    }

    return groups;
  }, [projects]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP HEADER */}
        <FadeInSlide delay={40} distance={14}>
          <View style={styles.topHeader}>
            <Text style={styles.pageTitle}>Schedule</Text>
            <Text style={styles.pageSub}>
              Live site musters, trade inspections, and client appointments
            </Text>
          </View>
        </FadeInSlide>

        {/* TIMELINE GROUPS */}
        <View style={styles.timeline}>
          {scheduleGroups.map((group, gIdx) => (
            <FadeInSlide key={group.dayLabel} delay={80 + gIdx * 40} distance={14}>
              <View style={styles.groupContainer}>
                <Text style={styles.groupHeader}>{group.dayLabel}</Text>

                <View style={styles.groupCards}>
                  {group.items.map((item) => (
                    <SpringPressable key={item.id} style={styles.scheduleCard} scaleTo={0.98}>
                      <View style={styles.cardTopRow}>
                        <View style={styles.timeBadge}>
                          <ClockIcon size={12} color="#FFFFFF" />
                          <Text style={styles.timeText}>{item.time}</Text>
                        </View>
                        <View style={styles.tagBadge}>
                          <Text style={styles.tagText}>{item.tag}</Text>
                        </View>
                      </View>

                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <View style={styles.siteRow}>
                        <BriefcaseIcon size={12} color="#8E8E93" />
                        <Text style={styles.siteNameText} numberOfLines={1}>
                          {item.siteName}
                        </Text>
                      </View>

                      <View style={styles.locationRow}>
                        <MapPinIcon size={12} color="#636366" />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {item.location}
                        </Text>
                      </View>
                    </SpringPressable>
                  ))}
                </View>
              </View>
            </FadeInSlide>
          ))}
        </View>
      </ScrollView>
    </View>
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
    paddingBottom: 110,
  },
  topHeader: {
    marginBottom: 24,
    paddingTop: 4,
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
  timeline: {
    gap: 24,
  },
  groupContainer: {
    gap: 12,
  },
  groupHeader: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 11.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  groupCards: {
    gap: 12,
  },
  scheduleCard: {
    backgroundColor: '#16161A',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222228',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#222228',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 11,
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  itemTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 6,
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  siteNameText: {
    fontFamily: fonts.bodyMedium,
    color: '#8E8E93',
    fontSize: 12.5,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  locationText: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 11.5,
    flex: 1,
  },
});
