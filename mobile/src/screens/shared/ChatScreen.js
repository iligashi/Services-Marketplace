import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { setMessages, addMessage, markMessagesReadFrom } from '../../store/chatSlice';
import api from '../../api/axios.instance';
import { SERVER_URL } from '../../config';
import Avatar from '../../components/Avatar';
import { Screen, Tappable, EmptyState } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { type } from '../../theme';

function TypingBubble() {
  const { colors } = useTheme();
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((d, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 150),
      Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.delay(300 - i * 150),
    ])));
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 4, alignSelf: 'flex-start', marginLeft: 52, marginTop: 4, backgroundColor: colors.bubbleTheirs, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 }}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={{
          width: 7, height: 7, borderRadius: 4, backgroundColor: colors.textSecondary,
          opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
          transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }],
        }} />
      ))}
    </View>
  );
}

export default function ChatScreen({ route }) {
  const { jobId } = route.params;
  const { colors } = useTheme();
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const [typing, setTyping] = useState(false);
  const { user, accessToken } = useSelector((state) => state.auth);
  const { messages } = useSelector((state) => state.chat);
  const dispatch = useDispatch();
  const listRef = useRef();

  useEffect(() => {
    api.get(`/messages/${jobId}`).then(({ data }) => {
      dispatch(setMessages(data.messages));
    });

    const s = io(SERVER_URL, { auth: { token: accessToken } });
    s.on('connect', () => {
      s.emit('join_room', jobId);
      s.emit('mark_read', { jobId });
    });
    s.on('new_message', (msg) => {
      dispatch(addMessage(msg));
      if (msg.sender_id !== user.id) s.emit('mark_read', { jobId });
    });
    s.on('user_typing', () => { setTyping(true); setTimeout(() => setTyping(false), 2000); });
    s.on('messages_read', ({ readerId }) => { dispatch(markMessagesReadFrom(readerId)); });
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

  const other = messages.find((m) => m.sender_id !== user.id);
  const lastMineIndex = messages.reduce((acc, m, i) => (m.sender_id === user.id ? i : acc), -1);

  const renderMessage = ({ item, index }) => {
    const isMe = item.sender_id === user.id;
    const prev = messages[index - 1];
    const next = messages[index + 1];
    const firstOfGroup = !prev || prev.sender_id !== item.sender_id;
    const lastOfGroup = !next || next.sender_id !== item.sender_id;
    const time = new Date(item.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={{ paddingHorizontal: 12, marginTop: firstOfGroup ? 12 : 2 }}>
        {!isMe && firstOfGroup ? (
          <Text style={[type.caption, { color: colors.textSecondary, marginLeft: 52, marginBottom: 3 }]}>{item.sender_name}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
          {!isMe ? (
            <View style={{ width: 32, marginRight: 8 }}>
              {lastOfGroup ? <Avatar name={item.sender_name} size={32} /> : null}
            </View>
          ) : null}
          <View style={{
            maxWidth: '76%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
            backgroundColor: isMe ? colors.primary : colors.bubbleTheirs,
            ...(lastOfGroup ? (isMe ? { borderBottomRightRadius: 6 } : { borderBottomLeftRadius: 6 }) : null),
          }}>
            <Text style={[type.body, { color: isMe ? '#fff' : colors.text }]}>{item.content}</Text>
          </View>
        </View>
        {lastOfGroup ? (
          <Text style={[type.caption2, { color: colors.textTertiary, marginTop: 4, alignSelf: isMe ? 'flex-end' : 'flex-start', marginLeft: isMe ? 0 : 52, fontWeight: '500' }]}>
            {isMe && index === lastMineIndex ? `${item.is_read ? 'Read' : 'Delivered'} · ${time}` : time}
          </Text>
        ) : null}
      </View>
    );
  };

  const canSend = !!input.trim();

  return (
    <Screen
      title={other?.sender_name || 'Messages'}
      large={false}
      scrollRef={listRef}
      data={messages}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderMessage}
      listProps={{
        onContentSizeChange: () => listRef.current?.scrollToEnd?.({ animated: true }),
        ListFooterComponent: typing ? <TypingBubble /> : null,
        keyboardDismissMode: 'interactive',
      }}
      ListEmptyComponent={(
        <EmptyState icon="chatbubbles" title="Say hello 👋" message="Messages are private between you and the other person on this job." style={{ marginTop: 40 }} />
      )}
      footer={(
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.separator, paddingHorizontal: 14, minHeight: 40, justifyContent: 'center' }}>
            <TextInput
              style={[type.body, { color: colors.text, maxHeight: 110, paddingVertical: 9, outlineStyle: 'none' }]}
              placeholder="Message"
              placeholderTextColor={colors.textTertiary}
              value={input}
              onChangeText={handleTyping}
              multiline
              maxLength={1000}
              accessibilityLabel="Message"
            />
          </View>
          <Tappable
            onPress={sendMessage}
            disabled={!canSend}
            scaleTo={0.85}
            accessibilityLabel="Send message"
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: canSend ? colors.primary : colors.fillStrong }}
          >
            <Ionicons name="arrow-up" size={22} color="#fff" />
          </Tappable>
        </View>
      )}
    />
  );
}
