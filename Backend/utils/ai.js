async function evaluateAnswer(answer) {
  // Placeholder AI evaluation
  // Later replace this with OpenAI / Google Gemini API call

  // Simple mock evaluation logic
  const score = Math.floor(Math.random() * 5) + 6; // Random score between 6-10
  const strengths = [
    "Clear explanation",
    "Good structure",
    "Relevant examples"
  ];
  const improvements = [
    "Add measurable achievements",
    "Be more confident",
    "Reduce filler words"
  ];

  return {
    score,
    strengths,
    improvements
  };
}

module.exports = { evaluateAnswer };