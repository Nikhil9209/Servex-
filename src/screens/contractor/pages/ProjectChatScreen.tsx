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
import {
  ArrowLeftIcon,
  LockIcon,
  UnlockIcon,
  SendIcon,
  ShieldCheckIcon,
} from '../../../components/ContractorIcons';

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
  'Site progress photo logged',
  'Material shipment received on site',
  'Trade ready for contractor inspection',
  'Daily shift completed, awaiting sign-off',
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
      ? 'Contractor granted messaging authority to workers. Site crew can now post updates.'
      : 'Contractor restricted worker messaging authority. Worker channel locked.';

    const systemMsg = createChatMessage('contractor', 'Prime Contractor Lead', actionNotice, true);

    const updatedState: ProjectChatState = {
      workerMessagingAllowed: newAllowed,
      messages: [...chatState.messages, systemMsg],
    };

    onUpdateChatState(updatedState);
    scrollToBottom();

    Alert.alert(
      newAllowed ? 'Worker Authority Granted' : 'Worker Authority Restricted',
      newAllowed
        ? 'Workers assigned to this site can now send messages and progress photos.'
        : 'Workers can no longer post messages in this channel without lead authority.'
    );
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text) return;

    if (activePersona === 'worker' && !chatState.workerMessagingAllowed) {
      Alert.alert(
        'Authority Required',
        'Worker messaging is restricted by the Prime Contractor on this site. Request contractor authority to post.'
      );
      return;
    }

    let senderName = 'Prime Contractor (Lead)';
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
          <ArrowLeftIcon size={16} color="#94A3B8" />
          <Text style={styles.backBtnText}>Workspace</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Site Tri-Party Chat</Text>
          <Text style={styles.headerSub}>
            {project.clientCode} • {project.projectName}
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* CONTRACTOR AUTHORITY CONTROL BANNER */}
      <View style={styles.authorityBanner}>
        <View style={styles.authorityInfoCol}>
          <View style={styles.authorityTitleRow}>
            <ShieldCheckIcon size={14} color="#38BDF8" />
            <Text style={styles.authorityTitle}>Worker Messaging Authority</Text>
          </View>
          <Text style={styles.authorityDesc}>
            {chatState.workerMessagingAllowed
              ? 'Crew permitted to post shift logs & progress photos'
              : 'Crew channel locked to read-only mode'}
          </Text>
        </View>

        <Pressable
          style={[
            styles.authorityToggleBtn,
            chatState.workerMessagingAllowed ? styles.authorityAllowed : styles.authorityLocked,
          ]}
          onPress={handleToggleWorkerAuthority}
        >
          {chatState.workerMessagingAllowed ? (
            <UnlockIcon size={13} color="#10B981" />
          ) : (
            <LockIcon size={13} color="#F59E0B" />
          )}
          <Text
            style={[
              styles.authorityToggleText,
              chatState.workerMessagingAllowed ? styles.textAllowed : styles.textLocked,
            ]}
          >
            {chatState.workerMessagingAllowed ? 'PERMITTED' : 'LOCKED'}
          </Text>
        </Pressable>
      </View>

      {/* SENDER PERSONA SWITCHER */}
      <View style={styles.personaBar}>
        <Text style={styles.personaLabel}>POSTING AS:</Text>

        <Pressable
          style={[
            styles.personaPill,
            activePersona === 'contractor' && styles.personaContractorActive,
          ]}
          onPress={() => setActivePersona('contractor')}
        >
          <Text
            style={[
              styles.personaPillText,
              activePersona === 'contractor' && styles.personaContractorText,
            ]}
          >
            Contractor (Lead)
          </Text>
        </Pressable>

        <Pressable
          style={[styles.personaPill, activePersona === 'client' && styles.personaClientActive]}
          onPress={() => setActivePersona('client')}
        >
          <Text
            style={[styles.personaPillText, activePersona === 'client' && styles.personaClientText]}
          >
            Client
          </Text>
        </Pressable>

        <Pressable
          style={[styles.personaPill, activePersona === 'worker' && styles.personaWorkerActive]}
          onPress={() => setActivePersona('worker')}
        >
          <Text
            style={[styles.personaPillText, activePersona === 'worker' && styles.personaWorkerText]}
          >
            Worker
          </Text>
        </Pressable>
      </View>

      {/* CHAT MESSAGES SCROLL */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {chatState.messages.map((msg) => {
          if (msg.isAuthorityAction) {
            return (
              <View key={msg.id} style={styles.systemActionRow}>
                <View style={styles.systemActionPill}>
                  <ShieldCheckIcon size={12} color="#38BDF8" />
                  <Text style={styles.systemActionText}>{msg.content}</Text>
                </View>
              </View>
            );
          }

          const isMe = msg.senderRole === activePersona;
          const isContractor = msg.senderRole === 'contractor';
          const isClient = msg.senderRole === 'client';

          return (
            <View
              key={msg.id}
              style={[styles.messageBubbleRow, isMe ? styles.rowRight : styles.rowLeft]}
            >
              <View
                style={[
                  styles.messageBubble,
                  isContractor
                    ? styles.bubbleContractor
                    : isClient
                    ? styles.bubbleClient
                    : styles.bubbleWorker,
                ]}
              >
                <View style={styles.msgHeader}>
                  <Text
                    style={[
                      styles.senderName,
                      isContractor
                        ? styles.senderContractor
                        : isClient
                        ? styles.senderClient
                        : styles.senderWorker,
                    ]}
                  >
                    {msg.senderName}
                  </Text>
                  <Text style={styles.timestampText}>{msg.timestamp}</Text>
                </View>

                <Text style={styles.msgContent}>{msg.content}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* QUICK PROMPT CHIPS */}
      <View style={styles.quickPromptsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptsScroll}>
          {DEFAULT_QUICK_PROMPTS.map((prompt, idx) => (
            <Pressable
              key={idx}
              style={styles.promptChip}
              onPress={() => handleSendMessage(prompt)}
            >
              <Text style={styles.promptChipText}>{prompt}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* INPUT BAR */}
      <View style={styles.inputContainer}>
        {isWorkerLocked ? (
          <View style={styles.lockedInputBanner}>
            <LockIcon size={14} color="#F59E0B" />
            <Text style={styles.lockedInputText}>
              Worker messaging restricted. Enable authority above to post.
            </Text>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder={`Message as ${activePersona}...`}
              placeholderTextColor="#64748B"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <Pressable
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim()}
            >
              <SendIcon size={14} color="#0B0E14" />
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
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
  authorityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111622',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2638',
  },
  authorityInfoCol: {
    flex: 1,
    marginRight: 12,
  },
  authorityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  authorityTitle: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 12,
  },
  authorityDesc: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 10.5,
  },
  authorityToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    gap: 5,
  },
  authorityAllowed: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  authorityLocked: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  authorityToggleText: {
    fontFamily: fonts.displayBold,
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  textAllowed: {
    color: '#10B981',
  },
  textLocked: {
    color: '#F59E0B',
  },
  personaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E121B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2638',
    gap: 8,
  },
  personaLabel: {
    fontFamily: fonts.displayBold,
    color: '#64748B',
    fontSize: 9.5,
    letterSpacing: 0.6,
  },
  personaPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: '#151C2C',
    borderWidth: 1,
    borderColor: '#28354D',
  },
  personaPillText: {
    fontFamily: fonts.bodyMedium,
    color: '#94A3B8',
    fontSize: 10.5,
  },
  personaContractorActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38BDF8',
  },
  personaContractorText: {
    color: '#38BDF8',
    fontFamily: fonts.displayBold,
  },
  personaClientActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10B981',
  },
  personaClientText: {
    color: '#10B981',
    fontFamily: fonts.displayBold,
  },
  personaWorkerActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#F59E0B',
  },
  personaWorkerText: {
    color: '#F59E0B',
    fontFamily: fonts.displayBold,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  systemActionRow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  systemActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111622',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E2638',
    gap: 6,
    maxWidth: '92%',
  },
  systemActionText: {
    fontFamily: fonts.body,
    color: '#94A3B8',
    fontSize: 10.5,
    textAlign: 'center',
  },
  messageBubbleRow: {
    flexDirection: 'row',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  bubbleContractor: {
    backgroundColor: '#0F2942',
    borderColor: '#1E4976',
  },
  bubbleClient: {
    backgroundColor: '#0A3326',
    borderColor: '#155E47',
  },
  bubbleWorker: {
    backgroundColor: '#2E2211',
    borderColor: '#543D1D',
  },
  msgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 10,
  },
  senderName: {
    fontFamily: fonts.displayBold,
    fontSize: 11,
  },
  senderContractor: {
    color: '#38BDF8',
  },
  senderClient: {
    color: '#34D399',
  },
  senderWorker: {
    color: '#FBBF24',
  },
  timestampText: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 9.5,
  },
  msgContent: {
    fontFamily: fonts.body,
    color: '#F8FAFC',
    fontSize: 12.5,
    lineHeight: 17,
  },
  quickPromptsRow: {
    backgroundColor: '#0E121B',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#1E2638',
  },
  promptsScroll: {
    paddingHorizontal: 12,
    gap: 6,
  },
  promptChip: {
    backgroundColor: '#151C2C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242F44',
  },
  promptChipText: {
    fontFamily: fonts.body,
    color: '#94A3B8',
    fontSize: 11,
  },
  inputContainer: {
    backgroundColor: '#0E121B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E2638',
  },
  lockedInputBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151C2C',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  lockedInputText: {
    fontFamily: fonts.bodyMedium,
    color: '#94A3B8',
    fontSize: 11.5,
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#151C2C',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontFamily: fonts.body,
    fontSize: 13,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: '#28354D',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
