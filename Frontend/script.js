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
    return "That was quite brief. Can you elaborate significantly more on that point in detail?";
  }
  
  // Topic-based follow-ups
  if (ansLower.includes("project")) {
    return "You mentioned a project. What specific technical or logical challenges did you face during that project, and how did you resolve them?";
  }
  if (ansLower.includes("team") || ansLower.includes("manager") || ansLower.includes("lead")) {
    return "Regarding your team interactions, how do you handle intense disagreements or conflicts with colleagues over critical decisions?";
  }
  if (ansLower.includes("bug") || ansLower.includes("error") || ansLower.includes("issue")) {
    return "When you encountered that issue, what was your exact step-by-step diagnostic process to find the root cause?";
  }

  return null; // No follow-up needed
}

// ==========================================
// REALISTIC ANSWER EVALUATOR
// ==========================================
function evaluateAnswer(answer) {
  const words = answer.toLowerCase().split(/\s+/);
  const length = answer.trim().length;
  
  // Lexical Analysis Keywords
  const keywords = ["project", "experience", "team", "built", "developed", "managed", "led", "created", "designed", "improved", "strategy", "data", "users", "code", "system", "app", "application", "learning", "growth", "challenge", "solution", "agile", "architecture", "deliver", "measure", "metric"];
  
  let keywordCount = 0;
  words.forEach(word => {
    if (keywords.some(kw => word.includes(kw))) {
      keywordCount++;
    }
  });

  let score = 5;
  let strengths = [];
  let improvements = [];

  // Short Answer Evaluator
  if (length < 30) {
    score = Math.floor(Math.random() * 2) + 4; // Score 4-5
    improvements.push("Your answer severely lacks depth and detail.");
    improvements.push("Elaborate significantly more on your points to prove competency.");
    strengths.push("Direct and concise response.");
  } 
  // Medium Answer Evaluator
  else if (length >= 30 && length < 100) {
    score = Math.floor(Math.random() * 2) + 6; // Score 6-7
    if (keywordCount >= 2) {
      score += 1; // Bump to 7/8 if keywords hit
      strengths.push("Good use of relevant professional terminology.");
    }
    strengths.push("Adequate structure and clarity in your explanation.");
    improvements.push("Provide more concrete examples and quantifiable results.");
    improvements.push("Expand deeper on the 'why' and 'how' of your actions.");
  } 
  // Detailed Answer Evaluator
  else {
    score = Math.floor(Math.random() * 2) + 8; // Score 8-9
    if (keywordCount >= 4) {
      score = 9; 
      strengths.push("Excellent integration of industry-specific language and action verbs.");
    }
    if (score > 10) score = 10;
    
    strengths.push("Strong communication, impressive depth, and confidence.");
    strengths.push("Well-structured, comprehensive, and convincing response.");
    if (keywordCount < 2) {
      improvements.push("Try to incorporate stronger action words (e.g., led, built, architected).");
    } else {
      improvements.push("Ensure you remain completely focused and avoid rambling.");
    }
  }

  // Cap score limits securely
  if (score > 10) score = 10;
  if (score < 1) score = 1;

  return { score, strengths, improvements };
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
    answerTextarea.classList.add('hidden');
    voiceAnswerBtn.classList.remove('hidden');
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

// 3. Role Selection -> Mode Selection
startInterviewBtn.addEventListener('click', () => {
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
  dynamicQuestions = generateQuestionsByRole(selectedRole);
  showScreen(screens.interview);
  loadQuestion();
});

voiceModeBtn.addEventListener('click', () => {
  interviewMode = "voice";
  dynamicQuestions = generateQuestionsByRole(selectedRole);
  showScreen(screens.interview);
  loadQuestion();
});

// 5. Submit / Validate / Evaluate / Follow-up Flow
nextQuestionBtn.addEventListener('click', () => {
  
  if (!isFeedbackShowing) {
    // Evaluation Stage
    const answer = interviewMode === "chat" ? answerTextarea.value.trim() : "Voice answer recorded";
    
    if (interviewMode === "chat" && !answer) {
      answerTextarea.placeholder = "❌ Please type an answer before we proceed...";
      answerTextarea.style.border = "1px solid #ef4444";
      return;
    }

    answers.push(answer);
    
    // Evaluate answer precisely based on length and lexicon
    const evaluation = evaluateAnswer(answer);
    scores.push(evaluation.score);
    feedbackList.push(evaluation);

    // Apply exact feedback to the UI
    feedbackScore.innerText = evaluation.score;
    
    feedbackStrengths.innerHTML = "";
    evaluation.strengths.forEach(s => { feedbackStrengths.innerHTML += `<li>${s}</li>`; });

    feedbackImprovements.innerHTML = "";
    evaluation.improvements.forEach(i => { feedbackImprovements.innerHTML += `<li>${i}</li>`; });

    feedbackSection.classList.remove('hidden');

    // Intelligent Follow-up Check
    const followUp = generateFollowUp(answer);
    const isCurrentQuestionAFollowUp = dynamicQuestions[currentQuestionIndex].startsWith("[Follow-up]");
    
    // Only insert a follow up if we are not already asking a follow up (prevents infinite loop!)
    if (followUp && !isCurrentQuestionAFollowUp) {
      dynamicQuestions.splice(currentQuestionIndex + 1, 0, "[Follow-up] " + followUp);
    }

    isFeedbackShowing = true;
    nextQuestionBtn.innerText = "Proceed to Next Question";

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
  isFeedbackShowing = false;

  roleDropdown.selectedIndex = 0;
  customRoleInput.value = "";
  customRoleInput.classList.add('hidden');
  roleErrorMessage.innerText = "";
  
  showScreen(screens.welcome);
});