const axios = require('axios');
const { Client } = require('pg');
const settingsService = require('./settings.service');

/**
 * Service to handle OTP (One Time Password) lifecycle.
 */
class OtpService {
  /**
   * Generates a 6-digit OTP code and stores it with an expiration timestamp.
   * @param {number|null} userId - The user ID (optional).
   * @param {string} phoneNumber - The target phone number.
   * @returns {Object} Result of the operation.
   */
  async generateAndSendOtp(userId, phoneNumber) {
    const isEnabled = (await settingsService.get('otp_enabled')) === 'true';
    if (!isEnabled) {
      console.log(`[OTP] Skipping OTP because OTP_ENABLED is false.`);
      return { success: false, message: 'OTP is disabled' };
    }

    const expMinutes = parseInt(await settingsService.get('otp_expiration_minutes')) || 5;
    const expiresAt = new Date(Date.now() + expMinutes * 60 * 1000);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      
      // Mark previous PENDING OTPs as EXPIRED for this phone or user
      if (userId) {
        await client.query("UPDATE otp_verification SET status = 'EXPIRED' WHERE user_id = $1 AND status = 'PENDING'", [userId]);
      } else {
        await client.query("UPDATE otp_verification SET status = 'EXPIRED' WHERE phone_number = $1 AND status = 'PENDING'", [phoneNumber]);
      }

      // Store new OTP
      await client.query(
        'INSERT INTO otp_verification (user_id, phone_number, code, expires_at) VALUES ($1, $2, $3, $4)',
        [userId || null, phoneNumber, code, expiresAt]
      );

      console.log(`[OTP] Stored OTP for ${phoneNumber}, expires at ${expiresAt}. Code: ${code}`);
      const gatewayResponse = await this.callOtpGateway(phoneNumber, code);
      
      const gatewaySuccess = gatewayResponse.status >= 200 && gatewayResponse.status < 300;
      
      return { 
        success: gatewaySuccess, 
        code, 
        gatewayResponse,
        message: gatewaySuccess ? 'OTP sent successfully' : `Gateway error: ${gatewayResponse.status}`
      };
    } catch (err) {
      console.error('Error in generateAndSendOtp:', err.message);
      throw err;
    } finally {
      await client.end();
    }
  }

  /**
   * Triggers the external OTP gateway.
   */
  async callOtpGateway(phoneNumber, code) {
    const gatewayUrl = await settingsService.get('otp_gateway_url');
    const apiKey = await settingsService.get('otp_api_key');

    if (!gatewayUrl || !apiKey) {
      const msg = '[OTP] Gateway URL or API Key not configured.';
      console.warn(msg, 'Logging code instead:', code);
      return { status: 'mock', message: msg, code };
    }

    try {
      const siteName = await settingsService.get('site_name') || 'AppStack';
      const response = await axios.post(gatewayUrl, {
        number: phoneNumber,
        message: `Your ${siteName} verification code is: ${code}`,
      }, {
        headers: {
          'X-API-KEY': apiKey
        }
      });
      return { status: response.status, data: response.data };
    } catch (error) {
      console.error('Error calling OTP Gateway:', error.message);
      return { 
        status: error.response?.status || 'error', 
        data: error.response?.data || error.message 
      };
    }
  }

  /**
   * Verifies the provided OTP code.
   */
  async verifyOtp(userIdOrPhone, providedCode) {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      
      let query, params;
      const isNumeric = (val) => /^\d+$/.test(val.toString());

      if (typeof userIdOrPhone === 'number' || (typeof userIdOrPhone === 'string' && userIdOrPhone.length < 8 && isNumeric(userIdOrPhone))) {
        query = "SELECT * FROM otp_verification WHERE user_id = $1 AND status = 'PENDING' ORDER BY id DESC LIMIT 1";
        params = [userIdOrPhone];
      } else {
        query = "SELECT * FROM otp_verification WHERE phone_number = $1 AND status = 'PENDING' ORDER BY id DESC LIMIT 1";
        params = [userIdOrPhone.toString()];
      }

      const result = await client.query(query, params);
      const otpRecord = result.rows[0];
      if (!otpRecord) return false;

      if (new Date() > new Date(otpRecord.expires_at)) {
        await client.query("UPDATE otp_verification SET status = 'EXPIRED' WHERE id = $1", [otpRecord.id]);
        throw new Error('OTP has expired.');
      }

      const maxRetries = parseInt(await settingsService.get('otp_max_retries')) || 3;
      if (otpRecord.retry_count >= maxRetries) {
        await client.query("UPDATE otp_verification SET status = 'FAILED' WHERE id = $1", [otpRecord.id]);
        throw new Error('Too many failed attempts.');
      }

      if (providedCode !== otpRecord.code) {
        await client.query('UPDATE otp_verification SET retry_count = retry_count + 1 WHERE id = $1', [otpRecord.id]);
        return false;
      }

      await client.query("UPDATE otp_verification SET status = 'VERIFIED' WHERE id = $1", [otpRecord.id]);
      return true;
    } catch (err) {
      console.error('Error in verifyOtp:', err.message);
      throw err;
    } finally {
      await client.end();
    }
  }

  /**
   * Sends a raw message without any template.
   */
  async sendRawMessage(phoneNumber, message) {
    const gatewayUrl = await settingsService.get('otp_gateway_url');
    const apiKey = await settingsService.get('otp_api_key');

    if (!gatewayUrl || !apiKey) {
      console.warn('[OTP] Gateway URL or API Key not configured. Message:', message);
      return { status: 'mock', message: 'Gateway not configured', data: message };
    }

    try {
      const response = await axios.post(gatewayUrl, {
        number: phoneNumber,
        message: message,
      }, {
        headers: {
          'X-API-KEY': apiKey
        }
      });
      return { status: response.status, data: response.data };
    } catch (error) {
      console.error('Error calling OTP Gateway for raw message:', error.message);
      return { 
        status: error.response?.status || 'error', 
        data: error.response?.data || error.message 
      };
    }
  }
}

module.exports = new OtpService();
