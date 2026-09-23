const API_KEY = "YOUR_GEMINI_API_KEY";

// ====================================
// LOAD PROFILE
// ====================================

async function loadProfile() {

    try {

        const url =
            chrome.runtime.getURL(
                "profile.json"
            );

        const response =
            await fetch(url);

        const profile =
            await response.json();

        console.log(
            "Profile loaded:",
            profile
        );

        return profile;

    } catch (e) {

        console.warn(
            "Could not load profile.json:",
            e
        );

        return null;

    }

}

// ====================================
// ASK GEMINI
// ====================================

async function askGemini(allQuestions) {

    // Load student profile
    const profile =
        await loadProfile();

    // Build profile section
    let profileSection = "";

    if (profile) {

        profileSection = `
Student Profile (use these details whenever the form asks for personal/academic info):
${JSON.stringify(profile, null, 2)}

IMPORTANT:
- Use the EXACT name, roll number, registration number, class, department, etc. from the profile above.
- The student's year range is ${profile.year_range || "unknown"}. Calculate their current year based on the current date.
- If the form asks for year/semester, use the values from the profile.
`;

    }

    const prompt = `
You are filling a Google Form.

Return ONLY a valid JSON array of objects.

${profileSection}
Questions:
${JSON.stringify(allQuestions, null, 2)}

Rules:
1. Answer EVERY single question in the list. Do NOT omit any question.
2. For personal detail questions (email, name, roll number, registration number, class, section, branch, semester, year, phone, etc.), use the Student Profile values provided above.
3. For multiple choice (MCQ) & dropdown: pick the option text EXACTLY as listed in the question's "options" list (for example, if asking for Year and profile says "3rd Year", choose "3rd").
4. For checkboxes: return comma-separated values matching option texts.
5. For ratings / linear scale: choose 4 or 5 (positive feedback).
6. For "multiple_choice_grid" or "checkbox_grid": the "answer" MUST be a JSON object mapping each row text to the chosen column option text.
7. For short answer and paragraph: write realistic, positive, helpful answers.
8. Include the "index" from each question.
9. Output JSON array ONLY. No markdown explanation.

Example:
[
  {
    "index": 1,
    "question": "Email",
    "answer": "${profile?.email || "student@example.com"}"
  },
  {
    "index": 2,
    "question": "Full Name",
    "answer": "${profile?.name || "Student Name"}"
  },
  {
    "index": 3,
    "question": "Overall Experience",
    "answer": "5"
  },
  {
    "index": 4,
    "question": "When attending an event, how important are the following factors to you?",
    "answer": {
      "Proximity/Location of the venue": "Very Important",
      "Cost/Affordability of the ticket": "Very Important",
      "Speaker/Presenter Reputation": "Crucial",
      "Duration of the event (e.g., full day vs. 2 hours)": "Somewhat Important"
    }
  }
]
`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            `Gemini API Error: ${response.status}`
        );
    }

    const data =
        await response.json();

    const text =
        data?.candidates?.[0]
            ?.content?.parts?.[0]
            ?.text;

    if (!text) {
        throw new Error(
            "Empty Gemini response"
        );
    }

    // Remove markdown formatting if exists
    const cleaned =
        text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        throw new Error(
            "Failed to parse Gemini response: " +
            cleaned.substring(0, 200)
        );
    }
}
