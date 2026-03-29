const express = require('express');
const router = express.Router();
const multer = require('multer');
const interviewController = require('../controllers/interview.controller');

// Setup multer for audio file uploads
const upload = multer({ dest: 'uploads/' });

// Define interview routes
router.post('/start-interview', interviewController.startInterview);
router.post('/next-question', interviewController.nextQuestion);
router.post('/evaluate', interviewController.evaluateAnswer); // Changed from /evaluate-answer to match frontend
router.post('/mock-interview', interviewController.mockInterview);

// History routes
router.post('/history', interviewController.saveHistory);
router.get('/history', interviewController.getHistory);

// The resume upload route handles PDF resume uploads via multer
router.post('/upload', upload.single('resume'), interviewController.uploadResume);

module.exports = router;
