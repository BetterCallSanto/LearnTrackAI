# LearnTrackAI Release Notes

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
