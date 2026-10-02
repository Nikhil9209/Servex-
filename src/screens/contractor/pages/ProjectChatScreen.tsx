import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { fonts } from '../../../theme/tokens';
import {
  ContractorProjectDetail,
  ProjectChatMessage,
  ProjectChatState,
  ChatSenderRole,
} from '../../../types/contractor';

interface ProjectChatScreenProps {
  project: ContractorProjectDetail;
  onBack: () => void;
  onUpdateChatState: (updatedChatState: ProjectChatState) => void;
}

function formatCurrentTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function createChatMessage(
  role: ChatSenderRole,
  name: string,
  content: string,
  isAuthorityAction = false
): ProjectChatMessage {
  return {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    senderRole: role,
    senderName: name,
    content,
    timestamp: formatCurrentTime(),
    isAuthorityAction,
  };
}

const DEFAULT_QUICK_PROMPTS = [
  '📸 Site progress photo attached',
  '📦 Material shipment received on site',
  '📋 Work ready for contractor inspection',
  '⏳ Shift completed, awaiting daily verification',
];

export const ProjectChatScreen: React.FC<ProjectChatScreenProps> = ({
  project,
  onBack,
  onUpdateChatState,
}) => {
  const chatState: ProjectChatState = project.chatState || {
    workerMessagingAllowed: false,
    messages: [],
  };

  const [inputText, setInputText] = useState('');
  const [activePersona, setActivePersona] = useState<ChatSenderRole>('contractor');
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Contractor grants or revokes authority for workers to send messages
  const handleToggleWorkerAuthority = () => {
    const newAllowed = !chatState.workerMessagingAllowed;
    const actionNotice = newAllowed
      ? '🔓 Contractor granted messaging authority to workers. Workers can now post messages.'
      : '🔒 Contractor restricted worker messaging authority. Worker text box locked.';

    const systemMsg = createChatMessage('contractor', 'Apex Contractors (Lead)', actionNotice, true);

    const updatedState: ProjectChatState = {
      workerMessagingAllowed: newAllowed,
      messages: [...chatState.messages, systemMsg],
    };

    onUpdateChatState(updatedState);
    scrollToBottom();

    Alert.alert(
      newAllowed ? 'Worker Authority Granted ✓' : 'Worker Authority Restricted 🔒',
      newAllowed
        ? 'Workers on this site can now send messages and site updates in this group.'
        : 'Workers can no longer send messages in this group without your authority.'
    );
  };

  // Attempting to send message
  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text) return;

    // Check authority rule: without contractor authority, worker cannot send any msg
    if (activePersona === 'worker' && !chatState.workerMessagingAllowed) {
      Alert.alert(
        'Authority Required 🔒',
        'Without Contractor Authority, workers cannot send messages in this group. Please contact your contractor to enable messaging authority.',
        [{ text: 'Understand' }]
      );
      return;
    }

    let senderName = 'Apex Contractors (You)';
    if (activePersona === 'client') {
      senderName = `${project.clientName} (Client)`;
    } else if (activePersona === 'worker') {
      const firstWorker = project.workers[0]?.name || 'Rameshwar Yadav';
      const firstRole = project.workers[0]?.role || 'Mason';
      senderName = `${firstWorker} (${firstRole})`;
    }

    const newMsg = createChatMessage(activePersona, senderName, text, false);
    const updatedState: ProjectChatState = {
      ...chatState,
      messages: [...chatState.messages, newMsg],
    };

    onUpdateChatState(updatedState);
    setInputText('');
    scrollToBottom();
  };

  const isWorkerLocked = activePersona === 'worker' && !chatState.workerMessagingAllowed;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* TOP HEADER */}
      <View style={styles.topHeader}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Site Tri-Party Chat</Text>
          <Text style={styles.headerSub}>Client • Contractor • Worker</Text>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* CONTRACTOR AUTHORITY STATUS BANNER */}
      <View
        style={[
          styles.authorityBanner,
          chatState.workerMessagingAllowed
            ? styles.authorityBannerAllowed
            : styles.authorityBannerRestricted,
        ]}
      >
        <View style={styles.authorityLeft}>
          <View
            style={[
              styles.authorityDot,
              chatState.workerMessagingAllowed
                ? styles.authorityDotGreen
                : styles.authorityDotGold,
            ]}
          />
          <View>
            <Text style={styles.authorityHeading}>
              {chatState.workerMessagingAllowed
                ? 'WORKER AUTHORITY: GRANTED'
                : 'WORKER AUTHORITY: RESTRICTED'}
            </Text>
            <Text style={styles.authorityDescription}>
              {chatState.workerMessagingAllowed
                ? 'Workers are authorized by Contractor to post in this channel.'
                : 'Workers cannot send messages without Contractor authority.'}
            </Text>
          </View>
        </View>

        {activePersona === 'contractor' && (
          <Pressable
            style={[
              styles.toggleAuthorityBtn,
              chatState.workerMessagingAllowed
                ? styles.toggleAuthorityBtnRevoke
                : styles.toggleAuthorityBtnGrant,
            ]}
            onPress={handleToggleWorkerAuthority}
          >
            <Text style={styles.toggleAuthorityBtnText}>
              {chatState.workerMessagingAllowed ? 'Revoke 🔒' : 'Grant 🔓'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* INTERACTIVE PERSPECTIVE / ROLE SWITCHER */}
      <View style={styles.perspectiveBar}>
        <Text style={styles.perspectiveLabel}>VIEWING & POSTING AS:</Text>
        <View style={styles.personaTabsRow}>
          <Pressable
            style={[
              styles.personaTab,
              activePersona === 'contractor' && styles.personaTabActiveContractor,
            ]}
            onPress={() => setActivePersona('contractor')}
          >
            <Text
              style={[
                styles.personaTabText,
                activePersona === 'contractor' && styles.personaTabTextActive,
              ]}
            >
              👔 Contractor
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.personaTab,
              activePersona === 'client' && styles.personaTabActiveClient,
            ]}
            onPress={() => setActivePersona('client')}
          >
            <Text
              style={[
                styles.personaTabText,
                activePersona === 'client' && styles.personaTabTextActive,
              ]}
            >
              🏛️ Client
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.personaTab,
              activePersona === 'worker' && styles.personaTabActiveWorker,
            ]}
            onPress={() => setActivePersona('worker')}
          >
            <Text
              style={[
                styles.personaTabText,
                activePersona === 'worker' && styles.personaTabTextActive,
              ]}
            >
              👷 Worker {isWorkerLocked ? '🔒' : '✓'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* CHAT MESSAGES STREAM */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
      >
        <View style={styles.channelMetaCard}>
          <Text style={styles.channelMetaProject}>{project.projectName}</Text>
          <Text style={styles.channelMetaCode}>Site Code: {project.clientCode}</Text>
          <Text style={styles.channelMetaNotice}>
            Official project channel connecting Client ({project.clientName}), Prime Contractor, and verified site workers.
          </Text>
        </View>

        {chatState.messages.map((msg) => {
          if (msg.isAuthorityAction) {
            return (
              <View key={msg.id} style={styles.authorityPillRow}>
                <View style={styles.authorityPill}>
                  <Text style={styles.authorityPillText}>{msg.content}</Text>
                  <Text style={styles.authorityPillTime}>{msg.timestamp}</Text>
                </View>
              </View>
            );
          }

          const isCurrentPerspective = msg.senderRole === activePersona;

          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isCurrentPerspective ? styles.messageRowRight : styles.messageRowLeft,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  msg.senderRole === 'contractor' && styles.bubbleContractor,
                  msg.senderRole === 'client' && styles.bubbleClient,
                  msg.senderRole === 'worker' && styles.bubbleWorker,
                  isCurrentPerspective && styles.bubbleOwn,
                ]}
              >
                {/* ROLE & NAME HEADER */}
                <View style={styles.bubbleHeaderRow}>
                  <View
                    style={[
                      styles.roleTag,
                      msg.senderRole === 'contractor' && styles.roleTagContractor,
                      msg.senderRole === 'client' && styles.roleTagClient,
                      msg.senderRole === 'worker' && styles.roleTagWorker,
                    ]}
                  >
                    <Text style={styles.roleTagText}>
                      {msg.senderRole === 'contractor'
                        ? 'CONTRACTOR'
                        : msg.senderRole === 'client'
                        ? 'CLIENT'
                        : 'WORKER'}
                    </Text>
                  </View>
                  <Text style={styles.senderNameText} numberOfLines={1}>
                    {msg.senderName}
                  </Text>
                </View>

                {/* CONTENT */}
                <Text style={styles.messageContentText}>{msg.content}</Text>

                {/* FOOTER */}
                <View style={styles.bubbleFooterRow}>
                  <Text style={styles.timestampText}>{msg.timestamp}</Text>
                  <Text style={styles.checkmarksText}>✓✓</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* QUICK SUGGESTIONS (ONLY WHEN ACTIVE OR ALLOWED) */}
      {!isWorkerLocked && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickPromptsRow}
        >
          {DEFAULT_QUICK_PROMPTS.map((prompt, index) => (
            <Pressable
              key={index}
              style={styles.quickPromptChip}
              onPress={() => handleSendMessage(prompt)}
            >
              <Text style={styles.quickPromptText}>{prompt}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* LOCKED WORKER WARNING BANNER */}
      {isWorkerLocked && (
        <View style={styles.workerLockedWarningBanner}>
          <Text style={styles.workerLockedWarningTitle}>
            🔒 Worker Text Box Locked
          </Text>
          <Text style={styles.workerLockedWarningSub}>
            Without Contractor Authority, workers cannot send messages in this channel. Switch to &apos;Contractor&apos; above to grant authority.
          </Text>
        </View>
      )}

      {/* INPUT BAR */}
      <View style={styles.inputBar}>
        <View style={styles.inputWrap}>
          <TextInput
            style={[styles.textInput, isWorkerLocked && styles.textInputDisabled]}
            placeholder={
              isWorkerLocked
                ? '🔒 Worker chat locked (Requires Contractor Authority)'
                : `Message as ${activePersona}...`
            }
            placeholderTextColor="#64748B"
            value={inputText}
            onChangeText={setInputText}
            editable={!isWorkerLocked}
            multiline={true}
          />
        </View>

        <Pressable
          style={[
            styles.sendBtn,
            isWorkerLocked
              ? styles.sendBtnDisabled
              : inputText.trim()
              ? styles.sendBtnActive
              : styles.sendBtnIdle,
          ]}
          onPress={() => handleSendMessage()}
          disabled={isWorkerLocked}
        >
          <Text style={styles.sendBtnIcon}>{isWorkerLocked ? '🔒' : '➤'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1D24',
    backgroundColor: '#0A0C0E',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#161920',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#242832',
  },
  backBtnText: {
    color: '#FFFFFF',
    fontFamily: fonts.mono,
    fontSize: 14,
    fontWeight: '600',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSub: {
    color: '#94A3B8',
    fontFamily: fonts.mono,
    fontSize: 11,
    marginTop: 2,
  },
  headerRightPlaceholder: {
    width: 50,
  },

  // Authority Status Banner
  authorityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  authorityBannerRestricted: {
    backgroundColor: '#18140B',
    borderBottomColor: '#2C2314',
  },
  authorityBannerAllowed: {
    backgroundColor: '#0B1713',
    borderBottomColor: '#142E24',
  },
  authorityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  authorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  authorityDotGold: {
    backgroundColor: '#F59E0B',
  },
  authorityDotGreen: {
    backgroundColor: '#10B981',
  },
  authorityHeading: {
    color: '#FFFFFF',
    fontFamily: fonts.heading,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  authorityDescription: {
    color: '#94A3B8',
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
  toggleAuthorityBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  toggleAuthorityBtnGrant: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  toggleAuthorityBtnRevoke: {
    backgroundColor: '#261D11',
    borderColor: '#F59E0B',
  },
  toggleAuthorityBtnText: {
    color: '#FFFFFF',
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: '700',
  },

  // Perspective Bar
  perspectiveBar: {
    backgroundColor: '#0E1116',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1C2028',
  },
  perspectiveLabel: {
    color: '#64748B',
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  personaTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  personaTab: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#151820',
    borderWidth: 1,
    borderColor: '#242935',
    alignItems: 'center',
  },
  personaTabActiveContractor: {
    backgroundColor: '#221C11',
    borderColor: '#D97706',
  },
  personaTabActiveClient: {
    backgroundColor: '#0F241E',
    borderColor: '#10B981',
  },
  personaTabActiveWorker: {
    backgroundColor: '#1E232F',
    borderColor: '#60A5FA',
  },
  personaTabText: {
    color: '#94A3B8',
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: '600',
  },
  personaTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Messages Stream
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 14,
    paddingBottom: 20,
  },
  channelMetaCard: {
    backgroundColor: '#111317',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E232B',
    marginBottom: 16,
    alignItems: 'center',
  },
  channelMetaProject: {
    color: '#FFFFFF',
    fontFamily: fonts.heading,
    fontSize: 13,
    fontWeight: '700',
  },
  channelMetaCode: {
    color: '#F59E0B',
    fontFamily: fonts.mono,
    fontSize: 11,
    marginTop: 2,
  },
  channelMetaNotice: {
    color: '#94A3B8',
    fontFamily: fonts.body,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },

  // Authority Action Centered Pill
  authorityPillRow: {
    alignItems: 'center',
    marginVertical: 10,
  },
  authorityPill: {
    backgroundColor: '#171A21',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262D3B',
    maxWidth: '90%',
    alignItems: 'center',
  },
  authorityPillText: {
    color: '#CBD5E1',
    fontFamily: fonts.mono,
    fontSize: 11,
    textAlign: 'center',
  },
  authorityPillTime: {
    color: '#64748B',
    fontFamily: fonts.mono,
    fontSize: 9,
    marginTop: 2,
  },

  // Message Bubbles
  messageRow: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
  },
  bubbleContractor: {
    backgroundColor: '#1A1813',
    borderColor: '#3D3422',
  },
  bubbleClient: {
    backgroundColor: '#0F1A17',
    borderColor: '#1E3B33',
  },
  bubbleWorker: {
    backgroundColor: '#161922',
    borderColor: '#282F40',
  },
  bubbleOwn: {
    borderWidth: 1.5,
  },
  bubbleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  roleTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleTagContractor: {
    backgroundColor: '#382D16',
  },
  roleTagClient: {
    backgroundColor: '#143329',
  },
  roleTagWorker: {
    backgroundColor: '#202636',
  },
  roleTagText: {
    color: '#FFFFFF',
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  senderNameText: {
    color: '#94A3B8',
    fontFamily: fonts.heading,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  messageContentText: {
    color: '#F1F5F9',
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  bubbleFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timestampText: {
    color: '#64748B',
    fontFamily: fonts.mono,
    fontSize: 10,
  },
  checkmarksText: {
    color: '#10B981',
    fontFamily: fonts.mono,
    fontSize: 10,
  },

  // Quick Prompt Chips
  quickPromptsRow: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    backgroundColor: '#0A0C0E',
    borderTopWidth: 1,
    borderTopColor: '#171A21',
  },
  quickPromptChip: {
    backgroundColor: '#14171E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#232833',
  },
  quickPromptText: {
    color: '#CBD5E1',
    fontFamily: fonts.body,
    fontSize: 11,
  },

  // Locked Banner
  workerLockedWarningBanner: {
    backgroundColor: '#1C150A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#352712',
  },
  workerLockedWarningTitle: {
    color: '#F59E0B',
    fontFamily: fonts.heading,
    fontSize: 11,
    fontWeight: '700',
  },
  workerLockedWarningSub: {
    color: '#94A3B8',
    fontFamily: fonts.body,
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },

  // Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0E1116',
    borderTopWidth: 1,
    borderTopColor: '#1A1E27',
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: '#161922',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#252B3A',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    minHeight: 40,
    justifyContent: 'center',
  },
  textInput: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13,
    maxHeight: 90,
  },
  textInputDisabled: {
    color: '#64748B',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#10B981',
  },
  sendBtnIdle: {
    backgroundColor: '#1E232E',
  },
  sendBtnDisabled: {
    backgroundColor: '#1A1813',
    borderWidth: 1,
    borderColor: '#3D3422',
  },
  sendBtnIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
