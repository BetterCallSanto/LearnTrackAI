# LearnTrack — Product Requirements Document (PRD)
### Learning Journey Tracking System
**Version:** 1.0 | **Date:** May 2026 | **Status:** DRAFT — Ready for Development
**Stack:** Spring Boot · React JS · MySQL · GitHub · Netlify · JWT Auth

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Database Design](#5-database-design)
6. [Authentication System](#6-authentication-system)
7. [REST API Endpoints](#7-rest-api-endpoints)
8. [Feature Requirements](#8-feature-requirements)
9. [Frontend Component Specifications](#9-frontend-component-specifications)
10. [Backend Implementation Specifications](#10-backend-implementation-specifications)
11. [Deployment Guide](#11-deployment-guide)
12. [Security Considerations](#12-security-considerations)
13. [UI/UX Guidelines](#13-uiux-guidelines)
14. [Error Handling](#14-error-handling)
15. [Testing Strategy](#15-testing-strategy)
16. [Implementation Roadmap](#16-implementation-roadmap)
17. [Out of Scope for v1.0](#17-out-of-scope-for-v10)
18. [Glossary](#18-glossary)
19. [Document Revision History](#19-document-revision-history)

---

## 1. Executive Summary

LearnTrack is a full-stack web application designed to help learners track, document, and revise their personal learning journeys in a structured and organized manner. Inspired by the notebook-style interface of tools like NotebookLM, LearnTrack combines daily learning logs, rich media attachments, short-note generation, and a built-in revision system — all protected behind a secure JWT-based authentication system.

This document is the complete Product Requirements Document (PRD) for LearnTrack. It covers every aspect of the system — from user authentication through to the revision checklist flow — in enough detail that a beginner developer can build the entire application confidently, following the DAO (Data Access Object) design pattern throughout the codebase.

| Field | Value |
|---|---|
| Product Name | LearnTrack |
| Document Type | Product Requirements Document (PRD) v1.0 |
| Tech Stack | Spring Boot (Java), React JS (JavaScript), MySQL |
| Deployment | Backend — GitHub + Railway / Render · Frontend — Netlify |
| Auth Mechanism | JWT (JSON Web Tokens) — Stateless Authentication |
| Design Pattern | DAO (Data Access Object) — throughout backend |
| Code Philosophy | Beginner-Friendly, Clean, Readable, Well-Commented |
| Status | Ready for Development |

---

## 2. Project Overview

### 2.1 Problem Statement

Learners who study new topics — whether programming, design, languages, or any other discipline — often struggle to organize their daily progress. Notes get scattered across different apps, references are lost, and there is no easy way to go back and revise what was learned. Existing tools are either too complex, too generic, or do not combine note-taking with structured revision workflows in one place.

### 2.2 Solution

LearnTrack provides a dedicated platform where a learner can:

- Create named **Learning Journeys** (e.g., "Learning React JS", "Python for Data Science")
- Log **daily learning entries** with rich content (text, images, documents, YouTube links, reference URLs)
- Generate bite-sized **Short Notes** from each day's session using a quick-enter interface
- **Revise** all accumulated short notes from Day 1 onwards through a checklist-based revision flow
- Track revision progress with **automatic day-by-day progression**

### 2.3 Target Users

| User Type | Description |
|---|---|
| Self-Learners | Individuals learning new skills independently through online courses, books, or documentation |
| Students | College or school students tracking coursework and study sessions |
| Professionals | Working professionals upskilling in new technologies or domains |
| Bootcamp Participants | Coding bootcamp or training program participants tracking daily modules |

### 2.4 Key Design Principles

1. **Beginner-Friendly Code** — Every class, method, and function must be simple, well-commented, and easy to read for a junior developer.
2. **DAO Design Pattern** — All database interactions must go through DAO interfaces and their implementations. No direct database calls from Service or Controller layers.
3. **Separation of Concerns** — Controller → Service → DAO → Database. Each layer has one clear responsibility.
4. **REST API Design** — All backend endpoints follow standard REST conventions with proper HTTP status codes.
5. **JWT Stateless Auth** — No session storage on the server. All authentication state lives in the JWT token carried by the client.
6. **JavaScript-Only Frontend** — The entire frontend is written in plain JavaScript-based React JS — no TypeScript.

---

## 3. Technology Stack

### 3.1 Backend

| Technology | Version / Details | Purpose |
|---|---|---|
| Java | Java 17 (LTS) | Core programming language for the backend |
| Spring Boot | 3.x | Application framework — auto-configuration, embedded server |
| Spring Security | 6.x | Authentication and authorization framework |
| Spring Data JPA | 3.x | ORM layer (Hibernate under the hood) |
| MySQL | 8.x | Relational database for all persistent data |
| JJWT Library | 0.11.x | JWT token creation, signing, and validation |
| Maven | Latest | Dependency management and build tool |
| Lombok | Latest | Reduces boilerplate (getters, setters, constructors) |

### 3.2 Frontend

| Technology | Version / Details | Purpose |
|---|---|---|
| React JS | 18.x | Core UI library (JavaScript only — no TypeScript) |
| React Router DOM | 6.x | Client-side routing between pages |
| Axios | Latest | HTTP client for calling the Spring Boot REST API |
| Context API | Built-in React | Global state management (auth token, user info) |
| CSS Modules / Plain CSS | Native | Component-level styling without external UI libraries |

### 3.3 DevOps & Deployment

| Tool / Platform | Usage | Notes |
|---|---|---|
| GitHub | Source code repository | All code pushed here — acts as the single source of truth |
| Netlify | Frontend deployment | Auto-deploys from GitHub on every push to main branch |
| Railway / Render | Backend deployment | Free-tier Java Spring Boot hosting with MySQL add-on |
| MySQL (Cloud) | Production database | Provisioned via Railway or PlanetScale |
| .env Files | Environment configuration | API keys, DB credentials, JWT secret kept out of code |

---

## 4. System Architecture

### 4.1 High-Level Architecture

LearnTrack follows a classic three-tier architecture:

```
┌─────────────────────────────────────────────────────────┐
│  TIER 1 — Presentation Layer (Frontend)                 │
│    • React JS Single Page Application (SPA)             │
│    • Runs in the user's browser                         │
│    • Hosted on Netlify                                  │
│    • Communicates with backend via HTTP REST API calls  │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP / JSON (Axios)
┌──────────────────────▼──────────────────────────────────┐
│  TIER 2 — Application Layer (Backend)                   │
│    • Spring Boot REST API                               │
│    • Handles business logic, authentication, processing │
│    • Exposes JSON endpoints consumed by the frontend    │
│    • Hosted on Railway / Render                         │
└──────────────────────┬──────────────────────────────────┘
                       │  JDBC / JPA
┌──────────────────────▼──────────────────────────────────┐
│  TIER 3 — Data Layer (Database)                         │
│    • MySQL Relational Database                          │
│    • Stores all users, journeys, logs, notes            │
│    • Accessed only through the Spring Boot DAO layer    │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Backend Layer Architecture (DAO Pattern)

The backend strictly follows the DAO (Data Access Object) design pattern:

```
HTTP Request (from React frontend)
       │
       ▼
[1] CONTROLLER LAYER   — Receives HTTP request, validates input, calls Service
       │                  Example: UserController, JourneyController, LogController
       ▼
[2] SERVICE LAYER      — Contains all business logic, calls DAO for data
       │                  Example: UserService, JourneyService, LogService
       ▼
[3] DAO LAYER          — Interface + Implementation. Handles DB operations only
       │                  Example: UserDAO (interface), UserDAOImpl (class)
       ▼
[4] REPOSITORY LAYER   — Spring Data JPA Repository (extends JpaRepository)
       │                  Example: UserRepository, JourneyRepository
       ▼
[5] DATABASE           — MySQL tables
```

### 4.3 Project Folder Structure

#### 4.3.1 Backend — Spring Boot

```
learntrack-backend/
├── src/main/java/com/learntrack/
│   ├── config/
│   │   ├── SecurityConfig.java        ← Spring Security config + JWT filter
│   │   └── CorsConfig.java            ← Allows frontend to call backend
│   ├── controller/
│   │   ├── AuthController.java        ← /api/auth/register, /api/auth/login
│   │   ├── JourneyController.java     ← CRUD for Learning Journeys
│   │   ├── LogController.java         ← CRUD for Daily Logs
│   │   ├── ShortNoteController.java   ← CRUD for Short Notes
│   │   └── AttachmentController.java  ← File/link attachments
│   ├── model/
│   │   ├── User.java                  ← JPA Entity
│   │   ├── LearningJourney.java       ← JPA Entity
│   │   ├── DailyLog.java              ← JPA Entity
│   │   ├── ShortNote.java             ← JPA Entity
│   │   └── Attachment.java            ← JPA Entity
│   ├── dao/
│   │   ├── UserDAO.java               ← Interface
│   │   ├── UserDAOImpl.java           ← Implementation
│   │   ├── JourneyDAO.java            ← Interface
│   │   ├── JourneyDAOImpl.java        ← Implementation
│   │   ├── LogDAO.java                ← Interface
│   │   ├── LogDAOImpl.java            ← Implementation
│   │   ├── ShortNoteDAO.java          ← Interface
│   │   ├── ShortNoteDAOImpl.java      ← Implementation
│   │   ├── AttachmentDAO.java         ← Interface
│   │   └── AttachmentDAOImpl.java     ← Implementation
│   ├── repository/
│   │   ├── UserRepository.java        ← extends JpaRepository<User, Long>
│   │   ├── JourneyRepository.java
│   │   ├── LogRepository.java
│   │   ├── ShortNoteRepository.java
│   │   └── AttachmentRepository.java
│   ├── service/
│   │   ├── UserService.java
│   │   ├── JourneyService.java
│   │   ├── LogService.java
│   │   ├── ShortNoteService.java
│   │   └── AttachmentService.java
│   ├── dto/
│   │   ├── RegisterRequest.java       ← Request body for registration
│   │   ├── LoginRequest.java          ← Request body for login
│   │   ├── AuthResponse.java          ← Response with JWT token
│   │   ├── JourneyRequest.java
│   │   └── LogRequest.java
│   └── util/
│       └── JwtUtil.java               ← JWT generation, parsing, validation
└── src/main/resources/
    └── application.properties         ← DB URL, JWT secret, server port
```

#### 4.3.2 Frontend — React JS

```
learntrack-frontend/
├── public/
│   └── index.html
├── src/
│   ├── api/
│   │   └── axiosConfig.js             ← Axios base URL + auth header interceptor
│   ├── context/
│   │   └── AuthContext.js             ← Global auth state (token, user, login, logout)
│   ├── components/
│   │   ├── Navbar.js                  ← Top navigation bar
│   │   ├── JourneyCard.js             ← Card for each learning journey on home page
│   │   ├── LogCard.js                 ← Card for each daily log entry
│   │   ├── ShortNoteItem.js           ← Individual short note row
│   │   ├── AttachmentUploader.js      ← File, image, link, YouTube attachment
│   │   └── ProtectedRoute.js          ← Redirect to login if not authenticated
│   ├── pages/
│   │   ├── LoginPage.js               ← Login form
│   │   ├── RegisterPage.js            ← Registration form
│   │   ├── HomePage.js                ← Landing page: list all journeys
│   │   ├── CreateJourneyPage.js       ← Form to create a new journey
│   │   ├── JourneyDetailPage.js       ← List of daily logs for a journey
│   │   ├── CreateLogPage.js           ← Form to create/edit a daily log
│   │   └── RevisionPage.js            ← Revision checklist across all days
│   ├── App.js                         ← Root component with Router + Routes
│   └── index.js                       ← ReactDOM.createRoot entry point
├── .env                               ← REACT_APP_API_BASE_URL
└── package.json
```

---

## 5. Database Design

### 5.1 Entity Relationship Overview

```
users
  └── (one-to-many) ──► learning_journeys
                              └── (one-to-many) ──► daily_logs
                                                        ├── (one-to-many) ──► short_notes
                                                        └── (one-to-many) ──► attachments
```

### 5.2 Table: `users`

| Column | Data Type | Description |
|---|---|---|
| id | BIGINT, PK, AUTO_INCREMENT | Unique identifier for each user |
| username | VARCHAR(50), UNIQUE, NOT NULL | The login username chosen by the user |
| email | VARCHAR(100), UNIQUE, NOT NULL | User's email address |
| password | VARCHAR(255), NOT NULL | BCrypt hashed password (never store plain text) |
| full_name | VARCHAR(100) | User's display name |
| created_at | DATETIME, DEFAULT NOW() | Timestamp when the account was created |

### 5.3 Table: `learning_journeys`

| Column | Data Type | Description |
|---|---|---|
| id | BIGINT, PK, AUTO_INCREMENT | Unique identifier for the journey |
| user_id | BIGINT, FK → users.id | Owner of this learning journey |
| name | VARCHAR(150), NOT NULL | Name of the journey (e.g., 'Learning React JS') |
| description | TEXT | Brief description of what the user is learning |
| created_at | DATETIME, DEFAULT NOW() | When the journey was created |
| updated_at | DATETIME | Last updated timestamp |

### 5.4 Table: `daily_logs`

| Column | Data Type | Description |
|---|---|---|
| id | BIGINT, PK, AUTO_INCREMENT | Unique identifier for each log entry |
| journey_id | BIGINT, FK → learning_journeys.id | Journey this log belongs to |
| day_number | INT, NOT NULL | Sequential day number (Day 1, Day 2, ...) |
| log_date | DATE, NOT NULL | The actual calendar date of the log |
| description | TEXT | Detailed description of what was learned that day |
| created_at | DATETIME, DEFAULT NOW() | When this log entry was created |

### 5.5 Table: `short_notes`

| Column | Data Type | Description |
|---|---|---|
| id | BIGINT, PK, AUTO_INCREMENT | Unique identifier |
| log_id | BIGINT, FK → daily_logs.id | The daily log this note belongs to |
| content | TEXT, NOT NULL | The text content of the short note |
| is_revised | BOOLEAN, DEFAULT FALSE | Whether this note has been marked as revised |
| display_order | INT | Order in which this note appears in the list |
| created_at | DATETIME, DEFAULT NOW() | When the note was added |

### 5.6 Table: `attachments`

| Column | Data Type | Description |
|---|---|---|
| id | BIGINT, PK, AUTO_INCREMENT | Unique identifier |
| log_id | BIGINT, FK → daily_logs.id | The daily log this attachment belongs to |
| attachment_type | ENUM('FILE','IMAGE','LINK','YOUTUBE') | What kind of attachment this is |
| file_name | VARCHAR(255) | Original file name (for FILE and IMAGE types) |
| file_url | TEXT | URL or file path where the attachment is stored |
| link_url | TEXT | The URL (for LINK and YOUTUBE types) |
| created_at | DATETIME, DEFAULT NOW() | When the attachment was added |

---

## 6. Authentication System

### 6.1 Overview

LearnTrack uses **JWT (JSON Web Token)** based stateless authentication. This means the server does not maintain any session state. After a successful login, the server issues a JWT token. The client (React app) stores this token and sends it with every subsequent API request in the `Authorization` header.

### 6.2 Registration Flow

```
Step 1:  User fills out the Register form (Full Name, Username, Email, Password, Confirm Password)
Step 2:  Frontend validates that Password and Confirm Password match
Step 3:  Frontend sends POST /api/auth/register with the user data as JSON
Step 4:  Backend AuthController receives the RegisterRequest DTO
Step 5:  UserService checks if username or email already exists in the database
Step 6:  If duplicate found, return 400 Bad Request with error message
Step 7:  If no duplicate, hash the password using BCryptPasswordEncoder
Step 8:  UserDAOImpl saves the new User entity to the users table
Step 9:  Backend returns 201 Created with a success message
Step 10: Frontend redirects the user to the Login page
```

### 6.3 Login Flow

```
Step 1:  User fills out the Login form (Username, Password)
Step 2:  Frontend sends POST /api/auth/login with LoginRequest DTO
Step 3:  Backend AuthController passes credentials to UserService
Step 4:  UserService uses Spring Security AuthenticationManager to authenticate
Step 5:  If credentials are wrong, return 401 Unauthorized
Step 6:  If correct, JwtUtil generates a signed JWT token
         Token payload includes: username, user ID, issued-at, expiry (24 hours)
Step 7:  Backend returns 200 OK with AuthResponse { token, username, userId }
Step 8:  Frontend stores token in localStorage
Step 9:  AuthContext updates global state with user info
Step 10: User is redirected to the Home Page
```

### 6.4 JWT Token Usage

Every protected API call from the frontend must include the JWT in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The Axios interceptor in `axiosConfig.js` automatically attaches this header to every outgoing request if a token exists in `localStorage`.

### 6.5 JWT Filter (Backend)

A custom `JwtAuthFilter` (extends `OncePerRequestFilter`) intercepts every request. It:

1. Reads the `Authorization` header
2. Extracts and validates the JWT token using `JwtUtil`
3. If valid, sets the authenticated user in the Spring Security context
4. If invalid or missing, the request is rejected with 401 for protected endpoints

### 6.6 Password Rules

- Minimum 6 characters
- Must be confirmed before submission (Confirm Password field)
- Stored as BCrypt hash — never stored in plain text
- Password reset functionality is out of scope for v1.0

### 6.7 Logout

Since JWT is stateless, logout is handled entirely on the frontend. The React app clears the token from `localStorage` and resets the `AuthContext` state. The user is redirected to the Login page.

---

## 7. REST API Endpoints

### 7.1 Authentication Endpoints

| Method + URL | Request Body | Response |
|---|---|---|
| POST /api/auth/register | `{ fullName, username, email, password }` | 201 Created \| 400 if duplicate |
| POST /api/auth/login | `{ username, password }` | 200 OK `{ token, username, userId }` |

### 7.2 Learning Journey Endpoints

> All endpoints below require `Authorization: Bearer {token}` header.

| Method + URL | Description | Response |
|---|---|---|
| GET /api/journeys | Get all journeys for the logged-in user | 200 OK `[ list of journeys ]` |
| POST /api/journeys | Create a new learning journey | 201 Created `{ journey object }` |
| GET /api/journeys/{id} | Get a single journey by its ID | 200 OK `{ journey }` \| 404 |
| PUT /api/journeys/{id} | Update journey name or description | 200 OK `{ updated journey }` |
| DELETE /api/journeys/{id} | Delete a journey and all its logs/notes | 204 No Content |

### 7.3 Daily Log Endpoints

| Method + URL | Description | Response |
|---|---|---|
| GET /api/journeys/{journeyId}/logs | Get all daily logs for a journey | 200 OK `[ list of logs ]` |
| POST /api/journeys/{journeyId}/logs | Create a new daily log entry | 201 Created `{ log object }` |
| GET /api/logs/{logId} | Get a single log with all its short notes and attachments | 200 OK `{ log }` |
| PUT /api/logs/{logId} | Update a log's description | 200 OK `{ updated log }` |
| DELETE /api/logs/{logId} | Delete a log and its notes/attachments | 204 No Content |

### 7.4 Short Note Endpoints

| Method + URL | Description | Response |
|---|---|---|
| GET /api/logs/{logId}/notes | Get all short notes for a log | 200 OK `[ list of notes ]` |
| POST /api/logs/{logId}/notes | Add a new short note to a log | 201 Created `{ note }` |
| PUT /api/notes/{noteId} | Update note content | 200 OK `{ updated note }` |
| PATCH /api/notes/{noteId}/revise | Toggle the `is_revised` status of a note | 200 OK `{ updated note }` |
| DELETE /api/notes/{noteId} | Delete a short note | 204 No Content |

### 7.5 Attachment Endpoints

| Method + URL | Description | Response |
|---|---|---|
| GET /api/logs/{logId}/attachments | Get all attachments for a log | 200 OK `[ list ]` |
| POST /api/logs/{logId}/attachments | Add an attachment (link, YouTube URL, or file metadata) | 201 Created `{ attachment }` |
| DELETE /api/attachments/{attachmentId} | Delete an attachment | 204 No Content |

### 7.6 Revision Endpoint

| Method + URL | Description | Response |
|---|---|---|
| GET /api/journeys/{journeyId}/revision | Get all short notes grouped by day for revision | 200 OK `{ dayGroups: [ { dayNumber, logDate, notes: [...] } ] }` |

---

## 8. Feature Requirements

### 8.1 Authentication Module

#### 8.1.1 Register Page

**Route:** `/register` | **Access:** Public (redirect to `/home` if already logged in)

**Fields:**
- Full Name (text input, required)
- Username (text input, required, 3–50 characters, no spaces)
- Email (email input, required, valid email format)
- Password (password input, required, min 6 characters)
- Confirm Password (password input, required, must match password)

**Behaviors:**
- Show inline validation errors before submission
- Disable submit button while request is in progress
- Show loading spinner inside the button during API call
- On success: show brief success message and redirect to `/login` after 1.5 seconds
- On failure: show server-returned error below the form
- Link to Login page: *"Already have an account? Login"*

---

#### 8.1.2 Login Page

**Route:** `/login` | **Access:** Public (redirect to `/home` if already logged in)

**Fields:**
- Username (text input, required)
- Password (password input, required)

**Behaviors:**
- On success: store token in `localStorage`, update `AuthContext`, redirect to `/home`
- On failure: show *"Invalid username or password"* error message
- Show loading spinner inside button during API call
- Link to Register page: *"Don't have an account? Register"*
- Show/hide password toggle button

---

### 8.2 Home Page — Learning Journey Dashboard

**Route:** `/home` | **Access:** Protected (must be logged in)

#### 8.2.1 Layout

- Top: Navbar with app logo/name on the left, username and logout button on the right
- Hero/greeting section: *"Welcome back, [Full Name]"*
- Section title: *"My Learning Journeys"*
- Grid or card list of all the user's learning journeys
- Prominent **"+ Create New Journey"** button (top right or floating button)

#### 8.2.2 Journey Card

Each learning journey is displayed as a card with:

- Journey Name (large, bold)
- Description (truncated to 2 lines with `...` if longer)
- Number of days logged (e.g., *"12 Days Logged"*)
- Created date
- Two action buttons: **"Learning Process"** and **"Revision"**
- Edit icon (pencil) and Delete icon (trash) on the card

#### 8.2.3 "Learning Process" Button

Clicking this navigates to `/journey/{id}/logs` — the Journey Detail Page showing all daily logs.

#### 8.2.4 "Revision" Button

Clicking this navigates to `/journey/{id}/revision` — the Revision Page with all short notes as a checklist.

#### 8.2.5 Empty State

If the user has no journeys yet, show a friendly empty state with the message:

> *"No learning journeys yet. Start your first one!"*

and the **"Create New Journey"** button.

---

### 8.3 Create New Journey Page

**Route:** `/journey/create` | **Access:** Protected

- **Field 1 — Journey Name:** Text input, required, max 150 characters
- **Field 2 — Description:** Textarea, optional, describes what the user plans to learn
- **"Create Journey"** button: Submits to `POST /api/journeys`
- **"Cancel"** button: Goes back to `/home`
- On success: Redirect immediately to `/journey/{id}/logs` for the newly created journey

---

### 8.4 Journey Detail Page — Daily Logs

**Route:** `/journey/{id}/logs` | **Access:** Protected

#### 8.4.1 Page Header

- Journey name as the page title
- Journey description below the title
- Back button to go to `/home`
- **"Add Today's Log"** button (prominent, top right)

#### 8.4.2 Daily Log List

Each daily log entry is displayed as a card:

- Day label: *"Day 1"*, *"Day 2"*, etc.
- Log date in readable format (e.g., *"Monday, 5 May 2026"*)
- Preview of the description (first 3 lines)
- Count of short notes: *"8 Short Notes"*
- Count of attachments: *"3 Attachments"*
- **"View / Edit"** button to open the full log
- Delete log button (with confirmation dialog)

#### 8.4.3 Empty State

If no logs exist yet, show:

> *"No days logged yet. Click "Add Today's Log" to start your Day 1!"*

---

### 8.5 Create / View Log Page

**Route:** `/journey/{id}/logs/{logId}` or `/journey/{id}/logs/new` | **Access:** Protected

#### 8.5.1 Log Header

- Day number and date auto-assigned (Day N = count of existing logs + 1, Date = today)
- Editable description textarea: *"What did you learn today? Write in detail..."*

#### 8.5.2 Attachments Section

Users can attach the following types of content to a daily log:

| Attachment Type | How It Works |
|---|---|
| Reference Document (PDF/DOC) | File upload input. File is uploaded to the server or a cloud storage URL is saved. File name is displayed with a download/view link. |
| Image | Image file upload. Displayed as a thumbnail in the log. Clicking opens a larger preview. |
| Reference Link / URL | Text input for any web URL. Saved with the link URL. Displayed as a clickable hyperlink. |
| YouTube Video Link | Text input for a YouTube URL. The video is embedded directly in the log using an `<iframe>` with the YouTube embed URL. |

Each attachment shows a delete (✕) button to remove it. Attachments are saved to the database via `POST /api/logs/{logId}/attachments`.

#### 8.5.3 Short Notes Section

This is the most important interactive feature of the log page.

```
How Short Notes Work:
─────────────────────────────────────────────────────────────
1. Below the description, there is a text input:
   "Type a short note and press Enter..."

2. The user types a concise point they want to remember.

3. When the user presses the Enter key, the note is instantly:
   a. Sent to POST /api/logs/{logId}/notes via Axios
   b. Added to the list of short notes below the input
   c. The input field is cleared and ready for the next note

4. The list of short notes is displayed below the input.

5. Each note in the list shows:
   a. The note content text
   b. An Edit icon (allows inline editing of the note)
   c. A Delete icon (removes the note after confirmation)
─────────────────────────────────────────────────────────────
```

#### 8.5.4 Save & Navigation

- **"Save Log"** button saves the description (attachments and notes are saved individually in real-time)
- **"Back to Journey"** link navigates back to `/journey/{id}/logs`

---

### 8.6 Revision Page

**Route:** `/journey/{id}/revision` | **Access:** Protected

#### 8.6.1 Purpose

The revision page is the learning reinforcement engine of LearnTrack. It shows all short notes created across all daily logs — from Day 1 onwards — as an interactive checklist. The user goes through each note, and upon marking it as "done", the note gets a strikethrough style.

#### 8.6.2 Data Fetching

On load, the page calls `GET /api/journeys/{journeyId}/revision` which returns all short notes grouped by day:

```json
{
  "dayGroups": [
    {
      "dayNumber": 1,
      "logDate": "2026-05-01",
      "notes": [
        { "id": 1, "content": "React useState is for local state", "isRevised": false },
        { "id": 2, "content": "useEffect runs after render", "isRevised": false }
      ]
    },
    {
      "dayNumber": 2,
      "logDate": "2026-05-02",
      "notes": [ ... ]
    }
  ]
}
```

#### 8.6.3 Revision Flow — Day-by-Day Progression

```
Step 1:  On page load, only Day 1's short notes are shown (expanded).
         All other days (Day 2, Day 3, ...) are hidden/collapsed.

Step 2:  The user reads each short note and checks the checkbox next to it.
         When a checkbox is checked:
           a. The note text gets a strikethrough style
           b. The note becomes visually greyed out
           c. A PATCH /api/notes/{noteId}/revise API call updates isRevised to true

Step 3:  The user UNCHECKS to de-revise a note (toggle behavior).
         This updates isRevised back to false.

Step 4:  Once ALL notes for Day 1 are checked (all isRevised = true),
         Day 2 automatically appears/expands below Day 1.

Step 5:  The user then goes through Day 2's notes the same way.
         Once all Day 2 notes are checked, Day 3 appears.

Step 6:  This progression continues until all days are completed.

Step 7:  When all notes across all days are revised, show a
         completion banner: "Great job! You have revised all your notes! 🎉"

IMPORTANT: Previously revised notes (from a past session) remember their
state because isRevised is persisted in the database.
```

#### 8.6.4 Visual Design of Revision Page

- Each day is a collapsible section with a header: *"Day 1 — May 1, 2026 (12 notes)"*
- Currently active day is expanded; completed days remain visible but collapsed
- Each note row: `[ Checkbox ]  [ Note Content ]` — when checked, content gets strikethrough
- Progress indicator at top: *"24 / 46 notes revised"*
- **"Reset All"** button: unchecks all notes for this journey (with confirmation)

---

### 8.7 Navigation & Routing Summary

| Route | Component / Page |
|---|---|
| `/` | Redirect to `/login` if not authenticated, else `/home` |
| `/login` | LoginPage.js |
| `/register` | RegisterPage.js |
| `/home` | HomePage.js (Protected) |
| `/journey/create` | CreateJourneyPage.js (Protected) |
| `/journey/:id/logs` | JourneyDetailPage.js (Protected) |
| `/journey/:id/logs/new` | CreateLogPage.js (Protected) |
| `/journey/:id/logs/:logId` | CreateLogPage.js in edit mode (Protected) |
| `/journey/:id/revision` | RevisionPage.js (Protected) |

---

## 9. Frontend Component Specifications

### 9.1 AuthContext.js

```
Purpose: Provides global authentication state to the entire React app.

State Variables:
  - token        : string | null   — The JWT token from localStorage
  - user         : object | null   — { userId, username }
  - isLoggedIn   : boolean         — true if token exists and is valid

Functions:
  - login(token, user)  : Saves token to localStorage, updates state
  - logout()            : Clears localStorage, resets state, redirects to /login

Usage in components:
  const { isLoggedIn, user, login, logout } = useContext(AuthContext);
```

### 9.2 axiosConfig.js

```
Purpose: Creates a pre-configured Axios instance with the base API URL
and an interceptor that automatically adds the JWT token to every request.

Base URL: process.env.REACT_APP_API_BASE_URL (from .env file)
         Example: http://localhost:8080

Request Interceptor:
  - Before every request, reads the token from localStorage
  - If token exists, adds: Authorization: Bearer {token}
  - If no token, request is sent without the header (for public endpoints)

Usage:
  import api from '../api/axiosConfig';
  api.get('/api/journeys').then(res => ...).catch(err => ...);
```

### 9.3 ProtectedRoute.js

```
Purpose: Wraps any React Router <Route> that requires authentication.
If the user is not logged in, redirect them to /login.

Logic:
  const { isLoggedIn } = useContext(AuthContext);
  if (!isLoggedIn) return <Navigate to='/login' />;
  return children;

Usage in App.js:
  <Route path='/home' element={
    <ProtectedRoute>
      <HomePage />
    </ProtectedRoute>
  } />
```

---

## 10. Backend Implementation Specifications

### 10.1 DAO Pattern — Detailed Explanation

The DAO (Data Access Object) pattern separates data access logic from business logic. Here is the complete structure for every DAO in LearnTrack:

**Step 1: Create the Repository interface (extends JpaRepository)**

```java
// UserRepository.java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
}
```

**Step 2: Create the DAO interface**

```java
// UserDAO.java
public interface UserDAO {
    User saveUser(User user);
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
}
```

**Step 3: Create the DAO implementation**

```java
// UserDAOImpl.java
@Repository
public class UserDAOImpl implements UserDAO {

    @Autowired
    private UserRepository userRepository;

    @Override
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}
```

**Step 4: Inject DAO into the Service**

```java
// UserService.java
@Service
public class UserService {

    @Autowired
    private UserDAO userDAO;  // Always inject the INTERFACE, not the impl

    // ... business logic methods go here
}
```

> **Rule:** Controllers call Services. Services call DAOs. DAOs call Repositories. Never skip a layer.

---

### 10.2 JWT Implementation

**JwtUtil.java — Key Methods:**

```
generateToken(String username, Long userId)
  → Creates a signed JWT token with claims (username, userId)
  → Token expiry: 24 hours (86400000 milliseconds)
  → Algorithm: HMAC-SHA256
  → Secret: Stored in application.properties as jwt.secret

extractUsername(String token)
  → Parses the JWT and returns the subject (username)

isTokenValid(String token, UserDetails userDetails)
  → Checks if the username in the token matches and token is not expired

extractExpiration(String token)
  → Returns the expiry date from the token claims
```

---

### 10.3 application.properties Configuration

```properties
# ── Database ──────────────────────────────────────────────
spring.datasource.url=jdbc:mysql://localhost:3306/learntrack_db
spring.datasource.username=root
spring.datasource.password=yourpassword
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# ── JPA / Hibernate ───────────────────────────────────────
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# ── JWT ───────────────────────────────────────────────────
jwt.secret=learntrack_super_secret_key_change_in_production
jwt.expiration=86400000

# ── Server ────────────────────────────────────────────────
server.port=8080

# ── File Upload ───────────────────────────────────────────
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

---

### 10.4 CORS Configuration

Since the React frontend (on Netlify) and the Spring Boot backend (on Railway) are on different domains, CORS must be explicitly configured on the backend.

**CorsConfig.java — Key Settings:**

```
Allowed Origins  : [http://localhost:3000, https://learntrack.netlify.app]
Allowed Methods  : GET, POST, PUT, DELETE, PATCH, OPTIONS
Allowed Headers  : Authorization, Content-Type
Allow Credentials: true
```

---

## 11. Deployment Guide

### 11.1 GitHub Repository Setup

1. Create two repositories on GitHub:
   - `learntrack-backend` (Spring Boot project)
   - `learntrack-frontend` (React JS project)
2. Use `.gitignore` to exclude:
   - Backend: `target/`, `.env`, `application-prod.properties`
   - Frontend: `node_modules/`, `.env`, `build/`
3. Use meaningful commit messages: `feat: add JWT authentication`, `fix: correct CORS headers`

### 11.2 Frontend Deployment — Netlify

1. Push the React app to the `learntrack-frontend` GitHub repo
2. Go to Netlify → *"Add New Site"* → *"Import from GitHub"*
3. Select the `learntrack-frontend` repo
4. Configure build settings:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `build`
5. Add Environment Variable in Netlify dashboard:
   - `REACT_APP_API_BASE_URL` = `https://your-backend-url.railway.app`
6. Add a `_redirects` file in the `public` folder for React Router SPA support:
   ```
   /*   /index.html   200
   ```
7. Every push to the `main` branch auto-deploys to Netlify

### 11.3 Backend Deployment — Railway

1. Push the Spring Boot project to `learntrack-backend` on GitHub
2. Go to Railway.app → *"New Project"* → *"Deploy from GitHub repo"*
3. Railway auto-detects a Java Maven project and builds it
4. Add a **MySQL plugin** in Railway — Railway provides the MySQL connection string
5. Set Environment Variables in Railway:
   - `SPRING_DATASOURCE_URL` = `jdbc:mysql://...(from Railway MySQL plugin)`
   - `SPRING_DATASOURCE_USERNAME` = (from Railway)
   - `SPRING_DATASOURCE_PASSWORD` = (from Railway)
   - `JWT_SECRET` = (a long random secure string)
6. Railway will assign a public URL like `https://learntrack-api.up.railway.app`
7. Update the Netlify `REACT_APP_API_BASE_URL` with this Railway URL

---

## 12. Security Considerations

### 12.1 Authentication Security

| Security Concern | How LearnTrack Handles It |
|---|---|
| Password Storage | BCrypt hashing with salt. Never stored in plain text. |
| JWT Secret | Stored as environment variable, never in code or Git. |
| Token Expiry | JWT tokens expire in 24 hours. User must re-login. |
| Protected Routes (Backend) | Spring Security filters reject requests without valid JWT. |
| Protected Routes (Frontend) | ProtectedRoute component redirects to /login. |

### 12.2 Data Security

| Security Concern | How LearnTrack Handles It |
|---|---|
| User Data Isolation | Every query filters by user_id. User A cannot access User B's journeys. |
| SQL Injection | Spring Data JPA uses parameterized queries. Raw SQL is never used. |
| CORS Policy | Only the Netlify frontend URL is allowed. All other origins are blocked. |
| File Upload Safety | File size limited to 10MB. File type validation to prevent malicious uploads. |
| HTTPS | Both Netlify and Railway provide HTTPS. Never deploy over plain HTTP. |

### 12.3 Input Validation

- All backend endpoints validate incoming request bodies using `@Valid` annotations and Bean Validation constraints
- Frontend validates forms before submission (required fields, length limits, format checks)
- Empty or null short notes are rejected by both frontend and backend

---

## 13. UI/UX Guidelines

### 13.1 Design Philosophy

The UI should feel clean, modern, and focused — similar to NotebookLM. The primary goal is to keep the user's attention on their learning content, not on the interface. Use plenty of white space, readable typography, and clear visual hierarchy.

### 13.2 Color Palette

| Usage | Color / Hex |
|---|---|
| Primary (buttons, links, active states) | `#1A56DB` (Blue) |
| Background (page) | `#F8FAFC` (Off-white) |
| Card Background | `#FFFFFF` (White) |
| Text (primary) | `#1E293B` (Dark Slate) |
| Text (secondary) | `#64748B` (Gray) |
| Border / Divider | `#E2E8F0` (Light Gray) |
| Success | `#16A34A` (Green) |
| Error / Danger | `#DC2626` (Red) |
| Revised note (strikethrough) | `#94A3B8` (Muted Gray) |

### 13.3 Typography

- **Font Family:** `'Inter'`, `system-ui`, `sans-serif` (use Google Fonts)
- **Heading 1** (page titles): 28–32px, bold
- **Heading 2** (section headers): 20–24px, semibold
- **Body text:** 15–16px, regular
- **Small / label text:** 12–13px, medium

### 13.4 Responsive Design

- The application should be usable on both desktop and tablet screens
- Journey cards: 3 columns on desktop, 2 on tablet, 1 on mobile
- Log detail page: single column layout, full-width textarea
- Navigation: hamburger menu on mobile screens

### 13.5 Loading & Error States

- Every API call must show a loading state (spinner or skeleton)
- Every API call must handle errors and display a user-friendly error message
- Use toast notifications (small popup at bottom-right) for success/error feedback
- Skeleton loading cards on the Home Page while journeys are being fetched

---

## 14. Error Handling

### 14.1 Backend Error Response Format

All backend errors return a consistent JSON structure:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Username already exists",
  "timestamp": "2026-05-06T10:30:00Z"
}
```

**HTTP Status Codes Used:**

| Code | Meaning | When Used |
|---|---|---|
| 200 OK | Success | Successful GET, PUT, PATCH |
| 201 Created | New resource created | Successful POST |
| 204 No Content | Success, no body | Successful DELETE |
| 400 Bad Request | Validation error | Duplicate data, missing fields |
| 401 Unauthorized | Auth failed | Missing or invalid JWT token |
| 403 Forbidden | Not authorized | Authenticated but wrong user's data |
| 404 Not Found | Resource missing | Resource does not exist |
| 500 Server Error | Unexpected error | Unhandled server-side exceptions |

### 14.2 Global Exception Handler

A `@ControllerAdvice` class (`GlobalExceptionHandler.java`) handles all exceptions thrown anywhere in the backend and converts them to the standard error response format. This keeps error handling in one place and avoids duplicating try-catch blocks in controllers.

---

## 15. Testing Strategy

### 15.1 Backend Testing

| Test Type | Details |
|---|---|
| Unit Tests | Test each Service class in isolation using JUnit 5 and Mockito to mock the DAO layer. |
| Integration Tests | Use Spring Boot Test + H2 in-memory database to test the full request flow from Controller to DB. |
| API Testing (Manual) | Use Postman or a `.http` file to manually test all REST endpoints during development. |

### 15.2 Frontend Testing

| Test Type | Details |
|---|---|
| Manual Testing | Test all user flows in the browser during development (primary approach for v1.0). |
| Console Logging | Add `console.log` statements during development to trace API responses. Remove before deployment. |
| Error Boundary | Wrap key components in React Error Boundaries to prevent full page crashes from component errors. |

### 15.3 Pre-Deployment Checklist

- [ ] All API endpoints tested via Postman with valid and invalid inputs
- [ ] Registration and Login flow tested end-to-end
- [ ] JWT token correctly attached to all protected requests
- [ ] CORS works correctly between Netlify URL and Railway URL
- [ ] Journey CRUD operations tested
- [ ] Daily log CRUD operations tested
- [ ] Short note add/delete/strikethrough flow tested
- [ ] Attachment upload for all four types tested
- [ ] Revision page flow tested: Day 1 → completion → Day 2 unlock
- [ ] All error states display correctly (network errors, 401, 404, 500)
- [ ] Environment variables verified in both Netlify and Railway dashboards

---

## 16. Implementation Roadmap

### 16.1 Development Phases

| Phase | Duration | Tasks |
|---|---|---|
| Phase 1: Project Setup | Days 1–2 | Create GitHub repos. Initialize Spring Boot with Maven. Initialize React app. Set up MySQL locally. Connect Spring Boot to MySQL. |
| Phase 2: Authentication | Days 3–5 | User entity, UserRepository, UserDAO, UserService. AuthController (/register, /login). JwtUtil + JwtAuthFilter + SecurityConfig. Build Login + Register pages. Implement AuthContext + axiosConfig. |
| Phase 3: Journey & Log CRUD | Days 6–9 | LearningJourney + DailyLog entities, DAOs, Services, Controllers. Build HomePage, JourneyDetailPage, CreateJourneyPage, CreateLogPage. |
| Phase 4: Short Notes & Attachments | Days 10–12 | ShortNote + Attachment entities, DAOs, Services, Controllers. Build short note input (press Enter to add). Build attachment uploader (4 types). Build YouTube embed component. |
| Phase 5: Revision System | Days 13–15 | Implement revision endpoint (grouped by day). Build RevisionPage with checklist. Day-by-day unlock logic. PATCH /api/notes/{id}/revise. Strikethrough + grey-out UI. |
| Phase 6: Polish & Deployment | Days 16–18 | Loading states + error handling everywhere. Toast notifications. Responsive CSS improvements. Deploy backend to Railway. Deploy frontend to Netlify. End-to-end testing on production. |

### 16.2 Maven Dependencies (pom.xml)

```xml
<!-- Required Spring Boot Dependencies -->
spring-boot-starter-web           <!-- REST API and embedded Tomcat server -->
spring-boot-starter-security       <!-- Spring Security framework -->
spring-boot-starter-data-jpa       <!-- JPA + Hibernate ORM -->
mysql-connector-j                  <!-- MySQL JDBC driver -->
jjwt-api (0.11.x)                  <!-- JWT API -->
jjwt-impl (0.11.x)                 <!-- JWT implementation -->
jjwt-jackson (0.11.x)              <!-- JWT Jackson JSON support -->
lombok                             <!-- Reduces boilerplate code -->
spring-boot-starter-validation     <!-- Bean Validation (@Valid, @NotBlank) -->
spring-boot-devtools               <!-- Hot reload during development (scope: runtime) -->
```

### 16.3 npm Dependencies (package.json)

```json
"dependencies": {
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "axios": "latest",
  "react-icons": "latest",
  "react-hot-toast": "latest"
}
```

> **No TypeScript. No Redux. No external UI component libraries.**

---

## 17. Out of Scope for v1.0

The following features are intentionally excluded from the first version to keep the scope manageable:

- Password reset / forgot password flow
- Email verification after registration
- User profile editing (change name, password, avatar)
- Sharing a learning journey publicly
- Collaboration (multiple users on one journey)
- AI-powered note summarization
- Mobile app (Android / iOS native)
- Dark mode
- Note re-ordering via drag and drop
- Rich text editor for daily log description (Markdown or WYSIWYG)
- Search functionality across journeys and logs
- Export journey as PDF
- Notification / reminder system
- Analytics dashboard (total hours, notes per day, etc.)

These can be added in future versions (v1.1, v2.0) after the core system is stable.

---

## 18. Glossary

| Term | Definition |
|---|---|
| JWT | JSON Web Token. A compact, URL-safe token used for stateless authentication. |
| DAO | Data Access Object. A design pattern that separates database access logic from business logic. |
| JPA | Java Persistence API. A standard interface for ORM (Object-Relational Mapping) in Java. |
| ORM | Object-Relational Mapping. Automatically maps Java classes to database tables. |
| REST API | Representational State Transfer API. A set of conventions for building web APIs using HTTP. |
| SPA | Single Page Application. A web app where navigation happens without full page reloads. |
| BCrypt | A password hashing function that salts and hashes passwords for secure storage. |
| CORS | Cross-Origin Resource Sharing. A browser security mechanism controlling which domains can make API requests. |
| DTO | Data Transfer Object. A simple class used to carry data between layers. |
| Entity | A Java class annotated with `@Entity` that maps directly to a database table. |
| Repository | A Spring Data JPA interface that provides built-in CRUD methods for an Entity. |
| Context API | A built-in React mechanism for sharing global state without prop drilling. |
| Axios Interceptor | A function that runs before every Axios request or response, used to add auth headers automatically. |
| Learning Journey | A named study project created by a user (e.g., "Learning Spring Boot"). |
| Daily Log | A daily entry within a Learning Journey documenting what was studied that day. |
| Short Note | A concise bullet-point note created during a daily log session, used for revision. |
| Revision | The process of reviewing all short notes from all days of a learning journey via a checklist. |

---

## 19. Document Revision History

| Version | Date | Changes |
|---|---|---|
| 1.0 | May 2026 | Initial PRD created. Full specification for all features including auth, journeys, logs, short notes, attachments, and the revision system. |

---

*— End of Document —*
