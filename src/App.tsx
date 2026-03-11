import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Image as ImageIcon, Sparkles, Download } from 'lucide-react';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Create a new instance right before making an API call
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      });
      
      let imageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
          break;
        }
      }
      
      if (imageUrl) {
        setGeneratedImage(imageUrl);
      } else {
        setError('Failed to generate image. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating the image.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center py-12 px-4 font-sans selection:bg-indigo-500/30">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-zinc-900 rounded-2xl mb-2 border border-zinc-800 shadow-inner">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">AI Image Generator</h1>
          <p className="text-zinc-400 text-lg">Enter a prompt below to generate a unique image.</p>
        </div>

        {/* Input Section */}
        <div className="flex flex-col gap-5 bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/50 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-col gap-2">
            <label htmlFor="prompt" className="text-sm font-medium text-zinc-300 ml-1">
              Your Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic city with flying cars at sunset, cyberpunk style, highly detailed..."
              className="w-full min-h-[120px] bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
              disabled={isGenerating}
            />
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:shadow-none active:scale-[0.98]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Image...
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5" />
                Generate Image
              </>
            )}
          </button>
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}
        </div>

        {/* Output Section */}
        <div className="w-full aspect-square bg-zinc-900/40 rounded-3xl border border-zinc-800/50 flex items-center justify-center overflow-hidden relative shadow-2xl backdrop-blur-sm group">
          {generatedImage ? (
            <>
              <img 
                src={generatedImage} 
                alt={prompt} 
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-6">
                <button 
                  onClick={handleDownload}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white p-3 rounded-xl transition-all flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  <span className="text-sm font-medium">Download</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 text-zinc-600">
              {isGenerating ? (
                <>
                  <Loader2 className="w-12 h-12 animate-spin text-indigo-500/50" />
                  <p className="text-sm font-medium animate-pulse text-indigo-400/80">Creating your masterpiece...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-medium">Your generated image will appear here</p>
                </>
              )}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
