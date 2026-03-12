import React from 'react';
import { ChatSession } from '../types/chat';
import { MessageSquare, Plus, Sparkles, Trash2 } from 'lucide-react';

interface SidebarProps {
  chats: ChatSession[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}

export default function Sidebar({ chats, currentChatId, onSelectChat, onNewChat, onDeleteChat }: SidebarProps) {
  return (
    <div className="w-64 bg-zinc-950 border-r border-zinc-800/50 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-zinc-800/50">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2 mt-2">
          Recent Chats
        </div>
        
        {chats.length === 0 ? (
          <div className="text-center text-zinc-600 text-sm p-4 mt-4">
            <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-20" />
            No chats yet
          </div>
        ) : (
          chats.map(chat => (
            <div
              key={chat.id}
              className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-left transition-colors group ${
                currentChatId === chat.id 
                  ? 'bg-zinc-800/80 text-amber-400' 
                  : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
              }`}
            >
              <button
                onClick={() => onSelectChat(chat.id)}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <MessageSquare className={`w-4 h-4 shrink-0 ${currentChatId === chat.id ? 'text-amber-500' : 'opacity-70'}`} />
                <div className="truncate text-sm font-medium">
                  {chat.title}
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                className={`p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100 ${
                  currentChatId === chat.id ? 'opacity-100' : ''
                }`}
                title="Delete chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
