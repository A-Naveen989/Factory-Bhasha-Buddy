## 1. Problem Statement

Migrant and contract factory workers often:

- Receive safety rules, notices, and shift information in text-heavy formats (posters, WhatsApp messages, PDFs) they cannot fully read or understand.
- Speak different languages (e.g., Telugu, Hindi, Tamil), but official communication is usually in one or two languages.
- Are scared or unable to report issues (unsafe conditions, unpaid salary, harassment) because they don’t know the “right words” or written format.
- Have their “understanding” of safety rules and instructions completely invisible to management — there is no feedback loop.

Current systems are:

- **One-way**: They push information; they don’t check if workers understood it.
- **Text-heavy**: They assume literacy and familiarity with complex terms.
- **Not personalized**: Everyone gets the same message regardless of language, role, or past confusion.
- **Not measured**: No tracking which workers or departments struggle with which topics.

This leads to:

- Preventable accidents and safety violations.
- Misunderstood notices on shifts, salaries, and policy changes.
- Lack of trust and poor worker morale.
- HR and supervisors having no data to redesign communication.

---

## 2. Solution Overview – Factory Bhasha Buddy

**Factory Bhasha Buddy** is a **mobile-friendly web app** (works in a browser on basic smartphones) that acts as an AI communication companion for factory workers and supervisors.

Workers can:

- Talk to the app in **Telugu, Hindi, Tamil (extensible to more)** using the phone microphone, or type simple messages.
- Ask about **shift timing, work location, safety rules, and notices** and get **clear spoken answers** and simple visuals in their own language.
- Receive **safety rules and factory notices as audio plus picture-based summaries**, instead of only long text.
- Take **picture-based safety quizzes** to check their understanding and learn from their mistakes.
- **Report complaints** (unsafe conditions, unpaid wages, harassment) via **voice or text**, which the system converts into a **clear structured complaint** they can review before sending.

Supervisors and HR can:

- Upload **notices and safety content** and let the system simplify and translate them.
- See a **simple dashboard** (no fancy hardware, no subscription tools) with:
  - **Understanding heatmaps** by language, department, and topic.
  - **Engagement metrics** (who listened, replayed, failed quizzes).
  - **Common questions and complaint categories**.
- Use this data to redesign communication and training.

All built with **open-source / free tools**, deployable on a single low-cost server or school cloud account, without paid subscription dependencies.

---

## 3. Target Users

### Primary Users – Factory Workers (Migrant and Local)

- **Devices**: Low-end Android smartphones; some may share devices.
- **Connectivity**: Intermittent mobile data, sometimes only Wi-Fi at hostel.
- **Skills & constraints**:
  - Limited literacy (cannot read long text well).
  - Prefer **voice** in their **native language** (e.g., Telugu, Hindi, Tamil).
  - Need **quick, simple answers**, not long manuals.
- **Needs**:
  - Understand **shift times, locations, and safety rules** clearly.
  - Be able to **re-listen** and learn at their own pace.
  - Report issues **safely and clearly** without needing advanced writing ability.

### Secondary Users – Supervisors, Line Managers, HR

- **Devices**: Laptops or smartphones.
- **Skills**: Comfortable with basic dashboards and forms.
- **Needs**:
  - Ensure workers **actually understand** safety rules and notices.
  - See **which departments or languages** are struggling.
  - Get **structured complaints** instead of vague verbal complaints.
  - Redesign communication using **real data** (heatmaps, quiz results).

---

## 4. Key Features

Per your requirements, all of these **must be included and working** in the prototype.

1. **Multilingual Voice Input and Response**
2. **Text-to-Speech Conversion for Notices**
3. **Understanding Tracking and Analytics**
4. **Supervisor Dashboard**
5. **Shift and Safety Information Retrieval**
6. **Picture-Based Safety Quiz**
7. **Voice-Based Complaint Assistant**

Below is what each feature does and how it appears in the app.

---

## 5. User Flow

### 5.1 Worker Experience – First-Time Use

1. **Open Factory Bhasha Buddy**
   - Worker visits a URL (e.g., `bhasha-buddy.local`) in phone browser.
   - Sees a **language selector**: Telugu | Hindi | Tamil | English.
   - Selects their preferred language (stored in localStorage and user profile).

2. **Quick Onboarding**
   - Short **audio greeting**: “Welcome to Factory Bhasha Buddy. You can ask about your shift, safety rules, or report problems in your language.”
   - Simple **cards**:
     - “Ask about shifts & safety”
     - “Listen to notices”
     - “Learn safety with pictures”
     - “Report a problem”
   - Each card has an icon (clock, shield, megaphone, warning).

3. **Grant microphone permission**
   - App asks for microphone access.
   - Shows simple visual: Tap mic to talk → Wait → Get audio answer.

---

### 5.2 Feature 1 – Multilingual Voice Input and Response

**Scenario:** Worker wants to know their shift for today.

1. Worker taps **“Ask about shifts & safety”**.
2. They see:
   - A **microphone button** (“Hold to speak”).
   - A **text input** (optional).
3. Worker holds mic and speaks in Telugu:  
   “Naa ivala shift eppudu?” (When is my shift today?)
4. App pipeline:
   - **Speech-to-text (STT)** converts audio to text in Telugu.
   - A simple **intent classifier** recognizes it as a “shift query”.
   - Backend looks up worker’s shift data by worker ID.
5. App responds:
   - In worker’s chosen language:
     - Text: “Your shift today is 2 PM to 10 PM in Assembly Line 3.”
     - **Text-to-speech (TTS)** plays audio in Telugu saying the same.
6. Worker can:
   - Tap **Replay** to hear again (logged).
   - Tap **“Show in simple words”** to see a very short text + icon view.

**Tracking:** Number of replays and whether worker asked follow-up questions are logged to **Understanding Tracking and Analytics**.

---

### 5.3 Feature 2 – Text-to-Speech Conversion for Notices

**Scenario:** HR uploads a complex safety notice.

1. **Supervisor/HR** logs into the web app (Supervisor mode).
2. Goes to **“Notices” → “Add New Notice”**.
3. Fills fields:
   - Title
   - Department(s)
   - Full text of the notice (can paste from Word/PDF).
   - Category: General, Safety, Payroll, Policy, etc.
4. Backend processes the notice:
   - **Simplifies** text into a short version (few bullet points).
   - Splits content into:
     - **Voice script** (2–3 short, simple sentences per language).
     - **Key points** that can be shown visually (icons, color banners).
5. Worker sees new notice:
   - In “Notices” screen, each notice becomes a **card** with:
     - Title + category icon.
     - Play button for **voice** in their language.
     - “View pictures” to see simple pictorial summary:
       - For safety: images like helmet, gloves, no smoking sign, etc.
6. Worker taps “Play”:
   - TTS reads the **simplified notice** in selected language.
   - Worker can replay, mark “I did not understand” (flag), or “Understood”.

**Tracking:** Plays, replays, and “did not understand” flags feed into **Understanding Tracking and Analytics**.

---

### 5.4 Feature 3 – Understanding Tracking and Analytics

This feature is mostly **backend + dashboard** but starts from worker actions.

1. **Events captured for each worker**:
   - Which notices they:
     - Played.
     - Replayed.
     - Skipped.
     - Marked “Not clear”.
   - Voice queries:
     - Topic detected (shift, safety rule, complaint, payroll, other).
     - Language used.
   - **Safety quizzes**:
     - Questions answered correctly/incorrectly.
     - Number of hints needed.
   - Complaints:
     - Category (unsafe, unpaid salary, harassment, other).
     - Whether worker cancelled or submitted.

2. **Aggregations computed**:
   - Per **topic** (e.g., PPE rules, machine lockout, overtime policy).
   - Per **language** (Telugu vs Hindi vs Tamil).
   - Per **department** (Assembly, Packing, Cleaning).
   - Per **notice** (which one has most confusion).

3. Data is exposed in a simple **API** and visualized in the **Supervisor Dashboard**.

---

### 5.5 Feature 4 – Supervisor Dashboard

**Scenario:** Supervisor wants to see if a new machine safety rule is understood by night shift workers.

1. Supervisor logs in via `bhasha-buddy.local/admin`.
2. Dashboard sections:

   #### a) Overview Tiles
   - “Active workers this week”
   - “% Workers who listened to latest safety notice”
   - “Avg quiz score on PPE rules”
   - “# of new complaints this week”

   #### b) Understanding Heatmap
   - Grid with rows = **Topics** (e.g., “Machine guarding”, “Fire exit”, “Salary slip”).
   - Columns = **Languages** or **Departments**.
   - Cell color = **understanding score** (green good, yellow medium, red low).
     - Score example: weighted combination of:
       - Quiz accuracy.
       - Replays per user.
       - “Not clear” flags.

   #### c) Notice Analytics
   - List of recent notices:
     - Notice title.
     - % workers who:
       - Played at least once.
       - Replayed more than 2 times.
       - Marked “Not clear”.
   - Click on a notice to see:
     - Breakdown by language.
     - Which quiz questions linked to this notice are most often missed.

   #### d) Questions & Complaints Insights
   - Common questions chart (e.g., “How many workers ask about overtime rates?”).
   - Complaint types:
     - Stack bar: Unpaid salary, Unsafe condition, Harassment, Other.
     - Each complaint shown with:
       - Auto-generated summary (e.g., “Slippery oil near Machine 5, Assembly Line 2”).

3. Supervisor uses this to:
   - Identify **red cells** in the heatmap.
   - Decide: “We must re-explain PPE in Tamil” or “We need more visuals for fire exits in Packing.”

---

### 5.6 Feature 5 – Shift and Safety Information Retrieval

**Scenario A: Shift info**

1. Worker opens “Ask about shifts & safety”.
2. Speaks or types:
   - Examples:
     - Hindi: “Kal meri shift kitne baje hai?”
     - Tamil: “Enakku innaiku night shift irukka?”
3. Backend:
   - STT → text (in respective language).
   - Intent classifier: SHIFT_INFO.
   - Fetches schedule from `shifts` table using worker ID.
4. Response:
   - Short text + voice:
     - “Tomorrow your shift is 6 AM to 2 PM in Packing, Gate 2.”
   - Optional visual: small clock graphic.

**Scenario B: Safety rules**

1. Worker asks:
   - Telugu: “Cutting machine daggara safety ela undali?”
2. Backend:
   - Maps to topic “Cutting machine safety”.
   - Returns pre-configured safety script + relevant pictures (e.g., gloves, goggles, no loose clothes).
3. App shows:
   - Audio explanation in their language.
   - **Visual safety guide**: 3–4 picture tiles with captions.

---

### 5.7 Feature 6 – Picture-Based Safety Quiz

**Scenario:** After listening to “Fire Safety” notice.

1. Worker finishes listening; app suggests:
   - “Test your understanding with 3 quick picture questions.”
2. Quiz UI:
   - Each question shows 1–2 pictures, plus a **simple audio question**.
   - Examples:
     - Picture: Two exits, one blocked with boxes, one clear.
       - Audio: “Which is the safe fire exit?”
       - Worker taps the correct picture.
     - Picture: Worker with helmet and gloves vs without PPE.
       - Audio: “Who is following the safety rule?”
3. For each answer:
   - If correct:
     - Show green tick.
     - Short audio praise.
   - If incorrect:
     - Show red cross.
     - **Explain in their language** why it’s wrong:
       - “This exit is blocked. In fire, blocked exit is dangerous. Always keep fire exits clear.”
4. At the end:
   - Show final score and a **very short summary** of key rules.
   - Progress stored as:
     - Quiz attempts, correct rate, hints, explanations played.

These quiz results heavily feed into **Understanding Tracking and Analytics** and show up on the **Dashboard heatmaps**.

---

### 5.8 Feature 7 – Voice-Based Complaint Assistant

**Scenario:** Worker sees oil spill near a machine and wants to report it.

1. Worker selects **“Report a problem”**.
2. Chooses category (with icons):
   - Unsafe condition
   - Unpaid salary
   - Harassment
   - Other
3. Taps microphone and describes the problem in their language:
   - Telugu: “Machine 4 daggara floor paina oil undi, jari padey chance undi, 2 rojul nundi clean cheyyaledu.”
4. Backend:
   - STT: Converts speech to text in Telugu.
   - NLU: Extracts:
     - Location (Machine 4, which line if known).
     - Problem type (slippery oil).
     - Duration (2 days).
   - Generates a **structured complaint draft** in simple English or admin’s preferred language, plus **worker’s language version**.
5. Confirmation screen:
   - Worker sees:
     - Audio playback of summary in their language:  
       “You are reporting: There is oil on the floor near Machine 4 for 2 days, risk of slipping.”
   - They can:
     - Edit via voice or text.
     - Cancel.
     - Submit.
6. On submit:
   - Complaint is logged in `complaints` table with:
     - Original transcription (worker language).
     - Auto-generated summary.
     - Department/line if known.
   - Shows simple tracking ID to the worker.

On the supervisor dashboard, these complaints are visible (without revealing worker identity if you choose anonymity as default).

---

## 6. Technical Approach

Design must avoid paid subscriptions and extra hardware. Use **open-source** and **self-hosted** components where possible.

### 6.1 Overall Architecture

- **Type**: Web app (responsive mobile-first) + REST API backend.
- **Frontend**:
  - Framework: **React** (or Vue if preferred).
  - Mobile-friendly UI with:
    - Bottom nav tabs: “Home”, “Notices”, “Quiz”, “Report”.
    - Simple large buttons and icons.
  - Use **MediaRecorder API** for audio capture in browser.
  - Use **Web Audio API** or simple HTML5 `<audio>` for playback.

- **Backend**:
  - Runtime: **Node.js** with **Express** (or Fastify).
  - REST endpoints for:
    - Auth (login, switch role).
    - Voice upload / transcription.
    - Text generation (simplification, complaint summary).
    - Shift info lookup.
    - Notice management.
    - Quiz questions and answers.
    - Analytics (for dashboard).
  - Background workers (e.g., with BullMQ / simple cron) for heavy processing (TTS/analysis) if needed.

- **Database**:
  - **PostgreSQL** (or SQLite for hackathon simplicity).
  - Schema (core tables):
    - `users` (id, name, phone(optional), role, language, department_id).
    - `departments` (id, name).
    - `shifts` (id, user_id, date, start_time, end_time, location).
    - `notices` (id, title, full_text, simplified_text, category, created_by).
    - `notice_translations` (id, notice_id, language, simplified_text, audio_url/path).
    - `notice_views` (id, user_id, notice_id, plays, replays, not_clear_flag, timestamps).
    - `safety_topics` (id, name, description).
    - `quiz_questions` (id, topic_id, image_path, question_text_per_language JSON, correct_answer, explanation_per_language JSON).
    - `quiz_attempts` (id, user_id, question_id, is_correct, attempts_count, created_at).
    - `voice_queries` (id, user_id, language, intent, topic_id, raw_text, created_at).
    - `complaints` (id, user_id (nullable), category, raw_text, language, structured_summary, department_id, status, created_at).
    - `analytics_snapshots` (optional precomputed aggregates for fast dashboard).

- **File storage**:
  - Store audio and images on local filesystem for hackathon (e.g. `/uploads/audio`, `/uploads/images`).
  - In production, could move to S3-compatible storage, but not required here.

### 6.2 Speech-to-Text (STT) and Text-to-Speech (TTS)

Use **open-source / free options** to avoid paid subscriptions:

- **STT** (multilingual, offline-capable options):
  - [Vosk](https://alphacephei.com/vosk/) with Telugu/Hindi/Tamil models.
  - Or [Coqui STT](https://github.com/coqui-ai/STT) models.
  - Deployed as a service container:
    - Node backend sends recorded audio file to local STT service.
    - Returns transcribed text + language code.
- **TTS**:
  - [Coqui TTS](https://github.com/coqui-ai/TTS) or [Mozilla TTS] models for Indian languages (where available).
  - Alternatively, use a free-tier open API during hackathon (e.g., some Hugging Face hosted TTS models) while **abstracting behind a TTS service layer** so it can be swapped with fully self-hosted later.

**Important:** Implement a **TTS adapter interface** in backend so you can switch between:
- Local open-source TTS.
- Free hosted TTS with no subscription (respecting free usage limits).

### 6.3 Natural Language Understanding & Logic

Since this is a hackathon and we must avoid paid LLM subscriptions, use a **hybrid rule-based + open-source model** approach:

1. **Language detection**:
   - Use [fastText language identification](https://fasttext.cc/docs/en/language-identification.html) or similar open library.

2. **Intent & topic classification**:
   - Define a small set of intents:
     - `SHIFT_INFO`, `SAFETY_INFO`, `NOTICE_QUERY`, `COMPLAINT`, `OTHER`.
   - Use:
     - Simple **keyword-based rules** for each language (e.g., “shift”, “timing”, “kal”, “night shift”, etc.).
     - For more flexibility, train a small classifier (e.g., scikit-learn with bag-of-words/TF-IDF) on labeled example phrases.

3. **Text simplification & complaint summarization**:
   - For hackathon, can:
     - Use a **small open-source language model** (e.g., via `transformers` on backend) to paraphrase / simplify.
     - Or apply **rule-based** simplification:
       - Shorten sentences.
       - Remove long clauses and complex words using custom phrase lists.
   - For complaint structuring:
     - Template-based:
       - Extract time phrases (e.g., “for 2 days”).
       - Extract machine/location keywords (“Machine 4”, “Packing area”).
       - Combine in a template:  
         “Worker reports [issue_type] at [location] since [duration]. Details: [original text].”

### 6.4 Frontend Implementation Notes

- Use **React + TypeScript** for reliability.
- Basic pages:
  - `/` – Worker home (language selection, main feature cards).
  - `/ask` – Ask about shifts & safety (voice/text).
  - `/notices` – List + detail page.
  - `/quiz` – Quiz selection and flow.
  - `/report` – Complaint assistant.
  - `/admin` – Supervisor dashboard (login required).
  - `/admin/notices` – Manage notices.
- Components:
  - `LanguageSelector`
  - `VoiceRecorder` (wraps `MediaRecorder`).
  - `AudioPlayer`
  - `NoticeCard`, `NoticeDetail`
  - `QuizQuestion`
  - `ComplaintForm`
  - `HeatmapChart`, `KPICard`, `BarChart` (use a library like **Chart.js** or **Recharts**).
- Use **CSS framework** like Tailwind CSS or simple CSS modules for quick, clean UI.

### 6.5 Authentication & Roles

- Simple JWT-based auth or cookie session.
- Roles:
  - `worker`
  - `supervisor`
  - `admin`
- Workers can optionally be **anonymous** (only browser-local ID) to reduce fear for complaints.

### 6.6 Analytics Computation

- **Real-time enough** for hackathon:
  - For each new event (notice view, quiz attempt, query, complaint):
    - Insert into DB.
  - For dashboard:
    - Write SQL queries to:
      - Compute per-topic quiz accuracy.
      - Per-language replay rates for notices.
      - Per-department complaint counts.
    - Optionally, precompute and cache results every X minutes with a cron.

---

## 7. Success Metrics

To evaluate whether **Factory Bhasha Buddy** is working:

### 7.1 Worker-Level Metrics

1. **Adoption**
   - # of unique workers using the app per week.
   - % of workforce that has used the app at least once.

2. **Engagement**
   - Avg. # of voice queries per worker per week.
   - Avg. # of notice plays and replays per worker.

3. **Comprehension (Proxy)**
   - Average quiz score per safety topic.
   - Reduction in “Not clear” flags on notices over time.
   - Decrease in replays per notice after improvements.

4. **Complaint Usage**
   - # of complaints submitted per month.
   - % of complaints that are **well-structured** (contain location, type, duration).

### 7.2 Supervisor/HR-Level Metrics

1. **Dashboard Usage**
   - # of supervisor logins per week.
   - # of changes in communication made based on heatmap (e.g., re-issued notice with visuals).

2. **Understanding Distribution**
   - % of topics with “green” understanding across all languages.
   - # of red cells in heatmap over time (should decrease).

3. **Safety & Operations (Longer Term / Simulated in Hackathon)**
   - (If real factory data) Change in reported minor incidents after targeted training.
   - (For hackathon demo) Simulated scenario: after improved notices and quizzes, show:
     - Increased quiz scores.
     - Reduced confusion metrics.

### 7.3 Hackathon Demo Readiness

For the hackathon, to consider the prototype successful:

- Worker UI can:
  - Record voice in at least 1–2 languages.
  - Show an example notice with TTS + visual summary.
  - Run at least one picture-based safety quiz.
  - Record a complaint and show the structured summary for confirmation.
- Supervisor UI can:
  - Upload a notice and see a simplified version.
  - View a simple heatmap or chart of understanding from test data.
  - See incoming example complaints and quiz statistics.

---

This plan is scoped so an AI prototyping tool (Lovable, Bolt, etc.) can:

- Scaffold the React frontend with the key pages/components.
- Scaffold the Node.js backend with REST endpoints and DB models.
- Integrate open-source STT/TTS as services (or stub them with mock APIs for the demo).
- Seed the system with sample workers, notices, safety topics, and quiz items to produce realistic heatmaps and analytics.