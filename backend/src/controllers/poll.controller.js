const db = require('../config/db');
const otpService = require('../services/otp.service');
const { normalizePhoneNumber } = require('../utils/validators');

class PollController {
  async getAll(req, res) {
    let { limit, offset } = req.query;
    limit = limit ? parseInt(limit) : 50;
    offset = offset ? parseInt(offset) : 0;

    try {
      let query = `
        SELECT p.*, COUNT(v.id)::INTEGER as total_votes 
        FROM polls p 
        LEFT JOIN poll_votes v ON p.id = v.poll_id 
        GROUP BY p.id 
        ORDER BY p.created_at DESC 
        LIMIT $1 OFFSET $2
      `;
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
        "SELECT id, title, description, type, created_at, starts_at, ends_at, background_image_url FROM polls WHERE access_type = 'PUBLIC' AND status = 'OPEN' ORDER BY created_at DESC LIMIT 12"
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEligiblePolls(req, res) {
    const userId = req.user.id;

    try {
      // Fetch user's phone number first
      const userRes = await db.query('SELECT phone_number FROM users WHERE id = $1', [userId]);
      const phoneNumber = userRes.rows[0]?.phone_number;

      // 1. Get all PUBLIC polls
      // 2. Get CLOSED polls where user is in the internal group
      // 3. Get polls created by the user
      
      const query = `
        SELECT DISTINCT p.* 
        FROM polls p
        LEFT JOIN group_members gm ON p.group_id = gm.group_id AND gm.user_id = $1
        WHERE p.status = 'OPEN' AND (
          p.access_type = 'PUBLIC' 
          OR (p.access_type = 'CLOSED' AND gm.user_id IS NOT NULL)
          OR (p.creator_id = $1)
        )
        ORDER BY p.created_at DESC
      `;
      
      const result = await db.query(query, [userId]);
      let polls = result.rows;

      // 4. Get CLOSED polls where user is in the WA group
      const whatsappService = require('../services/whatsapp.service');
      if (whatsappService.isReady && phoneNumber) {
        const closedWaPolls = await db.query(
          "SELECT * FROM polls WHERE status = 'OPEN' AND access_type = 'CLOSED' AND wa_jid IS NOT NULL AND creator_id != $1",
          [userId]
        );
        
        for (const poll of closedWaPolls.rows) {
          if (!polls.find(p => p.id === poll.id)) {
            const isMember = await whatsappService.isParticipantInGroup(poll.wa_jid, phoneNumber);
            if (isMember) {
              polls.push(poll);
            }
          }
        }
      }

      res.json(polls);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    let { title, description, type, access_type, options, group_id, candidates, starts_at, ends_at, background_image_url, wa_jid } = req.body;
    const creator_id = req.user.id;

    const client = await db.pool.connect();
    try {
      const finalGroupId = (group_id && group_id !== "") ? parseInt(group_id) : null;

      if (!req.user.roles?.includes('Admin')) {
        if (!finalGroupId) {
          return res.status(403).json({ error: 'Only system administrators can create global public polls' });
        }
        const adminRes = await client.query(
          "SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = 'ADMIN'",
          [finalGroupId, creator_id]
        );
        if (adminRes.rows.length === 0) {
          return res.status(403).json({ error: 'Only group administrators can create polls' });
        }
      }

      await client.query('BEGIN');

      // Default status: if starts_at is in future, status is PENDING, else OPEN
      let status = 'OPEN';
      if (starts_at && new Date(starts_at) > new Date()) {
        status = 'PENDING';
      }

      const pollRes = await client.query(
        'INSERT INTO polls (creator_id, group_id, type, access_type, title, description, options, status, starts_at, ends_at, background_image_url, wa_jid) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
        [creator_id, finalGroupId, type || 'GENERAL', access_type || 'PUBLIC', title, description, JSON.stringify(options || []), status, starts_at || null, ends_at || null, background_image_url || null, wa_jid || null]
      );
      const poll = pollRes.rows[0];

      if (type === 'ELECTION' && candidates && candidates.length > 0) {
        for (const cand of candidates) {
          await client.query(
            'INSERT INTO poll_candidates (poll_id, name, photo_url, manifesto, biography) VALUES ($1, $2, $3, $4, $5)',
            [poll.id, cand.name, cand.photo_url, cand.manifesto, cand.biography]
          );
        }
      }

      await client.query('COMMIT');
      res.status(201).json(poll);
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  }

  async update(req, res) {
    const { id } = req.params;
    const { title, description, status, access_type, options, starts_at, ends_at, results_published, candidates, type, background_image_url, wa_jid } = req.body;
    const userId = req.user.id;

    const client = await db.pool.connect();
    try {
      const checkRes = await client.query('SELECT creator_id, type FROM polls WHERE id = $1', [id]);
      if (checkRes.rows.length === 0) return res.status(404).json({ error: 'Poll not found' });
      if (!req.user.roles?.includes('Admin') && !req.user.roles?.includes('SuperAdmin') && checkRes.rows[0].creator_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await client.query('BEGIN');

      const result = await client.query(
        'UPDATE polls SET title = $1, description = $2, status = $3, access_type = $4, options = $5, starts_at = $6, ends_at = $7, results_published = $8, background_image_url = $9, wa_jid = $10, updated_at = CURRENT_TIMESTAMP WHERE id = $11 RETURNING *',
        [title, description, status, access_type, JSON.stringify(options), starts_at, ends_at, results_published, background_image_url, wa_jid, id]
      );

      // Handle candidates if it's an election poll
      if ((type === 'ELECTION' || checkRes.rows[0].type === 'ELECTION') && candidates) {
        // Simple approach: delete all and re-insert
        await client.query('DELETE FROM poll_candidates WHERE poll_id = $1', [id]);
        for (const cand of candidates) {
          await client.query(
            'INSERT INTO poll_candidates (poll_id, name, photo_url, manifesto, biography) VALUES ($1, $2, $3, $4, $5)',
            [id, cand.name, cand.photo_url, cand.manifesto, cand.biography]
          );
        }
      }
      
      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  }

  async publishResults(req, res) {
    const { id } = req.params;
    const { published } = req.body;
    const userId = req.user.id;

    try {
      const checkRes = await db.query('SELECT creator_id FROM polls WHERE id = $1', [id]);
      if (checkRes.rows.length === 0) return res.status(404).json({ error: 'Poll not found' });
      if (!req.user.roles?.includes('Admin') && !req.user.roles?.includes('SuperAdmin') && checkRes.rows[0].creator_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await db.query('UPDATE polls SET results_published = $1 WHERE id = $2', [published, id]);
      res.json({ success: true, results_published: published });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getResults(req, res) {
    const { id } = req.params;
    try {
      const pollRes = await db.query('SELECT type, results_published, creator_id FROM polls WHERE id = $1', [id]);
      if (pollRes.rows.length === 0) return res.status(404).json({ error: 'Poll not found' });

      const isCreator = req.user && (req.user.id === pollRes.rows[0].creator_id || req.user.roles?.includes('Admin'));
      
      // If not published and not creator/admin, restrict some data? 
      // User said "allow publishing of poll result", implying it might be hidden until published.
      // But usually admins want to see it anytime.
      
      let results;
      if (pollRes.rows[0].type === 'ELECTION') {
        results = await db.query(
          `SELECT c.id, c.name, c.photo_url, c.manifesto, c.biography, COUNT(v.id) as votes 
           FROM poll_candidates c 
           LEFT JOIN poll_votes v ON c.id = v.candidate_id 
           WHERE c.poll_id = $1 
           GROUP BY c.id`,
          [id]
        );
      } else {
        results = await db.query(
          'SELECT option_selected, COUNT(*) as votes FROM poll_votes WHERE poll_id = $1 GROUP BY option_selected',
          [id]
        );
      }

      const totalVotesRes = await db.query('SELECT COUNT(*) FROM poll_votes WHERE poll_id = $1', [id]);
      
      res.json({
        poll: pollRes.rows[0],
        totalVotes: parseInt(totalVotesRes.rows[0].count),
        results: results.rows
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async requestVoteOtp(req, res) {
    const { pollId, phone_number, confirmView } = req.body;
    if (!phone_number) return res.status(400).json({ error: 'Phone number required' });
    
    const normalizedPhone = normalizePhoneNumber(phone_number);
    console.log(`[POLL] OTP Request received for poll ${pollId}, phone ${phone_number} (normalized: ${normalizedPhone}), confirmView ${confirmView}`);

    try {
      const pollRes = await db.query(
        'SELECT p.status, p.starts_at, p.ends_at, p.access_type, p.group_id, p.wa_jid as poll_wa_jid, g.wa_jid as group_wa_jid FROM polls p LEFT JOIN groups g ON p.group_id = g.id WHERE p.id = $1',
        [pollId]
      );
      const poll = pollRes.rows[0];
      if (!poll) {
        console.log(`[POLL] Poll ${pollId} not found`);
        return res.status(404).json({ error: 'Poll not found' });
      }
      
      const now = new Date();
      if (poll.starts_at && new Date(poll.starts_at) > now) {
        console.log(`[POLL] Poll ${pollId} not started yet`);
        return res.status(400).json({ error: 'Polling has not started yet.' });
      }
      if (poll.ends_at && new Date(poll.ends_at) < now) {
        console.log(`[POLL] Poll ${pollId} has ended`);
        return res.status(400).json({ error: 'Polling has ended.' });
      }
      if (poll.status !== 'OPEN') {
        console.log(`[POLL] Poll ${pollId} status is ${poll.status}`);
        return res.status(400).json({ error: 'Poll is not currently open.' });
      }

      // WhatsApp Group Membership Check
      const targetWaJid = poll.poll_wa_jid || poll.group_wa_jid;
      if (poll.access_type === 'CLOSED') {
        let isVerified = false;

        if (targetWaJid) {
          console.log(`[POLL] Membership check required for poll ${pollId}, targetWaJid: ${targetWaJid}`);
          const whatsappService = require('../services/whatsapp.service');
          if (!whatsappService.isReady) {
            console.log(`[POLL] WhatsApp service not ready`);
            return res.status(503).json({ error: 'Identity validation service is currently offline. Please try again in a few minutes.' });
          }
          
          isVerified = await whatsappService.isParticipantInGroup(targetWaJid, normalizedPhone);
          if (!isVerified) {
            console.log(`[POLL] Voter ${normalizedPhone} is not a member of ${targetWaJid}`);
            return res.status(403).json({ error: 'This decision node is restricted to specific organizational units. Your current mobile unit is not recognized as a member.' });
          }
          console.log(`[POLL] Voter ${normalizedPhone} verified as member of ${targetWaJid}`);
        } else if (poll.group_id) {
          // Fallback to internal group check ONLY if no WA JID is provided
          const userRes = await db.query('SELECT id FROM users WHERE phone_number = $1', [normalizedPhone]);
          if (userRes.rows.length === 0) {
            return res.status(403).json({ error: 'Only registered members can vote in this closed poll' });
          }
          
          const userId = userRes.rows[0].id;
          const memberRes = await db.query('SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2', [poll.group_id, userId]);
          if (memberRes.rows.length === 0) {
            return res.status(403).json({ error: 'You are not a member of the required internal group' });
          }
          isVerified = true;
        }

        if (!isVerified) {
           return res.status(403).json({ error: 'This poll is restricted and your membership could not be verified.' });
        }
      }

      // Check if already voted
      const checkVote = await db.query(
        'SELECT * FROM poll_votes WHERE poll_id = $1 AND phone_number = $2',
        [pollId, normalizedPhone]
      );

      if (checkVote.rows.length > 0 && !confirmView) {
        console.log(`[POLL] Voter ${normalizedPhone} already voted for poll ${pollId}`);
        return res.json({ 
          already_voted: true, 
          needs_confirmation: true,
          message: 'This phone number has already cast a vote for this poll.'
        });
      }

      console.log(`[POLL] Triggering OTP for ${normalizedPhone}`);
      await otpService.generateAndSendOtp(null, normalizedPhone, 'voting');
      res.json({ success: true, message: 'OTP sent successfully.', normalizedPhone });
    } catch (error) {
      console.error(`[POLL] requestVoteOtp error:`, error);
      res.status(500).json({ error: error.message });
    }
  }

  async verifyAndVote(req, res) {
    const { pollId, phone_number, otp, option_selected, candidate_id } = req.body;
    const normalizedPhone = normalizePhoneNumber(phone_number);
    
    try {
      const isValid = await otpService.verifyOtp(normalizedPhone, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid or expired OTP' });

      const checkVote = await db.query(
        'SELECT * FROM poll_votes WHERE poll_id = $1 AND phone_number = $2',
        [pollId, normalizedPhone]
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

      const pollRes = await db.query('SELECT * FROM polls WHERE id = $1', [pollId]);
      const poll = pollRes.rows[0];
      if (!poll) return res.status(404).json({ error: 'Poll not found' });
      
      const now = new Date();
      if (poll.starts_at && new Date(poll.starts_at) > now) return res.status(400).json({ error: 'Polling has not started yet.' });
      if (poll.ends_at && new Date(poll.ends_at) < now) return res.status(400).json({ error: 'Polling has ended.' });
      if (poll.status !== 'OPEN') return res.status(400).json({ error: 'Poll is closed' });

      if (poll.access_type === 'CLOSED') {
        const targetWaJid = poll.wa_jid; // Use wa_jid directly if set on poll
        let isVerified = false;

        if (targetWaJid) {
          const whatsappService = require('../services/whatsapp.service');
          if (whatsappService.isReady) {
            isVerified = await whatsappService.isParticipantInGroup(targetWaJid, normalizedPhone);
          }
        } else if (poll.group_id) {
          const userRes = await db.query('SELECT id FROM users WHERE phone_number = $1', [normalizedPhone]);
          if (userRes.rows.length > 0) {
            const userId = userRes.rows[0].id;
            const memberRes = await db.query('SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2', [poll.group_id, userId]);
            isVerified = memberRes.rows.length > 0;
          }
        }

        if (!isVerified) {
          return res.status(403).json({ error: 'Membership validation failed for this restricted decision unit.' });
        }
      }

      const voteRes = await db.query(
        'INSERT INTO poll_votes (poll_id, phone_number, option_selected, candidate_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [pollId, normalizedPhone, option_selected || null, candidate_id || null]
      );

      res.json({ success: true, message: 'Vote cast successfully', vote: voteRes.rows[0] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    const { id } = req.params;
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'OTP is required for this action' });

    try {
      const whatsappService = require('../services/whatsapp.service');
      const otpService = require('../services/otp.service');

      if (!whatsappService.me) return res.status(400).json({ error: 'WhatsApp account not connected' });
      const phone = whatsappService.me.wid.user;

      const isValid = await otpService.verifyOtp(phone, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid or expired OTP' });

      const pollRes = await db.query('SELECT creator_id FROM polls WHERE id = $1', [id]);
      if (pollRes.rows.length === 0) return res.status(404).json({ error: 'Poll not found' });
      
      if (!req.user.roles?.includes('Admin') && !req.user.roles?.includes('SuperAdmin') && pollRes.rows[0].creator_id !== req.user.id) {
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
