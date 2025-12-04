function calculateQvcScore(count) {
  if (count === 0) return 2;
  if (count >= 1 && count <= 2) return 5;
  if (count === 3) return 8;
  if (count === 4) return 9;
  if (count >= 5 && count <= 7) return 10;
  if (count >= 8 && count <= 10) return 8;
  return 6;
}

module.exports = { calculateQvcScore };
