const db = require('../config/db');
const settingsService = require('./settings.service');
const crypto = require('crypto');

/**
 * Service to handle OTP (One Time Password) lifecycle.
 */
class OtpService {
  /**
   * Generates a 6-digit OTP code and stores it with an expiration timestamp.
   * @param {number|null} userId - The user ID (optional).
   * @param {string} phoneNumber - The target phone number.
   * @param {string} purpose - The purpose of the OTP (default: 'verification').
   * @returns {Object} Result of the operation.
   */
  async generateAndSendOtp(userId, phoneNumber, purpose = 'verification') {
    const isEnabled = (await settingsService.get('otp_enabled')) === 'true';
    if (!isEnabled) {
      console.log(`[OTP] Skipping OTP because OTP_ENABLED is false.`);
      return { success: false, message: 'OTP is disabled' };
    }

    const expMinutes = parseInt(await settingsService.get('otp_expiration_minutes')) || 5;
    const expiresAt = new Date(Date.now() + expMinutes * 60 * 1000);
    const code = crypto.randomInt(100000, 999999).toString();

    try {
      // Mark previous PENDING OTPs as EXPIRED for this phone or user
      if (userId) {
        await db.query("UPDATE otp_verification SET status = 'EXPIRED' WHERE user_id = $1 AND status = 'PENDING'", [userId]);
      } else {
        await db.query("UPDATE otp_verification SET status = 'EXPIRED' WHERE phone_number = $1 AND status = 'PENDING'", [phoneNumber]);
      }

      // Store new OTP
      await db.query(
        'INSERT INTO otp_verification (user_id, phone_number, code, expires_at) VALUES ($1, $2, $3, $4)',
        [userId || null, phoneNumber, code, expiresAt]
      );

      console.log(`[OTP] Stored OTP for ${phoneNumber}, expires at ${expiresAt}. Code: ${code}`);
      const gatewayResponse = await this.callOtpGateway(phoneNumber, code, purpose);
      
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
    }
  }

  /**
   * Triggers the internal WhatsApp service for OTP.
   */
  async callOtpGateway(phoneNumber, code, purpose = 'verification') {
    const whatsappService = require('./whatsapp.service');
    try {
      const siteName = await settingsService.get('site_name') || 'Portal';
      
      // professional OTP template
      const message = `🔐 *VERIFICATION CODE*\n\nYour OTP for *${purpose}* is:\n\n*${code}*\n\nThis code will expire in 5 minutes. Do not share this with anyone.`;
      
      const result = await whatsappService.sendMessage(phoneNumber, message);
      return { status: 200, data: { success: true, messageId: result.id?._serialized || result.id } };
    } catch (error) {
      console.error('[OTP] Error via WhatsApp Service:', error.message);
      return { 
        status: 500, 
        data: { error: true, message: error.message }
      };
    }
  }

  /**
   * Verifies the provided OTP code.
   */
  async verifyOtp(userIdOrPhone, providedCode) {
    try {
      let query, params;
      const isNumeric = (val) => /^\d+$/.test(val.toString());

      if (typeof userIdOrPhone === 'number' || (typeof userIdOrPhone === 'string' && userIdOrPhone.length < 8 && isNumeric(userIdOrPhone))) {
        query = "SELECT * FROM otp_verification WHERE user_id = $1 AND status = 'PENDING' ORDER BY id DESC LIMIT 1";
        params = [userIdOrPhone];
      } else {
        query = "SELECT * FROM otp_verification WHERE phone_number = $1 AND status = 'PENDING' ORDER BY id DESC LIMIT 1";
        params = [userIdOrPhone.toString()];
      }

      const result = await db.query(query, params);
      const otpRecord = result.rows[0];
      if (!otpRecord) return false;

      if (new Date() > new Date(otpRecord.expires_at)) {
        await db.query("UPDATE otp_verification SET status = 'EXPIRED' WHERE id = $1", [otpRecord.id]);
        throw new Error('OTP has expired.');
      }

      const maxRetries = parseInt(await settingsService.get('otp_max_retries')) || 3;
      if (otpRecord.retry_count >= maxRetries) {
        await db.query("UPDATE otp_verification SET status = 'FAILED' WHERE id = $1", [otpRecord.id]);
        throw new Error('Too many failed attempts.');
      }

      if (providedCode !== otpRecord.code) {
        await db.query('UPDATE otp_verification SET retry_count = retry_count + 1 WHERE id = $1', [otpRecord.id]);
        return false;
      }

      await db.query("UPDATE otp_verification SET status = 'VERIFIED' WHERE id = $1", [otpRecord.id]);
      return true;
    } catch (err) {
      console.error('Error in verifyOtp:', err.message);
      throw err;
    }
  }

  /**
   * Sends a raw message via WhatsApp service.
   */
  async sendRawMessage(phoneNumber, message) {
    const whatsappService = require('./whatsapp.service');
    try {
      const result = await whatsappService.sendMessage(phoneNumber, message);
      return { status: 200, data: { success: true, messageId: result.id?._serialized || result.id } };
    } catch (error) {
      console.error('[OTP] Raw message error:', error.message);
      return { 
        status: 500, 
        data: { error: true, message: error.message }
      };
    }
  }
}

module.exports = new OtpService();
