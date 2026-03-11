# AI Image Generator

A modern, responsive web application that generates high-quality images from text prompts using Google's Gemini AI.

## Features

- **Text-to-Image Generation**: Uses the `gemini-2.5-flash-image` model to create unique images based on user descriptions.
- **Modern UI/UX**: A sleek, dark-themed interface built with Tailwind CSS, featuring smooth transitions and hover effects.
- **Real-time Feedback**: Includes loading states, spinners, and error handling to keep the user informed during the generation process.
- **Download Capability**: Easily download the generated images directly to your device with a single click.
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices.

## Tech Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **AI Integration**: `@google/genai` SDK
- **Icons**: Lucide React

## How It Works

1. **User Input**: The user enters a descriptive prompt into the text area.
2. **API Request**: When the "Generate Image" button is clicked, the app initializes the `GoogleGenAI` client using the provided `GEMINI_API_KEY`.
3. **Model Execution**: A request is sent to the `gemini-2.5-flash-image` model with the user's prompt.
4. **Response Parsing**: The model returns the generated image as a base64-encoded string.
5. **Rendering**: The base64 string is converted into a data URI (`data:image/png;base64,...`) and displayed in the UI.
6. **Downloading**: The user can click the download button, which programmatically creates an anchor tag with the data URI and triggers a download.

## Setup & Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- A Google Gemini API Key

### Environment Variables
Create a `.env` file in the root directory (you can copy `.env.example`) and add your Gemini API key:

```env
GEMINI_API_KEY="your_actual_api_key_here"
```

### Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the local URL provided by Vite (usually `http://localhost:3000`).

## Project Structure

- `/src/App.tsx`: The main React component containing the UI and the generation logic.
- `/src/main.tsx`: The React entry point.
- `/src/index.css`: Global styles and Tailwind CSS imports.
- `/metadata.json`: Application metadata (name, description, permissions).
- `vite.config.ts`: Vite configuration, including Tailwind setup and environment variable injection.

## Perchance Version

If you are looking to run this inside the **Perchance** ecosystem using the `text-to-image-plugin`, a separate Perchance-compatible code snippet was provided in the previous interaction. That version uses Perchance's specific list syntax and HTML/CSS structure instead of React.
