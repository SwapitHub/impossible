const express = require("express");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.set("view engine", "ejs");
app.set("views", "./views");

app.get("/", (req, res) => {
  res.render("index");
});

// app.get("/", (req, res) => {
//   res.send("Hello World");
// });

app.post("/api/assessment", async (req, res) => {
  const { submission_id, submitted_at, user, assessment } = req.body;

  // Check if the required fields are present
  if (!submission_id || !submitted_at || !assessment) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Insert the data into the 'assessments' table without authorization check
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
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: "Assessment data successfully stored" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
