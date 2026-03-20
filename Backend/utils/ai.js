const axios = require('axios');

async function evaluateAnswer(answer) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in .env");
    }

    // Prepare prompt to ensure JSON output
    const prompt = `
You are an expert AI Interviewer. Evaluate the following interview answer.
Answer: "${answer}"

Provide a JSON response with exactly this structure:
{
  "score": <number between 1 and 10>,
  "strengths": ["string", "string"],
  "improvements": ["string", "string"]
}

Ensure the response is raw JSON without markdown formatting (\`\`\`json) or any other text.
`;

    // Make request to Gemini API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // Extract text from response
    let textResult = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResult) {
       throw new Error("Invalid response format from Gemini");
    }

    // Clean up potential markdown formatting from Gemini response
    textResult = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();

    const parsedResult = JSON.parse(textResult);

    return {
      score: parsedResult.score || 7,
      strengths: parsedResult.strengths || ["Answer provided"],
      improvements: parsedResult.improvements || ["Consider elaborating on your points"]
    };

  } catch (error) {
    console.error("AI Evaluation Error:", error.message || error);
    
    // Fallback response if API fails or parsing error occurs
    return {
      score: 6,
      strengths: ["Clear response (Fallback Evaluation)"],
      improvements: ["Provide more measurable achievements (Fallback Evaluation)"]
    };
  }
}

module.exports = { evaluateAnswer };