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

  async getMessagingApiKeys(req, res) {
    try {
      const keys = await settingsService.getMessagingApiKeys(true);
      res.json(keys);
    } catch (error) {
      console.error('Error in SettingsController.getMessagingApiKeys:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async createMessagingApiKey(req, res) {
    const name = req.body?.name?.trim();
    if (!name) {
      return res.status(400).json({ error: 'Application name is required.' });
    }

    try {
      const key = await settingsService.createMessagingApiKey(name);
      res.status(201).json({ message: `Messaging API key created for ${key.name}.`, key });
    } catch (error) {
      console.error('Error in SettingsController.createMessagingApiKey:', error.message);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Application name already exists.' });
      }
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async updateMessagingApiKey(req, res) {
    const id = Number(req.params.id);
    const name = req.body?.name?.trim();
    const isActive = req.body?.is_active;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid messaging API key id.' });
    }
    if (!name) {
      return res.status(400).json({ error: 'Application name is required.' });
    }
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be true or false.' });
    }

    try {
      const key = await settingsService.updateMessagingApiKey(id, { name, isActive });
      if (!key) {
        return res.status(404).json({ error: 'Messaging API key not found.' });
      }
      res.json({ message: `Messaging API key updated for ${key.name}.`, key });
    } catch (error) {
      console.error('Error in SettingsController.updateMessagingApiKey:', error.message);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Application name already exists.' });
      }
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async rotateMessagingApiKey(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid messaging API key id.' });
    }

    try {
      const key = await settingsService.rotateMessagingApiKey(id);
      if (!key) {
        return res.status(404).json({ error: 'Messaging API key not found.' });
      }
      res.json({ message: `Messaging API key rotated for ${key.name}.`, key });
    } catch (error) {
      console.error('Error in SettingsController.rotateMessagingApiKey:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async deleteMessagingApiKey(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid messaging API key id.' });
    }

    try {
      const key = await settingsService.deleteMessagingApiKey(id);
      if (!key) {
        return res.status(404).json({ error: 'Messaging API key not found.' });
      }
      res.json({ message: `Messaging API key deleted for ${key.name}.` });
    } catch (error) {
      console.error('Error in SettingsController.deleteMessagingApiKey:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getPublicConfig(req, res) {
    try {
      const vite_api_base_url = await settingsService.get('vite_api_base_url');
      const website_domain = await settingsService.get('website_domain');
      const site_name = await settingsService.get('site_name') || 'Identity Portal';
      
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
      const gatewayResponse = await otpService.callOtpGateway(phoneNumber, '123456', 'testing');
      const success = gatewayResponse.status === 200;
      
      res.json({ 
        message: success ? `Test message sent via WhatsApp Service to ${phoneNumber}` : `Failed to send via WhatsApp Service`,
        result: { gatewayResponse } 
      });
    } catch (error) {
      console.error('Error in SettingsController.testOtp:', error.message);
      res.status(500).json({ error: error.message || 'Failed to send test OTP' });
    }
  }
}

module.exports = new SettingsController();
