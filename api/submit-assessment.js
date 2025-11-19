import { supabase } from "../supabaseClient.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const data = req.body;

    const { error } = await supabase
      .from("assessments")
      .insert({
        submission_id: data.submission_id || null,
        submitted_at: data.submitted_at || new Date().toISOString(),
        user: data.user,
        assessment: data.assessment
      });

    if (error) return res.status(400).json({ error });

    res.status(200).json({ message: "Assessment Saved!" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
