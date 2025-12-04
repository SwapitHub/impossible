const supabase = require("../config/supabase");
const qvcMap = require("../data/qvc_theme_map.json");

// Q/V/C Scoring
function calculateQvcScore(count) {
  if (count === 0) return 2;
  if (count >= 1 && count <= 2) return 5;
  if (count === 3) return 8;
  if (count === 4) return 9;
  if (count >= 5 && count <= 7) return 10;
  if (count >= 8 && count <= 10) return 8;
  return 6; // 11+
}

// Theme Aggregation
function mapThemes(qualities, values, characteristics, map) {
  const themeCounts = {
    CREATOR: 0, CONNECTOR: 0, LEADER: 0, EXPLORER: 0,
    BUILDER: 0, SAGE: 0, GUARDIAN: 0, HARMONIZER: 0
  };

  const add = (items, groupMap) => {
    items.forEach((item) => {
      const themes = groupMap[item] || [];
      themes.forEach((t) => themeCounts[t]++);
    });
  };

  add(qualities, map.qualities);
  add(values, map.values);
  add(characteristics, map.characteristics);

  return themeCounts;
}

// Harmony Index
function calculateHarmony(qualities, values, characteristics, map) {
  const THEMES = Object.keys(map.qualities);
  let harmonized = 0;

  for (let theme of Object.keys(map.qualities)) {
    const q = qualities.filter(q => map.qualities[q]?.includes(theme)).length;
    const v = values.filter(v => map.values[v]?.includes(theme)).length;
    const c = characteristics.filter(c => map.characteristics[c]?.includes(theme)).length;

    const categoriesWithTwo = [q >= 2, v >= 2, c >= 2].filter(Boolean).length;
    if (categoriesWithTwo >= 2) harmonized++;
  }
  return Math.round((harmonized / 8) * 10);
}

function getHarmonyLabel(score) {
  if (score <= 3) return "Low";
  if (score <= 6) return "Emerging";
  return "High";
}

function getThemeRanking(themeCounts) {
  const sorted = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]);
  const primary = sorted.filter(([_, c]) => c >= 5).map(([t]) => t);
  const supporting = sorted.filter(([_, c]) => c >= 2 && c < 5).map(([t]) => t);
  return { primary, supporting };
}

function getRoadmapType(goalType, drivers, harmonyIndex, primaryThemes = []) {
  const driversAvg = drivers.length ? drivers.reduce((a,b)=>a+b,0)/drivers.length : 0;
  const discoveryGoalTypes = ["Emerging Goal","Goal Curious","Goal Split","Goal Drifting","Goal Blocked"];
  const isClearGoalType = goalType === "Goal Ready";

  const discoveryTriggers = [discoveryGoalTypes.includes(goalType), driversAvg < 5, harmonyIndex < 5].filter(Boolean).length;
  if(discoveryTriggers>0 && !isClearGoalType) return "Discovery";

  const achievingTriggers = [isClearGoalType, driversAvg >= 6, harmonyIndex >= 5, primaryThemes.length >= 2].filter(Boolean).length;
  if(achievingTriggers >= 2) return "Achieving";

  return "Discovery";
}

// Main Controller
exports.runAssessment = async (req, res) => {
  try {
    const body = req.body;

    const qualities = body.qualities || [];
    const values = body.values || [];
    const characteristics = body.characteristics || [];

    const motivational_drivers = [
      Number(body.driver_paradox_of_comfort) || 0,
      Number(body.driver_identity_pull) || 0,
      Number(body.driver_values_misalignment) || 0,
      Number(body.driver_desire_for_resonance) || 0,
      Number(body.driver_past_failures_as_fuel) || 0,
      Number(body.driver_quantum_possibility) || 0,
      Number(body.driver_threshold_moment) || 0
    ];

    // Scores & Themes
    const q_score = calculateQvcScore(qualities.length);
    const v_score = calculateQvcScore(values.length);
    const c_score = calculateQvcScore(characteristics.length);
    const theme_counts = mapThemes(qualities, values, characteristics, qvcMap);
    const harmony_index = calculateHarmony(qualities, values, characteristics, qvcMap);
    const harmony_label = getHarmonyLabel(harmony_index);
    const { primary, supporting } = getThemeRanking(theme_counts);
    const roadmap_type = getRoadmapType(body.goal_clarity_type, motivational_drivers, harmony_index, primary);

    // Prepare data object for DB
    const assessmentData = {
      assessment_version: "2.0",
      current_possible_description: body.current_possible_description || "",
      current_state_type: body.current_state_type || "",
      impossible_goal_text: body.impossible_goal_text || "",
      felt_sense_future: body.felt_sense_future || "",
      goal_clarity_score: Number(body.goal_clarity_score) || 0,
      goal_clarity_type: body.goal_clarity_type || "",
      driver_paradox_of_comfort: Number(body.driver_paradox_of_comfort) || 0,
      driver_identity_pull: Number(body.driver_identity_pull) || 0,
      driver_values_misalignment: Number(body.driver_values_misalignment) || 0,
      driver_desire_for_resonance: Number(body.driver_desire_for_resonance) || 0,
      driver_past_failures_as_fuel: Number(body.driver_past_failures_as_fuel) || 0,
      driver_quantum_possibility: Number(body.driver_quantum_possibility) || 0,
      driver_threshold_moment: Number(body.driver_threshold_moment) || 0,
      qualities, qualities_other_text: body.qualities_other_text || "",
      values, values_other_text: body.values_other_text || "",
      characteristics, characteristics_other_text: body.characteristics_other_text || "",
      q_score, v_score, c_score,
      theme_counts,
      harmony_index,
      harmony_label,
      primary_themes: primary,
      supporting_themes: supporting,
      roadmap_type,
      emotion_excited_by: body.emotion_excited_by || "",
      emotion_scared_by: body.emotion_scared_by || "",
      five_minute_readiness: Number(body.five_minute_readiness) || 0,
      obstacles: body.obstacles || [],
      obstacles_other_text: body.obstacles_other_text || "",
      biggest_obstacle_text: body.biggest_obstacle_text || "",
      micro_leap: body.micro_leap || "",
      support_preferences: body.support_preferences || [],
      additional_notes: body.additional_notes || ""
    };

    // Store in Supabase
    const { data, error } = await supabase.from('identity_assessments').insert([assessmentData]);
    if(error) throw error;

    return res.json(assessmentData);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
