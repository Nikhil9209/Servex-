import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fonts } from '../../theme/tokens';
import { User, UserRole } from '../../types/auth';
import {
  GridTabIcon,
  ScheduleTabIcon,
  BarChartTabIcon,
  ChatTabIcon,
  CloseIcon,
  LinkIcon,
  PlusIcon,
  CheckIcon,
} from '../../components/ContractorIcons';
import {
  BouncingTabIcon,
  SpringPressable,
} from '../../components/AnimatedComponents';
import { HomeOverviewView } from './views/HomeOverviewView';
import { generateSecureProjectCode } from '../../utils/projectCodeGenerator';
import { JobsListView } from './views/JobsListView';
import { ScheduleView } from './views/ScheduleView';
import { ProfileSettingsView } from './views/ProfileSettingsView';
import { ProjectWorkspaceScreen } from './pages/ProjectWorkspaceScreen';
import { useContractor } from '../../context/ContractorContext';

export interface ContractorHomeScreenProps {
  user: User;
  onLogout: () => void;
  onReplaySplash?: () => void;
  onSwitchRole?: (role: UserRole) => void;
}

type TabType = 'home' | 'jobs' | 'schedule' | 'profile';

export const ContractorHomeScreen: React.FC<ContractorHomeScreenProps> = ({
  user,
  onLogout,
  onReplaySplash,
  onSwitchRole,
}) => {
  const {
    projects,
    setSelectedProjectId,
    selectedProject,
    createProject,
    updateProject,
    joinProjectByCode,
  } = useContractor();

  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Modals for Join & Create Project
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [clientCodeInput, setClientCodeInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newSiteAddress, setNewSiteAddress] = useState('');

  // 1. IF A JOB IS SELECTED, OPEN THE DEDICATED JOB DETAILS / WORKSPACE SCREEN!
  if (selectedProject) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <ProjectWorkspaceScreen
          project={selectedProject}
          onBack={() => setSelectedProjectId(null)}
          onUpdateProject={(updatedProject) => {
            updateProject(updatedProject);
          }}
        />
      </SafeAreaView>
    );
  }

  const handleJoinByCode = async () => {
    const code = clientCodeInput.trim().toUpperCase();
    if (!code) {
      Alert.alert('Missing Code', 'Please enter the client project code.');
      return;
    }

    try {
      const joined = await joinProjectByCode(code);
      if (joined) {
        Alert.alert('Project Linked', `Opening workspace for ${joined.projectName}.`);
        setShowJoinModal(false);
        setClientCodeInput('');
        setSelectedProjectId(joined.id);
        return;
      }
      Alert.alert('Invalid Code', 'The project code entered is invalid or expired.');
    } catch (err: any) {
      Alert.alert('Unable to Link', err.message || 'Invalid or expired project code.');
    }
  };

  const handleCreateNewProject = async () => {
    if (!newProjectName.trim() || !newClientName.trim()) {
      Alert.alert('Missing Information', 'Please enter project name and client name.');
      return;
    }

    const generatedCode = generateSecureProjectCode();
    const createdProject = await createProject({
      clientCode: generatedCode,
      projectName: newProjectName.trim(),
      clientName: newClientName.trim(),
      clientPhone: newClientPhone.trim() || '+91 98200 00000',
      siteAddress: newSiteAddress.trim() || 'Metro Construction Zone',
      startDate: 'Today',
      status: 'active',
    });

    setShowCreateModal(false);
    setNewProjectName('');
    setNewClientName('');
    setNewClientPhone('');
    setNewSiteAddress('');
    setSelectedProjectId(createdProject.id);
    Alert.alert('Job Created', `Client Code generated: ${generatedCode}. Share this with your client.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* ACTIVE SCREEN CONTENT */}
      <View style={styles.contentContainer}>
        {activeTab === 'home' && (
          <HomeOverviewView
            user={user}
            projects={projects}
            onSelectProject={(id) => setSelectedProjectId(id)}
            onOpenSchedule={() => setActiveTab('schedule')}
            onOpenJobs={() => setActiveTab('jobs')}
            onOpenNewJob={() => setShowCreateModal(true)}
          />
        )}

        {activeTab === 'jobs' && (
          <JobsListView
            projects={projects}
            onSelectProject={(id) => setSelectedProjectId(id)}
            onOpenJoinModal={() => setShowJoinModal(true)}
            onOpenCreateModal={() => setShowCreateModal(true)}
          />
        )}

        {activeTab === 'schedule' && <ScheduleView />}

        {activeTab === 'profile' && (
          <ProfileSettingsView
            user={user}
            onLogout={onLogout}
            onSwitchRole={onSwitchRole}
            onReplaySplash={onReplaySplash}
          />
        )}
      </View>

      {/* MINIMAL REFERENCE BOTTOM NAVIGATION (NO LABELS, CLEAN ICONS) */}
      <View style={styles.bottomNav}>
        <View style={styles.navIconsRow}>
          <SpringPressable
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
            scaleTo={0.88}
            hitSlop={10}
          >
            <BouncingTabIcon focused={activeTab === 'home'}>
              <GridTabIcon
                size={22}
                color={activeTab === 'home' ? '#FFFFFF' : '#4E4E56'}
                focused={activeTab === 'home'}
              />
            </BouncingTabIcon>
          </SpringPressable>

          <SpringPressable
            style={styles.navItem}
            onPress={() => setActiveTab('schedule')}
            scaleTo={0.88}
            hitSlop={10}
          >
            <BouncingTabIcon focused={activeTab === 'schedule'}>
              <ScheduleTabIcon
                size={22}
                color={activeTab === 'schedule' ? '#FFFFFF' : '#4E4E56'}
                focused={activeTab === 'schedule'}
              />
            </BouncingTabIcon>
          </SpringPressable>

          <SpringPressable
            style={styles.navItem}
            onPress={() => setActiveTab('jobs')}
            scaleTo={0.88}
            hitSlop={10}
          >
            <BouncingTabIcon focused={activeTab === 'jobs'}>
              <BarChartTabIcon
                size={22}
                color={activeTab === 'jobs' ? '#FFFFFF' : '#4E4E56'}
                focused={activeTab === 'jobs'}
              />
            </BouncingTabIcon>
          </SpringPressable>

          <SpringPressable
            style={styles.navItem}
            onPress={() => setActiveTab('profile')}
            scaleTo={0.88}
            hitSlop={10}
          >
            <BouncingTabIcon focused={activeTab === 'profile'}>
              <ChatTabIcon
                size={22}
                color={activeTab === 'profile' ? '#FFFFFF' : '#4E4E56'}
                focused={activeTab === 'profile'}
              />
            </BouncingTabIcon>
          </SpringPressable>
        </View>

        {/* Minimal Home Indicator Bar */}
        <View style={styles.homeIndicator} />
      </View>

      {/* MODAL 1: JOIN BY CLIENT CODE */}
      <Modal
        visible={showJoinModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalTopRow}>
              <View style={styles.modalIconBox}>
                <LinkIcon size={16} color="#1A73E8" />
              </View>
              <Pressable onPress={() => setShowJoinModal(false)} hitSlop={8}>
                <CloseIcon size={16} color="#8E8E93" />
              </Pressable>
            </View>

            <Text style={styles.modalTitle}>Join via Client Code</Text>
            <Text style={styles.modalSub}>
              Enter the unique project code shared by your client to connect to their site workspace.
            </Text>

            <Text style={styles.inputLabel}>Client Project Code</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="e.g. SRX-8K9M-2P4W"
              placeholderTextColor="#686870"
              autoCapitalize="characters"
              value={clientCodeInput}
              onChangeText={setClientCodeInput}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowJoinModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleJoinByCode}>
                <Text style={styles.confirmBtnText}>Connect Job</Text>
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
          <View style={styles.modalCard}>
            <View style={styles.modalTopRow}>
              <View style={styles.modalIconBox}>
                <PlusIcon size={16} color="#1A73E8" />
              </View>
              <Pressable onPress={() => setShowCreateModal(false)} hitSlop={8}>
                <CloseIcon size={16} color="#8E8E93" />
              </Pressable>
            </View>

            <Text style={styles.modalTitle}>New Job Contract</Text>
            <Text style={styles.modalSub}>
              Register a new job site. A client code will be generated to share with your client.
            </Text>

            <Text style={styles.inputLabel}>Project / Site Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Skyline Penthouse Interior Fitout"
              placeholderTextColor="#686870"
              value={newProjectName}
              onChangeText={setNewProjectName}
            />

            <Text style={styles.inputLabel}>Client Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Vikram Singhania"
              placeholderTextColor="#686870"
              value={newClientName}
              onChangeText={setNewClientName}
            />

            <Text style={styles.inputLabel}>Client Phone Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. +91 98201 12345"
              placeholderTextColor="#686870"
              keyboardType="phone-pad"
              value={newClientPhone}
              onChangeText={setNewClientPhone}
            />

            <Text style={styles.inputLabel}>Site Address</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Tower B, Worli Sea Face, Mumbai"
              placeholderTextColor="#686870"
              value={newSiteAddress}
              onChangeText={setNewSiteAddress}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowCreateModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleCreateNewProject}>
                <CheckIcon size={13} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>Create Job</Text>
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
  contentContainer: {
    flex: 1,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#121216',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 18 : 12,
  },
  navIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  homeIndicator: {
    width: 134,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    opacity: 0.85,
    alignSelf: 'center',
    marginTop: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#17171B',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#23232A',
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(26, 115, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 18,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  modalSub: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#E2E2E6',
    fontSize: 11.5,
    marginBottom: 5,
    marginTop: 8,
  },
  codeInput: {
    backgroundColor: '#0F0F12',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#23232A',
    color: '#FFFFFF',
    fontFamily: fonts.displayBold,
    fontSize: 16,
    letterSpacing: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#0F0F12',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#23232A',
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  cancelBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#8E8E93',
    fontSize: 13,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A73E8',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 5,
  },
  confirmBtnText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13,
  },
});
