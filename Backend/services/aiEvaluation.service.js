/**
 * Optional AI Evaluation Service to handle more complex interview evaluation logic
 * beyond basic Gemini requests. Ready for further extension.
 */

const evaluateCandidate = async (candidateAnswers) => {
    // This function can summarize answers and generate scores.
    return {
        score: 85,
        feedback: "Great communication, needs to work on technical depth."
    };
};

module.exports = {
    evaluateCandidate
};
