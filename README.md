# FitChat 🏋️

A real-time, personalized WhatsApp fitness coach that chats, tracks, and motivates you to smash your goals. FitChat combines AI-powered conversation with voice interactions, persistent memory, and intelligent task scheduling to provide comprehensive fitness coaching through WhatsApp.

## Features

- 🎬 **Video Form Analysis**: Upload workout videos to get AI-powered form and technique feedback
- 🏋️ **Smart Workout Logging**: Automatically parse and track workouts with intelligent prompting
- 🍽️ **Meal Tracking**: AI-powered calorie estimation and nutrition tracking from meal descriptions
- 📈 **Body Weight Tracking**: Track weight changes over time with progress visualization
- 🗣️ **Voice Interactions**: Send voice messages and receive audio coaching feedback
- 💬 **Intelligent Conversations**: Context-aware fitness discussions with topic-based threading
- 📊 **Progress Tracking**: Comprehensive health metrics and workout history
- ⏰ **Smart Reminders**: Automated workout reminders, progress check-ins, and nutrition prompts
- 🎯 **Goal Management**: Set and track fitness goals with personalized coaching
- 📱 **WhatsApp Integration**: Native WhatsApp Business API for seamless mobile experience

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- WhatsApp Business API access
- OpenAI API key (for Whisper transcription and GPT-4o Vision)
- ElevenLabs API key (for text-to-speech)
- **FFmpeg** (required for video form analysis)

### Setup
1. **Install FFmpeg (Required for Video Analysis)**
   
   **Windows:**
   ```bash
   # Using Chocolatey (recommended)
   choco install ffmpeg
   
   # Or using Winget
   winget install "FFmpeg (Essentials Build)"
   ```
   
   **macOS:**
   ```bash
   brew install ffmpeg
   ```
   
   **Ubuntu/Debian:**
   ```bash
   sudo apt update && sudo apt install ffmpeg
   ```
   
   **Manual Installation:**
   - Download from https://ffmpeg.org/download.html
   - Add FFmpeg to your system PATH

2. **Clone and install dependencies**
   ```bash
   git clone <repo-url>
   cd fitchat
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in all the required API keys and URLs in `.env.local`

4. **Set up Supabase database**
   Run the fresh database setup script:
   
   ```bash
   npm run setup-db
   ```
   
   This will:
   - Clear existing data from your database
   - Generate a fresh SQL schema
   - Provide instructions to run it in Supabase SQL editor
   
   Alternatively, you can run the script manually:
   ```bash
   node scripts/setup-fresh-database.js
   ```
   
   Then copy the generated SQL and run it in your [Supabase SQL Editor](https://supabase.com/dashboard/project/your-project/sql/new).

5. **Configure WhatsApp webhook**
   - Deploy the application or use ngrok for local development
   - Set webhook URL to: `https://your-domain.com/api/webhook`
   - Set verification token to match `WEBHOOK_VERIFICATION_TOKEN`

6. **Set up git hooks (optional)**
   ```bash
   git config core.hooksPath .git/hooks
   ```
   
   Add the following to `.git/hooks/pre-commit`:
   ```bash
   #!/bin/sh
   echo "🔍 Running ESLint before commit..."
   npm run lint
   RESULT=$?
   if [ $RESULT -ne 0 ]; then
     echo "❌ ESLint failed. Commit aborted."
     exit 1
   fi
   echo "✅ ESLint passed. Proceeding with commit."
   exit 0
   ```
   
   Make it executable: `chmod +x .git/hooks/pre-commit`

7. **Start the development server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Core Endpoints
- `POST /api/webhook` - WhatsApp webhook for message processing
- `GET /api/health` - Health check endpoint
- `POST /api/send-onboarding-message` - Send welcome message to new users
- `GET/POST/PUT /api/users` - User management
- `GET/POST/PUT/DELETE /api/tasks` - Task management with scheduling
- `GET/POST/PUT /api/conversations` - Conversation history

### Sports Coach Endpoints
- `POST/GET /api/sports-coach/training-plan` - Generate and adjust personalized training plans
- `POST/GET /api/sports-coach/diary` - Create and retrieve performance diary entries
- `POST /api/sports-coach/analyze-form` - Analyze workout form from video input
- `POST /api/sports-coach/feedback` - Get personalized fitness feedback and motivation

## Architecture

### Core Components
- **Database Layer**: Supabase for persistent storage with realtime subscriptions
- **WhatsApp Integration**: Business API for message handling and media
- **AI Processing**: 
  - OpenAI Whisper for voice transcription
  - GPT-5-mini for intelligent responses  
  - GPT-4o Vision for video form analysis
  - ElevenLabs for text-to-speech
- **Video Processing**: FFmpeg for frame extraction from workout videos
- **Sports Coach**: Specialized fitness coaching logic with form analysis
- **Task Scheduler**: Node-cron based reminder system
- **Realtime Service**: Automatic task scheduling on database changes

### Conversation Flow
1. User sends message (text/voice/video) via WhatsApp
2. System extracts message data and processes content:
   - **Text**: Direct processing with smart health logging detection
   - **Audio**: Whisper transcription  
   - **Video**: FFmpeg frame extraction → GPT-4o Vision analysis
3. User is created/retrieved from database
4. **Smart Health Logging**:
   - **Workout Detection**: AI parses workout descriptions ("3 sets of 10 push-ups")
   - **Meal Tracking**: AI estimates calories and macros from meal descriptions
   - **Progressive Prompting**: Only asks for missing data (body weight, clarifications)
5. Message is logged to appropriate conversation thread
6. AI generates contextual fitness coaching response:
   - **Regular messages**: GPT-5-mini with conversation context
   - **Video analysis**: GPT-4o Vision + GPT-5-mini synthesis
   - **Health logging**: Confirmations and progress insights
7. Response is sent back via text or voice
8. Tasks are created and scheduled based on conversation intent

### Health Logging System
- **Workout Parsing**: Automatically extracts sets, reps, weight, and exercise type
- **Body Weight Tracking**: Tracks changes over time, only prompts when needed
- **Meal Analysis**: AI estimates calories with confidence scoring
- **Smart Prompting**: Minimal onboarding - collects data progressively as needed

## Development

```bash
# Start development server
npm run dev

# Setup fresh database
npm run setup-db

# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

### Database Schema
The health logging system includes these main tables:
- `users` - User profiles with basic info
- `user_metrics` - Body weight, health metrics over time
- `workouts` - Workout sessions
- `workout_exercises` - Individual exercises with sets/reps/weight
- `meals` - Meal tracking with calories and macros
- `conversations` - Chat threads by topic
- `messages` - All WhatsApp interactions

## Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Add all environment variables from `.env.example`
3. Deploy - Vercel will handle the build automatically
4. Configure your WhatsApp webhook URL to point to the deployed domain

### Manual Deployment
1. Build the project: `npm run build`
2. Start with: `npm start`
3. Ensure all environment variables are set in production
4. Configure webhook URL in WhatsApp Business API settings

## Troubleshooting

### Common Issues

**"User not found" errors**
- Ensure users are being created properly via WhatsApp messages
- Check that `SUPABASE_SERVICE_ROLE_KEY` has proper permissions

**Tasks not being scheduled**
- Verify Node-cron is working: check server logs for scheduling messages
- Ensure realtime connections are established with Supabase

**Audio features not working**
- Verify `OPENAI_API_KEY` and `ELEVENLABS_API_KEY` are set correctly
- Check that temporary file directories (`/tmp`) are writable

**Video form analysis not working**
- **FFmpeg not found**: Install FFmpeg and ensure it's in your system PATH
  ```bash
  # Test FFmpeg installation
  ffmpeg -version
  ```
- **Video processing fails**: Check console logs for detailed error messages
- **Large video files**: Ensure adequate disk space in `/tmp` directory
- **Unsupported formats**: Convert videos to MP4 format if needed

**WhatsApp messages not receiving**
- Verify webhook URL is accessible publicly (use ngrok for development)
- Check `WEBHOOK_VERIFICATION_TOKEN` matches Meta's webhook configuration
- Ensure `WHATSAPP_TOKEN` and `PHONE_NUMBER_ID` are correct

**Database connection issues**
- Verify Supabase URL and keys in environment variables
- Check that database tables are created with proper permissions
- Ensure RLS policies allow service role access

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure tests pass and linting succeeds
5. Submit a pull request

## License

MIT License - see LICENSE file for details