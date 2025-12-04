const openai = require("../config/openai");
const supabase = require("../config/supabase");
const generateSubmissionId = require("../UTILS/generateSubmissionId");



const handlePostAssessment = async (req, res) => {
   const { submitted_at, user, assessment } = req.body;

  // Check if the required fields are present
  if (!submitted_at || !assessment) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const submission_id = await generateSubmissionId();
    // Step 1: Call OpenAI API to analyze the assessment data and generate insights
    const response = await openai.responses.create({
      model: "gpt-4", // Use a valid model like "gpt-4" (update this if a newer model is available)
      input: [
        {
          role: "system",
          content: ` You are the narrative engine for The Impossible Works.Your job is to take a user's Personal Ecosystem Assessment data (in JSON format) and generate a clear, encouraging, and strategically useful narrative report called the "Personal Ecosystem Analysis."CORE PRINCIPLES"
                    CORE PRINCIPLES:
                    - This is NOT therapy, diagnosis, or medical advice.
                    - This is NOT a personality test.
                    - This is a snapshot of the user's "Possible Life" today.
                    - Your job is to highlight strengths, patterns, resources, and leverage points.
                    - You do not assign scores or grades. There is NO scoring.
                    - You never shame, judge, or compare the user to others.
                    - You write as if you are a thoughtful, grounded coach who believes in the user’s potential.

                    TONE & STYLE:
                    - Calm, clear, professional, and human.
                    - Motivating but not hypey or sentimental.
                    - Direct and specific, not vague.
                    - Assume the user is capable, intelligent, and self-aware.
                    - Use plain language. Avoid jargon.
                    - Speak in the second person ("you") where appropriate.

                    SOCIAL / DIGITAL PRESENCE RULES:
                    - The user's digital or social media presence is OPTIONAL.
                    - You ONLY mention digital presence if the user lists platforms or indicates usage.
                    - You NEVER present the absence of social media as a gap, problem, or weakness.
                    - You frame social presence ONLY as a potential amplifier or optional leverage point.
                    - If the user indicates "No" or does not list any platforms, OMIT this topic entirely.

                    GENERAL CONTENT RULES:
                    - Do not invent facts or fill in missing information.
                    - Use only what is present in the assessment data.
                    - If something is unclear, speak in terms of possibilities or tendencies, not certainties.
                    - You may synthesize patterns across multiple fields.
                    - Do not mention the JSON or that you are reading data. Just write the report.

                    REPORT STRUCTURE:
                    Your report MUST follow this structure:
                    
                    1. **Title**: A brief title summarizing the user's current state.
                    2. **Short Overview**: 2–3 sentences summarizing the user's current situation.
                    3. **Section 1: Beliefs & Mindset**: Summarize how the user currently sees their own capabilities. Reflect any tension between confidence and doubt. Normalize all belief states as starting points, not flaws.
                    4. **Section 2: Skills & Experience**: Identify the user’s strongest skills and the ones they rely on most. Highlight both formal and informal/life experience as valid strengths.
                    5. **Section 3: Relationships & Support**: Describe their current support system neutrally. Highlight any existing pillars of support. Note any desire for stronger networks, mentors, or community as a future growth focus.
                    6. **Section 4: Attitudes & Patterns**: Reflect how they tend to feel day-to-day and how they respond to obstacles. Name helpful patterns (e.g., resilience, curiosity, problem-solving). Gently surface any patterns that may slow momentum, without judgment.
                    7. **Section 5: Assets & Resources**: Identify their strongest resources (time, energy, finances, relationships, etc.). Treat "none feel strong right now" as a valid and important signal, not a failure. Highlight even small or subtle assets as starting points.
                    8. **Section 6: (Optional) Digital Presence & Amplifiers**: Include this section ONLY if digital presence is relevant (e.g., the user lists platforms or uses them). Frame any digital presence as an optional amplifier they can choose to use.
                    9. **Closing: Readiness And Next Moves**: Tie together their beliefs, skills, support, patterns, and resources. Reflect that this is a snapshot, not a verdict. Emphasize that they already have a foundation to build on. Suggest 2-3 gentle, practical “next moves” that someone in their position could consider (e.g., clarifying a goal, strengthening one relationship, carving out time, etc.).

                    Never include internal labels like "assessment.beliefs_capabilities" or the word "JSON" in the output.
                `,
        },
        {
          role: "user",
          content: `Here is the full assessment JSON data:\n\n${JSON.stringify(
            assessment,
            null,
            2
          )}\n\nNow generate the Personal Ecosystem Analysis report based on this data.`,
        },
      ],
    });

    // Step 2: Debug: Log the full response to check for missing 'choices' field

    // Step 3: Check if OpenAI response contains the 'output_text' field
    if (!response || !response.output_text) {
      throw new Error(
        "Invalid response from OpenAI API: Missing 'output_text' field"
      );
    }

    const openAiResponse = response.output_text;
    console.log("OpenAI API Response:", openAiResponse);

    // Step 3: Insert the insights data into the 'insights' table in Supabase
    const { data: insightsData, error: insightsError } = await supabase
      .from("insights")
      .insert([
        {
          submission_id, // submission_id jo ki aapne request body se liya hai
          insights: openAiResponse, // OpenAI ka response jo insights me store kiya hai
        },
      ]);

    if (insightsError) {
      throw new Error(
        `Error inserting insights data into database: ${insightsError.message}`
      );
    }

    // Step 4: Insert the data into the 'assessments' table in Supabase
    const { data, error } = await supabase.from("assessments").insert([
      {
        submission_id,
        submitted_at,
        user_name: user?.name,
        user_email: user?.email,

        beliefs_choice: assessment?.beliefs_capabilities?.choice,
        beliefs_detail: assessment?.beliefs_capabilities?.detail,

        feelings_choices: assessment?.feelings_change?.choices || [],
        feelings_detail: assessment?.feelings_change?.detail,

        strongest_skills_choices: assessment?.strongest_skills?.choices || [],
        strongest_skills_detail: assessment?.strongest_skills?.detail,

        most_used_skills_choices: assessment?.most_used_skills?.choices || [],
        most_used_skills_detail: assessment?.most_used_skills?.detail,

        support_system_choice: assessment?.support_system?.choice,
        support_system_detail: assessment?.support_system?.detail,

        desired_relationships_choices:
          assessment?.desired_relationships?.choices || [],
        desired_relationships_detail: assessment?.desired_relationships?.detail,

        day_to_day_attitude_choices:
          assessment?.day_to_day_attitude?.choices || [],
        day_to_day_attitude_detail: assessment?.day_to_day_attitude?.detail,

        obstacle_response_choice: assessment?.obstacle_response?.choice,
        obstacle_response_detail: assessment?.obstacle_response?.detail,

        strongest_resources_choices:
          assessment?.strongest_resources?.choices || [],
        strongest_resources_detail: assessment?.strongest_resources?.detail,

        digital_presence_level: assessment?.digital_presence?.level,
        digital_presence_platforms: assessment?.digital_presence?.platforms,

        final_reflection: assessment?.final_reflection,
      },
    ]);

    if (error) {
      throw new Error(`Error inserting data into database: ${error.message}`);
    }

    // Step 5: Return both the success message and the generated insights from OpenAI
    res.status(201).json({
      message: "Assessment data successfully stored",
      insights: openAiResponse,
      submission_id,
    });
  } catch (error) {
    // Handle errors: Return detailed error message
    console.error("Error occurred:", error);
    res.status(500).json({ error: error.message });
  }
};

const handleGetAssessment = async (req, res) => {
  const { submission_id } = req.params;

  try {
    // Fetch all the insights matching the submission_id
    const { data, error } = await supabase
      .from("insights")
      .select("insights")
      .eq("submission_id", submission_id);

    if (error) {
      throw new Error(`Error fetching insights: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ error: "No insights found for this submission_id" });
    }

    // Return all insights
    res.status(200).json({
      message: "Insights fetched successfully",
      insights: data, // Return all results as an array
      submission_id,
    });
  } catch (error) {
    // Handle errors: Return detailed error message
    console.error("Error occurred:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { handleGetAssessment, handlePostAssessment };
