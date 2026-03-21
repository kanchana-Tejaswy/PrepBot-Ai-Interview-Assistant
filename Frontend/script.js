// ==========================================
// STATE MANAGEMENT & VARIABLES
// ==========================================
let selectedRole = "";
let interviewMode = "";
let currentQuestionIndex = 0;
let answers = [];
let scores = [];
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
// REALISTIC ANSWER EVALUATOR (API)
// ==========================================
async function evaluateAnswerAPI(question, answer, role, history) {
  try {
    const response = await fetch('http://localhost:5000/api/interview/evaluate', {
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
  summary: document.getElementById('summaryScreen')
};

// Buttons
const startPracticeBtn = document.getElementById('startPracticeBtn');
const startInterviewBtn = document.getElementById('startInterviewBtn');
const chatModeBtn = document.getElementById('chatModeBtn');
const voiceModeBtn = document.getElementById('voiceModeBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const practiceAgainBtn = document.getElementById('practiceAgainBtn');
const voiceAnswerBtn = document.getElementById('voiceAnswerBtn');

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
    showSummary();
  }
}

function showSummary() {
  const totalScore = scores.reduce((sum, current) => sum + current, 0);
  const avgScore = (totalScore / scores.length).toFixed(1);
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
    const response = await fetch('http://localhost:5000/api/interview/upload', {
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
  feedbackList = [];
  dynamicQuestions = [];
  interviewHistory = [];
  isFeedbackShowing = false;

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