const db = require('../config/db');
const fs = require('fs');
const path = require('path');

/**
 * Service to generate system reports (CSV/JSON).
 */
class ReportService {
  async generatePollReport(pollId) {
    try {
      const pollRes = await db.query('SELECT title FROM polls WHERE id = $1', [pollId]);
      if (pollRes.rows.length === 0) throw new Error('Poll not found');
      
      const results = await db.query(
        'SELECT phone_number, option_selected, candidate_id, created_at FROM poll_votes WHERE poll_id = $1',
        [pollId]
      );

      const filename = `poll_report_${pollId}_${Date.now()}.csv`;
      const filePath = path.join(__dirname, '../../uploads', filename);
      
      let csv = 'Voter ID (Masked),Selection,Timestamp\n';
      results.rows.forEach(row => {
        const masked = row.phone_number.substring(0, 4) + '****' + row.phone_number.substring(row.phone_number.length - 2);
        csv += `${masked},${row.option_selected || row.candidate_id},${row.created_at.toISOString()}\n`;
      });

      fs.writeFileSync(filePath, csv);
      
      return {
        filename,
        filePath,
        url: `${process.env.WEBSITE_DOMAIN || 'localhost:3085'}/uploads/${filename}`
      };
    } catch (err) {
      console.error('[REPORT] Error generating poll report:', err.message);
      throw err;
    }
  }

  async getSystemHeartbeat() {
    const os = require('os');
    try {
      const sentCount = await db.query("SELECT COUNT(*) FROM message_history WHERE sent_at > NOW() - INTERVAL '24 hours'");
      const pendingApprovals = await db.query("SELECT COUNT(*) FROM users WHERE status = 'PENDING_APPROVAL'");
      
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memUsage = ((totalMem - freeMem) / totalMem * 100).toFixed(2);

      return {
        cpu_usage: os.loadavg()[0].toFixed(2),
        memory_usage: memUsage,
        messages_sent_24h: parseInt(sentCount.rows[0].count),
        pending_approvals: parseInt(pendingApprovals.rows[0].count)
      };
    } catch (err) {
      console.error('[REPORT] Error getting heartbeat:', err.message);
      return null;
    }
  }
}

module.exports = new ReportService();
