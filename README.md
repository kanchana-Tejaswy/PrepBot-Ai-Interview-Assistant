<h1 align="center">🤖 PrepBot – AI Interview Assistant</h1>

<p align="center">
🚀 AI-Powered Interview Simulation | Text & Voice | STAR Method Evaluation | Adaptive Questioning
</p>

<hr>

<h2>📌 Project Overview</h2>
<p>
<b>PrepBot</b> is an advanced AI-powered platform designed to simulate real-world interviews for students, professionals, and academic users. It provides an <b>interactive, adaptive, and personalized interview experience</b> by evaluating answers in text or voice, analyzing confidence, assessing structure using the STAR method, and generating role-specific questions based on resumes.
</p>

<p>
PrepBot empowers users to improve their interview skills through actionable feedback, confidence tracking, and analytics, while serving as a learning companion for communication, logical structuring, and real-time practice.
</p>

<hr>

<h2>🎯 Target Audience</h2>
<ul>
  <li>🎓 <b>Students & Freshers:</b> Preparing for technical, analytical, or business interviews</li>
  <li>💼 <b>Professionals:</b> Corporate interviews in marketing, product management, or sales</li>
  <li>🏫 <b>Academic Roles:</b> Teachers, lecturers, or internal recruiters</li>
  <li>🚀 <b>Program-Based Interviews:</b> UiPath, Google Student Ambassador, Microsoft Learn, Hackathons</li>
</ul>

<hr>

<h2>⚠️ Problem Statement</h2>
<p>
Many candidates struggle with anxiety, structuring responses logically, and tracking improvement. Existing platforms often provide static questions and generic feedback. <b>PrepBot</b> solves this by combining AI evaluation, adaptive questioning, and voice analysis for a realistic, dynamic, and personalized interview simulation.
</p>

<hr>

<h2>🔥 Key Features</h2>

<h3>Core Features (MVP)</h3>
<ul>
  <li>👋 Welcome Screen with motivational tagline</li>
  <li>📝 Role Selection (Students, Professionals, Academic, Program-based)</li>
  <li>💬 Interview Mode: Text chat or Voice</li>
  <li>📊 Feedback Screen: AI evaluates strengths, weaknesses, and scores</li>
  <li>📈 Session Summary: Track performance and view history</li>
</ul>

<h3>Research-Level Features</h3>
<ul>
  <li>🤖 AI Adaptive Questioning – Next question depends on prior answers</li>
  <li>🎤 Voice Analysis – Measures hesitation, filler words, tone, speed, and confidence</li>
  <li>📄 Resume-Based Personalized Questions – AI generates role-specific questions</li>
  <li>⭐ STAR Method Evaluation – Checks Situation → Task → Action → Result alignment</li>
  <li>📊 Analytics Dashboard – Tracks improvement over sessions</li>
  <li>🧑‍💼 AI Interviewer Personalities – Friendly HR, strict technical, behavioral analyst, startup founder</li>
  <li>⚡ Live Feedback – Real-time metrics during voice interviews</li>
</ul>

<hr>

<h2>🎨 UX & UI Design</h2>
<h3>Color Psychology</h3>
<table>
  <tr><th>Component</th><th>Color Code</th><th>Psychological Purpose</th></tr>
  <tr><td>Background</td><td>#0F172A</td><td>Calm focus, reduces eye strain</td></tr>
  <tr><td>Primary Buttons</td><td>#2563EB</td><td>Trust, confidence, professionalism</td></tr>
  <tr><td>Secondary Buttons</td><td>#7C3AED</td><td>Inspires intelligence and creativity</td></tr>
  <tr><td>Accent Elements</td><td>#F59E0B</td><td>Highlights progress and motivates action</td></tr>
  <tr><td>Card Background</td><td>#1E293B</td><td>Contrast, focus, readability</td></tr>
  <tr><td>Text</td><td>#F8FAFC</td><td>Readable without eye strain</td></tr>
</table>

<h3>Typography</h3>
<ul>
  <li>Headings: <b>Poppins</b> – Modern, clean, professional</li>
  <li>Body Text: <b>Inter</b> – Easy-to-read for long text and code</li>
</ul>

<h3>Layout & UX</h3>
<ul>
  <li>Mobile-first, responsive design</li>
  <li>Rounded cards for questions and feedback</li>
  <li>Smooth transitions between screens</li>
  <li>Step-by-step progress indicators</li>
</ul>

<hr>

<h2>⚙️ System Architecture</h2>
<p>PrepBot uses a modular, scalable design:</p>
<pre>
User Interface (HTML/CSS/JS)
        ↓
State Management (current question, role, score, answers)
        ↓
Backend (Node.js + Express)
        ↓
AI Evaluation Engine (OpenAI GPT / Google Gemini)
        ↓
Database (LocalStorage / Firebase / MongoDB)
        ↓
Feedback & Analytics Dashboard
</pre>

<hr>

<h2>🛠️ Tech Stack</h2>
<table>
<tr><th>Layer</th><th>Technology</th><th>Purpose</th></tr>
<tr><td>Frontend</td><td>HTML/CSS/JS</td><td>User interface, interactive experience</td></tr>
<tr><td>Backend</td><td>Node.js + Express</td><td>API handling, session management</td></tr>
<tr><td>Database</td><td>LocalStorage → Firebase / MongoDB</td><td>Profile & session storage</td></tr>
<tr><td>AI Engine</td><td>OpenAI GPT / Google Gemini</td><td>Text evaluation & feedback generation</td></tr>
<tr><td>Voice (Future)</td><td>OpenAI Whisper / ElevenLabs</td><td>Voice recognition & analysis</td></tr>
</table>

<hr>

<h2>🤖 AI Integration</h2>
<ul>
  <li>Text Evaluation: AI scores relevance, structure, clarity</li>
  <li>Voice Analysis: Detects hesitation, filler words, tone, confidence</li>
  <li>Adaptive Questioning: Generates dynamic next questions</li>
  <li>Resume Parsing: Generates role-specific questions</li>
  <li>STAR Method Scoring: Evaluates S → T → A → R structure</li>
</ul>

<h3>Example Feedback</h3>
<pre>
Score: 8/10
Strengths:
- Clear explanation
- Structured answer
- Relevant examples
Improvements:
- Reduce filler words
- Provide measurable outcomes
</pre>

<hr>

<h2>📁 Project Structure</h2>
<pre>
PrepBot/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── backend/
│   ├── server.js
│   └── routes/
├── utils/
│   └── ai.js
├── database/
│   └── db.js
└── package.json
</pre>

<hr>

<h2>🚀 Implementation Plan</h2>
<h3>Day 1</h3>
<ul>
  <li>Initialize folder structure & GitHub repository</li>
  <li>Setup Node.js backend & API placeholders</li>
  <li>Create basic frontend layout (welcome screen)</li>
  <li>AI placeholder functions in utils/ai.js</li>
  <li>Test frontend & backend connection</li>
</ul>

<h3>Roadmap</h3>
<table>
<tr><th>Phase</th><th>Features</th><th>Timeline</th></tr>
<tr><td>MVP</td><td>Chat interview, role selection, feedback, summary</td><td>7–10 days</td></tr>
<tr><td>Intermediate</td><td>Adaptive questioning, STAR analysis, history tracking</td><td>2–3 weeks</td></tr>
<tr><td>Advanced</td><td>Voice interview, confidence analysis, resume-based questions</td><td>3–5 weeks</td></tr>
<tr><td>Research-Level</td><td>Analytics dashboard, AI personalities, live feedback</td><td>6–10 weeks</td></tr>
</table>

<hr>

<h2>💡 Research-Level Potential</h2>
<ul>
  <li>Hackathon-winning project</li>
  <li>Internship portfolio project</li>
  <li>Research paper on AI, NLP & voice analysis</li>
  <li>Startup prototype</li>
</ul>

<p>
PrepBot uniquely combines <b>adaptive AI questioning, voice evaluation, STAR scoring, and analytics</b> into one platform for measurable improvement.
</p>

<hr>

<h2>👨‍💻 Author</h2>
<p>
<b>Tejaswy</b><br>
🎓 CSE Student | 💻 Developer | 🚀 Building Real-World Projects
</p>

<hr>

<h2>⭐ Final Note</h2>
<p>
PrepBot is a hybrid, research-level application providing <b>realistic interview simulations</b>. From MVP to advanced voice-based AI analytics, it equips users with confidence, communication skills, and actionable insights for real-world interviews.
</p>

<p align="center">
🔥 If you like this project, give it a star!
</p>
