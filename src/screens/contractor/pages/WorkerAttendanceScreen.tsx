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

interface WorkerAttendanceScreenProps {
  project: ContractorProjectDetail;
  onBack: () => void;
  onAddWorker: (newWorker: Omit<WorkerRecord, 'id'>) => void;
  onUpdateAttendance: (attendanceList: AttendanceEntry[]) => void;
}

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
        proofNote: newProof ? 'Site arrival & on-time proof verified ✓' : 'Awaiting proof verification',
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
          <Text style={styles.backBtnText}>‹ Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Daily Attendance & Wages</Text>
          <Text style={styles.headerSub}>{project.projectName}</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setShowAddWorkerModal(true)}>
          <Text style={styles.addBtnText}>+ Worker</Text>
        </Pressable>
      </View>

      {/* TODAY'S ATTENDANCE SUMMARY CARD */}
      <View style={styles.summaryCard}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{presentCount}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{halfDayCount}</Text>
          <Text style={styles.statLabel}>Half-Day</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{absentCount}</Text>
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
                  Daily Rate: ₹{entry.dailyWage} / day
                </Text>
              </View>

              <View style={styles.wagePayableBox}>
                <Text style={styles.wagePayableLabel}>Payable</Text>
                <Text style={styles.wagePayableVal}>
                  ₹{entry.wageCalculated.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* ATTENDANCE TOGGLE BUTTONS */}
            <View style={styles.statusButtonsRow}>
              <Pressable
                style={[styles.statusBtn, entry.status === 'present' && styles.statusBtnPresent]}
                onPress={() => setStatus(entry.workerId, 'present')}
              >
                <Text
                  style={[
                    styles.statusBtnText,
                    entry.status === 'present' && styles.statusBtnTextActive,
                  ]}
                >
                  ✓ Present (Full)
                </Text>
              </Pressable>

              <Pressable
                style={[styles.statusBtn, entry.status === 'half_day' && styles.statusBtnHalf]}
                onPress={() => setStatus(entry.workerId, 'half_day')}
              >
                <Text
                  style={[
                    styles.statusBtnText,
                    entry.status === 'half_day' && styles.statusBtnTextActive,
                  ]}
                >
                  ½ Half-Day
                </Text>
              </Pressable>

              <Pressable
                style={[styles.statusBtn, entry.status === 'absent' && styles.statusBtnAbsent]}
                onPress={() => setStatus(entry.workerId, 'absent')}
              >
                <Text
                  style={[
                    styles.statusBtnText,
                    entry.status === 'absent' && styles.statusBtnTextActive,
                  ]}
                >
                  ✕ Absent
                </Text>
              </Pressable>
            </View>

            {/* ON-TIME PROOF VERIFICATION */}
            {entry.status !== 'absent' && (
              <Pressable
                style={[styles.proofRow, entry.proofVerified && styles.proofRowVerified]}
                onPress={() => toggleProof(entry.workerId)}
              >
                <View style={[styles.proofCheckbox, entry.proofVerified && styles.proofCheckboxDone]}>
                  {entry.proofVerified && <Text style={styles.proofCheckSymbol}>✓</Text>}
                </View>
                <View style={styles.proofContent}>
                  <Text style={[styles.proofTitle, entry.proofVerified && styles.proofTitleDone]}>
                    {entry.proofVerified ? 'On-Time Proof Verified ✓' : 'Verify On-Time Arrival Proof'}
                  </Text>
                  <Text style={styles.proofSub}>
                    Check-in: {entry.checkInTime} • {entry.proofNote}
                  </Text>
                </View>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>

      {/* MODAL TO ADD NEW WORKER */}
      <Modal
        visible={showAddWorkerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddWorkerModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Project Worker</Text>
            <Text style={styles.modalDesc}>
              Enroll a new skilled tradesman or helper to this project roster.
            </Text>

            <Text style={styles.inputLabel}>Worker Full Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Rameshwar Yadav"
              placeholderTextColor="#71717A"
              value={newWorkerName}
              onChangeText={setNewWorkerName}
            />

            <Text style={styles.inputLabel}>Trade / Specialization</Text>
            <View style={styles.roleGrid}>
              {(['Mason', 'Electrician', 'Painter', 'Carpenter', 'Plumber', 'Helper'] as WorkerRecord['role'][]).map(
                (r) => (
                  <Pressable
                    key={r}
                    style={[styles.roleBtn, newWorkerRole === r && styles.roleBtnActive]}
                    onPress={() => setNewWorkerRole(r)}
                  >
                    <Text
                      style={[
                        styles.roleBtnText,
                        newWorkerRole === r && styles.roleBtnTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </Pressable>
                )
              )}
            </View>

            <Text style={styles.inputLabel}>Agreed Daily Wage Rate (₹ / Day)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 950"
              placeholderTextColor="#71717A"
              keyboardType="numeric"
              value={newWorkerWage}
              onChangeText={setNewWorkerWage}
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. +91 98200 12345"
              placeholderTextColor="#71717A"
              keyboardType="phone-pad"
              value={newWorkerPhone}
              onChangeText={setNewWorkerPhone}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowAddWorkerModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSaveWorker}>
                <Text style={styles.saveBtnText}>Enroll Worker</Text>
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
    backgroundColor: '#000000',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#161920',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 14,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  headerSub: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 7,
  },
  addBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#111317',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#20242D',
  },
  statNum: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 2,
  },
  statNumGreen: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 16,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10.5,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },
  sectionHeaderTitle: {
    fontFamily: fonts.displayBold,
    color: '#A1A1AA',
    fontSize: 12,
    letterSpacing: 0.5,
    marginVertical: 4,
  },
  workerCard: {
    backgroundColor: '#111317',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  workerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1C2028',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2A303C',
  },
  avatarInitial: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
  },
  workerInfo: {
    flex: 1,
  },
  workerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workerNameText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#D4D4D8',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  workerWageRate: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11.5,
    marginTop: 2,
  },
  wagePayableBox: {
    alignItems: 'flex-end',
  },
  wagePayableLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10,
  },
  wagePayableVal: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 15,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#232730',
  },
  statusBtnPresent: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  statusBtnHalf: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  statusBtnAbsent: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  statusBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#71717A',
    fontSize: 11,
  },
  statusBtnTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.displayBold,
  },
  proofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C0D11',
    borderRadius: 8,
    padding: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#1D222B',
  },
  proofRowVerified: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  proofCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#3F4450',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofCheckboxDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  proofCheckSymbol: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  proofContent: {
    flex: 1,
  },
  proofTitle: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 11.5,
  },
  proofTitleDone: {
    color: '#10B981',
  },
  proofSub: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10,
    marginTop: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F1116',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#242833',
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 17,
    marginBottom: 4,
  },
  modalDesc: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 11.5,
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#161920',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#232730',
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#161920',
    borderWidth: 1,
    borderColor: '#232730',
  },
  roleBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  roleBtnText: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 11.5,
  },
  roleBtnTextActive: {
    color: '#000000',
    fontFamily: fonts.displayBold,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cancelBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  saveBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 13,
  },
});
