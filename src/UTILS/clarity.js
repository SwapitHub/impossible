function getClarityType(value) {
  if (value >= 7) return "High Clarity";
  if (value >= 4) return "Emerging Clarity";
  return "Low Clarity";
}

module.exports = { getClarityType };
