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
    const {
      birth_date,
      birth_hour,
      gender,
      calendar_type = 'solar'
    } = req.body;

    if (!birth_date) {
      return res.status(400).json({
        success: false,
        error: 'birth_date is required'
      });
    }

    const genderMap = {
      '남': 'male',
      '남성': 'male',
      'male': 'male',
      '남자': 'male',

      '여': 'female',
      '여성': 'female',
      'female': 'female',
      '여자': 'female'
    };

    const iztroGender = genderMap[gender] || 'male';

    const hour24 = parseInt(birth_hour, 10) || 0;

    // 24시간 기준을 자미두수 12시진 번호로 변환
    // 23:00~00:59 = 자시 = 0
    // 01:00~02:59 = 축시 = 1
    // ...
    const hourNum = Math.floor(((hour24 + 1) % 24) / 2);

    let astrolabe;

    // 현재 n8n에서는 solarBirthDate를 보내므로 기본은 bySolar 사용
    // calendar_type은 기록/검증용으로 함께 받음
    if (calendar_type === 'solar') {
      astrolabe = astro.bySolar(
        birth_date,
        hourNum,
        iztroGender,
        true,
        'zh-CN'
      );
    } else {
      // 지금 서버는 음력 직접 입력 처리까지는 확정하지 않고,
      // n8n에서 양력 변환일을 넘기는 구조로 운영
      return res.status(400).json({
        success: false,
        error: '현재 /ziwei 서버는 solar 입력만 처리합니다. 음력 입력은 n8n에서 solarBirthDate로 변환해서 보내주세요.'
      });
    }

    const palaceData = astrolabe.palaces.map(palace => ({
      name: palace.name,
      heavenlyStem: palace.heavenlyStem,
      earthlyBranch: palace.earthlyBranch,
      majorStars: (palace.majorStars || []).map(s => ({
        name: s.name,
        brightness: s.brightness,
        mutagen: s.mutagen || null
      })),
      minorStars: (palace.minorStars || []).map(s => s.name),
    }));

    // iztro 객체 안에 음력 관련 필드가 있으면 최대한 잡아오기
    // 라이브러리 버전에 따라 필드명이 다를 수 있어서 여러 후보를 둠
    const lunarDate =
      astrolabe.lunarDate ||
      astrolabe.chineseDate ||
      astrolabe.lunarCalendarDate ||
      astrolabe.rawDates?.lunarDate ||
      astrolabe.rawDates?.chineseDate ||
      null;

    const isLeapMonth =
      astrolabe.isLeapMonth ??
      astrolabe.leapMonth ??
      astrolabe.rawDates?.isLeapMonth ??
      false;

    res.json({
      success: true,
      data: {
        solarDate: birth_date,
        lunarDate,
        isLeapMonth,
        calendarType: calendar_type,
        birthHour: hourNum,
        birthHour24: hour24,
        gender: iztroGender,
        palaces: palaceData
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Ziwei server running on port ${PORT}`);
});
