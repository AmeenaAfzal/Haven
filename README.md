**🏠HAVEN**

**Description:**
Haven is a peer-support web application designed for individuals living with chronic illness and isolation. The platform provides energy-matched micro-activities, topic-based chat rooms, and moderator-led events governed by an AI-moderated architecture.

**Features:**

* **Role-Based Access Control:** Role hierarchy consisting of User, Moderator, and Admin to manage community safety and application administration.
* **Guided Onboarding:** Intake system that recommends topic-based support rooms based on user input.
* **Dynamic Topic Rooms:** Searchable support rooms with custom, user-generated tags.
* **Pre-Post Content Moderation:** Real-time screening of chat messages and comments prior to rendering; automatically intercepts scams, crisis signals, and toxic input.
* **Event Management:** Event proposal workflows requiring admin verification of real public venues, RSVP tracking, and past-event memory logs.
* **Custom UI Overlay System:** Custom toast and modal system replacing standard browser dialogs (`alert()`, `confirm()`, `prompt()`) to maintain application state during asynchronous flows.

**Architecture:**

* **Frontend:** Single-page application built with vanilla JavaScript using a centralized state object and dynamic `render()` cycle triggered by state updates.
* **Backend:** Node.js and Express server (`server.js`) serving as a secure proxy to manage API requests and shield environment credentials.

**Backend:**

* Node.js and Express application serving static assets out of the `/public` directory and routing proxy API calls.
* Utilizes `dotenv` to keep third-party API keys secured on the server side.

**API Endpoints:**

* **`POST /api/classify`:** Executes parallel calls to OpenAI's Moderation endpoint and a `gpt-5.4-nano` classification model to categorize text into `ok`, `scam`, `crisis`, or `toxic`. Ambiguous outputs default to strict enforcement.
* **`POST /api/quiz`:** Generates theme-based trivia questions for community rooms via LLM prompts.

**Fault Tolerance:**

* **Local Moderation Fallback:** If the backend or API key is unavailable, `/api/classify` falls back to a client-side keyword filter to ensure posts remain screened.
* **Static Content Fallback:** `/api/quiz` automatically defaults to a static, pre-written question bank if external API calls fail.

**Safety Architecture**

* **Pre-Post AI Filtering:** Automated screening of incoming chat messages and forum posts prior to storage and display.
* **Local Fallback Filter:** Keyword-driven moderation when external API calls fail or remain unconfigured.
* **Community Flagging:** User-driven reporting mechanisms for specific messages or members.
* **Moderator Queues:** Flagged content lands in a dedicated triage system separate from public view.
* **Moderator Oversight:** Rooms are capped at two moderators. Reports regarding moderator misconduct route directly to the admin system rather than the room's internal queue.
* **Admin Dashboard:** Central panel for managing moderator keys, reviewing proposed event venues, handling flagged moderators, and monitoring activity logs.

**Tech Stack**

* **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3.
* **Backend:** Node.js, Express, `dotenv`.
* **AI & API Integration:** OpenAI Moderation Endpoint, OpenAI API (`gpt-5.4-nano`).
