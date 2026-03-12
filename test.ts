import { GoogleGenAI } from '@google/genai';

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: 'A beautiful wedding decoration' }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: '1:1'
        }
      }
    });
    console.log(JSON.stringify(response, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
