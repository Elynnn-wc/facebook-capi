require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const { hash } = require('./utils/hash');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 校验中间件（防止别人乱调用）
app.use((req, res, next) => {
  const auth = req.headers['x-api-key'];
  if (auth !== process.env.API_SECRET) {
    return res.status(403).json({ error: 'Forbidden: Invalid API Key' });
  }
  next();
});

app.post('/send-capi', async (req, res) => {
  const { email, phone, eventName = "Lead", value = 0 } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ error: 'Email or phone is required' });
  }

  const payload = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    event_source_url: "https://explore777.netlify.app/", // 修改为你的网页地址
    user_data: {
      em: email ? [hash(email)] : [],
      ph: phone ? [hash(phone)] : [],
    },
    custom_data: {
      currency: "MYR",
      value: value
    }
  };

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.PIXEL_ID}/events?access_token=${process.env.ACCESS_TOKEN}`,
      { data: [payload] }
    );
    res.json({ success: true, fb_response: response.data });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.listen(PORT, () => console.log(`✅ CAPI Server running on port ${PORT}`));
