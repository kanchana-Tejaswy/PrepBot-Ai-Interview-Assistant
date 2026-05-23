// ==========================================
// THEME MANAGEMENT
// ==========================================
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const htmlElement = document.documentElement;

// Function to set theme
function setTheme(theme) {
  htmlElement.setAttribute('data-theme', theme);
  localStorage.setItem('prepbot-theme', theme);
  
  // Update icon
  if (themeToggle && themeIcon) {
    if (theme === 'light') {
      themeIcon.setAttribute('data-lucide', 'sun');
    } else {
      themeIcon.setAttribute('data-lucide', 'moon');
    }
  }
  
  // Re-initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// System Theme Detection & Initial Load
function initTheme() {
  const savedTheme = localStorage.getItem('prepbot-theme');
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    // Sync with system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }
}
initTheme();

// ==========================================
// MARKET LEADER: VOICE SYNTHESIS
// ==========================================
function speakText(text) {
  if ('speechSynthesis' in window) {
    // Stop any current speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Try to find a professional-sounding voice
    utterance.voice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Female')) || voices[0];
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    window.speechSynthesis.speak(utterance);
  }
}

// Toggle theme event listener
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  });
}

// ==========================================
// SCROLL REVEAL ANIMATIONS
// ==========================================
function initScrollReveal() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  
  // Apply a small timeout to ensure DOM is fully ready and painted
  setTimeout(() => {
    revealElements.forEach(el => {
      // Check if element is already in view on load
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add('active');
      } else {
        observer.observe(el);
      }
    });
  }, 100);
}

// Initialize on load
window.addEventListener('DOMContentLoaded', initScrollReveal);

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
let experienceMode = "coaching"; // "coaching" or "exam"

// ==========================================
// MOBILE NAVIGATION
// ==========================================
const mobileNavToggle = document.getElementById('mobileNavToggle');
const navLinks = document.querySelector('.nav-links');

if (mobileNavToggle) {
  mobileNavToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const icon = mobileNavToggle.querySelector('i');
    if (navLinks.classList.contains('active')) {
      icon.setAttribute('data-lucide', 'x');
    } else {
      icon.setAttribute('data-lucide', 'menu');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
}

// Close mobile nav when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
    if (mobileNavToggle) {
      mobileNavToggle.querySelector('i').setAttribute('data-lucide', 'menu');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });
});

// ==========================================
// VOICE INTEGRATION & AUDIO WAVEFORM
// ==========================================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecording = false;

// Audio Context Variables
let audioContext;
let analyser;
let microphone;
let javascriptNode;
let waveformCtx;
let animationFrameId;

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

async function startAudioVisualizer() {
  const canvas = document.getElementById('voiceWaveformCanvas');
  if (!canvas) return;
  
  canvas.classList.remove('hidden');
  waveformCtx = canvas.getContext('2d');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 64;

    microphone.connect(analyser);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);

    javascriptNode.onaudioprocess = function() {
      const array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      
      waveformCtx.clearRect(0, 0, canvas.width, canvas.height);
      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--danger').trim() || '#EF4444';
      waveformCtx.fillStyle = primaryColor;

      const bars = 10;
      const barWidth = (canvas.width / bars) - 2;
      for (let i = 0; i < bars; i++) {
        const value = array[i] || 0;
        const height = Math.max((value / 255) * canvas.height, 2);
        const x = i * (barWidth + 2);
        const y = (canvas.height - height) / 2;
        
        waveformCtx.beginPath();
        waveformCtx.roundRect(x, y, barWidth, height, 5);
        waveformCtx.fill();
      }
    };
  } catch (err) {
    console.error("Microphone access denied:", err);
  }
}

function stopAudioVisualizer() {
  const canvas = document.getElementById('voiceWaveformCanvas');
  if (canvas) canvas.classList.add('hidden');
  
  if (javascriptNode) javascriptNode.disconnect();
  if (analyser) analyser.disconnect();
  if (microphone) microphone.disconnect();
  if (audioContext) audioContext.close();
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
// HAPTIC FEEDBACK & MOOD BLOBS
// ==========================================
function triggerHaptic(type = 'light') {
  if (navigator.vibrate) {
    if (type === 'light') navigator.vibrate(10);
    if (type === 'heavy') navigator.vibrate([20, 30, 20]);
    if (type === 'success') navigator.vibrate([10, 50, 20, 50, 30]);
  }
}

function updateMoodBlobs(score) {
  const blob1 = document.querySelector('.blob-1');
  const blob2 = document.querySelector('.blob-2');
  if (!blob1 || !blob2) return;

  blob1.className = 'bg-blob blob-1';
  blob2.className = 'bg-blob blob-2';

  if (score >= 8) {
    blob1.classList.add('mood-excellent');
    blob2.classList.add('mood-excellent');
  } else if (score < 5) {
    blob1.classList.add('mood-warning');
    blob2.classList.add('mood-warning');
  }
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
      "How do you approach debugging a critical issue in production code?"
    ];
  } else if (r.includes("product") || r.includes("manager")) {
    return [
      "Could you start by formally introducing yourself and your background?",
      "Why did you choose product management as your professional focus?",
      "Describe a digital product you admire. What makes its UX/UI successful?",
      "How do you prioritize conflicting feature requests mathematically or logically?",
      "Tell me about a challenging leadership experience where you had to align a team."
    ];
  } else if (r.includes("marketing") || r.includes("sales") || r.includes("business")) {
    return [
      "Could you start by formally introducing yourself and your background?",
      "What drives your passion for marketing and sales strategy?",
      "Walk me through how you would architect a campaign to promote a new SaaS product.",
      "Which performance metrics do you consider most critical when evaluating a campaign?",
      "Describe a time you had to pivot a failing strategy under intense pressure."
    ];
  } else {
    return [
      "Could you start by formally introducing yourself and your background?",
      "What specifically draws you to this particular role and industry?",
      "Can you clearly explain your key strengths with concrete examples?",
      "Describe a significant project or responsibility you previously handled.",
      "Tell me about a time you overcame a difficult challenge or failure."
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
// Automatically switches between localhost for development and relative paths for Vercel production.
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000' 
  : ''; 

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
const getStartedNavBtn = document.getElementById('getStartedNavBtn');
const finalCtaBtn = document.getElementById('finalCtaBtn');
const startInterviewBtn = document.getElementById('startInterviewBtn');
const chatModeBtn = document.getElementById('chatModeBtn');
const voiceModeBtn = document.getElementById('voiceModeBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const practiceAgainBtn = document.getElementById('practiceAgainBtn');
const voiceAnswerBtn = document.getElementById('voiceAnswerBtn');
const viewDashboardBtnWelcome = document.getElementById('viewDashboardBtnWelcome');
const viewDashboardBtnSummary = document.getElementById('viewDashboardBtnSummary');
const backToHomeBtn = document.getElementById('backToHomeBtn');
const selectResumeBtn = document.getElementById('selectResumeBtn');

// New UI Elements
const backToWelcomeBtn = document.getElementById('backToWelcomeBtn');
const backToRoleBtn = document.getElementById('backToRoleBtn');
const backToModeBtn = document.getElementById('backToModeBtn');
const finalRoundLabel = document.getElementById('finalRoundLabel');
const appWrapper = document.querySelector('.app-wrapper');

// Experience Mode Buttons
const coachingModeBtn = document.getElementById('coachingModeBtn');
const examModeBtn = document.getElementById('examModeBtn');
const modeDescription = document.getElementById('modeDescription');

if (coachingModeBtn) {
  coachingModeBtn.addEventListener('click', () => {
    experienceMode = "coaching";
    coachingModeBtn.classList.add('active-mode');
    examModeBtn.classList.remove('active-mode');
    modeDescription.innerText = "Coaching: Receive instant feedback after every answer.";
  });
}

if (examModeBtn) {
  examModeBtn.addEventListener('click', () => {
    experienceMode = "exam";
    examModeBtn.classList.add('active-mode');
    coachingModeBtn.classList.remove('active-mode');
    modeDescription.innerText = "Simulated Exam: No feedback until the final report card.";
  });
}

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
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');
const progressBarFill = document.getElementById('progressBarFill');
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

// UX Enhancement Elements
const wordCountDisplay = document.getElementById('wordCountDisplay');
const answerStrengthBar = document.getElementById('answerStrengthBar');
const personaContainer = document.getElementById('personaContainer');
const personaAvatar = document.getElementById('personaAvatar');
const personaName = document.getElementById('personaName');
const personaRole = document.getElementById('personaRole');
const quickStartContainer = document.getElementById('quickStartContainer');
const quickStartBtn = document.getElementById('quickStartBtn');
const quickStartRole = document.getElementById('quickStartRole');
const voiceWaveform = document.getElementById('voiceWaveform');
const starToggle = document.getElementById('starToggle');
const starCoach = document.getElementById('starCoach');
const downloadReportBtn = document.getElementById('downloadReportBtn');

// ==========================================
// ELITE UX: MAGNETIC CTA & CAROUSEL
// ==========================================

// 1. Magnetic Hero Button
const heroCta = document.getElementById('startPracticeBtn');
if (heroCta) {
  document.addEventListener('mousemove', (e) => {
    const rect = heroCta.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Within 50px range
    if (Math.abs(x) < 80 && Math.abs(y) < 80) {
      heroCta.style.transform = `translate(\${x * 0.3}px, \${y * 0.3}px) scale(1.05)`;
    } else {
      heroCta.style.transform = 'translate(0, 0) scale(1)';
    }
  });
}

// 2. Testimonial Carousel Logic
let currentSlide = 0;
const sliderInner = document.getElementById('testimonialInner');
const dotsContainer = document.getElementById('carouselDots');
const totalSlides = document.querySelectorAll('.testimonial-card').length;

function initCarousel() {
  if (!sliderInner) return;
  
  // Create dots
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('div');
    dot.className = `dot \${i === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  }

  // Auto slide every 5s
  setInterval(() => {
    currentSlide = (currentSlide + 1) % totalSlides;
    goToSlide(currentSlide);
  }, 5000);
}

function goToSlide(index) {
  currentSlide = index;
  sliderInner.style.transform = `translateX(-\${index * 100}%)`;
  
  // Update dots
  document.querySelectorAll('.carousel-dots .dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

window.addEventListener('DOMContentLoaded', initCarousel);

// 3. STAR Coach Toggle
if (starToggle) {
  starToggle.addEventListener('click', () => {
    starCoach.classList.toggle('active');
    const icon = starToggle.querySelector('i');
    icon.setAttribute('data-lucide', starCoach.classList.contains('active') ? 'x' : 'help-circle');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
}

// ==========================================
// CORE FUNCTIONS
// ==========================================

function showScreen(screenToShow) {
  Object.values(screens).forEach(screen => screen.classList.add('hidden'));
  screenToShow.classList.remove('hidden');

  // Toggle app-wrapper visibility to prevent excessive scroll height on landing page
  if (appWrapper) {
    if (screenToShow === screens.welcome) {
      appWrapper.classList.add('hidden');
    } else {
      appWrapper.classList.remove('hidden');
    }
  }

  // Adaptive Header Links
  const navLinks = document.querySelector('.nav-links');
  if (screenToShow === screens.interview) {
    navLinks.innerHTML = `
      <a href="#" id="exitSimulatorBtn" style="color: var(--danger); font-weight: 800;"><i data-lucide="log-out"></i> Exit Simulator</a>
    `;
    document.getElementById('exitSimulatorBtn').addEventListener('click', (e) => {
      e.preventDefault();
      backToModeBtn.click();
    });
  } else if (screenToShow === screens.welcome) {
    navLinks.innerHTML = `
      <a href="#features">Features</a>
      <a href="#how-it-works">How it works</a>
      <a href="#testimonials">Reviews</a>
      <button id="themeToggle" title="Toggle Theme">
        <i data-lucide="${htmlElement.getAttribute('data-theme') === 'light' ? 'sun' : 'moon'}" id="themeIcon"></i>
      </button>
      <button onclick="document.getElementById('startPracticeBtn').click()" class="btn btn-nav">Get Started</button>
    `;
    // Re-attach theme toggle listener since we replaced the innerHTML
    const newThemeToggle = document.getElementById('themeToggle');
    if (newThemeToggle) {
      newThemeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
      });
    }
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function loadQuestion() {
  isFeedbackShowing = false;

  const question = dynamicQuestions[currentQuestionIndex];
  const totalQuestions = dynamicQuestions.length;
  
  // Update Visual Progress Bar
  const progressVal = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const prefix = isFinalRound ? "Final Round " : "";
  if (progressText) progressText.innerText = `\${prefix}Question \${currentQuestionIndex + 1} of \${totalQuestions}`;
  if (progressPercent) progressPercent.innerText = `\${Math.round(progressVal)}%`;
  if (progressBarFill) progressBarFill.style.width = `\${progressVal}%`;

  questionText.innerText = question;

  // AI Voice Synthesis: Speak the question
  speakText(question);

  // Reset Answer Field
  answerTextarea.value = "";
  answerTextarea.placeholder = "Type your comprehensive answer here...";
  updateWordCount(); // Reset word count UI

  // Sync Persona
  updatePersona();

  if (interviewMode === "chat") {
    answerTextarea.classList.remove('hidden');
    voiceAnswerBtn.classList.add('hidden');
    personaContainer.classList.remove('recording');
  } else {
    answerTextarea.classList.remove('hidden');
    voiceAnswerBtn.classList.remove('hidden');
    voiceAnswerBtn.innerText = "Start Recording";
    if (isRecording && recognition) {
      recognition.stop();
    }
    isRecording = false;
    personaContainer.classList.remove('recording');
  }

  feedbackSection.classList.add('hidden');
  nextQuestionBtn.innerText = "Evaluate Answer";
}

// ==========================================
// MARKET LEADER: FOCUS MODE
// ==========================================
const focusModeToggle = document.getElementById('focusModeToggle');
if (focusModeToggle) {
  focusModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('focus-mode');
    const isFocus = document.body.classList.contains('focus-mode');
    focusModeToggle.innerHTML = `<i data-lucide="\${isFocus ? 'eye' : 'eye-off'}"></i> \${isFocus ? 'Exit Focus' : 'Focus Mode'}`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    showToast(`Focus Mode \${isFocus ? 'Enabled' : 'Disabled'}`, 'info');
  });
}

// ==========================================
// MARKET LEADER: ONBOARDING TOUR
// ==========================================
const tourSteps = [
  { id: 'startPracticeBtn', text: "Ready to begin? Start your practice session here!" },
  { id: 'viewDashboardBtnWelcome', text: "Track your progress over time in the Analytics Dashboard." },
  { id: 'langToggle', text: "Change the app language anytime." }
];

function showTourStep(index) {
  if (index >= tourSteps.length) {
    localStorage.setItem('prepbot-tour-seen', 'true');
    cleanupTour();
    return;
  }

  cleanupTour();
  const step = tourSteps[index];
  const el = document.getElementById(step.id);
  if (!el) {
    showTourStep(index + 1);
    return;
  }

  el.classList.add('onboarding-highlight');

  const tooltip = document.createElement('div');
  tooltip.className = 'onboarding-tooltip';
  tooltip.id = 'tourTooltip';
  tooltip.innerHTML = `
    <p>\${step.text}</p>
    <button id="nextTourBtn" class="btn btn-nav" style="margin-top: 1rem; padding: 0.4rem 1rem; width: 100%;">Next</button>
  `;

  document.body.appendChild(tooltip);

  const rect = el.getBoundingClientRect();
  tooltip.style.top = `\${rect.bottom + 20}px`;
  tooltip.style.left = `\${rect.left + (rect.width/2) - 125}px`;

  document.getElementById('nextTourBtn').addEventListener('click', () => {
    showTourStep(index + 1);
  });
}

function cleanupTour() {
  document.querySelectorAll('.onboarding-highlight').forEach(el => el.classList.remove('onboarding-highlight'));
  const oldTooltip = document.getElementById('tourTooltip');
  if (oldTooltip) oldTooltip.remove();
}

function runOnboarding() {
  const hasSeenTour = localStorage.getItem('prepbot-tour-seen');
  if (hasSeenTour) return;

  setTimeout(() => showTourStep(0), 1000);
}

// ==========================================
// ACCESSIBILITY: KEYBOARD NAVIGATION
// ==========================================
document.addEventListener('keydown', (e) => {
  // Global shortcut: Alt + F for Focus Mode
  if (e.altKey && e.key === 'f') {
    if (focusModeToggle) focusModeToggle.click();
  }

  // Global shortcut: Alt + H for Home
  if (e.altKey && e.key === 'h') {
    showScreen(screens.welcome);
  }
});

function updatePersona() {
  const role = selectedRole.toLowerCase();
  let persona = { name: "AI Interviewer", role: "General Recruiter", icon: "user" };

  if (role.includes("software") || role.includes("developer") || role.includes("tech")) {
    persona = { name: "Sarah Chen", role: "Senior Engineering Manager", icon: "code" };
  } else if (role.includes("product") || role.includes("manager")) {
    persona = { name: "David Miller", role: "Director of Product", icon: "briefcase" };
  } else if (role.includes("marketing") || role.includes("sales")) {
    persona = { name: "Elena Rodriguez", role: "VP of Growth", icon: "trending-up" };
  } else if (role.includes("teacher") || role.includes("professor") || role.includes("education")) {
    persona = { name: "Dr. James Wilson", role: "Academic Dean", icon: "graduation-cap" };
  }

  personaName.innerText = persona.name;
  personaRole.innerText = persona.role;
  personaAvatar.innerHTML = `<i data-lucide="\${persona.icon}"></i>`;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function updateWordCount() {
  const text = answerTextarea.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  wordCountDisplay.innerText = `\${words} words`;

  // Strength Bar Logic
  let percentage = (words / 60) * 100; // 60 words is "ideal"
  if (percentage > 100) percentage = 100;

  answerStrengthBar.style.width = `\${percentage}%`;
  
  if (words < 20) {
    answerStrengthBar.style.background = "var(--danger)";
    wordCountDisplay.style.color = "var(--danger)";
  } else if (words < 60) {
    answerStrengthBar.style.background = "var(--accent)";
    wordCountDisplay.style.color = "var(--accent)";
  } else {
    answerStrengthBar.style.background = "var(--success)";
    wordCountDisplay.style.color = "var(--success)";
  }
}

// Event listener for word count
if (answerTextarea) {
  answerTextarea.addEventListener('input', updateWordCount);
  
  // Keyboard Shortcut: Ctrl + Enter to submit
  answerTextarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      nextQuestionBtn.click();
    }
  });
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
      
      // Elite Transition to Final Round
      if(finalRoundLabel) finalRoundLabel.classList.remove('hidden');
      progressBarFill.style.background = "linear-gradient(90deg, var(--accent), var(--danger))"; // Warning/Elite color
      showToast("Entering Final Round: High-impact questions!", "warning");
      triggerHaptic('heavy');
      
      loadQuestion();
    } else {
      // Complete interview
      progressBarFill.style.width = "100%";
      progressPercent.innerText = "100%";
      showToast("Interview Completed! Calculating final results...", "success");
      setTimeout(showSummary, 1500);
    }
  }
}

function generateFinalRoundQuestions() {
  return [
    "Why should we hire you over other equally qualified candidates?",
    "Tell me about a significant failure. What went wrong and what did you learn?"
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

  // Update Mood Blobs and trigger haptic based on performance
  updateMoodBlobs(parseFloat(avgScore));
  if (parseFloat(avgScore) >= 7) {
    triggerHaptic('success');
    // Elite Reward: Confetti Celebration
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4F46E5', '#818CF8', '#10B981']
    });
    showToast("Amazing job! You've aced this session.", "success");
  } else {
    triggerHaptic('heavy');
  }
}

// ==========================================
// SHARE ACHIEVEMENT CARD (HTML2CANVAS)
// ==========================================
const shareCardBtn = document.getElementById('shareCardBtn');
if (shareCardBtn) {
  shareCardBtn.addEventListener('click', async () => {
    const exportCard = document.getElementById('shareCardExport');
    const scoreText = document.getElementById('summaryAverageScore').innerText;
    
    document.getElementById('shareCardScore').innerText = scoreText;
    document.getElementById('shareCardRole').innerText = selectedRole;
    
    const originalText = shareCardBtn.innerHTML;
    shareCardBtn.innerHTML = "Generating Card...";
    shareCardBtn.disabled = true;

    try {
      exportCard.style.left = '0'; // Bring into view briefly to render
      exportCard.style.zIndex = '-1';
      
      const canvas = await html2canvas(exportCard, {
        scale: 2,
        backgroundColor: '#0B0F1A',
        logging: false
      });
      
      exportCard.style.left = '-9999px'; // Hide again

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PrepBot_Achievement_\${selectedRole.replace(/\\s+/g, '_')}.png`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Achievement Card downloaded!", "success");
      });
    } catch (err) {
      console.error("Share Card Error:", err);
      showToast("Failed to generate card.", "error");
    } finally {
      shareCardBtn.innerHTML = originalText;
      shareCardBtn.disabled = false;
    }
  });
}

// ==========================================
// ELITE UX: PDF EXPORT
// ==========================================
async function downloadPDFReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const reportElement = document.getElementById('summaryScreen');
  const downloadBtn = document.getElementById('downloadReportBtn');
  
  downloadBtn.innerText = "Generating PDF...";
  downloadBtn.disabled = true;

  try {
    const canvas = await html2canvas(reportElement, {
      scale: 2,
      backgroundColor: '#0B0F1A', // Force dark theme for PDF
      logging: false,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    const imgProps = doc.getImageProperties(imgData);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    doc.save(`PrepBot_Report_\${selectedRole}_\${new Date().toLocaleDateString()}.pdf`);
    showToast("Report downloaded successfully!", "success");
  } catch (err) {
    console.error("PDF Export Error:", err);
    showToast("Failed to generate PDF.", "error");
  } finally {
    downloadBtn.innerHTML = '<i data-lucide="download"></i> Download My Report (PDF)';
    downloadBtn.disabled = false;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

if (downloadReportBtn) {
  downloadReportBtn.addEventListener('click', downloadPDFReport);
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// 1. Welcome -> Role Selection
if (startPracticeBtn) {
  startPracticeBtn.addEventListener('click', () => {
    showScreen(screens.role);
  });
}

if (getStartedNavBtn) {
  getStartedNavBtn.addEventListener('click', () => {
    showScreen(screens.role);
  });
}

if (finalCtaBtn) {
  finalCtaBtn.addEventListener('click', () => {
    showScreen(screens.role);
  });
}

if (selectResumeBtn) {
  selectResumeBtn.addEventListener('click', () => {
    resumeUploadInput.click();
  });
}

// 2. Custom Role Field Logic
if (roleDropdown) {
  roleDropdown.addEventListener('change', () => {
    if (roleDropdown.value === "custom") {
      customRoleInput.classList.remove('hidden');
    } else {
      customRoleInput.classList.add('hidden');
    }
    roleErrorMessage.innerText = ""; 
  });
}

// ==========================================
// RESUME UPLOAD LOGIC
// ==========================================
if (resumeUploadInput) {
  resumeUploadInput.addEventListener('change', async () => {
    const file = resumeUploadInput.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      uploadStatusMessage.innerText = "❌ Only PDF files are supported.";
      return;
    }

    uploadStatusMessage.innerText = "⏳ Uploading and analyzing resume...";
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
      resumeQuestions = (data.questions || []).slice(0, 5);
      usingResume = true;
      selectedRole = "Resume-Based Candidate";
      
      uploadStatusMessage.innerText = "✅ Resume analyzed: " + file.name;
      
      // Display Skills
      resumeSkillsList.innerHTML = "";
      (data.skills || []).forEach(skill => {
        resumeSkillsList.innerHTML += `<li>${skill}</li>`;
      });
      resumeSkillsSection.classList.remove('hidden');

    } catch (error) {
      console.error(error);
      uploadStatusMessage.innerText = "❌ Failed to parse resume.";
      usingResume = false;
    } finally {
      uploadResumeBtn.disabled = false;
    }
  });
}

if (uploadResumeBtn) {
  uploadResumeBtn.addEventListener('click', () => {
    if (!resumeUploadInput.files[0]) {
      resumeUploadInput.click();
    } else {
      startInterviewBtn.click();
    }
  });
}

// 3. Role Selection -> Mode Selection
if (startInterviewBtn) {
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
}

// 4. Mode Selection -> Interview Generation
if (chatModeBtn) {
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
}

if (voiceModeBtn) {
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
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    background: var(--bg-secondary);
    color: var(--text-inverse);
    padding: 1rem 1.5rem;
    border-radius: var(--radius-md);
    border-left: 4px solid \${type === 'error' ? 'var(--danger)' : type === 'success' ? 'var(--success)' : 'var(--primary)'};
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
    font-size: 0.9rem;
    animation: slideIn 0.3s ease forwards;
  `;

  const iconName = type === 'error' ? 'alert-circle' : type === 'success' ? 'check-circle' : 'info';
  toast.innerHTML = `<i data-lucide="\${iconName}" style="width: 18px; height: 18px;"></i> <span>\${message}</span>`;
  
  container.appendChild(toast);
  if (typeof lucide !== 'undefined') lucide.createIcons();

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Add animations to style.css dynamically if not present
const style = document.createElement('style');
style.innerHTML = `
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes fadeOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

// ==========================================
// VOICE BUTTON LOGIC
// ==========================================
if (voiceAnswerBtn) {
  voiceAnswerBtn.addEventListener('click', () => {
    if (!SpeechRecognition) {
      showToast("Voice recognition is not supported in this browser.", "error");
      return;
    }

    if (isRecording) {
      recognition.stop();
      isRecording = false;
      voiceAnswerBtn.innerText = "Start Recording";
      personaContainer.classList.remove('recording');
      stopAudioVisualizer();
      triggerHaptic('light');
    } else {
      answerTextarea.value = ""; // Clear for new recording
      recognition.start();
      isRecording = true;
      voiceAnswerBtn.innerText = "Stop Recording (Listening...)";
      answerTextarea.placeholder = "Listening to your answer...";
      personaContainer.classList.add('recording');
      startAudioVisualizer();
      triggerHaptic('heavy');
    }
  });
}

// 5. Submit / Validate / Evaluate / Follow-up Flow
if (nextQuestionBtn) {
  nextQuestionBtn.addEventListener('click', async () => {
    
    if (!isFeedbackShowing) {
      // Save last practiced role for Quick Start
      localStorage.setItem('prepbot-last-role', selectedRole);

      // If recording is still active when submitting, stop it
      if (isRecording && recognition) {
        recognition.stop();
        isRecording = false;
        voiceAnswerBtn.innerText = "Start Recording";
        personaContainer.classList.remove('recording');
      }

      // Evaluation Stage
      const answer = answerTextarea.value.trim();
      
      if (!answer) {
        answerTextarea.placeholder = "❌ Please provide an answer before we proceed...";
        return;
      }

      // Show Loading State
      const originalBtnText = nextQuestionBtn.innerText;
      nextQuestionBtn.innerText = "Analyzing answer...";
      nextQuestionBtn.disabled = true;

      // Show Skeleton Loader
      const feedbackSkeleton = document.getElementById('feedbackSkeleton');
      const feedbackContent = document.getElementById('feedbackContent');
      if (experienceMode === "coaching") {
        feedbackSection.classList.remove('hidden');
        feedbackSkeleton.classList.remove('hidden');
        feedbackContent.classList.add('hidden');
      }

      // Call Backend API
      const currentQuestion = dynamicQuestions[currentQuestionIndex];
      const evaluation = await evaluateAnswerAPI(currentQuestion, answer, selectedRole, interviewHistory);

      if (evaluation.error) {
        showToast("AI evaluation failed. Please try again.", "error");
        nextQuestionBtn.innerText = originalBtnText;
        nextQuestionBtn.disabled = false;
        if (experienceMode === "coaching") feedbackSection.classList.add('hidden');
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
      
      // Dynamic Score Coloring
      const scoreBadge = document.querySelector('.score-badge');
      if (scoreBadge) {
        scoreBadge.style.background = evaluation.score < 5 ? 'var(--danger)' : 
                                     evaluation.score < 8 ? 'var(--accent)' : 'var(--success)';
      }

      feedbackStrengths.innerHTML = "";
      (evaluation.strengths || []).forEach(s => { 
        feedbackStrengths.innerHTML += `<li>\${s}</li>`; 
      });

      feedbackImprovements.innerHTML = "";
      (evaluation.improvements || []).forEach((i, idx) => { 
        const li = document.createElement('li');
        li.innerHTML = `\${i} <button class="how-to-fix-btn" data-answer="\${answer.replace(/"/g, '&quot;')}" data-index="\${idx}">How to fix?</button>`;
        feedbackImprovements.appendChild(li);
      });

      // Delegate event for "How to fix" buttons
      feedbackImprovements.onclick = (e) => {
        if (e.target.classList.contains('how-to-fix-btn')) {
          showStarBreakdown(e.target.getAttribute('data-answer'));
        }
      };

      if (experienceMode === "coaching") {
        feedbackSkeleton.classList.add('hidden');
        feedbackContent.classList.remove('hidden');
        isFeedbackShowing = true;
        nextQuestionBtn.innerText = "Proceed to Next Question";
        nextQuestionBtn.disabled = false;
      } else {
        // Exam Mode: No instant feedback, just proceed
        feedbackSection.classList.add('hidden');
        getNextQuestion();
      }

      // Intelligent Follow-up Check

    } else {
      // Proceed Stage
      getNextQuestion();
    }
  });
}

// 6. Practice Again Reset Flow
if (practiceAgainBtn) {
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
}

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
// MARKET LEADER: STAR BREAKDOWN MODAL
// ==========================================
function showStarBreakdown(answer, index) {
  // Create Modal on the fly
  const modal = document.createElement('div');
  modal.className = 'star-breakdown-modal';
  modal.id = 'starModal';
  
  // Logical splitting of answer into STAR for demo/educational purposes
  const words = answer.split(' ');
  const chunk = Math.ceil(words.length / 4);
  
  modal.innerHTML = `
    <h3 style="margin-bottom: 1.5rem; color: var(--primary);">Educational STAR Breakdown</h3>
    <div style="text-align: left; line-height: 1.6;">
      <p style="margin-bottom: 1rem; font-size: 0.85rem; opacity: 0.8;">Here is how you can restructure your answer:</p>
      <div class="star-point"><strong>Situation:</strong> \${words.slice(0, chunk).join(' ')}...</div>
      <div class="star-point"><strong>Task:</strong> \${words.slice(chunk, chunk*2).join(' ')}...</div>
      <div class="star-point"><strong>Action:</strong> \${words.slice(chunk*2, chunk*3).join(' ')}...</div>
      <div class="star-point"><strong>Result:</strong> \${words.slice(chunk*3).join(' ')}...</div>
    </div>
    <button class="btn btn-cta" style="margin-top: 2rem; width: 100%;" onclick="document.getElementById('starModal').remove()">Got it!</button>
  `;
  
  document.body.appendChild(modal);
}

// ==========================================
// DASHBOARD LOGIC
// ==========================================
let scoreChartInstance = null;
let radarChartInstance = null;

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
  
  const reversedHistory = [...historyData].reverse();
  reversedHistory.forEach(item => {
    dashHistoryList.innerHTML += `
      <li class="history-item">
        <div>
          <span class="history-item-role" style="font-weight: 700; color: var(--text-inverse);">${item.role}</span><br>
          <span class="history-item-date" style="font-size: 0.85rem; color: var(--text-muted);">${item.date}</span>
        </div>
        <div class="history-item-score" style="font-weight: 800; color: var(--primary); font-size: 1.2rem;">
          ${item.score}
        </div>
      </li>
    `;
  });
  
  // Chart.js Line Graph
  const ctx = document.getElementById('scoreChart').getContext('2d');
  
  if (scoreChartInstance) {
    scoreChartInstance.destroy();
  }
  
  const labels = historyData.map((_, index) => `Int \${index + 1}`);
  const dataPoints = historyData.map(item => item.score);
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  
  scoreChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Average Score',
        data: dataPoints,
        borderColor: primaryColor,
        backgroundColor: `\${primaryColor}33`,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: primaryColor,
        pointRadius: 5,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 10, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94A3B8' } },
        x: { grid: { display: false }, ticks: { color: '#94A3B8' } }
      }
    }
  });

  // Chart.js Radar Chart
  const radarCtx = document.getElementById('radarChart').getContext('2d');
  if (radarChartInstance) radarChartInstance.destroy();

  // Mock calculation based on recent scores for visualization
  const recentScore = dataPoints[dataPoints.length - 1] || 5;
  const radarData = [
    Math.min(10, recentScore + 1.2), // Technical
    Math.min(10, recentScore + 0.5), // Comm
    Math.min(10, recentScore - 0.5), // STAR
    Math.min(10, recentScore + 0.8), // Confidence
    Math.min(10, recentScore - 1.0)  // Conciseness
  ];

  radarChartInstance = new Chart(radarCtx, {
    type: 'radar',
    data: {
      labels: ['Technical', 'Communication', 'STAR Structure', 'Confidence', 'Conciseness'],
      datasets: [{
        label: 'Skill Profile',
        data: radarData,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10B981',
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#10B981'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          pointLabels: { color: '#F8FAFC', font: { size: 10 } },
          ticks: { display: false, min: 0, max: 10 }
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

// ==========================================
// INITIALIZATION
// ==========================================
// Synchronize screen state on load to prevent ghost scroll space
showScreen(screens.welcome);

// Quick Start (Jump Back In) Logic
const lastRole = localStorage.getItem('prepbot-last-role');
if (lastRole && quickStartContainer) {
  quickStartRole.innerText = lastRole;
  quickStartContainer.classList.remove('hidden');

  quickStartBtn.addEventListener('click', () => {
    selectedRole = lastRole;
    modeSelectedRole.innerText = selectedRole;
    showScreen(screens.mode);
  });
}

// ==========================================
// ELITE UX: DAILY STREAKS (Gamification)
// ==========================================
function updateStreak() {
  const streakCountEl = document.getElementById('streakCount');
  if (!streakCountEl) return;

  const today = new Date().toLocaleDateString();
  let lastPracticeDate = localStorage.getItem('prepbot-last-date');
  let currentStreak = parseInt(localStorage.getItem('prepbot-streak')) || 0;

  if (lastPracticeDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastPracticeDate === yesterday.toLocaleDateString()) {
      currentStreak += 1;
    } else if (lastPracticeDate) {
      currentStreak = 1; // Reset if they missed a day
    } else {
      currentStreak = 1; // First time
    }
    
    localStorage.setItem('prepbot-last-date', today);
    localStorage.setItem('prepbot-streak', currentStreak);
  }
  
  streakCountEl.innerText = currentStreak;
  if (currentStreak > 0) {
    document.querySelector('.nav-streak i').style.color = '#EF4444'; // Fire red
  }
}
updateStreak(); // Call on load

// ==========================================
// MULTI-LANGUAGE UI SUPPORT
// ==========================================
const translations = {
  en: { nav_features: "Features", nav_how: "How it works", nav_reviews: "Reviews", nav_start: "Get Started" },
  es: { nav_features: "Características", nav_how: "Cómo funciona", nav_reviews: "Reseñas", nav_start: "Empezar" },
  fr: { nav_features: "Fonctionnalités", nav_how: "Comment ça marche", nav_reviews: "Avis", nav_start: "Commencer" }
};

let currentLang = 'en';
const langToggleBtn = document.getElementById('langToggle');
if (langToggleBtn) {
  langToggleBtn.addEventListener('click', () => {
    const langs = ['en', 'es', 'fr'];
    let idx = langs.indexOf(currentLang);
    currentLang = langs[(idx + 1) % langs.length];
    
    document.getElementById('currentLang').innerText = currentLang.toUpperCase();
    
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[currentLang] && translations[currentLang][key]) {
        el.innerText = translations[currentLang][key];
      }
    });
    
    showToast(`Language switched to \${currentLang.toUpperCase()}`, 'info');
  });
}

// 8. Final App Initialization
window.addEventListener('load', () => {
  runOnboarding();
});
