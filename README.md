# 🏭 Factory Bhasha Buddy
### Every Language Matters. Every Worker Matters.

<p align="center">
  <strong>An AI-powered multilingual communication platform for safer, smarter, and more inclusive factory workplaces.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-2026-blue?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-Powered-646CFF?logo=vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-Styling-06B6D4?logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase" />
</p>

---

## 🌟 Introduction

Imagine working in a factory where important safety instructions, shift updates, and workplace announcements are shared in a language you don't understand.

For many migrant and contract workers, this is an everyday challenge.

Language barriers can lead to misunderstandings, safety risks, and difficulties communicating with supervisors or reporting workplace problems.

**Factory Bhasha Buddy** is built to make factory communication easier for everyone.

It is a mobile-friendly web application that helps factory workers access important information, understand safety instructions, listen to announcements, and report workplace issues in their preferred language.

Instead of depending entirely on written communication, workers can interact using simple text, voice, and visual elements.

Our goal is simple: make sure every worker can understand, communicate, and feel heard.

## 🎯 The Problem

Factory workers often face several communication challenges:

- Important notices and safety instructions are available only in text-heavy formats.
- Workers from different regions may not understand the language used by management.
- Complex safety instructions can be difficult to understand.
- Workers may struggle to explain workplace problems through written complaints.
- Supervisors have limited visibility into whether workers actually understand important instructions.

These communication gaps can affect workplace safety, productivity, and employee well-being.

## 💡 Our Solution

Factory Bhasha Buddy brings workers and supervisors together through one simple communication platform.

Workers can:
- Select their preferred language.
- Ask questions using voice or text.
- Listen to important factory notices.
- Understand safety instructions through visual explanations.
- Test their knowledge using picture-based quizzes.
- Report workplace problems through a simple complaint assistant.

Supervisors can:
- Manage workplace notices.
- Monitor worker engagement.
- Review safety quiz performance.
- Identify common communication difficulties.
- View complaints and workplace insights.

## ✨ Key Features

### 🗣️ 1. Multilingual Communication
Communicate in the language you are comfortable with.

- Telugu
- Hindi
- Tamil
- English

The application is designed to make information accessible to workers from different linguistic backgrounds.

### 🎙️ 2. Voice-Based Assistant
Workers can interact with the application without having to type everything.

- Ask questions using a microphone.
- Access shift and safety information.
- Receive responses in a simple format.
- Listen to spoken responses where supported.

### 📢 3. Smart Notice Reader
Important announcements should be easy to understand.

- View factory announcements and safety notices.
- Listen to notices through audio playback.
- Access simplified information.
- Replay important announcements whenever needed.

### 📊 4. Understanding & Analytics
Help supervisors understand whether workplace communication is effective.

- Track notice engagement.
- Monitor replay activity.
- Analyze safety quiz results.
- Identify frequently misunderstood topics.
- Understand communication gaps across departments and languages.

### 🖥️ 5. Supervisor Dashboard
A centralized dashboard for workplace communication management.

- View important statistics.
- Monitor worker engagement.
- Review safety performance.
- Identify common questions.
- Analyze submitted complaints.

### 🛡️ 6. Shift & Safety Information
Make essential workplace information easier to access.

- Ask about shift schedules.
- Find relevant workplace information.
- Learn safety procedures.
- Access simple explanations of safety rules.

### 🧩 7. Picture-Based Safety Quiz
Learning workplace safety doesn't have to involve long instructions.

- Answer questions using pictures.
- Learn through practical safety scenarios.
- Receive feedback on answers.
- Track quiz performance and understanding.

### 📋 8. Voice-Based Complaint Assistant
Give workers a simpler way to communicate workplace problems.

- Report unsafe conditions.
- Report unpaid salary.
- Report harassment or other workplace concerns.
- Describe problems through voice or text.
- Review structured complaint summaries before submission.

---

## 🛠️ Technology Stack

The project uses modern frontend technologies and Supabase integration.

| Technology | Purpose |
|---|---|
| React.js | Building the user interface |
| TypeScript | Type-safe application development |
| Vite | Frontend development and build tooling |
| Tailwind CSS | Styling and responsive layouts |
| Supabase | Backend services and database integration |
| JavaScript / TypeScript | Application logic |
| Web Speech API | Browser-based speech functionality |
| HTML5 | Application structure |
| CSS | Additional styling |

---

## 📂 Project Structure

Here is the current project organization:

```text
Factory-Bhasha-Buddy/
│
├── dist/
│   ├── assets/
│   └── index.html
│
├── public/
│
├── src/
│   │
│   ├── components/
│   │   ├── AdminLayout.tsx
│   │   ├── AppLink.tsx
│   │   ├── LanguageSelector.tsx
│   │   ├── MicButton.tsx
│   │   ├── NoticeCard.tsx
│   │   ├── NoticeDetail.tsx
│   │   ├── QuizQuestionCard.tsx
│   │   ├── SpeakButton.tsx
│   │   └── WorkerLayout.tsx
│   │
│   ├── context/
│   │   ├── workerContextValue.ts
│   │   └── WorkerProvider.tsx
│   │
│   ├── hooks/
│   │   ├── useSpeechRecognition.ts
│   │   └── useWorker.ts
│   │
│   ├── lib/
│   │   ├── askAnswer.ts
│   │   ├── i18n.ts
│   │   ├── intents.ts
│   │   ├── notices.ts
│   │   ├── router.ts
│   │   ├── simplify.ts
│   │   ├── speech.ts
│   │   ├── supabase.ts
│   │   ├── types.ts
│   │   └── worker.ts
│   │
│   ├── pages/
│   │   ├── AdminDashboardPage.tsx
│   │   ├── AdminNoticesPage.tsx
│   │   ├── AskPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── NoticesPage.tsx
│   │   ├── QuizPage.tsx
│   │   └── ReportPage.tsx
│   │
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── supabase/
│   └── migrations/
│       └── 20261030054250_factory_bhas...
│
├── .env
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

**A quick explanation of the main folders:**

| Folder | Responsibility |
|---|---|
| `components/` | Reusable UI components and layouts |
| `context/` | Shared worker state and context management |
| `hooks/` | Custom React hooks for application functionality |
| `lib/` | Speech, translations, routing, notices, Supabase, and application logic |
| `pages/` | Main worker and administrator pages |
| `supabase/migrations/` | Database migration files |
| `dist/` | Production build output generated by Vite |

---

## 🚀 Getting Started

Want to run Factory Bhasha Buddy on your local machine? Follow these steps.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm
- [Git](https://git-scm.com/)
- A code editor such as [Visual Studio Code](https://code.visualstudio.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/A-Naveen989/Factory-Bhasha-Buddy.git
```

### 2. Navigate to the Project

```bash
cd Factory-Bhasha-Buddy
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory.

Add the Supabase credentials required by your project. Check `src/lib/supabase.ts` for the exact environment variable names.

For example, a typical Supabase setup uses:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Use the actual variable names expected by your application. Never upload your secret keys or `.env` file to GitHub.

### 5. Start the Development Server

```bash
npm run dev
```

### 6. Open in Your Browser

Visit the local development URL displayed in your terminal. Usually:

```text
http://localhost:5173
```

That's it! You can now explore the application locally.

---

## 📱 Application Modules

The application is organized around two main user experiences.

### 👷 Worker Interface

Designed with simplicity and accessibility in mind.

| Page | Description |
|---|---|
| Home | Main worker interface and feature navigation |
| Ask | Voice and text-based questions |
| Notices | Important announcements and information |
| Quiz | Interactive workplace safety questions |
| Report | Workplace complaint reporting |

### 🧑‍💼 Administrator Interface

Designed to help supervisors manage communication and monitor workplace information.

| Page | Description |
|---|---|
| Admin Dashboard | Overview of workplace communication and analytics |
| Admin Notices | Manage factory notices and announcements |

---

## 🌍 Accessibility & User Experience

Factory Bhasha Buddy is designed with real factory working conditions in mind.

Our design priorities include:

- **Mobile-first:** Designed to work on smartphones.
- **Simple navigation:** Clear buttons and easy-to-understand layouts.
- **Multilingual experience:** Support for multiple Indian languages.
- **Voice interaction:** Reduce dependence on typing.
- **Visual learning:** Use pictures and simple explanations.
- **Accessibility:** Make important information easier to understand.

---

## 🔮 Future Improvements

There is still plenty of room to improve the platform.

Some features we would like to explore include:

- Support for additional Indian regional languages.
- Improved offline functionality for low-connectivity areas.
- More accurate speech recognition for different regional accents.
- AI-powered notice simplification and translation.
- Anonymous complaint reporting.
- Real-time notifications for supervisors.
- Advanced communication analytics.
- Integration with factory attendance and shift management systems.

---

## 🎯 Project Vision

We don't believe language should prevent someone from understanding workplace safety or communicating an important problem.

Factory Bhasha Buddy is an attempt to use technology to solve a real-world communication problem.

By combining multilingual communication, voice interaction, visual learning, and workplace analytics, we aim to make factory environments more inclusive and safer.

**A worker who understands is a worker who can make safer decisions.**

---

## 👨‍💻 About the Developer

Hi, I'm **Naveen Annepu**, a Computer Science graduate specializing in Artificial Intelligence and Machine Learning, currently pursuing my MCA at Amity University Online.

I'm interested in software development, artificial intelligence, and building practical applications that solve real-world problems.

I enjoy exploring new technologies, learning by building projects, and turning ideas into useful applications.

Factory Bhasha Buddy is one such project where I explored how technology can help improve communication and accessibility in industrial workplaces.

### 🎓 Education

- **Master of Computer Applications (MCA)** — Amity University Online (2026 – Present)
- **Bachelor of Technology (B.Tech)** — Computer Science and Engineering (AI & ML), GITAM University

### 🤝 Connect With Me

<p>
  <a href="https://github.com/A-Naveen989">
    <img src="https://img.shields.io/badge/GitHub-A--Naveen989-181717?style=for-the-badge&logo=github" />
  </a>
  <a href="https://www.linkedin.com/in/naveen-annepu-164333257/">
    <img src="https://img.shields.io/badge/LinkedIn-Naveen%20Annepu-0A66C2?style=for-the-badge&logo=linkedin" />
  </a>
</p>

---

## 🤝 Contributions & Feedback

Ideas, suggestions, and feedback are always welcome.

If you have suggestions for improving multilingual accessibility, workplace safety, or the overall user experience, feel free to open an issue or contribute to the project.

---

## 📄 License

This project is currently developed as an AI hackathon project.

A formal open-source license can be added when the distribution and usage terms are finalized.

---

<p align="center">
  <strong>Made with ❤️ by Naveen Annepu</strong>
  <br/>
  <br/>
  <i>Factory Bhasha Buddy</i>
  <br/>
  <b>Every Language Matters. Every Worker Matters.</b>
</p>
