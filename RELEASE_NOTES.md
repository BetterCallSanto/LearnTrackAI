# LearnTrackAI Release Notes

## Version 2.2: The "Dwight Schrute" Soft Persona & Code Execution Update
**Date:** July 14, 2026

This release refines the Dwight AI chat personality, integrates compiler safety protocols, introduces resizable layouts for the code compiler, and optimizes the repo structure for clean GitHub pushes.

### 🤖 Dwight Chat Behavior & Personality Restructuring
- **Gentle & Supportive Tone**: Softened Dwight to be respectful, supportive, and gentle (acting as if whispering into a microphone).
- **Structured Explanations**: 
  - Standardized definitions of terms/concepts to **2-3 lines**.
  - If a technology is requested, it provides a **2-line history** of why it was created and a **2-3 line chronology** of its evolution.
  - If not a technology, it explains **why it is useful** instead of its history.
- **Emoji-Driven Real-World Analogies**: Uses highly relatable, real-world analogies (e.g. sharing a workbook vs xerox copy for pass-by-reference/value) rather than forcing Office-themed analogies. Emojis are reserved specifically to highlight these analogies.
- **Markdown Cleanup**: Reduced asterisk/bold formatting and eliminated all-caps text to keep output clean and crisp.

### 💻 Compiler & Class Naming Enhancements
- **Strict Main Class Naming**: Dwight is now explicitly prompted to always name the primary executable Java class `Main` in code outputs. This allows users to copy and run code directly without encountering compilation errors due to class mismatches.
- **Resizable Output Window**: Implemented a draggable border at the top of the compiler's output panel, allowing users to resize the console height dynamically.
- **Compiler Toolbar Polish**: Optimized the compiler toolbar for mobile responsiveness by aligning elements on a single row and using icon-only buttons.
- **Dwight Badges**: Added project tagging (`fromDwight`) on the backend to flag snippets created via the Dwight chat, rendering a `· Dwight Snippet` badge in the UI.

### ⚙️ Stability, Security, and Codebase Cleanup
- **Safe `<think>` Stripping**: Upgraded the backend regex pattern to `(?s)<think>(.*?)(</think>|$)` to successfully remove all reasoning thoughts from the Qwen model even if it hits token limits and cuts off without a closing tag.
- **Token Buffering**: Increased `max_tokens` to 4096 in `DwightChatService.java` to support long-form reasoning thoughts.
- **API Key Security**: Removed the hardcoded fallback API key in `application.properties`, relying strictly on the system's `GROQ_API_KEY` environment variable.
- **Warning Cleanup**: Resolved unchecked cast warnings in `DwightChatService.java` and `InterviewService.java` with correct `@SuppressWarnings("unchecked")` definitions.
- **Asset Restructuring**: Deleted root duplicates of static assets and moved all local project images into `learntrack-frontend/public/images/`.
- **Git Hygiene**: Updated the root `.gitignore` to prevent committing build targets, IDE profiles, node_modules, and local database files.

## Version 2.1: The "Pam Beesley" AI & Mobile Polish Update
**Date:** July 11, 2026

This major update brings massive improvements to the mobile user experience and completely overhauls the AI mock interview engine for robust, dynamic, and seamless interactions.

### 🤖 AI Mock Interview Engine Overhaul
- **Model Migration & Stability**: Transitioned the backend to natively support the advanced `Qwen3.6 27B` reasoning model. Resolved the "empty reply" token-truncation bug by radically increasing max token allowances while successfully hiding the model's internal `<think>` reasoning.
- **Zero Tolerance for Broken Replies**: Engineered a backend safety net with automatic retries. If the Groq API drops a connection or returns an empty reply, the Spring Boot backend catches it, retries, and gracefully falls back to a friendly in-character response, ensuring the UI never breaks.
- **Dynamic "Pam Beesley" Persona**: Completely rewrote the system prompting. Pam is no longer generic; she actively evaluates the user's specific answers (praising correct answers, gently correcting wrong ones) *before* moving to the next question.
- **Threaded Conversations**: Pam now follows the natural thread of conversation, asking deep follow-up questions based on the specific technical terms the user brings up.

### 📱 Mobile UI/UX Refinements
- **Code Editor Layout Rebuilt**: The compiler toggle and mobile toolbar were completely redesigned. The **Run** button is now pinned and permanently visible without needing to slide.
- **Cleaner Navigation**: Removed redundant text like "Back to Journey" on mobile, streamlining headers to use intuitive back arrows.
- **Standardized Snippets**: "Untitled Snippets" has been renamed globally to simply "Untitled" for a cleaner, modern look across all devices.
- **Removed Clutter**: Purged useless "slide ➔" indicators and cleaned up the associated CSS to give maximum screen real estate to the code editor.

### 🎉 Achievements & Animations
- **Celebration Feedback**: Integrated new `ConfettiShower` components, `g1.gif` animations, and audio cues (`kids_cheering.mp3`) to provide rewarding feedback for user milestones.

### ⚙️ Backend & Infrastructure
- Upgraded `InterviewService.java` to handle multi-turn LLM contexts more intelligently.
- Synced the latest database schemas and backups (`database_backup.sql`).
- Prepared environment configurations in `application.properties` for seamless deployment to Railway (Backend) and Netlify (Frontend).
