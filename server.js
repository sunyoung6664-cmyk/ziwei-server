const express = require('express');
const { astro } = require('iztro');
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.post('/ziwei', (req, res) => {
  try {
    const { birth_date, birth_hour, gender } = req.body;
    const genderMap = {
      '남': 'male', '남성': 'male', 'male': 'male',
      '여': 'female', '여성': 'female', 'female': 'female'
    };
    const iztroGender = genderMap[gender] || 'male';
    const hour24 = parseInt(birth_hour) || 0;
const hourNum = Math.floor(((hour24 + 1) % 24) / 2);
    const astrolabe = astro.bySolar(
      birth_date, hourNum, iztroGender, true, 'zh-CN'
    );
    const palaceData = astrolabe.palaces.map(palace => ({
      name: palace.name,
      heavenlyStem: palace.heavenlyStem,
      earthlyBranch: palace.earthlyBranch,
      majorStars: palace.majorStars.map(s => ({
        name: s.name,
        brightness: s.brightness,
        mutagen: s.mutagen || null
      })),
      minorStars: palace.minorStars.map(s => s.name),
    }));
    res.json({
      success: true,
      data: {
        solarDate: birth_date,
        birthHour: hourNum,
        gender: iztroGender,
        palaces: palaceData,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Ziwei server running on port ${PORT}`));
