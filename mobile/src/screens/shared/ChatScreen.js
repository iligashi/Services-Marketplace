import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { setMessages, addMessage } from '../../store/chatSlice';
import api from '../../api/axios.instance';
import { colors, radius, shadows, typography } from '../../theme';

export default function ChatScreen({ route }) {
  const { jobId } = route.params;
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const [typing, setTyping] = useState(false);
  const { user, accessToken } = useSelector((state) => state.auth);
  const { messages } = useSelector((state) => state.chat);
  const dispatch = useDispatch();
  const flatListRef = useRef();

  useEffect(() => {
    api.get(`/messages/${jobId}`).then(({ data }) => {
      dispatch(setMessages(data.messages));
    });

    const socketUrl = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://192.168.0.127:5000';
    const s = io(socketUrl, { auth: { token: accessToken } });
    s.on('connect', () => { s.emit('join_room', jobId); });
    s.on('new_message', (msg) => { dispatch(addMessage(msg)); });
    s.on('typing', () => { setTyping(true); setTimeout(() => setTyping(false), 2000); });
    setSocket(s);

    return () => { s.disconnect(); };
  }, [jobId]);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    socket.emit('send_message', { jobId, content: input.trim() });
    setInput('');
  };

  const handleTyping = (text) => {
    setInput(text);
    if (socket && text.trim()) socket.emit('typing', { jobId });
  };

  const renderMessage = ({ item, index }) => {
    const isMe = item.sender_id === user.id;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id !== item.sender_id);

    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowRight : styles.messageRowLeft]}>
        {!isMe && (
          <View style={[styles.avatarMini, !showAvatar && { opacity: 0 }]}>
            <Text style={styles.avatarMiniText}>{item.sender_name?.charAt(0)?.toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
          {showAvatar && <Text style={styles.senderName}>{item.sender_name}</Text>}
          <Text style={[styles.messageText, isMe && { color: '#fff' }]}>{item.content}</Text>
          <Text style={[styles.timeText, isMe && { color: 'rgba(255,255,255,0.6)' }]}>
            {new Date(item.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatIcon}>{'💬'}</Text>
            <Text style={styles.emptyChatTitle}>Start the conversation</Text>
            <Text style={styles.emptyChatSub}>Messages are private between you and the other party</Text>
          </View>
        }
      />
      {typing && (
        <View style={styles.typingBar}>
          <Text style={styles.typingText}>Typing...</Text>
        </View>
      )}
      <View style={styles.inputBar}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            value={input}
            onChangeText={handleTyping}
            multiline
            maxLength={1000}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.sendBtnText}>{'>'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgAlt },

  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1 },

  messageRow: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-end' },
  messageRowLeft: { justifyContent: 'flex-start', marginRight: 48 },
  messageRowRight: { justifyContent: 'flex-end', marginLeft: 48 },

  avatarMini: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
  },
  avatarMiniText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  messageBubble: { maxWidth: '85%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.lg },
  myMessage: {
    backgroundColor: colors.primary, borderBottomRightRadius: 4,
    ...shadows.sm,
  },
  theirMessage: {
    backgroundColor: colors.white, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: colors.border,
  },

  senderName: { ...typography.caption, fontSize: 10, color: colors.primary, marginBottom: 3 },
  messageText: { fontSize: 15, lineHeight: 21, color: colors.text },
  timeText: { fontSize: 10, color: colors.textTertiary, marginTop: 4, alignSelf: 'flex-end' },

  typingBar: { paddingHorizontal: 20, paddingVertical: 4 },
  typingText: { ...typography.caption, fontSize: 11, color: colors.textSecondary, fontStyle: 'italic', textTransform: 'none' },

  inputBar: {
    flexDirection: 'row', padding: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border,
    alignItems: 'flex-end', ...shadows.md,
  },
  inputWrapper: {
    flex: 1, backgroundColor: colors.bgAlt, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  textInput: {
    paddingHorizontal: 18, paddingVertical: 10, fontSize: 15,
    color: colors.text, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    marginLeft: 10, ...shadows.sm,
  },
  sendBtnDisabled: { backgroundColor: colors.border },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 18 },

  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 60 },
  emptyChatIcon: { fontSize: 48, marginBottom: 16 },
  emptyChatTitle: { ...typography.h3, marginBottom: 8 },
  emptyChatSub: { ...typography.bodySmall, textAlign: 'center', lineHeight: 20 },
});
