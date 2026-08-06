import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import ScreenWrapper from '../components/ScreenWrapper';
import EmptyState from '../components/EmptyState';
import { useChatOptional } from '../../context/ChatContext';
import { formatShortTime } from '../utils/ratings';
import { compressImage, resolveMediaUrl } from '../../utils/image';
import { getOrCreateConversation } from '../../services/chatApi';

const SENT_BUBBLE = '#3A2A0F';
const RECEIVED_BUBBLE = '#202020';

function formatDateSeparator(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = (now - d) / 86400000;
  if (diff < 1) return 'Today';
  if (diff < 2) return 'Yesterday';
  return d.toLocaleDateString('en-UG', { weekday: 'long', month: 'long', day: 'numeric' });
}

// Deterministic keyboard height on Android. Unlike KeyboardAvoidingView's
// 'height' behavior, this only reacts to real keyboard show/hide events, so the
// input bar never jumps on mount.
function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) =>
      setHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

function ConversationItem({ item, userId, onPress }) {
  const other = item.participants?.find((p) => p._id !== userId);
  const name = other?.name || 'Unknown';
  const isLastFromMe = item.lastSenderId?._id === userId || item.lastSenderId === userId;
  const time = item.lastMessageAt ? formatShortTime(item.lastMessageAt) : '';
  const initial = name.charAt(0).toUpperCase();

  return (
    <TouchableOpacity style={styles.convItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.convAvatar}>
        <View style={styles.convAvatarInner}>
          <Text style={styles.convAvatarText}>{initial}</Text>
        </View>
      </View>
      <View style={styles.convContent}>
        <View style={styles.convTop}>
          <Text style={styles.convName} numberOfLines={1}>{name}</Text>
          <Text style={styles.convTime}>{time}</Text>
        </View>
        <View style={styles.convBottom}>
          {isLastFromMe ? (
            <Ionicons name="checkmark-done" size={14} color={theme.colors.muted} style={{ marginRight: 3 }} />
          ) : null}
          <Text style={styles.convLast} numberOfLines={1}>
            {item.lastMessage || 'No messages yet'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function DateSeparator({ date }) {
  return (
    <View style={styles.dateSepRow}>
      <View style={styles.dateSepLine} />
      <Text style={styles.dateSepText}>{formatDateSeparator(date)}</Text>
      <View style={styles.dateSepLine} />
    </View>
  );
}

function MessageBubble({ msg, isOwn, showDateSep }) {
  const time = msg.createdAt ? formatShortTime(msg.createdAt) : '';
  const imgUrl = msg.imageUrl ? resolveMediaUrl(msg.imageUrl) : null;
  return (
    <>
      {showDateSep ? <DateSeparator date={msg.createdAt} /> : null}
      <View style={[styles.bubbleRow, isOwn ? styles.bubbleRowOwn : styles.bubbleRowOther]}>
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          {isOwn ? <View style={styles.tailOwn} /> : <View style={styles.tailOther} />}
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.bubbleImage} resizeMode="cover" />
          ) : null}
          {msg.text ? (
            <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>{msg.text}</Text>
          ) : null}
          <View style={styles.bubbleMeta}>
            <Text style={[styles.bubbleTime, isOwn && styles.bubbleTimeOwn]}>{time}</Text>
            {isOwn ? (
              <Ionicons name="checkmark-done" size={12} color={styles.bubbleTimeOwn.color} style={{ marginLeft: 3 }} />
            ) : null}
          </View>
        </View>
      </View>
    </>
  );
}

function TypingDots() {
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDot((p) => (p + 1) % 4), 400);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={styles.typingRow}>
      <View style={styles.typingBubble}>
        <Text style={styles.typingDots}>{'.'.repeat(dot)}{'\u00A0'.repeat(3 - dot)}</Text>
      </View>
    </View>
  );
}

function ConversationView({ conversationId, userId, onBack }) {
  const insets = useSafeAreaInsets();
  const { messages, loading, sendTextMessage, sendImageMessage, typingUsers } = useChatOptional();
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const flatRef = useRef(null);
  const typingUserId = typingUsers?.[conversationId];
  const kbHeight = useKeyboardHeight();

  useEffect(() => {
    if (messages?.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 50);
    }
  }, [messages?.length]);

  const messagesWithDates = useMemo(() => {
    if (!messages?.length) return [];
    let lastDate = '';
    return messages.map((m) => {
      const d = m.createdAt ? new Date(m.createdAt).toDateString() : '';
      const show = d && d !== lastDate;
      lastDate = d;
      return { ...m, _showDate: show };
    });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendTextMessage(conversationId, input.trim());
    setInput('');
  };

  const handlePickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access to your photo library to send images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.length) return;
    const uri = result.assets[0].uri;
    setUploading(true);
    try {
      const compressed = await compressImage(uri);
      await sendImageMessage(conversationId, compressed);
    } catch (e) {
      Alert.alert('Error', 'Failed to send image. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [conversationId, sendImageMessage]);

  const renderMessage = useCallback(({ item }) => (
    <MessageBubble
      msg={item}
      isOwn={item.senderId?._id === userId || item.senderId === userId}
      showDateSep={item._showDate}
    />
  ), [userId]);

  return (
    <View style={styles.conversationContainer}>
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onBack} style={[styles.headerBtn, styles.headerBackBtn]}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.white} />
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderTitle}>Chat</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      {loading && messages.length === 0 ? (
        <View style={styles.chatList}>
          <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 40 }} />
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messagesWithDates}
          keyExtractor={(item) => item._id || String(Math.random())}
          style={styles.chatList}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No messages"
              message="Send a message to start the conversation."
            />
          }
          renderItem={renderMessage}
        />
      )}

      {typingUserId && typingUserId !== userId ? <TypingDots /> : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View
          style={[
            styles.inputRow,
            {
              paddingBottom: Math.max(insets.bottom, 4),
              marginBottom: Platform.OS === 'android' ? kbHeight : 0,
            },
          ]}
        >
          <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color={theme.colors.accent} />
            ) : (
              <Ionicons name="add-circle-outline" size={26} color={theme.colors.mutedDark} />
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message"
            placeholderTextColor={theme.colors.mutedDark}
          />
          {input.trim() ? (
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Ionicons name="send" size={18} color={theme.colors.textDark} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micBtn}>
              <Ionicons name="mic-outline" size={22} color={theme.colors.mutedDark} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function SupportChat({ userId }) {
  const insets = useSafeAreaInsets();
  const { sendSupportQuery } = useChatOptional();
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm FundiLink support. How can I help you today?", createdAt: new Date().toISOString() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatRef = useRef(null);
  const kbHeight = useKeyboardHeight();

  useEffect(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg, createdAt: new Date().toISOString() }]);
    setLoading(true);

    const history = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    const reply = await sendSupportQuery(userMsg, history);
    setMessages((prev) => [...prev, { role: 'bot', text: reply, createdAt: new Date().toISOString() }]);
    setLoading(false);
  };

  const renderMsg = useCallback(({ item }) => {
    const isBot = item.role === 'bot';
    return (
      <View style={[styles.bubbleRow, isBot ? styles.bubbleRowOther : styles.bubbleRowOwn]}>
        <View style={[styles.bubble, isBot ? styles.bubbleOther : styles.bubbleOwn]}>
          {isBot ? <View style={styles.tailOther} /> : <View style={styles.tailOwn} />}
          <Text style={[styles.bubbleText, !isBot && styles.bubbleTextOwn]}>{item.text}</Text>
        </View>
      </View>
    );
  }, []);

  return (
    <View style={styles.conversationContainer}>
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        style={styles.chatList}
        contentContainerStyle={styles.messageList}
        renderItem={renderMsg}
      />

      {loading ? (
        <View style={styles.supportLoading}>
          <ActivityIndicator size="small" color={theme.colors.accent} />
          <Text style={styles.supportLoadingText}>Thinking...</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View
          style={[
            styles.inputRow,
            {
              paddingBottom: Math.max(insets.bottom, 4),
              marginBottom: Platform.OS === 'android' ? kbHeight : 0,
            },
          ]}
        >
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything..."
            placeholderTextColor={theme.colors.mutedDark}
          />
          {input.trim() && !loading ? (
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Ionicons name="send" size={18} color={theme.colors.textDark} />
            </TouchableOpacity>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function ChatScreen({ onNavigate, userRole, userId, targetUserId }) {
  const chatCtx = useChatOptional();
  const [tab, setTab] = useState('messages');
  const [view, setView] = useState('list');
  const [activeConvId, setActiveConvId] = useState(null);

  const conversations = chatCtx?.conversations || [];
  const refreshConversations = chatCtx?.refreshConversations;
  const openConversation = chatCtx?.openConversation;

  useEffect(() => {
    refreshConversations?.();
  }, [refreshConversations]);

  useEffect(() => {
    if (!targetUserId || targetUserId === userId) return;
    (async () => {
      try {
        const { data } = await getOrCreateConversation(null, targetUserId);
        if (data?.conversation?._id) {
          setActiveConvId(data.conversation._id);
          setView('conversation');
          openConversation?.(data.conversation._id);
        }
      } catch (e) {
        // fall back to conversation list
      }
    })();
  }, [targetUserId, userId, openConversation]);

  const handleOpenConversation = (convId) => {
    setActiveConvId(convId);
    setView('conversation');
    openConversation?.(convId);
  };

  const handleBack = () => {
    if (view === 'conversation') {
      setView('list');
      setActiveConvId(null);
    } else {
      onNavigate?.('bookings');
    }
  };

  if (view === 'conversation' && activeConvId) {
    return (
      <ScreenWrapper style={styles.safe} edges={['top', 'left', 'right']}>
        <ConversationView
          conversationId={activeConvId}
          userId={userId}
          onBack={() => setView('list')}
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setTab(tab === 'messages' ? 'support' : 'messages')}
        >
          <Ionicons
            name={tab === 'support' ? 'chatbubbles' : 'headset-outline'}
            size={22}
            color={theme.colors.accent}
          />
        </TouchableOpacity>
      </View>

      {tab === 'messages' ? (
        conversations.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="No messages yet"
            message="Start a conversation from an active booking."
          />
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item._id}
            style={styles.chatList}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <ConversationItem
                item={item}
                userId={userId}
                onPress={() => handleOpenConversation(item._id)}
              />
            )}
          />
        )
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.supportHeader}>
            <Ionicons name="headset" size={20} color={theme.colors.accent} />
            <Text style={styles.supportHeaderText}>FundiLink Support</Text>
          </View>
          <SupportChat userId={userId} />
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.panel,
  },
  headerTitle: { color: theme.colors.white, fontWeight: '700', fontSize: 18 },
  headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  headerBackBtn: { backgroundColor: theme.colors.input },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.colors.black,
  },
  convAvatar: { marginRight: 12 },
  convAvatarInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  convAvatarText: { color: theme.colors.textDark, fontWeight: '700', fontSize: 18 },
  convContent: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  convName: { color: theme.colors.white, fontWeight: '600', fontSize: 15, flex: 1 },
  convTime: { color: theme.colors.mutedDark, fontSize: 11, marginLeft: 8 },
  convBottom: { flexDirection: 'row', alignItems: 'center' },
  convLast: { color: theme.colors.muted, fontSize: 13, flex: 1 },
  conversationContainer: { flex: 1, backgroundColor: theme.colors.black },
  chatList: { flex: 1 },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: theme.colors.panel,
  },
  chatHeaderInfo: { flex: 1, marginLeft: 8 },
  chatHeaderTitle: { color: theme.colors.white, fontWeight: '600', fontSize: 16 },
  messageList: { paddingHorizontal: 8, paddingVertical: 8, flexGrow: 1 },
  dateSepRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, marginHorizontal: 40 },
  dateSepLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dateSepText: { color: theme.colors.mutedDark, fontSize: 11, marginHorizontal: 10, fontWeight: '500' },
  bubbleRow: { marginBottom: 2, flexDirection: 'row', paddingHorizontal: 4 },
  bubbleRowOwn: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    position: 'relative',
  },
  bubbleOwn: {
    backgroundColor: SENT_BUBBLE,
    borderTopRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: RECEIVED_BUBBLE,
    borderTopLeftRadius: 2,
  },
  tailOwn: {
    position: 'absolute',
    top: 0,
    right: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: SENT_BUBBLE,
    borderTopColor: 'transparent',
  },
  tailOther: {
    position: 'absolute',
    top: 0,
    left: -6,
    width: 0,
    height: 0,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderRightColor: RECEIVED_BUBBLE,
    borderTopColor: 'transparent',
  },
  bubbleImage: {
    width: 200,
    height: 160,
    borderRadius: 6,
    marginBottom: 4,
  },
  bubbleText: { color: theme.colors.white, fontSize: 14, lineHeight: 20 },
  bubbleTextOwn: { color: theme.colors.white },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 },
  bubbleTime: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  bubbleTimeOwn: { color: 'rgba(255,255,255,0.6)' },
  typingRow: { paddingHorizontal: 12, paddingBottom: 4 },
  typingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: RECEIVED_BUBBLE,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  typingDots: { color: theme.colors.white, fontSize: 18, lineHeight: 16, letterSpacing: 2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: theme.colors.panel,
  },
  attachBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 4 },
  input: {
    flex: 1,
    backgroundColor: theme.colors.input,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 9,
    color: theme.colors.white,
    fontSize: 15,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  supportHeaderText: { color: theme.colors.accent, fontWeight: '600', fontSize: 14 },
  supportLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  supportLoadingText: { color: theme.colors.mutedDark, fontSize: 12 },
});
