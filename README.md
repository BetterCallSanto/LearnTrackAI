# LearnTrackAI 🚀

LearnTrackAI is an intelligent, interactive learning portal that combines an inline code compiler, structured learning journeys, and AI-powered characters (from *The Office*) acting as mentors and mock interviewers to help developers master coding concepts.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite/CRA), Tailwind CSS, Vanilla CSS, Lucide Icons, Canvas-Confetti.
- **Backend**: Spring Boot, RestTemplate, Spring Data JPA.
- **Database**: SQLite (local) / PostgreSQL (production).
- **AI Integrations**: Groq API (models: `llama-3.3-70b-versatile`, `qwen/qwen3.6-27b`).
- **Hosting**:
  - **Backend & Database**: Railway
  - **Frontend**: Netlify

---

## 📁 Repository Structure

```
Learn_Track_ai/
├── learntrack-backend/     # Spring Boot Rest API
│   ├── src/
│   ├── pom.xml
│   └── uploads/            # Backend attachments
├── learntrack-frontend/    # React Single Page App
│   ├── src/
│   │   ├── components/     # UI Components (InlineSnippetCard, InterviewAvatar, etc.)
│   │   └── pages/          # Pages (UniversalCompilerPage, RevisionPage, etc.)
│   └── public/             # Static Assets (Images, GIFs, Audio)
├── database/               # Local SQL backups & scripts
├── docs/                   # Supporting documentation
└── RELEASE_NOTES.md        # Detailed release logs
```

---

## 🚀 Version Changelog & Updates

Here is a history of updates made to the application. For detailed breakdowns, please reference [RELEASE_NOTES.md](file:///d:/learnTrack_versions/Learn_Track_ai/RELEASE_NOTES.md).

### 🏷️ Version 2.2: The "Dwight Schrute" Soft Persona & Code Execution Update (Current)
**Date:** July 14, 2026

This release refines the Dwight AI chat personality, integrates compiler safety protocols, introduces resizable layouts for the code compiler, and optimizes the repo structure for clean GitHub pushes.

#### 🤖 Dwight Chat Behavior & Personality Restructuring
- **Gentle & Supportive Tone**: Softened Dwight to be respectful, supportive, and gentle (acting as if whispering into a microphone).
- **Structured Explanations**: 
  - Standardized definitions of terms/concepts to **2-3 lines**.
  - If a technology is requested, it provides a **2-line history** of why it was created and a **2-3 line chronology** of its evolution.
  - If not a technology, it explains **why it is useful** instead of its history.
- **Emoji-Driven Real-World Analogies**: Uses highly relatable, real-world analogies (e.g. sharing a workbook vs xerox copy for pass-by-reference/value) rather than forcing Office-themed analogies. Emojis are reserved specifically to highlight these analogies.
- **Markdown Cleanup**: Reduced asterisk/bold formatting and eliminated all-caps text to keep output clean and crisp.

#### 💻 Compiler & Class Naming Enhancements
- **Strict Main Class Naming**: Dwight is now explicitly prompted to always name the primary executable Java class `Main` in code outputs. This allows users to copy and run code directly without encountering compilation errors due to class mismatches.
- **Resizable Output Window**: Implemented a draggable border at the top of the compiler's output panel, allowing users to resize the console height dynamically.
- **Compiler Toolbar Polish**: Optimized the compiler toolbar for mobile responsiveness by aligning elements on a row and using icon-only buttons.
- **Dwight Badges**: Added project tagging (`fromDwight`) on the backend to flag snippets created via the Dwight chat, rendering a `· Dwight Snippet` badge in the UI.

#### ⚙️ Stability, Security, and Codebase Cleanup
- **Safe `<think>` Stripping**: Upgraded the backend regex pattern to `(?s)<think>(.*?)(</think>|$)` to successfully remove all reasoning thoughts from the Qwen model even if it hits token limits and cuts off without a closing tag.
- **Token Buffering**: Increased `max_tokens` to 4096 in `DwightChatService.java` to support long-form reasoning thoughts.
- **API Key Security**: Removed the hardcoded fallback API key in `application.properties`, relying strictly on the system's `GROQ_API_KEY` environment variable.
- **Warning Cleanup**: Resolved unchecked cast warnings in `DwightChatService.java` and `InterviewService.java` with correct `@SuppressWarnings("unchecked")` definitions.
- **Asset Restructuring**: Deleted root duplicates of static assets and moved all local project images into `learntrack-frontend/public/images/`.
- **Git Hygiene**: Updated the root `.gitignore` to prevent committing build targets, IDE profiles, node_modules, and local database files.

---

### 🏷️ Version 2.1: The "Pam Beesley" AI & Mobile Polish Update
**Date:** July 11, 2026

- **Pam Mock Interviewer**: Integrated evaluation phase where Pam gives feedback on answers before asking the next question.
- **Connection Fallbacks**: Added automatic retries on empty LLM responses or connection drops.
- **UI Animation & Rewards**: Added confetti showers, GIFs, and cheering audio for milestone celebrations.
- **Mobile Responsive Editors**: Cleaned up the mobile toolbar layout to pin the "Run" compiler action.

---

## 💻 Local Setup & Deployment

### Prerequisite Environment Variable
Make sure to set your Groq API Key on your system:
```bash
# Windows (PowerShell)
$env:GROQ_API_KEY="your-groq-api-key"

# Linux / macOS
export GROQ_API_KEY="your-groq-api-key"
```

### Run Backend
```bash
cd learntrack-backend
# Make sure Maven is installed
mvn spring-boot:run
```

### Run Frontend
```bash
cd learntrack-frontend
npm install
npm run dev
```
