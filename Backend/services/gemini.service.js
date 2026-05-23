const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env.config');

// Initialize the Gemini AI client
// We instantiate it lazily or check if key exists to prevent crashing if the key is missing
let genAI = null;
if (config.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
}

/**
 * Generates a list of interview questions based on the role and previous answers.
 */
const generateQuestion = async (role, previousAnswers = []) => {
    try {
        if (!genAI) {
            console.warn('[GeminiService] No API key configured. Returning mock question.');
            return `MOCK QUESTION: Can you tell me about your experience as a ${role}?`;
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `You are an expert HR technical interviewer. The candidate is applying for the role of: ${role}.
        Previous answers provided by the candidate: ${JSON.stringify(previousAnswers)}.
        Based on the role and their previous answers, generate ONE highly relevant, challenging, yet realistic interview question.
        Do not include extra conversational text, output only the question itself.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return responseText.trim();
    } catch (error) {
        console.error('[GeminiService] Error in generateQuestion:', error.message);
        return `MOCK QUESTION: Can you tell me about your experience as a ${role}?`;
    }
};

/**
 * Evaluates a candidate's answer for a specific role.
 */
const evaluateAnswer = async (question, answer, role, history = []) => {
    try {
        if (!genAI) {
            console.warn('[GeminiService] No API key configured. Returning mock evaluation.');
            return {
                score: 7,
                strengths: ["Clear structure", "Relevant examples"],
                improvements: ["Expand on technical detail", "Be more concise"],
                nextQuestion: null
            };
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `You are an expert HR interviewer evaluating a candidate for the role of ${role}.
        The question asked was:
        "${question}"
        The candidate answered:
        "${answer}"

        Use the candidate's history to provide context if helpful:
        ${JSON.stringify(history)}

        Respond in valid JSON only using this exact schema:
        {
          "score": 0,
          "strengths": ["Strength 1", "Strength 2"],
          "improvements": ["Improvement 1", "Improvement 2"],
          "nextQuestion": "Optional follow-up question or null"
        }
        Do not add any text outside the JSON object.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

        try {
            const parsed = JSON.parse(cleanText);
            return {
                score: Number(parsed.score) || 0,
                strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
                improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
                nextQuestion: parsed.nextQuestion || null
            };
        } catch (parseError) {
            console.warn('[GeminiService] Failed to parse evaluation JSON, returning fallback object.');
            return {
                score: 0,
                strengths: [],
                improvements: [],
                nextQuestion: null,
                rawText: cleanText
            };
        }
    } catch (error) {
        console.error('[GeminiService] Error in evaluateAnswer:', error.message);
        return {
            score: 6,
            strengths: ["Clear structure", "Relevant experience"],
            improvements: ["Provide more detail", "Use specific examples"],
            nextQuestion: null
        };
    }
};

/**
 * Generates a full mock interview script or flow based on role and resume data.
 */
const generateMockInterview = async (role, resumeData) => {
    try {
        if (!genAI) {
            console.warn('[GeminiService] No API key configured. Returning mock interview flow.');
            return `MOCK INTERVIEW STARTED: Welcome. Let's begin the interview for ${role}.`;
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `You are an expert HR technical interviewer. Create a mock interview flow for the role of ${role}.
        The candidate's background/resume data: ${JSON.stringify(resumeData || {})}.

        Please generate:
        1. A brief welcoming introductory statement.
        2. 5 progressive interview questions (from basic to advanced) suitable for this role and background.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return responseText.trim();
    } catch (error) {
        console.error('[GeminiService] Error in generateMockInterview:', error.message);
        return `MOCK INTERVIEW STARTED: Welcome. Let's begin the interview for ${role}.`;
    }
};

/**
 * Analyzes extracted resume text and generates personalized questions.
 */
const analyzeResume = async (resumeText) => {
    try {
        if (!genAI) {
            console.warn('[GeminiService] No API key configured. Returning mock resume analysis.');
            return {
                skills: ["React", "Node.js", "Team Leadership"],
                projects: ["Mock User Dashboard", "Mock E-Commerce site"],
                questions: [
                    "Can you elaborate on your experience with React?",
                    "What was your role in the Mock User Dashboard project?",
                    "How do you handle Team Leadership challenges?",
                    "What is your proudest technical achievement?",
                    "Why are you interested in this position based on your background?"
                ]
            };
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `You are an expert technical interviewer. Analyze the following resume:
        ${resumeText}

        Extract the core: Skills, Projects, and Work Experience.
        Then generate exactly 5 personalized, realistic interview questions tailored specifically to this candidate's background.

        Respond ONLY in JSON format, exactly like this:
        {
          "skills": ["Extracted Skill 1", "Extracted Skill 2"],
          "projects": ["Extracted Project 1", "Extracted Project 2"],
          "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
        }`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Strip out any markdown wrappers Gemini might provide
        const cleanText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error('[GeminiService] Error in analyzeResume:', error.message);
        return {
            skills: ["React", "Node.js", "Team Leadership"],
            projects: ["Mock User Dashboard", "Mock E-Commerce site"],
            questions: [
                "Can you elaborate on your experience with React?",
                "What was your role in the Mock User Dashboard project?",
                "How do you handle Team Leadership challenges?",
                "What is your proudest technical achievement?",
                "Why are you interested in this position based on your background?"
            ]
        };
    }
};

module.exports = {
    generateQuestion,
    evaluateAnswer,
    generateMockInterview,
    analyzeResume
};
