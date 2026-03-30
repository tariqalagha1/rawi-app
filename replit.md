# Rawi - AI Voice Companion

## Overview

Rawway (رواي) is a real-time voice-to-voice AI chat companion mobile application. Users speak directly to the AI using the microphone, and the AI responds with natural voice output. No text typing required - it's a pure voice experience. The app also supports file attachments (PDF, Word, EPUB, TXT, and more) so users can discuss documents with the AI.

Built with Expo React Native frontend and Express backend, using OpenAI APIs for speech-to-text, chat completions, and text-to-speech.

## Key Features

- **Voice-Only Interface**: Large microphone button for recording voice messages
- **File Attachments**: Support for PDF, DOCX, EPUB, TXT, HTML, Markdown, RTF, CSV, JSON files
- **Multiple Voice Options**: Choose from 6 AI voices (Alloy, Echo, Fable, Onyx, Nova, Shimmer)
- **Arabic Language**: Full RTL support with Arabic UI and conversation
- **Real-time Audio**: Instant speech-to-speech communication
- **Multi-Language Support**: Arabic (default) and English with LanguageContext, automatic RTL/LTR switching
- **Volume Boost**: Audio amplification using Web Audio API GainNode (1x, 2x, 3x, or auto modes)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Expo SDK 54 with React Native 0.81
- **Navigation**: React Navigation with native stack navigator (stack-only, single-screen focus)
- **State Management**: TanStack React Query for server state
- **Styling**: Custom theming system with dark mode support, using a "Calm Tech" aesthetic
- **Animations**: React Native Reanimated for fluid UI interactions
- **RTL Support**: Arabic language support with right-to-left text input

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript
- **API Design**: RESTful endpoints with Server-Sent Events (SSE) for real-time audio streaming
- **AI Integration**: OpenAI API via Replit AI Integrations for:
  - Chat completions (GPT models)
  - Text-to-speech (multiple voice options: alloy, echo, fable, onyx, nova, shimmer)
  - Speech-to-text (Whisper)
- **Audio Processing**: FFmpeg for audio format conversion (WebM/MP4/OGG to WAV)

### Project Structure
- `/client` - React Native/Expo frontend code
- `/server` - Express backend with API routes
- `/shared` - Shared types, schemas, and models between client and server
- `/client/replit_integrations` - Audio utilities for voice streaming
- `/server/replit_integrations` - Backend integration modules (audio, chat, image, batch processing)

### Database Schema
- **conversations**: Stores chat sessions with id, title, and timestamp
- **messages**: Stores individual messages with conversation reference, role (user/ai), content, and timestamp
- Uses PostgreSQL with Drizzle ORM for type-safe database operations

### Key Design Decisions
1. **Single Screen Focus**: Chat interface as the primary and only main screen, with settings accessible via modal
2. **Voice-First**: Designed for voice input/output with real-time streaming audio playback
3. **Modular Integrations**: Replit integration modules are separated for audio, chat, image generation, and batch processing
4. **Path Aliases**: Uses `@/` for client code and `@shared/` for shared code via babel module resolver

## External Dependencies

### AI Services
- **OpenAI API** (via Replit AI Integrations): Chat, TTS, and STT functionality
  - Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Database
- **PostgreSQL**: Primary data store via Drizzle ORM
  - Environment variable: `DATABASE_URL`

### System Dependencies
- **FFmpeg**: Required for audio format conversion on the server

### Key NPM Packages
- `expo-av`: Audio recording and playback on mobile
- `expo-file-system`: File operations for audio handling
- `expo-haptics`: Haptic feedback for interactions
- `react-native-keyboard-controller`: Keyboard handling for chat input
- `openai`: OpenAI SDK for AI integrations
- `drizzle-orm` + `drizzle-zod`: Type-safe database ORM with schema validation