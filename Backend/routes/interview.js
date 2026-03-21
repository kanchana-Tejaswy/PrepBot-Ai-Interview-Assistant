const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { evaluateAnswer, analyzeResume } = require('../utils/ai');

// Configure multer for file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/interview/evaluate
router.post('/evaluate', async (req, res) => {
  try {
    const { question, answer, role, history } = req.body;

    if (!question || !answer || !role) {
      return res.status(400).json({ error: "question, answer, and role are required." });
    }

    // Call the AI utility function
    const evaluation = await evaluateAnswer(question, answer, role, history);
    res.json(evaluation);

  } catch (error) {
    console.error("Route Evaluation Error:", error);
    
    // Fallback response for safe UI rendering
    res.status(500).json({ 
      error: "Server error during AI evaluation.",
      score: 0,
      strengths: [],
      improvements: ["Internal system failure avoiding complete evaluation."],
      nextQuestion: "Let's move on. Can you describe your proudest professional achievement?"
    });
  }
});

// POST /api/interview/upload
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded." });
    }

    // Extract text from PDF buffer
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Could not extract text from the provided PDF." });
    }

    // Analyze extracted text using AI
    const analysis = await analyzeResume(text);
    res.json(analysis);

  } catch (error) {
    console.error("Route Resume Upload Error:", error);
    
    // Fallback response
    res.status(500).json({ 
      error: "Server error during resume parsing.",
      skills: [],
      projects: [],
      questions: [
        "Can you deeply describe the exact experiences on your resume?",
        "What specific project are you proudest of?",
        "What key learnings have shaped your career?",
        "Describe a major hurdle you solved at your last job.",
        "Why does your background make you an ideal candidate?"
      ]
    });
  }
});

module.exports = router;