const express = require("express");
require('dotenv').config();
const { createClient } = require("@supabase/supabase-js");
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.post("/api/assessment", async (req, res) => {
  const { submission_id, submitted_at, user, assessment } = req.body;

  if (!submission_id || !submitted_at || !assessment) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Inserting data into the 'assessments' table
    const { data, error } = await supabase.from("assessments").insert([
      {
        submission_id,
        submitted_at,
        user_name: user.name,
        user_email: user.email,
        beliefs_capabilities: assessment.beliefs_capabilities,
        feelings_change: assessment.feelings_change,
        strongest_skills: assessment.strongest_skills,
        most_used_skills: assessment.most_used_skills,
        support_system: assessment.support_system,
        desired_relationships: assessment.desired_relationships,
        day_to_day_attitude: assessment.day_to_day_attitude,
        obstacle_response: assessment.obstacle_response,
        strongest_resources: assessment.strongest_resources,
        digital_presence: assessment.digital_presence,
        final_reflection: assessment.final_reflection,
      },
    ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res
      .status(201)
      .json({ message: "Assessment data successfully stored", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
