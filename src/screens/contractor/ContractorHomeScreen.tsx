import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fonts } from '../../theme/tokens';
import { User } from '../../types/auth';
import { ContractorProjectDetail } from '../../types/contractor';
import { INITIAL_CONTRACTOR_PROJECTS } from '../../services/contractorStorage';
import { MapPinIcon, CrewIcon } from '../../components/ContractorIcons';
import { ProjectWorkspaceScreen } from './pages/ProjectWorkspaceScreen';

export interface ContractorHomeScreenProps {
  user: User;
  onLogout: () => void;
  onReplaySplash?: () => void;
}

export const ContractorHomeScreen: React.FC<ContractorHomeScreenProps> = ({
  user,
  onLogout,
  onReplaySplash,
}) => {
  const [projects, setProjects] = useState<ContractorProjectDetail[]>(INITIAL_CONTRACTOR_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Join Project Modal state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [clientCodeInput, setClientCodeInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newSiteAddress, setNewSiteAddress] = useState('');

  const [isMobilized, setIsMobilized] = useState(true);

  // If a project is selected, render the dedicated ProjectWorkspaceScreen!
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  if (selectedProject) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <ProjectWorkspaceScreen
          project={selectedProject}
          onBack={() => setSelectedProjectId(null)}
          onUpdateProject={(updatedProject) => {
            setProjects((prev) =>
              prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
            );
          }}
        />
      </SafeAreaView>
    );
  }

  const handleJoinByCode = () => {
    const code = clientCodeInput.trim().toUpperCase();
    if (!code) {
      Alert.alert('Missing Code', 'Please enter the project code given by your client.');
      return;
    }

    // Check if code already joined
    const exists = projects.find((p) => p.clientCode === code);
    if (exists) {
      Alert.alert('Project Linked', `Opening workspace for ${exists.projectName}.`);
      setShowJoinModal(false);
      setClientCodeInput('');
      setSelectedProjectId(exists.id);
      return;
    }

    // Create linked project with this client code
    const newLinkedProject: ContractorProjectDetail = {
      id: `proj-${Date.now()}`,
      clientCode: code,
      projectName: `Site Project (${code})`,
      clientName: 'Client Partner',
      clientPhone: '+91 98000 00000',
      siteAddress: 'Client Assigned Site Location',
      startDate: 'Today',
      status: 'active',
      scopeItems: [
        {
          id: `sc-${Date.now()}`,
          name: 'Site Mobilization & Layout',
          unit: 'sqft',
          quantity: 1000,
          ratePerUnit: 60,
          totalAmount: 60000,
          completedQuantity: 0,
        },
      ],
      workers: [],
      todayAttendance: [],
      dailyReports: [],
      transactions: [],
    };

    setProjects((prev) => [newLinkedProject, ...prev]);
    setShowJoinModal(false);
    setClientCodeInput('');
    setSelectedProjectId(newLinkedProject.id);
    Alert.alert('Connected ✓', `Successfully joined project with Client Code ${code}.`);
  };

  const handleCreateNewProject = () => {
    if (!newProjectName.trim() || !newClientName.trim()) {
      Alert.alert('Missing Info', 'Please enter project name and client name.');
      return;
    }

    const generatedCode = `CLT-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdProject: ContractorProjectDetail = {
      id: `proj-${Date.now()}`,
      clientCode: generatedCode,
      projectName: newProjectName.trim(),
      clientName: newClientName.trim(),
      clientPhone: newClientPhone.trim() || '+91 98200 00000',
      siteAddress: newSiteAddress.trim() || 'Mumbai Metro Zone',
      startDate: 'Today',
      status: 'active',
      scopeItems: [],
      workers: [],
      todayAttendance: [],
      dailyReports: [],
      transactions: [],
    };

    setProjects((prev) => [createdProject, ...prev]);
    setShowCreateModal(false);
    setNewProjectName('');
    setNewClientName('');
    setNewClientPhone('');
    setNewSiteAddress('');
    setSelectedProjectId(createdProject.id);
    Alert.alert('Project Created', `Project created with Client Code: ${generatedCode}. Share this code with your client.`);
  };

  const totalWorkersAllSites = projects.reduce((sum, p) => sum + p.workers.length, 0);
  const totalCompletedValAll = projects.reduce(
    (sum, p) =>
      sum +
      p.scopeItems.reduce((scSum, item) => scSum + item.completedQuantity * item.ratePerUnit, 0),
    0
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* TOP HEADER */}
      <View style={styles.topHeader}>
        <View style={styles.brandGroup}>
          <Text style={styles.brandTitle}>SERVEX</Text>
          <View style={styles.brandPill}>
            <Text style={styles.brandPillText}>PRIME CONTRACTOR</Text>
          </View>
        </View>

        <View style={styles.headerRightRow}>
          <Pressable
            style={[styles.statusToggle, isMobilized ? styles.toggleOn : styles.toggleOff]}
            onPress={() => setIsMobilized(!isMobilized)}
          >
            <View style={[styles.statusDot, isMobilized ? styles.dotOn : styles.dotOff]} />
            <Text style={[styles.statusToggleText, isMobilized ? styles.textOn : styles.textOff]}>
              {isMobilized ? 'MOBILIZED' : 'STANDBY'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.logoutIconBtn}
            onPress={() => {
              Alert.alert('Logout', 'Log out of Servex Contractor Suite?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: onLogout },
              ]);
            }}
            hitSlop={8}
          >
            <Text style={styles.logoutIconText}>⏻</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* CONTRACTOR EXECUTIVE PROFILE */}
        <View style={styles.firmCard}>
          <View style={styles.firmAvatar}>
            <Text style={styles.firmAvatarText}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>
          <View style={styles.firmInfo}>
            <Text style={styles.firmName} numberOfLines={1}>
              {user.name ? `${user.name} Contracting & Infra` : 'Prime Contracting Group'}
            </Text>
            <Text style={styles.firmDetails}>
              Class-1 Prime License • {user.email}
            </Text>
          </View>
        </View>

        {/* PRIMARY ACTIONS: JOIN BY CLIENT CODE & CREATE PROJECT */}
        <View style={styles.actionsRow}>
          <Pressable
            style={styles.joinCodeBtn}
            onPress={() => setShowJoinModal(true)}
          >
            <View style={styles.btnIconBox}>
              <Text style={styles.btnIcon}>🔗</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.joinBtnTitle}>Join via Client Code</Text>
              <Text style={styles.joinBtnSub}>Connect project using code given by client</Text>
            </View>
            <Text style={styles.actionArrow}>➔</Text>
          </Pressable>

          <Pressable
            style={styles.newProjectBtn}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.newProjectBtnText}>+ New Project</Text>
          </Pressable>
        </View>

        {/* PORTFOLIO SNAPSHOT (HIGH-LEVEL & DE-CONGESTED) */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Active Projects</Text>
            <Text style={styles.kpiValue}>{projects.length}</Text>
            <Text style={styles.kpiSub}>Sites in Execution</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Workforce</Text>
            <Text style={styles.kpiValue}>{totalWorkersAllSites} Workers</Text>
            <Text style={styles.kpiSub}>On Active Roster</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Cumulative Output</Text>
            <Text style={styles.kpiValue}>
              ₹{(totalCompletedValAll / 100000).toFixed(1)}L
            </Text>
            <Text style={styles.kpiSub}>Work Done to Date</Text>
          </View>
        </View>

        {/* LINKED PROJECTS LIST */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Linked Projects ({projects.length})</Text>
          <Text style={styles.sectionHeaderSub}>Select project to manage</Text>
        </View>

        <View style={styles.projectList}>
          {projects.map((proj) => {
            const completedVal = proj.scopeItems.reduce(
              (sum, item) => sum + item.completedQuantity * item.ratePerUnit,
              0
            );
            const totalVal = proj.scopeItems.reduce((sum, item) => sum + item.totalAmount, 0);
            const progressPct = totalVal > 0 ? Math.round((completedVal / totalVal) * 100) : 0;

            return (
              <Pressable
                key={proj.id}
                style={styles.projectCard}
                onPress={() => setSelectedProjectId(proj.id)}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.codeTag}>
                    <Text style={styles.codeTagText}>{proj.clientCode}</Text>
                  </View>
                  <Text style={styles.clientPhoneText}>Client: {proj.clientName}</Text>
                </View>

                <Text style={styles.projectTitleText}>{proj.projectName}</Text>

                <View style={styles.addressRow}>
                  <MapPinIcon size={12} color="#71717A" />
                  <Text style={styles.addressText} numberOfLines={1}>
                    {proj.siteAddress}
                  </Text>
                </View>

                {/* WORKFORCE & PROGRESS BAR */}
                <View style={styles.cardFooter}>
                  <View style={styles.workersPill}>
                    <CrewIcon size={13} color="#FFFFFF" />
                    <Text style={styles.workersPillText}>
                      {proj.workers.length} Workers Enrolled
                    </Text>
                  </View>

                  <View style={styles.progressCol}>
                    <Text style={styles.progressLabel}>
                      {progressPct}% Executed • ₹{(completedVal / 1000).toFixed(0)}k Done
                    </Text>
                    <View style={styles.track}>
                      <View
                        style={[styles.trackFill, { width: `${Math.min(progressPct, 100)}%` }]}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.cardActionRow}>
                  <Text style={styles.actionPrompt}>Open Project Workspace ➔</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* SYSTEM ANIMATION REPLAY */}
        {onReplaySplash && (
          <Pressable style={styles.replayPill} onPress={onReplaySplash}>
            <Text style={styles.replayPillText}>⚡ Replay Servex Logo Animation</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* MODAL 1: JOIN BY CLIENT CODE */}
      <Modal
        visible={showJoinModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join via Client Project Code</Text>
            <Text style={styles.modalDesc}>
              Enter the unique project code shared by your client to connect to their site workspace.
            </Text>

            <Text style={styles.inputLabel}>Client Project Code</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="e.g. CLT-8842"
              placeholderTextColor="#71717A"
              autoCapitalize="characters"
              value={clientCodeInput}
              onChangeText={setClientCodeInput}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowJoinModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleJoinByCode}>
                <Text style={styles.confirmBtnText}>Connect & Open</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: CREATE NEW PROJECT */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start New Project</Text>
            <Text style={styles.modalDesc}>
              Create a new contracting project. A client code will be generated to share with your client.
            </Text>

            <Text style={styles.inputLabel}>Project Name / Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Skyline Villa Full Interior & Electrical"
              placeholderTextColor="#71717A"
              value={newProjectName}
              onChangeText={setNewProjectName}
            />

            <Text style={styles.inputLabel}>Client Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Rajesh Khurana"
              placeholderTextColor="#71717A"
              value={newClientName}
              onChangeText={setNewClientName}
            />

            <Text style={styles.inputLabel}>Client Phone Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. +91 98201 12345"
              placeholderTextColor="#71717A"
              keyboardType="phone-pad"
              value={newClientPhone}
              onChangeText={setNewClientPhone}
            />

            <Text style={styles.inputLabel}>Site Address</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 14th Floor, Oberoi Splendor, Andheri East"
              placeholderTextColor="#71717A"
              value={newSiteAddress}
              onChangeText={setNewSiteAddress}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowCreateModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleCreateNewProject}>
                <Text style={styles.confirmBtnText}>Create Project</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#161920',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 1.5,
  },
  brandPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  brandPillText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 8.5,
    letterSpacing: 0.6,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  toggleOn: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  toggleOff: {
    backgroundColor: 'rgba(113, 113, 122, 0.12)',
    borderColor: 'rgba(113, 113, 122, 0.3)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOn: {
    backgroundColor: '#10B981',
  },
  dotOff: {
    backgroundColor: '#71717A',
  },
  statusToggleText: {
    fontFamily: fonts.displayBold,
    fontSize: 9.5,
    letterSpacing: 0.6,
  },
  textOn: {
    color: '#10B981',
  },
  textOff: {
    color: '#71717A',
  },
  logoutIconBtn: {
    padding: 6,
  },
  logoutIconText: {
    color: '#EF4444',
    fontSize: 15,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 36,
  },
  firmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111317',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#20242D',
    marginBottom: 14,
  },
  firmAvatar: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#1C2028',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A303C',
    marginRight: 12,
  },
  firmAvatarText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 18,
  },
  firmInfo: {
    flex: 1,
  },
  firmName: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 2,
  },
  firmDetails: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11.5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  joinCodeBtn: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  btnIconBox: {
    width: 32,
    height: 32,
    borderRadius: 7,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    fontSize: 15,
  },
  joinBtnTitle: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 12.5,
  },
  joinBtnSub: {
    fontFamily: fonts.body,
    color: '#475569',
    fontSize: 10,
  },
  actionArrow: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  newProjectBtn: {
    flex: 1,
    backgroundColor: '#161920',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A303C',
    paddingVertical: 12,
  },
  newProjectBtnText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 12.5,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#111317',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  kpiLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10.5,
    marginBottom: 3,
  },
  kpiValue: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 2,
  },
  kpiSub: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 9.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14.5,
  },
  sectionHeaderSub: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
  },
  projectList: {
    gap: 12,
    marginBottom: 20,
  },
  projectCard: {
    backgroundColor: '#111317',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  codeTag: {
    backgroundColor: '#1E232E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
  },
  codeTagText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  clientPhoneText: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 11.5,
  },
  projectTitleText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15.5,
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  addressText: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1A1E26',
    marginBottom: 10,
  },
  workersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171B24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  workersPillText: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 11,
  },
  progressCol: {
    flex: 1,
    marginLeft: 14,
  },
  progressLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10,
    textAlign: 'right',
    marginBottom: 3,
  },
  track: {
    height: 4,
    backgroundColor: '#1C2028',
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  cardActionRow: {
    alignItems: 'flex-end',
  },
  actionPrompt: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 11.5,
    letterSpacing: 0.3,
  },
  replayPill: {
    backgroundColor: '#12141A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#20242D',
  },
  replayPillText: {
    fontFamily: fonts.bodyMedium,
    color: '#71717A',
    fontSize: 12,
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
  codeInput: {
    backgroundColor: '#161920',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#232730',
    color: '#FFFFFF',
    fontFamily: fonts.displayBold,
    fontSize: 16,
    letterSpacing: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlign: 'center',
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
  confirmBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  confirmBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 13,
  },
});
