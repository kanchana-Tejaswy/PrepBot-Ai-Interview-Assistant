// --- Step 1: Get DOM Elements ---
const startBtn = document.getElementById('startBtn');
const welcomeScreen = document.getElementById('welcomeScreen');
const roleScreen = document.getElementById('roleScreen');
const roleSelect = document.getElementById('roleSelect');
const customRoleInput = document.getElementById('customRoleInput');
const startInterviewBtn = document.getElementById('startInterviewBtn');

// State
let selectedRole = "";

// --- Step 2: Show Role Selection on Start ---
startBtn.addEventListener('click', () => {
  welcomeScreen.classList.add('hidden');
  roleScreen.classList.remove('hidden');
});

// --- Step 3: Show Custom Role Input if "Custom Role" selected ---
roleSelect.addEventListener('change', () => {
  if (roleSelect.value === "custom") {
    customRoleInput.classList.remove('hidden');
  } else {
    customRoleInput.classList.add('hidden');
  }
});

// --- Step 4: Save Role and Start Interview ---
startInterviewBtn.addEventListener('click', () => {
  if (roleSelect.value === "") {
    alert("Please select a role to continue!");
    return;
  }

  if (roleSelect.value === "custom") {
    if (customRoleInput.value.trim() === "") {
      alert("Please enter your custom role!");
      return;
    }
    selectedRole = customRoleInput.value.trim();
  } else {
    selectedRole = roleSelect.value;
  }

  alert(`Starting interview for: ${selectedRole}`);

  // TODO: Move to Interview Screen
  console.log("Selected Role:", selectedRole);
});

// --- Step 1: Get new DOM Elements ---
const interviewScreen = document.getElementById('interviewScreen');
const displayRole = document.getElementById('displayRole');
const chatModeBtn = document.getElementById('chatModeBtn');
const voiceModeBtn = document.getElementById('voiceModeBtn');
const questionContainer = document.getElementById('questionContainer');
const questionText = document.getElementById('questionText');
const answerInput = document.getElementById('answerInput');
const startVoiceBtn = document.getElementById('startVoiceBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');

// --- Sample Questions ---
const questions = [
  "Tell me about yourself.",
  "What are your strengths and weaknesses?",
  "Describe a challenging project you worked on.",
  "How do you debug a problem?"
];
let currentQuestionIndex = 0;
let interviewMode = "";

// --- Step 2: Move from Role Screen to Interview Screen ---
startInterviewBtn.addEventListener('click', () => {
  // Hide role screen
  roleScreen.classList.add('hidden');

  // Show interview screen
  interviewScreen.classList.remove('hidden');

  // Display selected role
  displayRole.textContent = selectedRole;
});

// --- Step 3: Select Chat or Voice Mode ---
chatModeBtn.addEventListener('click', () => {
  interviewMode = "chat";
  questionContainer.classList.remove('hidden');
  answerInput.classList.remove('hidden');
  startVoiceBtn.classList.add('hidden');
  nextQuestionBtn.classList.remove('hidden');
  loadQuestion();
});

voiceModeBtn.addEventListener('click', () => {
  interviewMode = "voice";
  questionContainer.classList.remove('hidden');
  answerInput.classList.add('hidden');
  startVoiceBtn.classList.remove('hidden');
  nextQuestionBtn.classList.remove('hidden');
  loadQuestion();
});

// --- Step 4: Load Question ---
function loadQuestion() {
  if (currentQuestionIndex < questions.length) {
    questionText.textContent = questions[currentQuestionIndex];
    if (interviewMode === "chat") {
      answerInput.value = "";
    }
  } else {
    alert("Interview Completed! (Next, we will add AI evaluation)");
    // TODO: Move to Session Summary Screen
  }
}

// --- Step 5: Next Question ---
nextQuestionBtn.addEventListener('click', () => {
  // Here you can send answer to AI for evaluation later
  if (interviewMode === "chat") {
    console.log("Answer:", answerInput.value);
  } else if (interviewMode === "voice") {
    console.log("Voice answer placeholder");
  }

  currentQuestionIndex++;
  loadQuestion();
});

// --- Send answer to backend AI for evaluation ---
async function sendAnswerToAI(answer) {
  try {
    const response = await fetch('http://localhost:5000/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer })
    });

    const data = await response.json();

    // Display AI feedback
    displayFeedback(data);
  } catch (error) {
    console.error(error);
  }
}

// --- Display AI Feedback ---
function displayFeedback(data) {
  const { score, strengths, improvements } = data;

  // Clear previous feedback if exists
  let feedbackDiv = document.getElementById('feedbackDiv');
  if (!feedbackDiv) {
    feedbackDiv = document.createElement('div');
    feedbackDiv.id = 'feedbackDiv';
    questionContainer.appendChild(feedbackDiv);
  }
  feedbackDiv.innerHTML = `
    <h3>Feedback</h3>
    <p><strong>Score:</strong> ${score}/10</p>
    <p><strong>Strengths:</strong></p>
    <ul>${strengths.map(s => `<li>${s}</li>`).join('')}</ul>
    <p><strong>Improvements:</strong></p>
    <ul>${improvements.map(i => `<li>${i}</li>`).join('')}</ul>
  `;
}

// --- Modify Next Question Button to send AI request ---
nextQuestionBtn.addEventListener('click', async () => {
  let answer = "";
  if (interviewMode === "chat") {
    answer = answerInput.value;
  } else if (interviewMode === "voice") {
    answer = "Voice answer placeholder"; // Placeholder
  }

  // Send to AI backend
  await sendAnswerToAI(answer);

  // Move to next question after showing feedback
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    loadQuestion();
  } else {
    alert("Interview Completed! Check all feedback above.");
    // TODO: Move to Session Summary Screen
  }
});

// --- New Variables ---
const summaryScreen = document.getElementById('summaryScreen');
const averageScoreElem = document.getElementById('averageScore');
const summaryStrengths = document.getElementById('summaryStrengths');
const summaryImprovements = document.getElementById('summaryImprovements');
const practiceAgainBtn = document.getElementById('practiceAgainBtn');

// Store all AI feedback
let feedbackList = [];

// --- Modify Next Question Button ---
nextQuestionBtn.addEventListener('click', async () => {
  let answer = "";
  if (interviewMode === "chat") {
    answer = answerInput.value;
  } else if (interviewMode === "voice") {
    answer = "Voice answer placeholder";
  }

  // Send to AI backend
  const data = await sendAnswerToAI(answer);

  // Save feedback
  feedbackList.push(data);

  // Move to next question
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    loadQuestion();
  } else {
    // Interview completed
    showSummaryScreen();
  }
});

// --- Display Summary Screen ---
function showSummaryScreen() {
  interviewScreen.classList.add('hidden');
  summaryScreen.classList.remove('hidden');

  // Calculate average score
  const totalScore = feedbackList.reduce((sum, f) => sum + f.score, 0);
  const avgScore = (totalScore / feedbackList.length).toFixed(1);
  averageScoreElem.textContent = avgScore;

  // Aggregate strengths & improvements
  const allStrengths = new Set();
  const allImprovements = new Set();

  feedbackList.forEach(f => {
    f.strengths.forEach(s => allStrengths.add(s));
    f.improvements.forEach(i => allImprovements.add(i));
  });

  summaryStrengths.innerHTML = Array.from(allStrengths)
    .map(s => `<li>${s}</li>`).join('');
  summaryImprovements.innerHTML = Array.from(allImprovements)
    .map(i => `<li>${i}</li>`).join('');
}

// --- Practice Again ---
practiceAgainBtn.addEventListener('click', () => {
  // Reset variables
  currentQuestionIndex = 0;
  feedbackList = [];
  selectedRole = "";
  interviewMode = "";

  // Hide summary, show welcome screen
  summaryScreen.classList.add('hidden');
  welcomeScreen.classList.remove('hidden');
});