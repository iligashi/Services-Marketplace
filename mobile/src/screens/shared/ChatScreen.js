import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { setMessages, addMessage } from '../../store/chatSlice';
import api from '../../api/axios.instance';

export default function ChatScreen({ route }) {
  const { jobId } = route.params;
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const { user, accessToken } = useSelector((state) => state.auth);
  const { messages } = useSelector((state) => state.chat);
  const dispatch = useDispatch();
  const flatListRef = useRef();

  useEffect(() => {
    // Load existing messages
    api.get(`/messages/${jobId}`).then(({ data }) => {
      dispatch(setMessages(data.messages));
    });

    // Connect socket
    const s = io('http://localhost:3000', { auth: { token: accessToken } });
    s.on('connect', () => { s.emit('join_room', jobId); });
    s.on('new_message', (msg) => { dispatch(addMessage(msg)); });
    setSocket(s);

    return () => { s.disconnect(); };
  }, [jobId]);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    socket.emit('send_message', { jobId, content: input.trim() });
    setInput('');
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender_id === user.id;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        {!isMe && <Text style={styles.senderName}>{item.sender_name}</Text>}
        <Text style={[styles.messageText, isMe && { color: '#fff' }]}>{item.content}</Text>
        <Text style={[styles.timeText, isMe && { color: 'rgba(255,255,255,0.7)' }]}>
          {new Date(item.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
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
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  messageList: { padding: 12, paddingBottom: 8 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
  myMessage: { backgroundColor: '#0984e3', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirMessage: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  senderName: { fontSize: 12, color: '#636e72', marginBottom: 2, fontWeight: '600' },
  messageText: { fontSize: 15, color: '#2d3436' },
  timeText: { fontSize: 11, color: '#b2bec3', marginTop: 4, alignSelf: 'flex-end' },
  inputBar: { flexDirection: 'row', padding: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#dfe6e9', alignItems: 'flex-end' },
  textInput: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { backgroundColor: '#0984e3', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, marginLeft: 8 },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
