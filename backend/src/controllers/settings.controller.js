const settingsService = require('../services/settings.service');

class SettingsController {
  async getAll(req, res) {
    try {
      const settings = await settingsService.getAll();
      res.json(settings);
    } catch (error) {
      console.error('Error in SettingsController.getAll:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async update(req, res) {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required.' });
    }

    try {
      await settingsService.set(key, value);
      res.json({ message: `Setting ${key} updated successfully.` });
    } catch (error) {
      console.error('Error in SettingsController.update:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getPublicConfig(req, res) {
    try {
      const vite_api_base_url = await settingsService.get('vite_api_base_url');
      const website_domain = await settingsService.get('website_domain');
      const site_name = await settingsService.get('site_name') || 'AppStack';
      
      res.json({
        VITE_API_BASE_URL: vite_api_base_url,
        WEBSITE_DOMAIN: website_domain,
        SITE_NAME: site_name
      });
    } catch (error) {
      console.error('Error in SettingsController.getPublicConfig:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async testOtp(req, res) {
    let { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    // Normalize: append 91 if 10 digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
      phoneNumber = '91' + cleaned;
    }

    try {
      const otpService = require('../services/otp.service');
      // Call gateway directly with a dummy code to bypass database insertion
      const gatewayResponse = await otpService.callOtpGateway(phoneNumber, '123456');
      res.json({ 
        message: `Test message triggered for ${phoneNumber}`,
        result: { gatewayResponse } 
      });
    } catch (error) {
      console.error('Error in SettingsController.testOtp:', error.message);
      res.status(500).json({ error: error.message || 'Failed to send test OTP' });
    }
  }
}

module.exports = new SettingsController();
