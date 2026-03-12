import React, { useState } from 'react';
import { ChatMessage } from '../types/chat';
import { Loader2, Download, RefreshCw, Edit3, Crop, User, Sparkles } from 'lucide-react';

interface ChatMessageItemProps {
  message: ChatMessage;
  onEditImage: (messageId: string) => void;
  onRegenerate: (prompt: string) => void;
  onAspectRatioChange: (messageId: string, ratioValue: number, ratioLabel: string) => void;
  isGenerating?: boolean;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ 
  message, 
  onEditImage, 
  onRegenerate, 
  onAspectRatioChange,
  isGenerating 
}) => {
  const [showRatioSelector, setShowRatioSelector] = useState(false);

  const handleDownload = () => {
    if (!message.image) return;
    const a = document.createElement('a');
    a.href = message.image;
    a.download = `eventdhara-decor-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-6">
        <div className="bg-zinc-800 text-zinc-100 px-5 py-3 rounded-2xl rounded-tr-sm max-w-[80%] shadow-md">
          <div className="flex items-center gap-2 mb-1 opacity-70">
            <User className="w-4 h-4" />
            <span className="text-xs font-medium">You</span>
          </div>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant message (Image)
  return (
    <div className="flex justify-start mb-6 w-full">
      <div className="bg-zinc-900/60 border border-zinc-800/50 p-4 rounded-2xl rounded-tl-sm w-full max-w-3xl shadow-lg">
        <div className="flex items-center gap-2 mb-3 text-amber-500">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-medium">EventDhara AI</span>
        </div>
        
        {message.isError ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {message.content || 'An error occurred.'}
          </div>
        ) : message.image ? (
          <div className="flex flex-col gap-3">
            <div 
              className="w-full bg-zinc-950/50 rounded-xl border border-zinc-800/50 flex items-center justify-center overflow-hidden relative group transition-all duration-500"
              style={{ aspectRatio: (message.aspectRatio || '1:1').replace(':', '/') }}
            >
              <img 
                src={message.image} 
                alt={message.prompt_used || 'Generated decoration'} 
                className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.02]"
                referrerPolicy="no-referrer"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-4 gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setShowRatioSelector(!showRatioSelector)}
                    disabled={isGenerating}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white p-2.5 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Crop className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:inline">{message.aspectRatio || '1:1'}</span>
                  </button>
                  {showRatioSelector && (
                    <div className="absolute bottom-full right-0 mb-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden flex flex-col w-32 z-20">
                      {[
                        { label: '1:1', value: 1 },
                        { label: '16:9', value: 16/9 },
                        { label: '9:16', value: 9/16 },
                        { label: '4:3', value: 4/3 },
                        { label: '3:4', value: 3/4 },
                      ].map((ratio) => (
                        <button
                          key={ratio.label}
                          onClick={() => {
                            onAspectRatioChange(message.id, ratio.value, ratio.label);
                            setShowRatioSelector(false);
                          }}
                          className={`px-4 py-2 text-sm text-left hover:bg-zinc-800 transition-colors ${(message.aspectRatio || '1:1') === ratio.label ? 'text-amber-500 font-medium bg-zinc-800/50' : 'text-zinc-300'}`}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => onEditImage(message.id)} // Will trigger prompt editor
                  disabled={isGenerating}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white p-2.5 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Edit Image"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onRegenerate(message.prompt_used || '')}
                  disabled={isGenerating}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white p-2.5 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Regenerate"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleDownload}
                  disabled={isGenerating}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white p-2.5 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            {message.prompt_used && (
              <div className="text-xs text-zinc-500 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/30">
                <span className="font-medium text-zinc-400">Prompt used:</span> {message.prompt_used}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-zinc-400 p-4">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
            <span className="text-sm">{message.content || 'Generating...'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessageItem;
