const express = require('express');
const router = express.Router();
const { evaluateAnswer } = require('../utils/ai');

// POST /api/evaluate
router.post('/evaluate', async (req, res) => {
  try {
    const { answer } = req.body;

    if (!answer) {
      return res.status(400).json({ error: "Answer is required" });
    }

    const result = await evaluateAnswer(answer);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;