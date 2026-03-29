// ==========================================
// STATE MANAGEMENT & VARIABLES
// ==========================================
let selectedRole = "";
let interviewMode = "";
let currentQuestionIndex = 0;
let answers = [];
let scores = [];
let normalScores = [];
let finalScores = [];
let isFinalRound = false;
let feedbackList = [];
let isFeedbackShowing = false;
let dynamicQuestions = [];
let interviewHistory = [];
let resumeQuestions = [];
let usingResume = false;

// ==========================================
// VOICE INTEGRATION (Web Speech API)
// ==========================================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecording = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let fullTranscript = '';
    for (let i = 0; i < event.results.length; ++i) {
      fullTranscript += event.results[i][0].transcript;
    }
    document.getElementById('answerTextarea').value = fullTranscript;
  };

  recognition.onerror = (event) => {
    console.error("Speech Recognition Error:", event.error);
  };
}

// ==========================================
// VOICE ANALYSIS
// ==========================================
function analyzeVoice(text) {
  const words = text.toLowerCase().split(/\s+/);
  const fillerWords = ["um", "uh", "like", "basically", "literally"];
  
  let fillerCount = 0;
  words.forEach(word => {
    if (fillerWords.includes(word)) fillerCount++;
  });

  const strengths = [];
  const improvements = [];

  if (words.length >= 20 && words.length <= 150) {
    strengths.push("Voice Analysis: Good speech length and clarity.");
  } else if (words.length < 20) {
    improvements.push("Voice Analysis: Try to speak more and elaborate on your points.");
  } else {
    improvements.push("Voice Analysis: You speak at length. Ensure you remain concise.");
  }

  if (fillerCount >= 2) {
    improvements.push(`Voice Analysis: Too many filler words detected (${fillerCount}). Try to speak more confidently.`);
  } else if (fillerCount === 0 && words.length > 10) {
    strengths.push("Voice Analysis: Excellent voice clarity, no filler words detected.");
  }

  return { strengths, improvements };
}

// ==========================================
// ROLE-BASED QUESTION GENERATOR
// ==========================================
function generateQuestionsByRole(role) {
  const r = role.toLowerCase();
  
  if (r.includes("software") || r.includes("developer") || r.includes("frontend") || r.includes("backend") || r.includes("full stack")) {
    return [
      "Could you start by formally introducing yourself and your background?",
      "What specifically motivated you to pursue a career in software engineering?",
      "Can you clearly explain your key technical strengths, providing examples?",
      "Describe a complex project you developed. What was your distinct contribution?",
      "How do you approach debugging a critical issue in production code?",
      "Explain a time you disagreed with a team member on a technical decision.",
      "Where do you see your technical expertise growing in the next three years?",
      "Why should we select you over other qualified engineering candidates?"
    ];
  } else if (r.includes("product") || r.includes("manager")) {
    return [
      "Could you start by formally introducing yourself and your background?",
      "Why did you choose product management as your professional focus?",
      "Describe a digital product you admire. What makes its UX/UI successful?",
      "How do you prioritize conflicting feature requests mathematically or logically?",
      "Tell me about a challenging leadership experience where you had to align a team.",
      "How do you assess if a newly launched product feature is successful?",
      "Describe a time a product failed. What did you learn from it?",
      "Why should we trust you to manage our core product lines?"
    ];
  } else if (r.includes("marketing") || r.includes("sales") || r.includes("business")) {
    return [
      "Could you start by formally introducing yourself and your background?",
      "What drives your passion for marketing and sales strategy?",
      "Walk me through how you would architect a campaign to promote a new SaaS product.",
      "Which performance metrics do you consider most critical when evaluating a campaign?",
      "Describe a time you had to pivot a failing strategy under intense pressure.",
      "How do you define and identify an ideal target audience?",
      "Tell me about your most successful campaign or quota achievement to date.",
      "Why are you the definitive choice for this role?"
    ];
  } else {
    // Academic, Programs, Custom, etc.
    return [
      "Could you start by formally introducing yourself and your background?",
      "What specifically draws you to this particular role and industry?",
      "Can you clearly explain your key strengths with concrete examples?",
      "Describe a significant project or responsibility you previously handled.",
      "Tell me about a time you overcame a difficult challenge or failure.",
      "How do you manage competing priorities under a strict deadline?",
      "Where do you envision your professional growth leading in the next few years?",
      "Why should we extend an offer to you over other candidates?"
    ];
  }
}

// ==========================================
// SMART FOLLOW-UP GENERATOR
// ==========================================
function generateFollowUp(answer) {
  const ansLower = answer.toLowerCase();
  
  // If extremely short
  if (answer.trim().length > 0 && answer.trim().length <= 25) {
    return "Can you elaborate more?";
  }
  
  // Topic-based follow-ups
  if (ansLower.includes("project")) {
    return "What challenges did you face in that project?";
  }
  if (ansLower.includes("team")) {
    return "What was your role in the team?";
  }

  return null; // No follow-up needed
}

// ==========================================
// API BASE URL
// ==========================================
// Always point frontend API calls to the backend server at localhost:5000.
// This makes the app work even when the frontend is served from another local address
// like http://127.0.0.1:5500 or when opened directly via file://.
const API_BASE_URL = 'http://localhost:5000';

// ==========================================
// REALISTIC ANSWER EVALUATOR (API)
// ==========================================
async function evaluateAnswerAPI(question, answer, role, history) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/interview/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer, role, history })
    });
    if (!response.ok) throw new Error("API request failed");
    return await response.json();
  } catch (error) {
    console.error("Evaluation Error:", error);
    return { error: true };
  }
}

// ==========================================
// DOM ELEMENTS
// ==========================================
const screens = {
  welcome: document.getElementById('welcomeScreen'),
  role: document.getElementById('roleScreen'),
  mode: document.getElementById('modeScreen'),
  interview: document.getElementById('interviewScreen'),
  summary: document.getElementById('summaryScreen'),
  dashboard: document.getElementById('dashboardScreen')
};

// Buttons
const startPracticeBtn = document.getElementById('startPracticeBtn');
const startInterviewBtn = document.getElementById('startInterviewBtn');
const chatModeBtn = document.getElementById('chatModeBtn');
const voiceModeBtn = document.getElementById('voiceModeBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const practiceAgainBtn = document.getElementById('practiceAgainBtn');
const voiceAnswerBtn = document.getElementById('voiceAnswerBtn');
const viewDashboardBtnWelcome = document.getElementById('viewDashboardBtnWelcome');
const viewDashboardBtnSummary = document.getElementById('viewDashboardBtnSummary');
const backToHomeBtn = document.getElementById('backToHomeBtn');

// New UI Elements
const backToWelcomeBtn = document.getElementById('backToWelcomeBtn');
const backToRoleBtn = document.getElementById('backToRoleBtn');
const backToModeBtn = document.getElementById('backToModeBtn');
const finalRoundLabel = document.getElementById('finalRoundLabel');
const summaryNormalScore = document.getElementById('summaryNormalScore');
const summaryFinalScore = document.getElementById('summaryFinalScore');

// Inputs & UI Elements
const roleDropdown = document.getElementById('roleDropdown');
const customRoleInput = document.getElementById('customRoleInput');
const roleErrorMessage = document.getElementById('roleErrorMessage');
const resumeUploadInput = document.getElementById('resumeUploadInput');
const uploadResumeBtn = document.getElementById('uploadResumeBtn');
const uploadStatusMessage = document.getElementById('uploadStatusMessage');
const resumeSkillsSection = document.getElementById('resumeSkillsSection');
const resumeSkillsList = document.getElementById('resumeSkillsList');

const modeSelectedRole = document.getElementById('modeSelectedRole');
const progressIndicator = document.getElementById('progressIndicator');
const questionText = document.getElementById('questionText');
const answerTextarea = document.getElementById('answerTextarea');

// Feedback Section Elements
const feedbackSection = document.getElementById('feedbackSection');
const feedbackScore = document.getElementById('feedbackScore');
const feedbackStrengths = document.getElementById('feedbackStrengths');
const feedbackImprovements = document.getElementById('feedbackImprovements');

// Summary Section Elements
const summaryAverageScore = document.getElementById('summaryAverageScore');
const summaryStrengths = document.getElementById('summaryStrengths');
const summaryImprovements = document.getElementById('summaryImprovements');

// ==========================================
// CORE FUNCTIONS
// ==========================================

function showScreen(screenToShow) {
  Object.values(screens).forEach(screen => screen.classList.add('hidden'));
  screenToShow.classList.remove('hidden');
}

function loadQuestion() {
  isFeedbackShowing = false;
  
  progressIndicator.innerText = `Question ${currentQuestionIndex + 1} of ${dynamicQuestions.length}`;
  questionText.innerText = dynamicQuestions[currentQuestionIndex];
  
  answerTextarea.value = "";
  answerTextarea.placeholder = "Type your comprehensive answer here...";
  answerTextarea.style.border = "1px solid rgba(255, 255, 255, 0.1)";
  
  if (interviewMode === "chat") {
    answerTextarea.classList.remove('hidden');
    voiceAnswerBtn.classList.add('hidden');
  } else {
    answerTextarea.classList.remove('hidden'); // Show textarea to display transcribed text
    voiceAnswerBtn.classList.remove('hidden');
    voiceAnswerBtn.innerText = "Start Recording";
    if (isRecording && recognition) {
      recognition.stop();
    }
    isRecording = false;
  }

  feedbackSection.classList.add('hidden');
  nextQuestionBtn.innerText = "Evaluate Answer";
}

function getNextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < dynamicQuestions.length) {
    loadQuestion();
  } else {
    // End of Phase
    if (!isFinalRound) {
      isFinalRound = true;
      dynamicQuestions = generateFinalRoundQuestions();
      currentQuestionIndex = 0;
      if(finalRoundLabel) finalRoundLabel.classList.remove('hidden');
      loadQuestion();
    } else {
      showSummary();
    }
  }
}

function generateFinalRoundQuestions() {
  return [
    "Why should we hire you over other equally qualified candidates?",
    "Tell me about a significant failure. What went wrong and what did you learn?",
    "Explain your most complex project in detail, focusing on your specific contribution.",
    "What makes you fundamentally different from other professionals in this field?",
    "Describe a time you strongly disagreed with your supervisor. How did you handle it?",
    "How do you process and deliver negative feedback to a peer?",
    "Where do you genuinely see your career progressing in the next five years?",
    "Walk me through your methodology for prioritizing tasks under extreme pressure.",
    "Tell me about a time you had to pivot a major decision mid-project.",
    "What is your greatest professional weakness, and how do you mitigate it?",
    "Describe a technically demanding concept to me as if I were a beginner.",
    "How do you ensure continuous learning and stay current in your industry?",
    "Tell me about an instance where you worked with a difficult team member.",
    "What are your expectations for our company culture and management style?",
    "Do you have any questions for me regarding this role or the company?"
  ];
}

function showSummary() {
  const normTotal = normalScores.reduce((sum, current) => sum + current, 0);
  const normAvg = normalScores.length > 0 ? (normTotal / normalScores.length).toFixed(1) : "0.0";
  if(summaryNormalScore) summaryNormalScore.innerText = normAvg;

  const finalTotal = finalScores.reduce((sum, current) => sum + current, 0);
  const finalAvg = finalScores.length > 0 ? (finalTotal / finalScores.length).toFixed(1) : "0.0";
  if(summaryFinalScore) summaryFinalScore.innerText = finalAvg;

  const totalScore = scores.reduce((sum, current) => sum + current, 0);
  const avgScore = scores.length > 0 ? (totalScore / scores.length).toFixed(1) : "0.0";
  summaryAverageScore.innerText = avgScore;

  const allStrengths = new Set();
  const allImprovements = new Set();

  feedbackList.forEach(feedback => {
    feedback.strengths.forEach(s => allStrengths.add(s));
    feedback.improvements.forEach(i => allImprovements.add(i));
  });

  summaryStrengths.innerHTML = "";
  allStrengths.forEach(s => { summaryStrengths.innerHTML += `<li>${s}</li>`; });

  summaryImprovements.innerHTML = "";
  allImprovements.forEach(i => { summaryImprovements.innerHTML += `<li>${i}</li>`; });

  // SAVE TO BACKEND API (SUPABASE)
  const interviewData = {
    role: selectedRole,
    date: new Date().toLocaleDateString(),
    score: parseFloat(avgScore) || 0,
    strengths: Array.from(allStrengths),
    improvements: Array.from(allImprovements)
  };
  
  fetch(`${API_BASE_URL}/api/interview/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(interviewData)
  }).catch(err => console.error('Failed to save interview history:', err));

  showScreen(screens.summary);
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// 1. Welcome -> Role Selection
startPracticeBtn.addEventListener('click', () => {
  showScreen(screens.role);
});

// 2. Custom Role Field Logic
roleDropdown.addEventListener('change', () => {
  if (roleDropdown.value === "custom") {
    customRoleInput.classList.remove('hidden');
  } else {
    customRoleInput.classList.add('hidden');
  }
  roleErrorMessage.innerText = ""; 
});

// ==========================================
// RESUME UPLOAD LOGIC
// ==========================================
uploadResumeBtn.addEventListener('click', async () => {
  const file = resumeUploadInput.files[0];
  if (!file) {
    uploadStatusMessage.innerText = "❌ Please select a PDF file first.";
    uploadStatusMessage.style.color = "red";
    return;
  }

  if (file.type !== "application/pdf") {
    uploadStatusMessage.innerText = "❌ Only PDF files are supported.";
    uploadStatusMessage.style.color = "red";
    return;
  }

  uploadStatusMessage.innerText = "⏳ Uploading and analyzing resume...";
  uploadStatusMessage.style.color = "blue";
  uploadResumeBtn.disabled = true;

  const formData = new FormData();
  formData.append("resume", file);

  try {
    const response = await fetch(`${API_BASE_URL}/api/interview/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error("Upload failed.");

    const data = await response.json();
    
    // Success
    resumeQuestions = data.questions || [];
    usingResume = true;
    selectedRole = "Resume-Based Candidate";
    
    uploadStatusMessage.innerText = "✅ Resume analyzed successfully! (" + file.name + ")";
    uploadStatusMessage.style.color = "lime";
    
    // Display Skills
    resumeSkillsList.innerHTML = "";
    (data.skills || []).forEach(skill => {
      resumeSkillsList.innerHTML += `<li>${skill}</li>`;
    });
    resumeSkillsSection.classList.remove('hidden');

  } catch (error) {
    console.error(error);
    uploadStatusMessage.innerText = "❌ Failed to parse resume. Using default questions.";
    uploadStatusMessage.style.color = "red";
    usingResume = false;
  } finally {
    uploadResumeBtn.disabled = false;
  }
});

// 3. Role Selection -> Mode Selection
startInterviewBtn.addEventListener('click', () => {
  if (usingResume) {
    modeSelectedRole.innerText = selectedRole;
    showScreen(screens.mode);
    return;
  }

  const roleValue = roleDropdown.value;
  
  if (!roleValue) {
    roleErrorMessage.innerText = "Please select a role to continue.";
    return;
  }

  if (roleValue === "custom") {
    const customValue = customRoleInput.value.trim();
    if (!customValue) {
      roleErrorMessage.innerText = "Please enter your custom role.";
      return;
    }
    selectedRole = customValue;
  } else {
    selectedRole = roleDropdown.options[roleDropdown.selectedIndex].text;
  }

  modeSelectedRole.innerText = selectedRole;
  showScreen(screens.mode);
});

// 4. Mode Selection -> Interview Generation
chatModeBtn.addEventListener('click', () => {
  interviewMode = "chat";
  if (usingResume && resumeQuestions.length > 0) {
    dynamicQuestions = [...resumeQuestions];
  } else {
    dynamicQuestions = generateQuestionsByRole(selectedRole);
  }
  showScreen(screens.interview);
  loadQuestion();
});

voiceModeBtn.addEventListener('click', () => {
  interviewMode = "voice";
  if (usingResume && resumeQuestions.length > 0) {
    dynamicQuestions = [...resumeQuestions];
  } else {
    dynamicQuestions = generateQuestionsByRole(selectedRole);
  }
  showScreen(screens.interview);
  loadQuestion();
});

// ==========================================
// VOICE BUTTON LOGIC
// ==========================================
voiceAnswerBtn.addEventListener('click', () => {
  if (!SpeechRecognition) {
    alert("Voice not supported");
    return;
  }

  if (isRecording) {
    recognition.stop();
    isRecording = false;
    voiceAnswerBtn.innerText = "Start Recording";
  } else {
    answerTextarea.value = ""; // Clear for new recording
    recognition.start();
    isRecording = true;
    voiceAnswerBtn.innerText = "Stop Recording (Listening...)";
    answerTextarea.placeholder = "Listening to your answer...";
  }
});

// 5. Submit / Validate / Evaluate / Follow-up Flow
nextQuestionBtn.addEventListener('click', async () => {
  
  if (!isFeedbackShowing) {
    // If recording is still active when submitting, stop it
    if (isRecording && recognition) {
      recognition.stop();
      isRecording = false;
      voiceAnswerBtn.innerText = "Start Recording";
    }

    // Evaluation Stage
    const answer = answerTextarea.value.trim();
    
    if (!answer) {
      answerTextarea.placeholder = "❌ Please provide an answer before we proceed...";
      answerTextarea.style.border = "1px solid #ef4444";
      return;
    }

    // Show Loading State
    const originalBtnText = nextQuestionBtn.innerText;
    nextQuestionBtn.innerText = "Analyzing answer...";
    nextQuestionBtn.disabled = true;

    // Call Backend API
    const currentQuestion = dynamicQuestions[currentQuestionIndex];
    const evaluation = await evaluateAnswerAPI(currentQuestion, answer, selectedRole, interviewHistory);

    if (evaluation.error) {
      alert("AI evaluation failed. Try again.");
      nextQuestionBtn.innerText = originalBtnText;
      nextQuestionBtn.disabled = false;
      return;
    }

    // Analyze voice and append feedback if voice mode
    if (interviewMode === "voice") {
      const voiceFeedback = analyzeVoice(answer);
      evaluation.strengths = (evaluation.strengths || []).concat(voiceFeedback.strengths);
      evaluation.improvements = (evaluation.improvements || []).concat(voiceFeedback.improvements);
    }

    // Save history
    answers.push(answer);
    scores.push(evaluation.score);
    if (isFinalRound) {
      finalScores.push(evaluation.score);
    } else {
      normalScores.push(evaluation.score);
    }
    feedbackList.push(evaluation);
    interviewHistory.push({ question: currentQuestion, answer });

    // Apply exact feedback to the UI
    feedbackScore.innerText = evaluation.score;
    
    feedbackStrengths.innerHTML = "";
    (evaluation.strengths || []).forEach(s => { feedbackStrengths.innerHTML += `<li>${s}</li>`; });

    feedbackImprovements.innerHTML = "";
    (evaluation.improvements || []).forEach(i => { feedbackImprovements.innerHTML += `<li>${i}</li>`; });

    feedbackSection.classList.remove('hidden');

    // Intelligent Follow-up Check
    const followUp = generateFollowUp(answer);
    const isCurrentQuestionAFollowUp = currentQuestion.startsWith("[Follow-up]");
    
    // Insert rule-based follow up OR AI-generated adaptive nextQuestion
    if (followUp && !isCurrentQuestionAFollowUp) {
      dynamicQuestions.splice(currentQuestionIndex + 1, 0, "[Follow-up] " + followUp);
    } else if (evaluation.nextQuestion) {
      // Append Adaptive AI Question
      dynamicQuestions.splice(currentQuestionIndex + 1, 0, evaluation.nextQuestion);
    }

    isFeedbackShowing = true;
    nextQuestionBtn.innerText = "Proceed to Next Question";
    nextQuestionBtn.disabled = false;

  } else {
    // Proceed Stage
    getNextQuestion();
  }
});

// 6. Practice Again Reset Flow
practiceAgainBtn.addEventListener('click', () => {
  selectedRole = "";
  interviewMode = "";
  currentQuestionIndex = 0;
  answers = [];
  scores = [];
  normalScores = [];
  finalScores = [];
  isFinalRound = false;
  feedbackList = [];
  dynamicQuestions = [];
  interviewHistory = [];
  isFeedbackShowing = false;
  if(finalRoundLabel) finalRoundLabel.classList.add('hidden');

  resumeQuestions = [];
  usingResume = false;
  resumeUploadInput.value = "";
  uploadStatusMessage.innerText = "";
  resumeSkillsSection.classList.add('hidden');

  roleDropdown.selectedIndex = 0;
  customRoleInput.value = "";
  customRoleInput.classList.add('hidden');
  roleErrorMessage.innerText = "";
  
  showScreen(screens.welcome);
});

// Navigation Back Buttons
if (backToWelcomeBtn) {
  backToWelcomeBtn.addEventListener('click', () => {
    showScreen(screens.welcome);
  });
}

if (backToRoleBtn) {
  backToRoleBtn.addEventListener('click', () => {
    showScreen(screens.role);
  });
}

if (backToModeBtn) {
  backToModeBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to quit the interview? Progress will be lost.")) {
      if (isRecording && recognition) {
        recognition.stop();
        isRecording = false;
      }
      currentQuestionIndex = 0;
      answers = [];
      scores = [];
      normalScores = [];
      finalScores = [];
      feedbackList = [];
      isFinalRound = false;
      interviewHistory = [];
      isFeedbackShowing = false;
      if(finalRoundLabel) finalRoundLabel.classList.add('hidden');

      showScreen(screens.mode);
    }
  });
}

// ==========================================
// DASHBOARD LOGIC
// ==========================================
let scoreChartInstance = null;

async function loadDashboard() {
  showScreen(screens.dashboard);
  
  let historyData = [];
  try {
    const res = await fetch(`${API_BASE_URL}/api/interview/history`);
    if (res.ok) {
      historyData = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch dashboard history:', err);
  }
  const dashboardContent = document.getElementById('dashboardContent');
  const dashboardEmptyState = document.getElementById('dashboardEmptyState');
  
  if (historyData.length === 0) {
    dashboardContent.classList.add('hidden');
    dashboardEmptyState.classList.remove('hidden');
    return;
  }
  
  dashboardContent.classList.remove('hidden');
  dashboardEmptyState.classList.add('hidden');
  
  // Metrics
  document.getElementById('dashTotalInterviews').innerText = historyData.length;
  
  const totalScore = historyData.reduce((sum, item) => sum + item.score, 0);
  const avgOverallScore = (totalScore / historyData.length).toFixed(1);
  document.getElementById('dashAvgScore').innerText = avgOverallScore;
  
  const bestScore = Math.max(...historyData.map(item => item.score));
  document.getElementById('dashBestScore').innerText = bestScore;
  
  // Strengths & Improvements Analysis
  const strengthCounts = {};
  const improvementCounts = {};
  
  historyData.forEach(item => {
    (item.strengths || []).forEach(s => {
      strengthCounts[s] = (strengthCounts[s] || 0) + 1;
    });
    (item.improvements || []).forEach(i => {
      improvementCounts[i] = (improvementCounts[i] || 0) + 1;
    });
  });
  
  const topStrengths = Object.entries(strengthCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);
    
  const topImprovements = Object.entries(improvementCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);
    
  const dashTopStrengths = document.getElementById('dashTopStrengths');
  dashTopStrengths.innerHTML = "";
  if (topStrengths.length > 0) {
    topStrengths.forEach(s => { dashTopStrengths.innerHTML += `<li>${s}</li>`; });
  } else {
    dashTopStrengths.innerHTML = "<li>No data</li>";
  }
  
  const dashTopImprovements = document.getElementById('dashTopImprovements');
  dashTopImprovements.innerHTML = "";
  if (topImprovements.length > 0) {
    topImprovements.forEach(i => { dashTopImprovements.innerHTML += `<li>${i}</li>`; });
  } else {
    dashTopImprovements.innerHTML = "<li>No data</li>";
  }
  
  // History List
  const dashHistoryList = document.getElementById('dashHistoryList');
  dashHistoryList.innerHTML = "";
  
  // Reverse to show latest first
  const reversedHistory = [...historyData].reverse();
  reversedHistory.forEach(item => {
    dashHistoryList.innerHTML += `
      <li class="history-item">
        <div>
          <span class="history-item-role">${item.role}</span><br>
          <span class="history-item-date">${item.date}</span>
        </div>
        <div class="history-item-score">
          Score: ${item.score}
        </div>
      </li>
    `;
  });
  
  // Chart.js Graph
  const ctx = document.getElementById('scoreChart').getContext('2d');
  
  if (scoreChartInstance) {
    scoreChartInstance.destroy();
  }
  
  const labels = historyData.map((_, index) => `Int ${index + 1}`);
  const dataPoints = historyData.map(item => item.score);
  
  scoreChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Average Score',
        data: dataPoints,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#7C3AED',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: '#94A3B8' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#94A3B8' }
        }
      }
    }
  });
}

// 7. Navigation Event Listeners
if(viewDashboardBtnWelcome) {
  viewDashboardBtnWelcome.addEventListener('click', loadDashboard);
}

if(viewDashboardBtnSummary) {
  viewDashboardBtnSummary.addEventListener('click', loadDashboard);
}

if(backToHomeBtn) {
  backToHomeBtn.addEventListener('click', () => {
    showScreen(screens.welcome);
  });
}