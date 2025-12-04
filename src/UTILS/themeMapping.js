function mapThemes(qualities, values, characteristics, qvcMap) {
  const themeCounts = {};

  const addToTheme = (items, categoryMap) => {
    items.forEach((item) => {
      const themes = categoryMap[item]; // e.g. qvcMap.qualities["Creative"]

      if (themes && themes.length > 0) {
        themes.forEach((t) => {
          themeCounts[t] = (themeCounts[t] || 0) + 1;
        });
      }
    });
  };

  addToTheme(qualities, qvcMap.qualities);
  addToTheme(values, qvcMap.values);
  addToTheme(characteristics, qvcMap.characteristics);

  return themeCounts;
}

module.exports = { mapThemes };
