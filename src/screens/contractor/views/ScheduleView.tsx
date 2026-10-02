import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { fonts } from '../../../theme/tokens';
import { ClockIcon, MapPinIcon } from '../../../components/ContractorIcons';

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

const SCHEDULE_GROUPS: ScheduleDayGroup[] = [
  {
    dayLabel: 'TODAY · OCT 2',
    items: [
      {
        id: 'sch-1',
        time: '09:00 AM',
        title: 'Morning Crew Check-in & Tooling',
        siteName: 'Skyline Penthouse Renovation',
        location: 'Tower B, Worli Sea Face',
        tag: 'On-site',
      },
      {
        id: 'sch-2',
        time: '04:30 PM',
        title: 'Measurement Verification & Day Sign-off',
        siteName: 'Skyline Penthouse Renovation',
        location: 'Tower B, Worli Sea Face',
        tag: 'Audit',
      },
    ],
  },
  {
    dayLabel: 'TOMORROW · OCT 3',
    items: [
      {
        id: 'sch-3',
        time: '10:30 AM',
        title: 'Italian Marble Consignment Delivery',
        siteName: 'Skyline Penthouse Renovation',
        location: 'Tower B Service Lift, Worli',
        tag: 'Material',
      },
      {
        id: 'sch-4',
        time: '02:00 PM',
        title: 'Architect & Client Site Walkthrough',
        siteName: 'Skyline Penthouse Renovation',
        location: 'Client: Vikram Singhania',
        tag: 'Meeting',
      },
    ],
  },
  {
    dayLabel: 'SATURDAY · OCT 4',
    items: [
      {
        id: 'sch-5',
        time: '11:00 AM',
        title: 'Concealed Electrical Conduit Pressure Test',
        siteName: 'Skyline Penthouse Renovation',
        location: 'Electrical Riser Zone',
        tag: 'Inspection',
      },
    ],
  },
  {
    dayLabel: 'MONDAY · OCT 6',
    items: [
      {
        id: 'sch-6',
        time: '09:30 AM',
        title: 'POP False Ceiling Framing Phase 2',
        siteName: 'Skyline Penthouse Renovation',
        location: 'Living & Dining Area',
        tag: 'Milestone',
      },
    ],
  },
];

export const ScheduleView: React.FC = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP HEADER */}
        <View style={styles.topHeader}>
          <Text style={styles.pageTitle}>Schedule</Text>
          <Text style={styles.pageSub}>
            Upcoming appointments, material deliveries, and crew milestones
          </Text>
        </View>

        {/* TIMELINE GROUPS */}
        <View style={styles.timeline}>
          {SCHEDULE_GROUPS.map((group) => (
            <View key={group.dayLabel} style={styles.groupContainer}>
              <Text style={styles.groupHeader}>{group.dayLabel}</Text>

              <View style={styles.groupCards}>
                {group.items.map((item) => (
                  <View key={item.id} style={styles.scheduleCard}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.timeBadge}>
                        <ClockIcon size={12} color="#1A73E8" />
                        <Text style={styles.timeText}>{item.time}</Text>
                      </View>
                      <View style={styles.tagBadge}>
                        <Text style={styles.tagText}>{item.tag}</Text>
                      </View>
                    </View>

                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.siteNameText}>{item.siteName}</Text>

                    <View style={styles.locationRow}>
                      <MapPinIcon size={12} color="#8E8E93" />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {item.location}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
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
    lineHeight: 18,
  },
  timeline: {
    gap: 22,
  },
  groupContainer: {
    gap: 10,
  },
  groupHeader: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 11.5,
    letterSpacing: 0.8,
  },
  groupCards: {
    gap: 12,
  },
  scheduleCard: {
    backgroundColor: '#16161A',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#222228',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(26, 115, 232, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeText: {
    fontFamily: fonts.displayBold,
    color: '#1A73E8',
    fontSize: 11.5,
  },
  tagBadge: {
    backgroundColor: '#23232A',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: fonts.bodyMedium,
    color: '#E2E2E6',
    fontSize: 10.5,
  },
  itemTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15.5,
    marginBottom: 2,
  },
  siteNameText: {
    fontFamily: fonts.bodyMedium,
    color: '#E2E2E6',
    fontSize: 13,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 12,
    flex: 1,
  },
});
