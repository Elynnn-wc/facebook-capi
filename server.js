require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// SHA256 加密函数
function hash(input) {
  return crypto.createHash('sha256').update(input.trim().toLowerCase()).digest('hex');
}

// Root route
app.get('/', (req, res) => {
  res.send('Hello! CAPI Server is running.');
});

// API key validation middleware
app.use((req, res, next) => {
  const auth = req.headers['x-api-key'];
  if (auth !== process.env.X_API_KEY) {
    return res.status(403).json({ error: 'Forbidden: Invalid API Key' });
  }
  next();
});

// POST /send-capi route
app.post('/send-capi', async (req, res) => {
  const { email, phone, eventName = "Lead", value = 0, currency = "SGD" } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ error: 'Email or phone is required' });
  }

  // 取请求的 IP，兼容代理和直连
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
  // 取 User-Agent
  const userAgent = req.headers['user-agent'] || '';
  const fbc = req.headers['x-fbc'] || '';

  const payload = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    event_source_url: "https://xplaylb7.netlify.app/", // 根据实际替换
    user_data: {
      em: email ? [hash(email)] : [],
      ph: phone ? [hash(phone)] : [],
      client_ip_address: clientIp,
      client_user_agent: userAgent,
      fbc: fbc ? [fbc] : [],
    },
    custom_data: {
      currency,
      value,
    }
  };

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.PIXEL_ID}/events?access_token=${process.env.ACCESS_TOKEN}`,
      { data: [payload] }
    );
    res.json({ success: true, fb_response: response.data });
  } catch (err) {
    console.error('Facebook API error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.listen(PORT, () => console.log(`✅ CAPI Server running on port ${PORT}`));
