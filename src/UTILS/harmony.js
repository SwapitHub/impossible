function calculateHarmony(qualities, values, characteristics, themeMap) {
  let harmonized = 0;

  const categories = { Q: qualities, V: values, C: characteristics };
  const themeCategory = {};

  for (const [cat, items] of Object.entries(categories)) {
    items.forEach((item) => {
      themeMap[item]?.forEach((theme) => {
        if (!themeCategory[theme]) {
          themeCategory[theme] = { Q: 0, V: 0, C: 0 };
        }
        themeCategory[theme][cat]++;
      });
    });
  }

  for (const theme of Object.keys(themeCategory)) {
    const cat = themeCategory[theme];
    const valid = Object.values(cat).filter((v) => v >= 2);

    if (valid.length >= 2) harmonized++;
  }

  return (harmonized / 8) * 10;
}

module.exports = { calculateHarmony };
