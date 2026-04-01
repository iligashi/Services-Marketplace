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
  },
});

export const { setMessages, addMessage, setActiveRoom, setUnreadCount } = chatSlice.actions;
export default chatSlice.reducer;
