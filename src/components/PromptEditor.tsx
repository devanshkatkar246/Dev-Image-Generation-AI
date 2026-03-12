import React, { useState } from 'react';
import { X, Check, Loader2, Sparkles } from 'lucide-react';

interface PromptEditorProps {
  imageUrl: string;
  onCancel: () => void;
  onEdit: (instruction: string) => Promise<void>;
}

export default function PromptEditor({ imageUrl, onCancel, onEdit }: PromptEditorProps) {
  const [instruction, setInstruction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!instruction.trim()) return;
    setIsSubmitting(true);
    try {
      await onEdit(instruction);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            AI Image Editor
          </h2>
          <button onClick={onCancel} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          
          {/* Image Preview */}
          <div className="flex-1 bg-zinc-950 p-6 flex items-center justify-center relative overflow-hidden">
            <img 
              src={imageUrl} 
              alt="Base" 
              className="max-w-full max-h-[50vh] lg:max-h-[60vh] object-contain rounded-lg shadow-2xl border border-zinc-800"
            />
          </div>

          {/* Controls Sidebar */}
          <div className="w-full lg:w-96 bg-zinc-900 border-t lg:border-t-0 lg:border-l border-zinc-800 p-6 flex flex-col gap-6">
            
            <div className="space-y-3 flex-1">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Edit Instruction</h3>
              <p className="text-xs text-zinc-500">Describe exactly how you want to change the image. The AI will automatically figure out what to edit.</p>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="E.g., Change the text on the banner to '26th Anniversary', make the flowers red, add a disco ball..."
                className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 resize-none"
                disabled={isSubmitting}
              />
            </div>

            <div className="mt-auto pt-4">
              <button
                onClick={handleSave}
                disabled={isSubmitting || !instruction.trim()}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Applying Edit...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Apply Changes
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
