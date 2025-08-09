# FitChat 🏋️

A real-time, personalized WhatsApp fitness coach that chats, tracks, and motivates you to smash your goals. FitChat combines AI-powered conversation with voice interactions, persistent memory, and intelligent task scheduling to provide comprehensive fitness coaching through WhatsApp.

## Features

- 🗣️ **Voice Interactions**: Send voice messages and receive audio coaching feedback
- 💬 **Intelligent Conversations**: Context-aware fitness discussions with topic-based threading
- 📊 **Progress Tracking**: Persistent conversation history and progress monitoring
- ⏰ **Smart Reminders**: Automated workout reminders, progress check-ins, and nutrition prompts
- 🎯 **Goal Management**: Set and track fitness goals with personalized coaching
- 🌤️ **Weather-Based Recommendations**: Exercise suggestions based on local weather conditions
- 📱 **WhatsApp Integration**: Native WhatsApp Business API for seamless mobile experience

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- WhatsApp Business API access
- OpenAI API key (for Whisper transcription)
- ElevenLabs API key (for text-to-speech)

### Setup
1. **Clone and install dependencies**
   ```bash
   git clone <repo-url>
   cd fitchat
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in all the required API keys and URLs in `.env.local`

3. **Set up Supabase database**
   Run the database setup script in your Supabase SQL editor:
   
   Copy the contents of `scripts/setup-database.sql` and execute it in your Supabase project's SQL editor. This will create all necessary tables, indexes, and security policies.

4. **Configure WhatsApp webhook**
   - Deploy the application or use ngrok for local development
   - Set webhook URL to: `https://your-domain.com/api/webhook`
   - Set verification token to match `WEBHOOK_VERIFICATION_TOKEN`

5. **Set up git hooks (optional)**
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

6. **Start the development server**
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
- **AI Processing**: OpenAI Whisper for transcription, ElevenLabs for TTS
- **Sports Coach**: Specialized fitness coaching logic with form analysis
- **Task Scheduler**: Node-cron based reminder system
- **Realtime Service**: Automatic task scheduling on database changes

### Conversation Flow
1. User sends message (text/voice) via WhatsApp
2. System extracts message data and transcribes audio if needed
3. User is created/retrieved from database
4. Message is logged to appropriate conversation thread
5. AI generates contextual fitness coaching response
6. Response is sent back via text or voice
7. Tasks are created and scheduled based on conversation intent

## Development

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

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