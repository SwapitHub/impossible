const { OpenAI } = require("openai");
const express = require("express");
const cors = require("cors");

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const app = express();
const port = process.env.PORT || 5000;


app.use(express.json());
app.use(cors());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Test route
app.get("/", (req, res) => {
  res.send("Hello World like ");
});

async function generateSubmissionId() {
  // Count existing rows
  const { count, error } = await supabase
    .from("assessments")
    .select("*", { count: "exact", head: true });

  if (error)
    throw new Error("Error generating submission_id: " + error.message);

  const nextNumber = count + 1;

  // Format: pe-assessment-00001
  const formatted = String(nextNumber).padStart(5, "0");

  return `pe-assessment-${formatted}`;
}

app.post("/api/assessment", async (req, res) => {
  const { submitted_at, user, assessment } = req.body;

  // Check if the required fields are present
  if (!submitted_at || !assessment) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const submission_id = await generateSubmissionId();
    // Step 1: Call OpenAI API to analyze the assessment data and generate insights
    const response = await client.responses.create({
      model: "gpt-4", // Use a valid model like "gpt-4" (update this if a newer model is available)
      input: [
        {
          role: "system",
          content:
            "You are an expert assessment analyst. Generate a clear, helpful summary & insights.",
        },
        {
          role: "user",
          content: `Here is the full assessment JSON data:\n\n${JSON.stringify(
            assessment,
            null,
            2
          )}\n\nNow generate:\n1. Key personality insights\n2. Strengths summary\n3. Growth opportunities\n4. Career guidance\n5. Emotional tone analysis`,
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
});

// Get API to fetch insights based on submission_id
app.get("/api/insights/:submission_id", async (req, res) => {
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
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
