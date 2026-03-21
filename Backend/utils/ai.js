const { GoogleGenerativeAI } = require("@google/generative-ai");

async function evaluateAnswer(question, answer, role, history = []) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in .env");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Format history
    let historyText = "None";
    if (history && history.length > 0) {
      historyText = history.map((item, index) => `Q${index + 1}: ${item.question}\nA${index + 1}: ${item.answer}`).join("\n\n");
    }

    const systemPrompt = `You are a strict professional interviewer.

Role: ${role}
Candidate's Previous Q&A history:
${historyText}

Current Question: ${question}
Candidate Answer: ${answer}

Evaluate the candidate's Current Answer based on:
- Relevance
- Clarity
- Depth
- Confidence

Then, dynamically generate the NEXT best interview question for the role: ${role}.
ADAPTIVE DIFFICULTY RULES:
- If the current answer score is < 5, ask a simpler next question.
- If the current answer score is 5-7, ask a normal next question.
- If the current answer score is > 7, ask an advanced next question.
- DO NOT repeat any previous questions.

Respond ONLY in JSON format:

{
  "score": number (0-10),
  "strengths": ["point1", "point2"],
  "improvements": ["point1", "point2"],
  "nextQuestion": "string"
}

Be strict and realistic.`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    // Safely parse JSON by removing potential markdown code blocks
    const cleanText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(cleanText);
    } catch (parseError) {
      throw new Error("Failed to parse AI response as JSON.");
    }

    return {
      score: parsedData.score || 0,
      strengths: parsedData.strengths || [],
      improvements: parsedData.improvements || [],
      nextQuestion: parsedData.nextQuestion || "Could you tell me anything else about your experience?"
    };

  } catch (error) {
    console.error("AI Evaluation Engine Error:", error.message || error);
    
    // Strict Fallback Response
    return {
      score: 0,
      strengths: [],
      improvements: ["Error processing evaluation. Please try again."],
      nextQuestion: "We experienced a technical error. Let's move to the next topic. How do you handle failure?"
    };
  }
}

async function analyzeResume(resumeText) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in .env");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `You are an expert interviewer.

Analyze this resume:
${resumeText}

Extract:
- Skills
- Projects
- Experience

Then generate exactly 5 personalized interview questions based on this resume content.

Respond ONLY in JSON format exactly as follows:
{
  "skills": ["skill1", "skill2"],
  "projects": ["project1", "project2"],
  "questions": ["question1", "question2", "question3", "question4", "question5"]
}

Be strict and professional. Do not add markdown around the JSON.`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    const cleanText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(cleanText);
    } catch (parseError) {
      throw new Error("Failed to parse AI response as JSON.");
    }

    return {
      skills: parsedData.skills || [],
      projects: parsedData.projects || [],
      questions: parsedData.questions || [
        "Can you walk me through your resume?",
        "What is your most notable project?",
        "How do your skills align with this role?",
        "What was your biggest professional challenge?",
        "Why should we hire you based on this experience?"
      ]
    };

  } catch (error) {
    console.error("AI Resume Analysis Error:", error.message || error);
    
    // Strict Fallback Response
    return {
      skills: [],
      projects: [],
      questions: [
        "Can you walk me through your resume?",
        "What is your most notable project?",
        "How do your skills align with this role?",
        "What was your biggest professional challenge?",
        "Why should we hire you based on this experience?"
      ]
    };
  }
}

module.exports = { evaluateAnswer, analyzeResume };