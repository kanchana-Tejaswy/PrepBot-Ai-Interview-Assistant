const geminiService = require('../services/gemini.service');
const supabase = require('../config/db.config');
const pdfParse = require('pdf-parse');
const fs = require('fs');

// Start the interview
exports.startInterview = async (req, res, next) => {
    try {
        const { role } = req.body;
        console.log(`[Controller] Starting interview for role: ${role}`);
        const firstQuestion = await geminiService.generateQuestion(role, []);
        res.status(200).json({ question: firstQuestion });
    } catch (error) {
        next(error);
    }
};

// Generate the next question based on chat history
exports.nextQuestion = async (req, res, next) => {
    try {
        const { role, previousAnswers } = req.body;
        console.log(`[Controller] Generating next question for role: ${role}`);
        const question = await geminiService.generateQuestion(role, previousAnswers);
        res.status(200).json({ question });
    } catch (error) {
        next(error);
    }
};

// Evaluate a specific answer
exports.evaluateAnswer = async (req, res, next) => {
    try {
        const { question, answer, role, history } = req.body;
        console.log(`[Controller] Evaluating answer for role: ${role}`);
        const evaluation = await geminiService.evaluateAnswer(question, answer, role, history);
        res.status(200).json(evaluation);
    } catch (error) {
        next(error);
    }
};

// Generate a full mock interview
exports.mockInterview = async (req, res, next) => {
    try {
        const { role, resumeData } = req.body;
        console.log(`[Controller] Creating mock interview for role: ${role}`);
        const interviewData = await geminiService.generateMockInterview(role, resumeData);
        res.status(200).json({ interviewData });
    } catch (error) {
        next(error);
    }
};

// Save interview history locally or to Supabase
exports.saveHistory = async (req, res, next) => {
    try {
        const interviewData = req.body;
        console.log(`[Controller] Saving interview history for role: ${interviewData.role}`);
        
        if (supabase) {
            const { data, error } = await supabase
                .from('interviews')
                .insert([interviewData])
                .select();
                
            if (error) throw error;
            return res.status(201).json({ success: true, data });
        } else {
            console.log(`[Controller] Supabase not connected. Sending mock success response.`);
            // Mock success response for testing without keys
            return res.status(201).json({ success: true, mock: true, data: interviewData });
        }
    } catch (error) {
        next(error);
    }
};

// Fetch all interview history
exports.getHistory = async (req, res, next) => {
    try {
        console.log(`[Controller] Fetching interview history...`);
        
        if (supabase) {
            const { data, error } = await supabase
                .from('interviews')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            return res.status(200).json(data);
        } else {
            console.log(`[Controller] Supabase not connected. Sending empty array fallback.`);
            // Mock empty array fallback
            return res.status(200).json([]);
        }
    } catch (error) {
        next(error);
    }
};

// Process Resume PDF upload
exports.uploadResume = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No PDF file uploaded." });
        }
        
        console.log(`[Controller] Processing Resume PDF upload...`);
        
        // Use buffer from memoryStorage (Vercel compatible)
        const pdfBuffer = req.file.buffer;

        if (!pdfBuffer) {
            return res.status(500).json({ error: "File buffer is empty." });
        }

        const pdfData = await pdfParse(pdfBuffer);
        const text = pdfData.text;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: "Could not extract text from the provided PDF." });
        }

        const analysis = await geminiService.analyzeResume(text);
        res.status(200).json(analysis);
    } catch (error) {
        next(error);
    }
};
