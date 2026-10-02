import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { fonts } from '../../../theme/tokens';
import { ContractorProjectDetail, WorkerRecord, AttendanceEntry } from '../../../types/contractor';
import {
  ArrowLeftIcon,
  PlusIcon,
  CloseIcon,
  CrewIcon,
  ShieldCheckIcon,
  CameraIcon,
  CheckIcon,
} from '../../../components/ContractorIcons';
import {
  FadeInSlide,
  SpringPressable,
} from '../../../components/AnimatedComponents';

interface WorkerAttendanceScreenProps {
  project: ContractorProjectDetail;
  onBack: () => void;
  onAddWorker: (newWorker: Omit<WorkerRecord, 'id'>) => void;
  onUpdateAttendance: (attendanceList: AttendanceEntry[]) => void;
}

const AVAILABLE_ROLES: WorkerRecord['role'][] = [
  'Mason',
  'Electrician',
  'Helper',
  'Carpenter',
  'Painter',
];

export const WorkerAttendanceScreen: React.FC<WorkerAttendanceScreenProps> = ({
  project,
  onBack,
  onAddWorker,
  onUpdateAttendance,
}) => {
  const [attendance, setAttendance] = useState<AttendanceEntry[]>(project.todayAttendance);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerRole, setNewWorkerRole] = useState<WorkerRecord['role']>('Mason');
  const [newWorkerWage, setNewWorkerWage] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');

  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const halfDayCount = attendance.filter((a) => a.status === 'half_day').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;
  const totalWageToday = attendance.reduce((sum, a) => sum + a.wageCalculated, 0);

  const setStatus = (workerId: string, status: AttendanceEntry['status']) => {
    const updated = attendance.map((a) => {
      if (a.workerId !== workerId) return a;
      const wageCalculated =
        status === 'present' ? a.dailyWage : status === 'half_day' ? Math.round(a.dailyWage / 2) : 0;
      return {
        ...a,
        status,
        wageCalculated,
      };
    });
    setAttendance(updated);
    onUpdateAttendance(updated);
  };

  const toggleProof = (workerId: string) => {
    const updated = attendance.map((a) => {
      if (a.workerId !== workerId) return a;
      const newProof = !a.proofVerified;
      return {
        ...a,
        proofVerified: newProof,
        proofNote: newProof
          ? 'Site arrival & on-time photo proof verified ✓'
          : 'Awaiting proof verification',
      };
    });
    setAttendance(updated);
    onUpdateAttendance(updated);
  };

  const handleSaveWorker = () => {
    if (!newWorkerName.trim()) {
      Alert.alert('Missing Name', 'Please enter the worker name.');
      return;
    }
    const wage = parseFloat(newWorkerWage);
    if (isNaN(wage) || wage <= 0) {
      Alert.alert('Invalid Wage', 'Please enter a valid daily wage rate.');
      return;
    }

    onAddWorker({
      name: newWorkerName.trim(),
      role: newWorkerRole,
      dailyWage: wage,
      phone: newWorkerPhone.trim() || '+91 98000 00000',
    });

    setNewWorkerName('');
    setNewWorkerWage('');
    setNewWorkerPhone('');
    setShowAddWorkerModal(false);
  };

  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER WITH CIRCULAR CONTROLS */}
      <FadeInSlide delay={40} distance={14}>
        <View style={styles.topHeader}>
          <SpringPressable
            style={styles.circleHeaderBtn}
            onPress={onBack}
            scaleTo={0.92}
            hitSlop={8}
          >
            <ArrowLeftIcon size={18} color="#FFFFFF" />
          </SpringPressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Crew & Attendance</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {project.projectName}
            </Text>
          </View>

          <SpringPressable
            style={styles.circleAddBtn}
            onPress={() => setShowAddWorkerModal(true)}
            scaleTo={0.92}
            hitSlop={8}
          >
            <PlusIcon size={18} color="#000000" />
          </SpringPressable>
        </View>
      </FadeInSlide>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. TODAY'S ATTENDANCE SUMMARY CARD */}
        <FadeInSlide delay={80} distance={14}>
          <View style={styles.summaryCard}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#10B981' }]}>{presentCount}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#F59E0B' }]}>{halfDayCount}</Text>
              <Text style={styles.statLabel}>Half-Day</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#EF4444' }]}>{absentCount}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumWhite}>₹{totalWageToday.toLocaleString('en-IN')}</Text>
              <Text style={styles.statLabel}>Wage Liability</Text>
            </View>
          </View>
        </FadeInSlide>

        {/* 3. SECTION HEADER */}
        <FadeInSlide delay={120} distance={14}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY&apos;S WORKER ROSTER</Text>
            <Text style={styles.sectionCount}>{attendance.length} enrolled</Text>
          </View>
        </FadeInSlide>

        {/* 4. WORKER LIST */}
        {attendance.map((entry, idx) => (
          <FadeInSlide key={entry.workerId} delay={140 + idx * 40} distance={14}>
            <View style={styles.workerCard}>
              {/* Worker Top Info */}
              <View style={styles.workerTopRow}>
                <View style={styles.workerAvatar}>
                  <Text style={styles.avatarInitial}>{entry.workerName.charAt(0)}</Text>
                </View>

                <View style={styles.workerInfo}>
                  <View style={styles.workerNameRow}>
                    <Text style={styles.workerNameText}>{entry.workerName}</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{entry.role.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.workerWageRate}>
                    Rate: ₹{entry.dailyWage}/day • {entry.checkInTime}
                  </Text>
                </View>

                <View style={styles.earnedBox}>
                  <Text style={styles.earnedVal}>₹{entry.wageCalculated.toLocaleString('en-IN')}</Text>
                  <Text style={styles.earnedLabel}>Pay Calculated</Text>
                </View>
              </View>

              {/* Status Segmented Buttons */}
              <View style={styles.statusRow}>
                <SpringPressable
                  style={[
                    styles.statusTab,
                    entry.status === 'present' && styles.statusTabPresent,
                  ]}
                  onPress={() => setStatus(entry.workerId, 'present')}
                  scaleTo={0.96}
                >
                  <Text
                    style={[
                      styles.statusTabText,
                      entry.status === 'present' ? styles.textPresent : styles.textInactive,
                    ]}
                  >
                    Present (Full)
                  </Text>
                </SpringPressable>

                <SpringPressable
                  style={[
                    styles.statusTab,
                    entry.status === 'half_day' && styles.statusTabHalf,
                  ]}
                  onPress={() => setStatus(entry.workerId, 'half_day')}
                  scaleTo={0.96}
                >
                  <Text
                    style={[
                      styles.statusTabText,
                      entry.status === 'half_day' ? styles.textHalf : styles.textInactive,
                    ]}
                  >
                    Half-Day
                  </Text>
                </SpringPressable>

                <SpringPressable
                  style={[
                    styles.statusTab,
                    entry.status === 'absent' && styles.statusTabAbsent,
                  ]}
                  onPress={() => setStatus(entry.workerId, 'absent')}
                  scaleTo={0.96}
                >
                  <Text
                    style={[
                      styles.statusTabText,
                      entry.status === 'absent' ? styles.textAbsent : styles.textInactive,
                    ]}
                  >
                    Absent
                  </Text>
                </SpringPressable>
              </View>

              {/* Photo Proof Verification Capsule */}
              <SpringPressable
                style={[
                  styles.proofToggleRow,
                  entry.proofVerified ? styles.proofVerifiedBg : styles.proofPendingBg,
                ]}
                onPress={() => toggleProof(entry.workerId)}
                scaleTo={0.98}
              >
                <View style={styles.proofLeftCol}>
                  <View style={styles.proofIconBox}>
                    {entry.proofVerified ? (
                      <ShieldCheckIcon size={14} color="#10B981" />
                    ) : (
                      <CameraIcon size={14} color="#F59E0B" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.proofStatusTitle,
                        entry.proofVerified ? styles.proofTextGreen : styles.proofTextAmber,
                      ]}
                    >
                      {entry.proofVerified ? 'Site Photo Verified' : 'Awaiting Photo Proof'}
                    </Text>
                    <Text style={styles.proofNoteText} numberOfLines={1}>
                      {entry.proofNote}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.verifyActionPill,
                    entry.proofVerified ? styles.verifyActionDone : styles.verifyActionPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.verifyActionText,
                      entry.proofVerified ? styles.verifyTextDone : styles.verifyTextPending,
                    ]}
                  >
                    {entry.proofVerified ? 'Verified ✓' : 'Verify'}
                  </Text>
                </View>
              </SpringPressable>
            </View>
          </FadeInSlide>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 5. FLOATING BOTTOM BAR */}
      <FadeInSlide delay={200} distance={20}>
        <View style={styles.floatingBottomBar}>
          <View style={styles.floatingLeft}>
            <Text style={styles.floatingTitle}>{attendance.length} Crew Members Active</Text>
            <Text style={styles.floatingSubtitle}>Daily biometric & photo muster roll</Text>
          </View>
          <SpringPressable
            style={styles.floatingAddBtn}
            onPress={() => setShowAddWorkerModal(true)}
            scaleTo={0.94}
          >
            <PlusIcon size={16} color="#000000" />
            <Text style={styles.floatingAddBtnText}>Add Worker</Text>
          </SpringPressable>
        </View>
      </FadeInSlide>

      {/* 6. ADD WORKER MODAL */}
      <Modal
        visible={showAddWorkerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddWorkerModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalTopRow}>
              <View style={styles.modalIconBox}>
                <CrewIcon size={18} color="#FFFFFF" />
              </View>
              <SpringPressable
                onPress={() => setShowAddWorkerModal(false)}
                style={styles.modalCloseBtn}
                scaleTo={0.9}
                hitSlop={8}
              >
                <CloseIcon size={16} color="#8E8E93" />
              </SpringPressable>
            </View>

            <Text style={styles.modalTitle}>Enroll New Worker</Text>
            <Text style={styles.modalDesc}>
              Add a new crew member to this site roster with daily wage and trade category.
            </Text>

            {/* Name */}
            <Text style={styles.inputLabel}>WORKER FULL NAME</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Rameshwar Yadav"
              placeholderTextColor="#55555C"
              value={newWorkerName}
              onChangeText={setNewWorkerName}
            />

            {/* Role Pills */}
            <Text style={styles.inputLabel}>TRADE CATEGORY</Text>
            <View style={styles.rolePickerRow}>
              {AVAILABLE_ROLES.map((r) => {
                const isActive = newWorkerRole === r;
                return (
                  <SpringPressable
                    key={r}
                    style={[styles.rolePill, isActive && styles.rolePillActive]}
                    onPress={() => setNewWorkerRole(r)}
                    scaleTo={0.95}
                  >
                    <Text
                      style={[
                        styles.rolePillText,
                        isActive && styles.rolePillTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </SpringPressable>
                );
              })}
            </View>

            {/* Daily Wage */}
            <Text style={styles.inputLabel}>DAILY WAGE RATE (₹)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 950"
              placeholderTextColor="#55555C"
              keyboardType="numeric"
              value={newWorkerWage}
              onChangeText={setNewWorkerWage}
            />

            {/* Phone */}
            <Text style={styles.inputLabel}>PHONE NUMBER</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. +91 98111 22334"
              placeholderTextColor="#55555C"
              keyboardType="phone-pad"
              value={newWorkerPhone}
              onChangeText={setNewWorkerPhone}
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <SpringPressable
                style={styles.cancelBtn}
                onPress={() => setShowAddWorkerModal(false)}
                scaleTo={0.95}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </SpringPressable>

              <SpringPressable
                style={styles.confirmBtn}
                onPress={handleSaveWorker}
                scaleTo={0.95}
              >
                <CheckIcon size={14} color="#000000" />
                <Text style={styles.confirmBtnText}>Enroll Worker</Text>
              </SpringPressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#000000',
  },
  circleHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: '#222228',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 2,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },

  // SUMMARY CARD
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#16161A',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222228',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#222228',
  },
  statNum: {
    fontFamily: fonts.displayBold,
    fontSize: 17,
    marginBottom: 2,
  },
  statNumWhite: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 10,
  },

  // SECTION HEADER
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 11,
  },

  // WORKER CARDS
  workerCard: {
    backgroundColor: '#16161A',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222228',
    marginBottom: 12,
  },
  workerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  workerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#222228',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2C2C34',
  },
  avatarInitial: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  workerInfo: {
    flex: 1,
  },
  workerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  workerNameText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  roleBadge: {
    backgroundColor: '#1F1F26',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A2A34',
  },
  roleBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 9.5,
  },
  workerWageRate: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 11,
  },
  earnedBox: {
    alignItems: 'flex-end',
  },
  earnedVal: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  earnedLabel: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 10,
    marginTop: 2,
  },

  // STATUS SELECTOR (CAPSULE ROW)
  statusRow: {
    flexDirection: 'row',
    backgroundColor: '#111114',
    borderRadius: 12,
    padding: 3,
    marginBottom: 10,
    gap: 4,
  },
  statusTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  statusTabPresent: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusTabHalf: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusTabAbsent: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusTabText: {
    fontFamily: fonts.displayBold,
    fontSize: 10.5,
  },
  textPresent: {
    color: '#10B981',
  },
  textHalf: {
    color: '#F59E0B',
  },
  textAbsent: {
    color: '#EF4444',
  },
  textInactive: {
    color: '#636366',
  },

  // PROOF TOGGLE
  proofToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  proofVerifiedBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  proofPendingBg: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  proofLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  proofIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#222228',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofStatusTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 11,
  },
  proofTextGreen: {
    color: '#10B981',
  },
  proofTextAmber: {
    color: '#F59E0B',
  },
  proofNoteText: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 10,
    marginTop: 1,
  },
  verifyActionPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  verifyActionDone: {
    backgroundColor: '#10B981',
  },
  verifyActionPending: {
    backgroundColor: '#222228',
  },
  verifyActionText: {
    fontFamily: fonts.displayBold,
    fontSize: 10,
  },
  verifyTextDone: {
    color: '#000000',
  },
  verifyTextPending: {
    color: '#FFFFFF',
  },

  // FLOATING BOTTOM BAR
  floatingBottomBar: {
    position: 'absolute',
    bottom: 24,
    left: 18,
    right: 18,
    backgroundColor: '#16161A',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#262630',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  floatingLeft: {
    flex: 1,
    marginRight: 12,
  },
  floatingTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13,
  },
  floatingSubtitle: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 10.5,
    marginTop: 2,
  },
  floatingAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
  },
  floatingAddBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 12,
  },

  // MODAL STYLING
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#16161A',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: '#262632',
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#222228',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#222228',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 17,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  modalDesc: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 10.5,
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 10,
  },
  rolePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  rolePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#1C1C22',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262630',
  },
  rolePillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  rolePillText: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 11,
  },
  rolePillTextActive: {
    color: '#000000',
  },
  textInput: {
    backgroundColor: '#0C0C0E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262632',
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#8E8E93',
    fontSize: 13,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 14,
    gap: 6,
  },
  confirmBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 13,
  },
});
