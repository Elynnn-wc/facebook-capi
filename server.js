require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const cors = require('cors'); 
const { hash } = require('./utils/hash');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Root route to verify server is running
app.get('/', (req, res) => {
  res.send('Hello! CAPI Server is running.');
});

// Middleware to validate API key (prevent unauthorized use)
app.use((req, res, next) => {
  const auth = req.headers['x-api-key'];
  if (auth !== process.env.X_API_KEY) {
    return res.status(403).json({ error: 'Forbidden: Invalid API Key' });
  }
  next();
});

app.post('/send-capi', async (req, res) => {
  const { email, phone, eventName = "Lead", value = 0 } = req.body;

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


  if (!email && !phone) {
    return res.status(400).json({ error: 'Email or phone is required' });
  }

  const payload = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    event_source_url: "https://explore777.netlify.app/", // Change to your site URL
    user_data: {
      em: email ? [hash(email)] : [],
      ph: phone ? [hash(phone)] : [],
    },
    custom_data: {
      currency: "SGD",
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
