const db = require('../config/db');
const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');
const { promisify } = require('util');
const execPromise = promisify(exec);

/**
 * Controller for System Management and Updates
 */
class SystemController {
  getGitHubRepoConfig() {
    return {
      owner: 'caseypaite',
      repo: 'WhatsApp-Web-Tool'
    };
  }

  getPackageVersion() {
    return require('../../package.json').version || '1.6.0';
  }

  getReleaseFallbackHistory() {
    return [
      { id: '1.6.0', shortHash: 'v1.6.0', message: 'Official Beta transition with secure cookie auth and modular UI', date: '2026-03-28' },
      { id: '1.5.5', shortHash: 'v1.5.5', message: 'Interactive API diagnostics and external media support', date: '2026-03-28' },
      { id: '1.5.4', shortHash: 'v1.5.4', message: 'Production recovery and sidebar restoration', date: '2026-03-28' }
    ];
  }

  async fetchGitHubCommitHistory(limit = 5) {
    const { owner, repo } = this.getGitHubRepoConfig();
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AppStack-SystemController'
      },
      params: { per_page: limit },
      timeout: 5000
    });

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid GitHub commits response');
    }

    return response.data
      .map((commit) => ({
        id: commit.sha,
        shortHash: commit.sha?.slice(0, 7),
        date: commit.commit?.author?.date ? commit.commit.author.date.split('T')[0] : null,
        message: commit.commit?.message?.split('\n')[0]
      }))
      .filter((entry) => entry.id && entry.shortHash && entry.date && entry.message);
  }

  /**
   * Fetches version history from GitHub.
   */
  async getVersionHistory(req, res) {
    try {
      // Fetch latest releases/tags from GitHub
      const response = await axios.get('https://api.github.com/repos/caseypaite/WhatsApp-Web-Tool/releases', {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        timeout: 5000
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response from GitHub');
      }

      const history = response.data.slice(0, 10).map(release => ({
        tag: release.tag_name,
        message: release.name || release.body?.split('\n')[0] || 'Regular protocol update',
        date: release.published_at ? release.published_at.split('T')[0] : '2026-04-04'
      }));

      res.json(history);
    } catch (error) {
      console.error('[SYSTEM] Failed to fetch version history:', error.message);
      // Fallback data if GitHub is unreachable
      const fallback = [
        { tag: "v1.6.0", message: "Official Beta transition with secure cookie auth and modular UI", date: "2026-03-28" },
        { tag: "v1.5.5", message: "Interactive API diagnostics and external media support", date: "2026-03-28" }
      ];
      res.json(fallback);
    }
  }

  /**
   * Returns the current app version and the latest git history.
   */
  async getGitHistory(req, res) {
    const rootDir = path.join(__dirname, '../../../');
    const version = this.getPackageVersion();

    try {
      const { stdout } = await execPromise(
        'git --no-pager log -5 --date=short --pretty=format:"%H%x09%h%x09%ad%x09%s"',
        { cwd: rootDir }
      );

      const history = stdout
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [id, shortHash, date, ...messageParts] = line.split('\t');
          return {
            id,
            shortHash,
            date,
            message: messageParts.join('\t')
          };
        })
        .filter((entry) => entry.id && entry.shortHash && entry.date && entry.message);

      if (history.length === 0) {
        throw new Error('Git log returned no entries');
      }

      res.json({ version, source: 'git', history });
    } catch (error) {
      console.error('[SYSTEM] Failed to read local git history:', error.message);
      try {
        const history = await this.fetchGitHubCommitHistory(5);
        if (history.length === 0) {
          throw new Error('GitHub commit history returned no entries');
        }

        res.json({
          version,
          source: 'github',
          history
        });
      } catch (githubError) {
        console.error('[SYSTEM] Failed to fetch GitHub commit history:', githubError.message);
        res.json({
          version,
          source: 'fallback',
          history: this.getReleaseFallbackHistory()
        });
      }
    }
  }

  /**
   * Returns current system status and version.
   */
  async getSystemStatus(req, res) {
    try {
      const version = this.getPackageVersion();
      const dbStatus = await db.query('SELECT NOW()');
      
      res.json({
        version,
        node_env: process.env.NODE_ENV,
        database: dbStatus.rows ? 'CONNECTED' : 'DISCONNECTED',
        uptime: process.uptime(),
        platform: process.platform
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve system status' });
    }
  }
}

module.exports = new SystemController();
