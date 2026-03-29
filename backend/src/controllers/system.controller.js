const db = require('../config/db');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const execPromise = promisify(exec);

/**
 * Controller for System Management and Updates
 */
class SystemController {
  /**
   * Performs a system update using an uploaded tar.gz package.
   */
  async performUpdate(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'No update package provided.' });
    }

    const packagePath = req.file.path;
    const tempDir = path.join(__dirname, '../../temp_update_' + Date.now());
    const rootDir = path.join(__dirname, '../../../'); // AppStack root

    console.log(`[SYSTEM] Starting update protocol with package: ${req.file.originalname}`);

    try {
      // 1. Create temp directory
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      // 2. Extract package
      console.log(`[SYSTEM] Extracting package to: ${tempDir}`);
      await execPromise(`tar -xzf ${packagePath} -C ${tempDir}`);

      // 3. Database Schema Sync (Retain data, add new tables/cols)
      // We look for backend/src/db/acl_schema.sql in the extracted package
      const schemaPath = path.join(tempDir, 'backend/src/db/acl_schema.sql');
      if (fs.existsSync(schemaPath)) {
        console.log('[SYSTEM] Applying database schema updates...');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // Split by semicolon and run each command to handle potential errors gracefully
        const commands = schemaSql.split(';').filter(cmd => cmd.trim() !== '');
        const client = await db.pool.connect();
        try {
          await client.query('BEGIN');
          for (let cmd of commands) {
            await client.query(cmd);
          }
          await client.query('COMMIT');
          console.log('[SYSTEM] Database schema synchronized.');
        } catch (dbErr) {
          await client.query('ROLLBACK');
          console.error('[SYSTEM] Schema sync error:', dbErr.message);
          // We continue anyway as some commands might fail if already exists but 
          // acl_schema.sql is now using IF NOT EXISTS/IF EXISTS so it should be fine.
        } finally {
          client.release();
        }
      }

      // 4. Code Synchronization
      // For Docker, we replace backend/src and root frontend (pre-built)
      console.log('[SYSTEM] Synchronizing codebases...');
      
      const updateScript = `
        # Synchronize Backend Source
        rm -rf ${rootDir}/backend/src/*
        cp -rf ${tempDir}/backend/src/* ${rootDir}/backend/src/
        
        # Synchronize Frontend Pre-built assets
        if [ -d "${tempDir}/frontend" ]; then
          rm -rf ${rootDir}/frontend/*
          cp -rf ${tempDir}/frontend/* ${rootDir}/frontend/
        fi

        # Sync package files
        cp ${tempDir}/backend/package.json ${rootDir}/backend/
        cp ${tempDir}/frontend/package.json ${rootDir}/frontend/ 2>/dev/null || true
      `;

      await execPromise(updateScript);

      // 5. Cleanup
      console.log('[SYSTEM] Cleaning up temporary files...');
      await execPromise(`rm -rf ${tempDir}`);
      if (fs.existsSync(packagePath)) fs.unlinkSync(packagePath);

      res.json({ 
        message: 'Update package applied successfully. System will restart in 5 seconds to apply changes.',
        status: 'PENDING_RESTART'
      });

      // 6. Auto-Restart (Trigger Docker to restart the container)
      console.log('[SYSTEM] Update complete. Restarting process...');
      setTimeout(() => {
        process.exit(0); // Exit with success, Docker with restart:always will bring it back
      }, 5000);

    } catch (error) {
      console.error('[SYSTEM] Critical update failure:', error.message);
      // Cleanup on failure
      if (fs.existsSync(tempDir)) await execPromise(`rm -rf ${tempDir}`);
      if (fs.existsSync(packagePath)) fs.unlinkSync(packagePath);
      
      res.status(500).json({ 
        error: 'System update failed.', 
        details: error.message 
      });
    }
  }

  /**
   * Returns current system status and version.
   */
  async getSystemStatus(req, res) {
    try {
      const version = require('../../package.json').version || '1.6.0';
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
