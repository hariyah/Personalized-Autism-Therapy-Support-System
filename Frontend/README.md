# Autism Support Frontend

Professional React-based frontend for the autism support voice analysis application.

## Features

- 🎙️ **Real-time Audio Recording** - Built-in microphone recording with timer
- 📁 **File Upload** - Support for audio file uploads (MP3, WAV, etc.)
- 📊 **AI-Powered Analysis** - Displays:
  - Speech transcript
  - Issue classification with confidence scores
  - Urgency level assessment
  - Summarized insights
- 💡 **Smart Recommendations** - Context-aware suggestions based on detected issues
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- ♿ **Accessibility** - Clean, clear interface suitable for autism support context

## Installation & Setup

### Prerequisites

- Node.js 16+
- npm or yarn

### Install Dependencies

```bash
cd client
npm install
```

### Configure Backend Connection

Edit `package.json` and ensure the proxy is set to your Express server:

```json
"proxy": "http://localhost:5000"
```

### Run Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

Creates an optimized production build in the `build/` folder.

## File Structure

```
client/
├── public/
│   ├── index.html          # Main HTML file
│   └── index.css           # Global styles
├── src/
│   ├── components/
│   │   ├── AudioRecorder.js        # Audio recording/upload component
│   │   ├── AudioRecorder.css       # Recorder styling
│   │   ├── ResultsDisplay.js       # Results display component
│   │   └── ResultsDisplay.css      # Results styling
│   ├── App.js              # Main app component
│   ├── App.css             # App styling
│   ├── index.js            # React entry point
│   └── index.css           # Global styles
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## Backend Integration

The frontend communicates with the Express server at `/api/analyze`:

```
Frontend (Port 3000)
    ↓
Express Server (Port 5000)
    ↓
FastAPI Backend (Port 8000)
```

Ensure all three servers are running:

```bash
# Terminal 1 - FastAPI (Port 8000)
cd ai-service
python -m uvicorn main:app --port 8000

# Terminal 2 - Express (Port 5000)
cd server
npm start

# Terminal 3 - React Frontend (Port 3000)
cd client
npm start
```

## API Response Format

The frontend expects responses in this format:

```json
{
  "audio_filename": "filename.mp3",
  "transcript": "full audio transcript text",
  "issue_label": "sensory_overload",
  "issue_top3": [
    { "label": "sensory_overload", "score": 0.95 },
    { "label": "anxiety_meltdown", "score": 0.03 },
    { "label": "sleep_issue", "score": 0.02 }
  ],
  "urgency_label": "high",
  "urgency_top3": [
    { "label": "high", "score": 0.88 },
    { "label": "medium", "score": 0.1 },
    { "label": "low", "score": 0.02 }
  ],
  "summary": "Summary of the analysis"
}
```

## Supported Issue Types

- Aggression 😠
- Anxiety/Meltdown 😰
- Daily Progress ✅
- Feeding Issue 🍽️
- Health Concern 🏥
- Regression (Social) 👥
- Regression (Speech) 🗣️
- Repetitive Behavior 🔄
- Routine Change 📅
- School Concern 🏫
- Self-Injury ⚠️
- Sensory Overload 🔊
- Sleep Issue 😴

## Styling & Customization

All styles use CSS with gradient backgrounds and smooth animations. To customize:

1. **Colors**: Edit color variables in CSS files
2. **Fonts**: Modify font-family in `public/index.css`
3. **Layout**: Adjust grid/flex properties in component CSS files

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigable
- High contrast ratio
- Clear, readable fonts

## License

© 2026 Autism Support Application. All rights reserved.
