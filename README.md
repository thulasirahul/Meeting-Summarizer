# Meeting Summarizer

A real-time meeting recorder with AI-powered transcription and intelligent action item detection.

## ✨ Features

- 🎥 **Real Screen Recording** - Capture any meeting (Google Meet, Zoom, Teams)
- 🎤 **Live Audio Capture** - Record system audio + microphone  
- 📝 **Real-time Transcription** - Speech-to-text as people speak
- 🤖 **AI Analysis** - Automatic action item & decision detection
- 📊 **Meeting Analytics** - Duration, word count, participation stats
- 💾 **Multiple Export Formats** - Video, audio, text, JSON, CSV
- 🌐 **Multi-language Support** - English, Spanish, French, German
- 📱 **Responsive Design** - Works on desktop and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Modern browser (Chrome recommended)
- Microphone and screen access permissions

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/meeting-summarizer.git
cd meeting-summarizer

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm start
```

Open http://localhost:3000 in your browser.

### Basic Usage

1. **Grant Permissions** - Allow screen capture and microphone access
2. **Join Meeting** - Open Google Meet/Zoom in another tab  
3. **Start Recording** - Click record and select the meeting tab
4. **Watch Live Analysis** - See transcription and action items in real-time
5. **Export Results** - Download video, transcript, and summary

## 📁 Project Structure

```
meeting-summarizer/
├── src/
│   ├── index.html          # Main HTML file
│   ├── style.css           # Styles and design system
│   ├── app.js              # Main application logic
│   ├── components/         # Reusable UI components
│   ├── utils/              # Utility functions
│   └── assets/             # Images, icons, fonts
├── tests/
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── docs/                   # Documentation
├── dist/                   # Built files for production
├── .github/               # GitHub workflows and templates
├── docker/                # Docker configuration
├── scripts/               # Build and deployment scripts
└── config/                # Configuration files
```

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start development server
npm run dev        # Development server with hot reload
npm test           # Run tests
npm run build      # Build for production
npm run lint       # Lint code
npm run format     # Format code with Prettier
npm run deploy     # Deploy to GitHub Pages
```

### Code Style

This project uses:
- **ESLint** for JavaScript linting
- **Prettier** for code formatting  
- **Husky** for git hooks
- **Lint-staged** for pre-commit checks

### Browser Support

- Chrome 70+ ✅
- Firefox 65+ ✅  
- Safari 14+ ⚠️ (Limited features)
- Edge 79+ ✅

## 🎯 How It Works

### Screen Recording
Uses the **Screen Capture API** to record browser tabs or entire screen with audio.

### Speech Recognition  
Implements **Web Speech API** for real-time speech-to-text conversion with confidence scoring.

### AI Analysis
Custom NLP pipeline detects:
- Action items and tasks
- Key decisions  
- Important deadlines
- Person assignments
- Meeting topics

### Export Options
- **Video**: WebM, MP4 formats
- **Audio**: WAV, MP3 formats  
- **Text**: Plain text, JSON, CSV
- **Summary**: PDF reports

## 🔧 Configuration

### Environment Variables

Create `.env` file with your configuration:

```env
# Required
NODE_ENV=development
PORT=3000

# Optional API Keys
OPENAI_API_KEY=your_key_here
DEEPGRAM_API_KEY=your_key_here
```

### Recording Settings

Modify `src/config/recording.js`:

```javascript
export const RECORDING_CONFIG = {
  video: {
    width: 1920,
    height: 1080,
    frameRate: 30
  },
  audio: {
    sampleRate: 48000,
    channelCount: 2
  }
};
```

## 🧪 Testing

### Unit Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
```

### E2E Tests
```bash
npm run test:e2e           # Playwright tests
npm run test:e2e:headed    # With browser UI
```

### Manual Testing Checklist

- [ ] Permissions granted successfully
- [ ] Screen recording works
- [ ] Audio capture works  
- [ ] Real-time transcription appears
- [ ] Action items detected
- [ ] Export functions work
- [ ] Mobile responsive

## 🚀 Deployment

### GitHub Pages
```bash
npm run deploy
```

### Netlify  
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Docker
```bash
docker build -t meeting-summarizer .
docker run -p 3000:3000 meeting-summarizer
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Write tests for new features
- Follow existing code style
- Update documentation
- Add meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

- [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API) for browser capabilities
- [Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) for transcription
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) for recording

## 🆘 Support

- 📧 Email: support@meetingsummarizer.com
- 💬 Discord: [Join our server](https://discord.gg/meeting-summarizer)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/meeting-summarizer/issues)
- 📖 Docs: [Full Documentation](https://docs.meetingsummarizer.com)

## 🗺️ Roadmap

- [ ] Cloud storage integration
- [ ] Team collaboration features
- [ ] Mobile app (React Native)
- [ ] Advanced AI analysis
- [ ] Integration with more platforms
- [ ] Real-time collaboration
- [ ] Meeting scheduling
- [ ] Custom branding options

---

Made with ❤️ by [Your Name]