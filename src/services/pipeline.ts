import { GoogleGenAI } from '@google/genai';

const KEYWORDS = [
  'wedding', 'birthday', 'decoration', 'stage decoration', 'photobooth',
  'balloon decoration', 'haldi', 'mehndi', 'engagement', 'anniversary',
  'baby shower', 'backdrop', 'mandap', 'floral decoration', 'event setup',
  'selfie point', 'garden decoration'
];

/**
 * Layer 1: Keyword Filter
 * Checks if the prompt contains any known event decoration keywords.
 */
export function keywordCheck(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  return KEYWORDS.some(keyword => lowerPrompt.includes(keyword));
}

/**
 * Layer 2: AI Prompt Validator
 * Uses Gemini 3 Flash to validate if the prompt is related to event decorations.
 */
export async function aiValidatePrompt(prompt: string, ai: GoogleGenAI): Promise<string> {
  const systemPrompt = `You are a prompt validator for an event decoration AI generator used by a decoration management company.

Determine whether the following prompt is related to:
event decoration, wedding decor, party decor, stage decoration, photobooth setup, floral decoration, balloon decoration, or event styling.

Respond with ONLY one of these labels:
WEDDING
BIRTHDAY
HALDI
MEHNDI
BABY_SHOWER
ENGAGEMENT
ANNIVERSARY
CORPORATE_EVENT
DECORATION
INVALID`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Prompt: ${prompt}`,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.1, // Low temperature for deterministic classification
    }
  });

  const label = response.text?.trim().toUpperCase() || 'INVALID';
  const validLabels = [
    'WEDDING', 'BIRTHDAY', 'HALDI', 'MEHNDI', 'BABY_SHOWER', 
    'ENGAGEMENT', 'ANNIVERSARY', 'CORPORATE_EVENT', 'DECORATION'
  ];
  
  return validLabels.includes(label) ? label : 'INVALID';
}

/**
 * Layer 3: Prompt Enhancement
 * Expands the prompt based on the identified category to improve image quality.
 */
export function enhancePrompt(prompt: string, category: string): string {
  const enhancements: Record<string, string> = {
    HALDI: "luxury haldi ceremony stage decoration with marigold flowers, yellow drapes, floral backdrop, traditional Indian wedding decor, professional event photography, ultra realistic, high detail",
    WEDDING: "elegant wedding stage decoration, luxurious floral arrangements, crystal chandeliers, romantic lighting, premium event styling, professional photography, highly detailed, 8k",
    BIRTHDAY: "festive birthday party decoration, vibrant balloon garlands, neon signs, modern event setup, cheerful atmosphere, high quality, photorealistic",
    MEHNDI: "vibrant mehndi ceremony decor, colorful drapes, traditional seating, floral canopy, festive Indian wedding setup, highly detailed",
    BABY_SHOWER: "elegant baby shower decoration, pastel balloons, cute props, soft lighting, beautiful event setup, high resolution",
    ENGAGEMENT: "romantic engagement stage decoration, elegant floral rings, soft fairy lights, premium event styling, highly detailed",
    ANNIVERSARY: "sophisticated anniversary party decor, elegant table settings, romantic ambient lighting, luxurious event design, photorealistic",
    CORPORATE_EVENT: "professional corporate event stage setup, modern lighting, sleek design, branded backdrop, high quality event photography",
    DECORATION: "professional event decoration setup, premium styling, beautiful lighting, high quality event photography, highly detailed, 8k resolution, photorealistic"
  };

  const baseEnhancement = enhancements[category] || enhancements.DECORATION;
  return `${prompt}, ${baseEnhancement}`;
}

/**
 * Production Improvement: Rate Limiting
 * Simple client-side rate limiter to prevent spam.
 */
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

export function checkRateLimit() {
  const now = Date.now();
  const historyStr = localStorage.getItem('eventDhara_rateLimit');
  let history: number[] = historyStr ? JSON.parse(historyStr) : [];

  // Filter out old requests outside the window
  history = history.filter(time => now - time < RATE_LIMIT_WINDOW_MS);

  if (history.length >= MAX_REQUESTS_PER_WINDOW) {
    throw new Error(`Rate limit exceeded. Please wait a minute before generating more designs.`);
  }

  history.push(now);
  localStorage.setItem('eventDhara_rateLimit', JSON.stringify(history));
}
