# Dev Image Generation AI

A premium, high-performance image generation platform that leverages state-of-the-art AI models to transform text prompts into stunning visual content. Built with a modern tech stack focused on speed, reliability, and user experience.

## ✨ Features

- **Advanced AI Generation**: Powered by **Flux 1.1 Pro** via Replicate for industry-leading image quality and prompt adherence.
- **Optimized Backend**: Custom Node.js/Express server acting as a secure proxy to handle API requests and rate limiting.
- **Premium UI/UX**:
  - Sleek dark-mode aesthetic with glassmorphism.
  - Smooth micro-animations using Framer Motion (Motion).
  - Fully responsive design for all screen sizes.
- **Smart Prompting**: Automatically appends quality-enhancing constraints to ensure high-fidelity outputs.
- **Instant Preview & Download**: Real-time generation feedback with one-click image downloads.
- **Usage Management**: Built-in rate limiting to manage API usage effectively.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4
- **Backend**: Node.js, Express, TSX
- **AI Integration**: Replicate API (Flux 1.1 Pro)
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Replicate API Token

### 1. Installation

Clone the repository and install dependencies:

```bash
npm install
```

### 2. Configuration

Create a `.env` file in the root directory (refer to `.env.example`) and add your Replicate API token:

```env
REPLICATE_API_TOKEN=your_replicate_token_here
```

### 3. Development

Start the integrated development server (runs both the backend and frontend):

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📂 Project Structure

- `server.ts`: The core Express server handling API routing, rate limiting, and Vite middleware.
- `src/App.tsx`: Main React application entry point and UI logic.
- `src/api/generateImage.ts`: Client-side service for communicating with the backend.
- `src/components/`: Reusable React components (ChatMessageItem, etc.).
- `public/`: Static assets.

## 🛡️ Architecture & Security

- **Proxy Layer**: The frontend never communicates directly with Replicate. All requests are routed through our backend to keep API keys secure and enforce usage limits.
- **Environment Safety**: Sensitive credentials are managed via environment variables and are excluded from version control.

## 📄 License

MIT
