import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
    activeRoom: null,
    unreadCount: 0,
  },
  reducers: {
    setMessages(state, action) {
      state.messages = action.payload;
    },
    addMessage(state, action) {
      state.messages.push(action.payload);
    },
    setActiveRoom(state, action) {
      state.activeRoom = action.payload;
    },
    setUnreadCount(state, action) {
      state.unreadCount = action.payload;
    },
    markMessagesReadFrom(state, action) {
      const readerId = action.payload;
      state.messages.forEach((m) => {
        if (m.sender_id !== readerId) m.is_read = true;
      });
    },
  },
});

export const { setMessages, addMessage, setActiveRoom, setUnreadCount, markMessagesReadFrom } = chatSlice.actions;
export default chatSlice.reducer;
