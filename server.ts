import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Replicate from 'replicate';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Replicate client
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  // In-memory store for rate limiting
  const LIMIT = 20;
  const WINDOW_MS = 60 * 60 * 1000; // 1 hour
  const usageStore: Record<string, { count: number, resetTime: number }> = {};

  const getUsage = (ip: string) => {
    const now = Date.now();
    if (!usageStore[ip] || now > usageStore[ip].resetTime) {
      usageStore[ip] = {
        count: 0,
        resetTime: now + WINDOW_MS
      };
    }
    return usageStore[ip];
  };

  // Usage stats endpoint
  app.get('/usage', (req, res) => {
    const ip = String(req.ip || req.headers['x-forwarded-for'] || 'anonymous');
    const usage = getUsage(ip);
    const now = Date.now();
    const remaining = Math.max(0, LIMIT - usage.count);
    const resetInSeconds = Math.max(0, Math.ceil((usage.resetTime - now) / 1000));
    res.json({ remaining, resetInSeconds });
  });

  // Image generation endpoint
  app.post('/generate-image', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const ip = String(req.ip || req.headers['x-forwarded-for'] || 'anonymous');
      const usage = getUsage(ip);

      if (usage.count >= LIMIT) {
        return res.status(429).json({ error: 'Free tier limit reached' });
      }

      // Append constraints to the prompt
      const finalPrompt = `${prompt}, no people, no humans, no faces, no crowd, empty decorated venue, no watermark, no logo, no text`;

      console.log(`[Backend] Generating image for: ${finalPrompt}`);

      const output = await replicate.run(
        "black-forest-labs/flux-1.1-pro",
        {
          input: {
            prompt: finalPrompt,
            aspect_ratio: "1:1",
            output_format: "png",
            safety_tolerance: 2,
            prompt_upsampling: true
          }
        }
      );

      // Increment usage count
      usage.count++;

      let imageUrl;
      if (output && typeof (output as any).url === 'function') {
        imageUrl = (output as any).url();
      } else {
        imageUrl = Array.isArray(output) ? output[0] : output;
      }

      res.json({ image: imageUrl });
    } catch (error: any) {
      console.error('[Backend Error]', error);
      res.status(500).json({ error: error.message || 'Failed to generate image' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
