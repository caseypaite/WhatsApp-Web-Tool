require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cmsRoutes = require('./routes/cms.routes');
const userRoutes = require('./routes/user.routes');
const settingsRoutes = require('./routes/settings.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/cms', cmsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/settings', settingsRoutes);

app.use((req, res, next) => {
  console.log(`[404] Unhandled request: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not Found', url: req.url });
});

// Mock Registration route to trigger OTP (Demonstration)
app.post('/api/register', async (req, res) => {
  const { userId, phoneNumber } = req.body;
  const otpService = require('./services/otp.service');
  
  try {
    await otpService.generateAndSendOtp(userId, phoneNumber);
    res.json({ message: 'User registered and OTP sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'up' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
