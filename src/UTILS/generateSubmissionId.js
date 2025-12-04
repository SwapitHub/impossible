const supabase = require("../config/supabase");

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

module.exports = generateSubmissionId;
