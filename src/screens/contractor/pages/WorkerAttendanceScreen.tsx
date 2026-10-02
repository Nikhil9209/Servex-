import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
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
      {/* HEADER */}
      <View style={styles.topHeader}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <ArrowLeftIcon size={16} color="#94A3B8" />
          <Text style={styles.backBtnText}>Workspace</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Daily Attendance & Wages</Text>
          <Text style={styles.headerSub}>{project.projectName}</Text>
        </View>

        <Pressable style={styles.addBtn} onPress={() => setShowAddWorkerModal(true)}>
          <PlusIcon size={14} color="#0B0E14" />
          <Text style={styles.addBtnText}>Worker</Text>
        </Pressable>
      </View>

      {/* TODAY'S ATTENDANCE SUMMARY CARD */}
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
          <Text style={styles.statNumGreen}>₹{totalWageToday.toLocaleString('en-IN')}</Text>
          <Text style={styles.statLabel}>Wage Liability</Text>
        </View>
      </View>

      {/* WORKER ATTENDANCE LIST */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeaderTitle}>Today&apos;s Worker Roster & Proof Verification</Text>

        {attendance.map((entry) => (
          <View key={entry.workerId} style={styles.workerCard}>
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
                  Standard Rate: ₹{entry.dailyWage}/day • Check-in: {entry.checkInTime}
                </Text>
              </View>

              <View style={styles.earnedBox}>
                <Text style={styles.earnedVal}>₹{entry.wageCalculated}</Text>
                <Text style={styles.earnedLabel}>Calculated</Text>
              </View>
            </View>

            {/* STATUS SELECTOR (SEGMENTED TABS) */}
            <View style={styles.statusRow}>
              <Pressable
                style={[
                  styles.statusTab,
                  entry.status === 'present' ? styles.statusTabPresent : styles.statusTabInactive,
                ]}
                onPress={() => setStatus(entry.workerId, 'present')}
              >
                <Text
                  style={[
                    styles.statusTabText,
                    entry.status === 'present' ? styles.textPresent : styles.textInactive,
                  ]}
                >
                  Present (Full)
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.statusTab,
                  entry.status === 'half_day' ? styles.statusTabHalf : styles.statusTabInactive,
                ]}
                onPress={() => setStatus(entry.workerId, 'half_day')}
              >
                <Text
                  style={[
                    styles.statusTabText,
                    entry.status === 'half_day' ? styles.textHalf : styles.textInactive,
                  ]}
                >
                  Half-Day
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.statusTab,
                  entry.status === 'absent' ? styles.statusTabAbsent : styles.statusTabInactive,
                ]}
                onPress={() => setStatus(entry.workerId, 'absent')}
              >
                <Text
                  style={[
                    styles.statusTabText,
                    entry.status === 'absent' ? styles.textAbsent : styles.textInactive,
                  ]}
                >
                  Absent
                </Text>
              </Pressable>
            </View>

            {/* PROOF VERIFICATION TOGGLE */}
            <Pressable
              style={[
                styles.proofToggleRow,
                entry.proofVerified ? styles.proofVerifiedBg : styles.proofPendingBg,
              ]}
              onPress={() => toggleProof(entry.workerId)}
            >
              <View style={styles.proofLeftCol}>
                <View style={styles.proofIconBox}>
                  {entry.proofVerified ? (
                    <ShieldCheckIcon size={14} color="#10B981" />
                  ) : (
                    <CameraIcon size={14} color="#F59E0B" />
                  )}
                </View>
                <View>
                  <Text
                    style={[
                      styles.proofStatusTitle,
                      entry.proofVerified ? styles.proofTextGreen : styles.proofTextAmber,
                    ]}
                  >
                    {entry.proofVerified ? 'Site Photo Verified' : 'Awaiting Photo Proof'}
                  </Text>
                  <Text style={styles.proofNoteText}>{entry.proofNote}</Text>
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
                  {entry.proofVerified ? 'Verified' : 'Verify'}
                </Text>
              </View>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* ADD WORKER MODAL */}
      <Modal
        visible={showAddWorkerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddWorkerModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalTopRow}>
              <View style={styles.modalIconBox}>
                <CrewIcon size={18} color="#10B981" />
              </View>
              <Pressable onPress={() => setShowAddWorkerModal(false)} hitSlop={8}>
                <CloseIcon size={18} color="#94A3B8" />
              </Pressable>
            </View>

            <Text style={styles.modalTitle}>Enroll New Worker</Text>
            <Text style={styles.modalDesc}>
              Add a new crew member to this site roster with daily wage and trade category.
            </Text>

            <Text style={styles.inputLabel}>Worker Full Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Rameshwar Yadav"
              placeholderTextColor="#64748B"
              value={newWorkerName}
              onChangeText={setNewWorkerName}
            />

            <Text style={styles.inputLabel}>Trade Category</Text>
            <View style={styles.rolePickerRow}>
              {AVAILABLE_ROLES.map((r) => (
                <Pressable
                  key={r}
                  style={[styles.rolePill, newWorkerRole === r && styles.rolePillActive]}
                  onPress={() => setNewWorkerRole(r)}
                >
                  <Text
                    style={[
                      styles.rolePillText,
                      newWorkerRole === r && styles.rolePillTextActive,
                    ]}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>Daily Wage Rate (₹)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 950"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              value={newWorkerWage}
              onChangeText={setNewWorkerWage}
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. +91 98111 22334"
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
              value={newWorkerPhone}
              onChangeText={setNewWorkerPhone}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowAddWorkerModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleSaveWorker}>
                <CheckIcon size={14} color="#0B0E14" />
                <Text style={styles.confirmBtnText}>Enroll Worker</Text>
              </Pressable>
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
    backgroundColor: '#0B0E14',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2638',
    backgroundColor: '#0E121B',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  backBtnText: {
    fontFamily: fonts.displayBold,
    color: '#94A3B8',
    fontSize: 12.5,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 14.5,
  },
  headerSub: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 10.5,
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    gap: 4,
  },
  addBtnText: {
    fontFamily: fonts.displayBold,
    color: '#0B0E14',
    fontSize: 11.5,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#111622',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E2638',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#1E2638',
  },
  statNum: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    marginBottom: 2,
  },
  statNumGreen: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 14,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 9.5,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 12,
  },
  sectionHeaderTitle: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 13,
  },
  workerCard: {
    backgroundColor: '#111622',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E2638',
  },
  workerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  workerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#1E2638',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2D384E',
  },
  avatarInitial: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 15,
  },
  workerInfo: {
    flex: 1,
  },
  workerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  workerNameText: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 13.5,
  },
  roleBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontFamily: fonts.bodyMedium,
    color: '#38BDF8',
    fontSize: 9,
  },
  workerWageRate: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 10.5,
  },
  earnedBox: {
    alignItems: 'flex-end',
  },
  earnedVal: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 14,
  },
  earnedLabel: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 9.5,
  },
  statusRow: {
    flexDirection: 'row',
    backgroundColor: '#0E121B',
    borderRadius: 8,
    padding: 3,
    marginBottom: 10,
    gap: 3,
  },
  statusTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 6,
  },
  statusTabPresent: {
    backgroundColor: '#064E3B',
  },
  statusTabHalf: {
    backgroundColor: '#78350F',
  },
  statusTabAbsent: {
    backgroundColor: '#7F1D1D',
  },
  statusTabInactive: {
    backgroundColor: 'transparent',
  },
  statusTabText: {
    fontFamily: fonts.displayBold,
    fontSize: 10.5,
  },
  textPresent: {
    color: '#34D399',
  },
  textHalf: {
    color: '#FBBF24',
  },
  textAbsent: {
    color: '#F87171',
  },
  textInactive: {
    color: '#64748B',
  },
  proofToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  proofVerifiedBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  proofPendingBg: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  proofLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  proofIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#1E2638',
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
    color: '#64748B',
    fontSize: 10,
  },
  verifyActionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  verifyActionDone: {
    backgroundColor: '#10B981',
  },
  verifyActionPending: {
    backgroundColor: '#1E2638',
  },
  verifyActionText: {
    fontFamily: fonts.displayBold,
    fontSize: 9.5,
  },
  verifyTextDone: {
    color: '#0B0E14',
  },
  verifyTextPending: {
    color: '#94A3B8',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#0E121B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#242F44',
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1E2638',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 16,
    marginBottom: 4,
  },
  modalDesc: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 14,
  },
  inputLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 5,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#151C2C',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#28354D',
    color: '#F8FAFC',
    fontFamily: fonts.body,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  rolePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#151C2C',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#28354D',
  },
  rolePillActive: {
    backgroundColor: '#1E2638',
    borderColor: '#10B981',
  },
  rolePillText: {
    fontFamily: fonts.displayBold,
    color: '#64748B',
    fontSize: 10.5,
  },
  rolePillTextActive: {
    color: '#10B981',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  cancelBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#94A3B8',
    fontSize: 12.5,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 5,
  },
  confirmBtnText: {
    fontFamily: fonts.displayBold,
    color: '#0B0E14',
    fontSize: 12.5,
  },
});
