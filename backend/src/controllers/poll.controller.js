const db = require('../config/db');
const otpService = require('../services/otp.service');

class PollController {
  // Original Admin methods
  async getAll(req, res) {
    let { limit, offset } = req.query;
    limit = limit ? parseInt(limit) : 50;
    offset = offset ? parseInt(offset) : 0;

    try {
      let query = 'SELECT * FROM polls ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      const result = await db.query(query, [limit, offset]);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    const { id } = req.params;
    try {
      const pollRes = await db.query('SELECT * FROM polls WHERE id = $1', [id]);
      if (pollRes.rows.length === 0) return res.status(404).json({ error: 'Poll not found' });
      
      const poll = pollRes.rows[0];
      if (poll.type === 'ELECTION') {
        const candRes = await db.query('SELECT * FROM poll_candidates WHERE poll_id = $1', [id]);
        poll.candidates = candRes.rows;
      }
      
      res.json(poll);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPublicLatest(req, res) {
    try {
      const result = await db.query(
        "SELECT id, title, description, type, created_at FROM polls WHERE access_type = 'PUBLIC' AND status = 'OPEN' ORDER BY created_at DESC LIMIT 6"
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Advanced Poll Module methods
  async create(req, res) {
    let { title, description, type, access_type, options, group_id, candidates } = req.body;
    const creator_id = req.user.id;
    console.log('[POLL] Creating poll:', { title, type, group_id, creator_id });

    const client = await db.pool.connect();
    try {
      // Normalize group_id
      const finalGroupId = (group_id && group_id !== "") ? parseInt(group_id) : null;

      // Check if user is system Admin or Group Admin
      if (!req.user.roles?.includes('Admin')) {
        if (!finalGroupId) {
          console.warn('[POLL] Non-admin tried creating global poll');
          return res.status(403).json({ error: 'Only system administrators can create global public polls' });
        }
        const adminRes = await client.query(
          "SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = 'ADMIN'",
          [finalGroupId, creator_id]
        );
        if (adminRes.rows.length === 0) {
          console.warn('[POLL] Unauthorized poll creation attempt for group:', finalGroupId);
          return res.status(403).json({ error: 'Only group administrators can create polls' });
        }
      }

      await client.query('BEGIN');

      const pollRes = await client.query(
        'INSERT INTO polls (creator_id, group_id, type, access_type, title, description, options) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [creator_id, finalGroupId, type || 'GENERAL', access_type || 'PUBLIC', title, description, JSON.stringify(options || [])]
      );
      const poll = pollRes.rows[0];
      console.log('[POLL] Base poll created:', poll.id);

      if (type === 'ELECTION' && candidates && candidates.length > 0) {
        for (const cand of candidates) {
          await client.query(
            'INSERT INTO poll_candidates (poll_id, name, photo_url, manifesto, biography) VALUES ($1, $2, $3, $4, $5)',
            [poll.id, cand.name, cand.photo_url, cand.manifesto, cand.biography]
          );
        }
        console.log('[POLL] Candidates added for poll:', poll.id);
      }

      await client.query('COMMIT');
      res.status(201).json(poll);
    } catch (error) {
      console.error('[POLL] Creation error:', error.message);
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  }

  async update(req, res) {
    const { id } = req.params;
    const { title, description, status, access_type, options } = req.body;
    const userId = req.user.id;

    try {
      // Check ownership
      const checkRes = await db.query('SELECT creator_id FROM polls WHERE id = $1', [id]);
      if (checkRes.rows.length === 0) return res.status(404).json({ error: 'Poll not found' });
      if (!req.user.roles?.includes('Admin') && checkRes.rows[0].creator_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const result = await db.query(
        'UPDATE polls SET title = $1, description = $2, status = $3, access_type = $4, options = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
        [title, description, status, access_type, JSON.stringify(options), id]
      );
      
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async requestVoteOtp(req, res) {
    const { pollId, phone_number } = req.body;
    if (!phone_number) return res.status(400).json({ error: 'Phone number required' });

    try {
      // In a real scenario, check if poll exists and is OPEN
      await otpService.generateAndSendOtp(null, phone_number);
      res.json({ success: true, message: 'OTP sent for voting' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async verifyAndVote(req, res) {
    const { pollId, phone_number, otp, option_selected, candidate_id } = req.body;
    
    try {
      // 1. Verify OTP
      const isValid = await otpService.verifyOtp(phone_number, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid or expired OTP' });

      // 2. Check if already voted
      const checkVote = await db.query(
        'SELECT * FROM poll_votes WHERE poll_id = $1 AND phone_number = $2',
        [pollId, phone_number]
      );

      if (checkVote.rows.length > 0) {
        const existingVote = checkVote.rows[0];
        let voteDetail = existingVote.option_selected;
        if (existingVote.candidate_id) {
          const cand = await db.query('SELECT name FROM poll_candidates WHERE id = $1', [existingVote.candidate_id]);
          voteDetail = cand.rows[0]?.name || 'Unknown Candidate';
        }
        return res.json({ 
          already_voted: true, 
          message: `You have already cast your vote for: ${voteDetail}`,
          vote: existingVote
        });
      }

      // 3. Validate Poll Access (Closed Polls)
      const pollRes = await db.query('SELECT * FROM polls WHERE id = $1', [pollId]);
      const poll = pollRes.rows[0];
      if (!poll) return res.status(404).json({ error: 'Poll not found' });
      if (poll.status !== 'OPEN') return res.status(400).json({ error: 'Poll is closed' });

      if (poll.access_type === 'CLOSED') {
        // Check if user with this phone exists and is in the group
        const userRes = await db.query('SELECT id FROM users WHERE phone_number = $1', [phone_number]);
        if (userRes.rows.length === 0) return res.status(403).json({ error: 'Only registered members can vote in this closed poll' });
        
        const userId = userRes.rows[0].id;
        const memberRes = await db.query('SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2', [poll.group_id, userId]);
        if (memberRes.rows.length === 0) return res.status(403).json({ error: 'You are not a member of the required group' });
      }

      // 4. Cast Vote
      const voteRes = await db.query(
        'INSERT INTO poll_votes (poll_id, phone_number, option_selected, candidate_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [pollId, phone_number, option_selected || null, candidate_id || null]
      );

      res.json({ success: true, message: 'Vote cast successfully', vote: voteRes.rows[0] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getResults(req, res) {
    const { id } = req.params;
    try {
      const pollRes = await db.query('SELECT type FROM polls WHERE id = $1', [id]);
      if (pollRes.rows.length === 0) return res.status(404).json({ error: 'Poll not found' });

      let results;
      if (pollRes.rows[0].type === 'ELECTION') {
        results = await db.query(
          'SELECT c.id, c.name, COUNT(v.id) as votes FROM poll_candidates c LEFT JOIN poll_votes v ON c.id = v.candidate_id WHERE c.poll_id = $1 GROUP BY c.id, c.name',
          [id]
        );
      } else {
        results = await db.query(
          'SELECT option_selected, COUNT(*) as votes FROM poll_votes WHERE poll_id = $1 GROUP BY option_selected',
          [id]
        );
      }
      res.json(results.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    const { id } = req.params;
    try {
      // Check ownership or admin
      const pollRes = await db.query('SELECT creator_id FROM polls WHERE id = $1', [id]);
      if (pollRes.rows.length === 0) return res.status(404).json({ error: 'Poll not found' });
      
      if (!req.user.roles?.includes('Admin') && pollRes.rows[0].creator_id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await db.query('DELETE FROM polls WHERE id = $1', [id]);
      res.json({ success: true, message: 'Poll deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new PollController();
