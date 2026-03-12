import { useState, useEffect } from 'react';
import { ChatSession, ChatMessage } from '../types/chat';

const STORAGE_KEY = 'eventdhara_chat_history';

export function useChatHistory() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.chats && Array.isArray(parsed.chats)) {
          setChats(parsed.chats);
          if (parsed.chats.length > 0) {
            setCurrentChatId(parsed.chats[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
  }, []);

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ chats }));
    }
  }, [chats]);

  const createNewChat = () => {
    const newChat: ChatSession = {
      id: `chat_${Date.now()}`,
      title: 'New Chat',
      timestamp: Date.now(),
      messages: [],
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    return newChat.id;
  };

  const addMessage = (chatId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const newMessage: ChatMessage = {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };
        
        // Update title if it's the first user message
        let title = chat.title;
        if (chat.messages.length === 0 && message.role === 'user' && message.content) {
          title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
        }

        return {
          ...chat,
          title,
          messages: [...chat.messages, newMessage],
        };
      }
      return chat;
    }));
  };

  const updateMessage = (chatId: string, messageId: string, updates: Partial<ChatMessage>) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.map(msg => 
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
        };
      }
      return chat;
    }));
  };

  const currentChat = chats.find(c => c.id === currentChatId) || null;

  return {
    chats,
    setChats,
    currentChatId,
    setCurrentChatId,
    currentChat,
    createNewChat,
    addMessage,
    updateMessage,
  };
}
