import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Image as ImageIcon, Sparkles, Download, RefreshCw, Upload, X, CheckCircle2, Edit3, Crop, Send, Menu } from 'lucide-react';
import { keywordCheck, aiValidatePrompt, enhancePrompt, checkRateLimit } from './services/pipeline';
import PromptEditor from './components/PromptEditor';
import { useChatHistory } from './hooks/useChatHistory';
import Sidebar from './components/Sidebar';
import ChatMessageItem from './components/ChatMessageItem';

const cropImage = (base64: string, ratio: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');

      let sWidth = img.width;
      let sHeight = img.height;
      let sx = 0;
      let sy = 0;

      const imgRatio = img.width / img.height;

      if (imgRatio > ratio) {
        sWidth = img.height * ratio;
        sx = (img.width - sWidth) / 2;
      } else {
        sHeight = img.width / ratio;
        sy = (img.height - sHeight) / 2;
      }

      canvas.width = sWidth;
      canvas.height = sHeight;

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = base64;
  });
};

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{data: string, mimeType: string} | null>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    chats,
    setChats,
    currentChatId,
    setCurrentChatId,
    currentChat,
    createNewChat,
    addMessage,
    updateMessage,
    deleteChat,
  } = useChatHistory();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages, isGenerating]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const mimeType = result.split(';')[0].split(':')[1];
      const base64Data = result.split(',')[1];
      setUploadedImage({ data: base64Data, mimeType });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGenerate = async (overridePrompt?: string) => {
    const finalPrompt = overridePrompt || prompt;
    if (!finalPrompt.trim()) return;
    
    let chatId = currentChatId;
    if (!chatId) {
      chatId = createNewChat();
    }

    // Add user message
    addMessage(chatId, {
      role: 'user',
      content: finalPrompt,
    });

    setPrompt('');
    setIsGenerating(true);
    setError(null);
    setLoadingStep('Initializing...');
    
    // Add temporary assistant message
    addMessage(chatId, {
      role: 'assistant',
      content: 'Initializing...',
    });
    
    // We need to get the actual ID assigned by addMessage.
    // Since addMessage is synchronous but state update is async, we'll just update the last message.
    // A better way is to pass the ID or return it, but for simplicity we'll update the last assistant message.
    
    try {
      console.log("[Pipeline] Checking rate limits...");
      checkRateLimit();

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      setLoadingStep('Analyzing prompt...');
      console.log("[Pipeline] Starting for prompt:", finalPrompt);
      
      let category = "DECORATION";
      if (keywordCheck(finalPrompt)) {
        console.log("[Pipeline] Keyword match found. Proceeding to enhancement.");
      } else {
        setLoadingStep('Validating decoration context...');
        category = await aiValidatePrompt(finalPrompt, ai);
      }

      if (category === "INVALID") {
        throw new Error("Please enter a prompt related to event decorations.");
      }

      setLoadingStep('Enhancing prompt for best results...');
      const enhancedPrompt = enhancePrompt(finalPrompt, category);

      setLoadingStep('Generating your decoration concept...');
      
      const parts: any[] = [];
      if (uploadedImage) {
        parts.push({
          inlineData: {
            data: uploadedImage.data,
            mimeType: uploadedImage.mimeType,
          }
        });
      }
      parts.push({ text: enhancedPrompt });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: parts },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          }
        }
      });
      
      console.log("[Pipeline] Response:", JSON.stringify(response, null, 2));
      
      if (response.promptFeedback?.blockReason) {
        throw new Error(`Prompt blocked: ${response.promptFeedback.blockReason}`);
      }
      
      const candidate = response.candidates?.[0];
      if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`Generation stopped: ${candidate.finishReason}`);
      }

      let imageUrl = null;
      let textResponse = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          textResponse = part.text;
        }
      }
      
      if (imageUrl) {
        setChats(prev => prev.map(c => {
          if (c.id === chatId) {
            const msgs = [...c.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.image = imageUrl;
              lastMsg.originalImage = imageUrl;
              lastMsg.prompt_used = enhancedPrompt;
              lastMsg.content = undefined;
              lastMsg.aspectRatio = aspectRatio;
            }
            return { ...c, messages: msgs };
          }
          return c;
        }));
      } else {
        throw new Error(textResponse || 'Failed to generate image. Please try again.');
      }
    } catch (err: any) {
      console.error("[Pipeline Error]", err);
      setError(err.message || 'An error occurred while generating the image.');
      setChats(prev => prev.map(c => {
        if (c.id === chatId) {
          const msgs = [...c.messages];
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.isError = true;
            lastMsg.content = err.message || 'An error occurred.';
          }
          return { ...c, messages: msgs };
        }
        return c;
      }));
    } finally {
      setIsGenerating(false);
      setLoadingStep('');
      setUploadedImage(null);
    }
  };

  const handleAspectRatioChange = async (messageId: string, ratioValue: number, ratioLabel: string) => {
    if (!currentChat) return;
    const message = currentChat.messages.find(m => m.id === messageId);
    if (!message || !message.originalImage) return;
    
    try {
      const cropped = await cropImage(message.originalImage, ratioValue);
      updateMessage(currentChat.id, messageId, {
        image: cropped,
        aspectRatio: ratioLabel
      });
    } catch (err) {
      console.error("Failed to crop image", err);
    }
  };

  const openEditor = (messageId: string) => {
    setEditingMessageId(messageId);
    setIsEditingImage(true);
  };

  const handleEditImage = async (instruction: string) => {
    if (!currentChat || !editingMessageId) return;
    const message = currentChat.messages.find(m => m.id === editingMessageId);
    if (!message || !message.image) return;
    
    setIsEditingImage(false);
    setIsGenerating(true);
    setLoadingStep('Applying your edits...');
    setError(null);

    const chatId = currentChat.id;
    
    // Add user message for the edit instruction
    addMessage(chatId, {
      role: 'user',
      content: `Edit: ${instruction}`,
    });

    // Add temporary assistant message
    addMessage(chatId, {
      role: 'assistant',
      content: 'Applying edits...',
    });

    try {
      const imageBase64 = message.image.split(',')[1];
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{
          parts: [
            { inlineData: { data: imageBase64, mimeType: 'image/png' } },
            { text: instruction }
          ]
        }]
      });

      let imageUrl = null;
      let textResponse = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          textResponse = part.text;
        }
      }

      if (imageUrl) {
        setChats(prev => prev.map(c => {
          if (c.id === chatId) {
            const msgs = [...c.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.image = imageUrl;
              lastMsg.originalImage = imageUrl;
              lastMsg.prompt_used = instruction;
              lastMsg.content = undefined;
              lastMsg.aspectRatio = message.aspectRatio || '1:1';
            }
            return { ...c, messages: msgs };
          }
          return c;
        }));
      } else {
        throw new Error(textResponse || 'Failed to edit image. Please try again.');
      }
    } catch (err: any) {
      console.error("[Edit Error]", err);
      setError(err.message || 'An error occurred while editing the image.');
      setChats(prev => prev.map(c => {
        if (c.id === chatId) {
          const msgs = [...c.messages];
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.isError = true;
            lastMsg.content = err.message || 'An error occurred.';
          }
          return { ...c, messages: msgs };
        }
        return c;
      }));
    } finally {
      setIsGenerating(false);
      setLoadingStep('');
      setEditingMessageId(null);
    }
  };

  // We need to expose setChats from the hook to update the last message easily
  // Let's assume we can just use the hook's updateMessage or add a setChats to it.
  // Wait, I didn't export setChats from useChatHistory. I'll need to update the hook or use a workaround.
  // Let's update useChatHistory to export setChats.

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500/30 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          chats={chats} 
          currentChatId={currentChatId} 
          onSelectChat={(id) => {
            setCurrentChatId(id);
            setIsSidebarOpen(false);
          }} 
          onNewChat={() => {
            createNewChat();
            setIsSidebarOpen(false);
          }} 
          onDeleteChat={deleteChat}
        />
      </div>
      
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        {/* Header */}
        <div className="shrink-0 p-4 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="inline-flex items-center justify-center p-2 bg-zinc-900 rounded-xl border border-zinc-800 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white">EventDhara AI</h1>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <div className="max-w-4xl mx-auto flex flex-col gap-2 pb-32">
            {!currentChat || currentChat.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center space-y-4 opacity-70">
                <div className="p-4 bg-zinc-900 rounded-full border border-zinc-800">
                  <ImageIcon className="w-10 h-10 text-zinc-500" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-zinc-300 mb-2">What would you like to decorate?</h2>
                  <p className="text-zinc-500 max-w-md">
                    Describe your event, theme, and preferences. I'll generate a stunning concept for you.
                  </p>
                </div>
              </div>
            ) : (
              currentChat.messages.map((msg) => (
                <ChatMessageItem 
                  key={msg.id} 
                  message={msg} 
                  onEditImage={openEditor}
                  onRegenerate={(p) => handleGenerate(p)}
                  onAspectRatioChange={handleAspectRatioChange}
                  isGenerating={isGenerating}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-10 pb-6 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            <div className="bg-zinc-900/80 p-2 rounded-3xl border border-zinc-800/80 shadow-2xl backdrop-blur-xl flex flex-col gap-2">
              {uploadedImage && (
                <div className="px-4 pt-3 pb-1">
                  <div className="relative inline-block w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 group/upload">
                    <img 
                      src={`data:${uploadedImage.mimeType};base64,${uploadedImage.data}`} 
                      alt="Uploaded reference" 
                      className="w-full h-full object-cover" 
                    />
                    <button 
                      onClick={() => setUploadedImage(null)} 
                      disabled={isGenerating}
                      className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white hover:bg-black/90 transition-colors opacity-0 group-hover/upload:opacity-100 disabled:opacity-0"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-end gap-2 px-2 pb-2">
                <label className={`shrink-0 p-3 rounded-2xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer ${isGenerating ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Upload className="w-5 h-5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isGenerating} />
                </label>
                
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder="Describe your decoration concept..."
                  className="flex-1 max-h-32 min-h-[44px] bg-transparent border-0 text-white placeholder:text-zinc-500 focus:ring-0 resize-none py-3 px-2"
                  disabled={isGenerating}
                  rows={prompt.split('\n').length > 1 ? Math.min(prompt.split('\n').length, 4) : 1}
                />
                
                <button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating || !prompt.trim()}
                  className="shrink-0 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white p-3 rounded-2xl transition-all shadow-lg shadow-amber-500/20 disabled:shadow-none mb-0.5"
                >
                  {isGenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="text-center mt-3 text-xs text-zinc-600">
              AI generated concepts may not be perfect. Verify details before implementation.
            </div>
          </div>
        </div>
      </div>

      {/* Editor Overlay */}
      {isEditingImage && editingMessageId && currentChat && (
        <PromptEditor 
          imageUrl={currentChat.messages.find(m => m.id === editingMessageId)?.image || ''} 
          onCancel={() => {
            setIsEditingImage(false);
            setEditingMessageId(null);
          }} 
          onEdit={handleEditImage} 
        />
      )}
    </div>
  );
}
