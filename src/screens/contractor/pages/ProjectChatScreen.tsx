import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import {
  FadeInSlide,
  SpringPressable,
} from '../../../components/AnimatedComponents';

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
            <Text style={styles.headerTitle}>Site Tri-Party Chat</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {project.clientCode} • {project.projectName}
            </Text>
          </View>

          <View style={styles.headerRightPlaceholder} />
        </View>
      </FadeInSlide>

      {/* 2. CONTRACTOR AUTHORITY CONTROL BANNER */}
      <FadeInSlide delay={80} distance={14}>
        <View style={styles.authorityBanner}>
          <View style={styles.authorityInfoCol}>
            <View style={styles.authorityTitleRow}>
              <ShieldCheckIcon size={14} color="#FFFFFF" />
              <Text style={styles.authorityTitle}>Worker Messaging Authority</Text>
            </View>
            <Text style={styles.authorityDesc}>
              {chatState.workerMessagingAllowed
                ? 'Crew permitted to post shift logs & progress photos'
                : 'Crew channel restricted to read-only status'}
            </Text>
          </View>

          <SpringPressable
            style={[
              styles.authorityToggleBtn,
              chatState.workerMessagingAllowed ? styles.authorityAllowed : styles.authorityLocked,
            ]}
            onPress={handleToggleWorkerAuthority}
            scaleTo={0.94}
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
          </SpringPressable>
        </View>
      </FadeInSlide>

      {/* 3. SENDER PERSONA SWITCHER */}
      <FadeInSlide delay={120} distance={14}>
        <View style={styles.personaBar}>
          <Text style={styles.personaLabel}>POSTING AS:</Text>

          <SpringPressable
            style={[
              styles.personaPill,
              activePersona === 'contractor' && styles.personaPillActive,
            ]}
            onPress={() => setActivePersona('contractor')}
            scaleTo={0.96}
          >
            <Text
              style={[
                styles.personaPillText,
                activePersona === 'contractor' && styles.personaPillTextActive,
              ]}
            >
              Contractor
            </Text>
          </SpringPressable>

          <SpringPressable
            style={[styles.personaPill, activePersona === 'client' && styles.personaPillActive]}
            onPress={() => setActivePersona('client')}
            scaleTo={0.96}
          >
            <Text
              style={[
                styles.personaPillText,
                activePersona === 'client' && styles.personaPillTextActive,
              ]}
            >
              Client
            </Text>
          </SpringPressable>

          <SpringPressable
            style={[styles.personaPill, activePersona === 'worker' && styles.personaPillActive]}
            onPress={() => setActivePersona('worker')}
            scaleTo={0.96}
          >
            <Text
              style={[
                styles.personaPillText,
                activePersona === 'worker' && styles.personaPillTextActive,
              ]}
            >
              Worker
            </Text>
          </SpringPressable>
        </View>
      </FadeInSlide>

      {/* 4. CHAT MESSAGES SCROLL */}
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
                  <ShieldCheckIcon size={12} color="#8E8E93" />
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
                  isMe ? styles.bubbleMe : styles.bubbleOther,
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

      {/* 5. QUICK PROMPT CHIPS */}
      <View style={styles.quickPromptsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptsScroll}>
          {DEFAULT_QUICK_PROMPTS.map((prompt, idx) => (
            <SpringPressable
              key={idx}
              style={styles.promptChip}
              onPress={() => handleSendMessage(prompt)}
              scaleTo={0.96}
            >
              <Text style={styles.promptChipText}>{prompt}</Text>
            </SpringPressable>
          ))}
        </ScrollView>
      </View>

      {/* 6. INPUT BAR */}
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
              placeholderTextColor="#55555C"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <SpringPressable
              style={[styles.circleSendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim()}
              scaleTo={0.92}
            >
              <SendIcon size={14} color="#000000" />
            </SpringPressable>
          </View>
        )}
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
  headerRightPlaceholder: {
    width: 44,
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

  // AUTHORITY BANNER
  authorityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16161A',
    marginHorizontal: 18,
    marginTop: 4,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222228',
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
    color: '#FFFFFF',
    fontSize: 12.5,
  },
  authorityDesc: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 11,
  },
  authorityToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  authorityAllowed: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  authorityLocked: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
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

  // PERSONA SWITCHER
  personaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 8,
  },
  personaLabel: {
    fontFamily: fonts.displayBold,
    color: '#636366',
    fontSize: 9.5,
    letterSpacing: 0.8,
    marginRight: 4,
  },
  personaPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: '#222228',
  },
  personaPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  personaPillText: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 11,
  },
  personaPillTextActive: {
    color: '#000000',
  },

  // MESSAGES
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 12,
  },
  systemActionRow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  systemActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16161A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222228',
  },
  systemActionText: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 11,
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
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  bubbleMe: {
    backgroundColor: '#1C1C22',
    borderColor: '#262630',
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: '#16161A',
    borderColor: '#222228',
    borderBottomLeftRadius: 6,
  },
  msgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 12,
  },
  senderName: {
    fontFamily: fonts.displayBold,
    fontSize: 11,
  },
  senderContractor: {
    color: '#38BDF8',
  },
  senderClient: {
    color: '#10B981',
  },
  senderWorker: {
    color: '#F59E0B',
  },
  timestampText: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 9.5,
  },
  msgContent: {
    fontFamily: fonts.body,
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
  },

  // PROMPTS
  quickPromptsRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#16161A',
  },
  promptsScroll: {
    paddingHorizontal: 18,
    gap: 8,
  },
  promptChip: {
    backgroundColor: '#16161A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222228',
  },
  promptChipText: {
    fontFamily: fonts.bodyMedium,
    color: '#8E8E93',
    fontSize: 11,
  },

  // INPUT
  inputContainer: {
    paddingHorizontal: 18,
    paddingBottom: 22,
    paddingTop: 8,
    backgroundColor: '#000000',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#16161A',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#222228',
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13.5,
    maxHeight: 80,
    paddingVertical: 6,
  },
  circleSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },
  lockedInputBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16161A',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#222228',
  },
  lockedInputText: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 11.5,
  },
});
