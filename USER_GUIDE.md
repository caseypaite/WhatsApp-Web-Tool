# WhatsApp Web Tool User Guide

Welcome to the **WhatsApp Web Tool** User Guide. This document provides step-by-step instructions for deployment, administration, and advanced usage.

---

## 🏗️ 1. Server Deployment

### Automated Installation
The platform includes an automated script to handle database creation, schema initialization, and service setup.

1. **Environment Setup:** Copy `.env.example` to `.env` in the `backend/` folder and fill in your details.
2. **Run Installer:**
   ```bash
   ./scripts/fresh-install.sh
   ```
3. **Systemd Integration:** During installation, the script will configure services as systemd units. This ensures automatic restarts and high availability.

### Service Control
Use these commands for manual management:
- **Restart Server:** `sudo systemctl restart whatsapp-web-tool-backend`
- **Check Status:** `sudo systemctl status whatsapp-web-tool-backend`
- **View Logs:** `sudo journalctl -u whatsapp-web-tool-backend -f`

---

## 🔑 2. Getting Started & Security

### Registration & Password Policy
1. Go to the **Register** page.
2. Enter your details. Your password must meet the following **Security Policy**:
   - Minimum **8 characters**.
   - At least one **uppercase** and one **lowercase** letter.
   - At least one **number**.
   - At least one **special character** (`@$!%*?&#`).
3. Click **Send OTP** to verify your WhatsApp identity.
4. Enter the 6-digit code.
5. Upon submission, your account enters **Pending Approval**. An admin must activate it before you can log in.

### Login Options
- **Identity Credentials:** Standard Email/Password login.
- **Identity Proofing (OTP):** Login via a temporary code sent to your registered WhatsApp number.

---

## 🛠️ 3. Administrator Guide

### User & Role Management
- Access the **Users** tab to view the registry.
- **Activation**: Change a user's status to `ACTIVE` to grant system access.
- **RBAC**: Assign `SuperAdmin`, `Admin`, `Editor`, or `User` roles.
  - **SuperAdmin**: Full system access, including management of all community polls and access to the Admin Portal.
  - **Admin**: Full access to standard administrative tools and user management.

### WhatsApp Instance
- **Connection**: Scan the QR code in the **WhatsApp** tab to link your server instance.
- **Entity Directory**: Manage groups and channels where the server account is an administrator.
- **Group Greetings**: Enable or disable automated "Welcome" messages for new group members. 
  - **Global Setting**: Manage the system-wide default in **Settings > General**.
  - **Per-Group Override**: Toggle greetings for specific groups in the **WhatsApp** tab.
- **Broadcast**: Send messages or media to multiple targets simultaneously using the **Broadcast** tool.
- **Templates**: Create reusable message formats with support for media attachments.

### Automation & Intelligence
- **Auto-Responders**: Define keywords (Exact or Contains) to trigger automated WhatsApp replies.
- **AI Assistant**: If enabled, the AI handles complex queries that don't match specific keywords. 
  - **Customization**: Define the AI's "Personality" and instructions in the **Settings > AI** tab.
  - **Providers**: Supports Google Gemini 2.0 Flash/Pro and Mistral AI.
- **Scheduling**: Queue messages for future transmission with specific date/time targets.
- **Heartbeat**: Super Admins receive a daily WhatsApp report at 9:00 AM with server health and activity stats.

### Governance Hub
- **Entrance Lobby (Gatekeeper)**: When enabled for a group, new members are private messaged a verification link. Failure to verify identity using an Identity Packet results in automated removal.
- **Membership Sync**: Deactivating a user in the portal automatically triggers their removal from all managed WhatsApp groups.
- **Admin Dashboard Performance**: The dashboard is optimized for speed, eagerly loading all configuration and state data on initialization to provide an instant, reactive experience.

---

## 👤 4. User Guide

### Profile & Identity
- **Verifiable Identity**: Your profile is anchored to your physical WhatsApp number.
- **Updates**: Modify your name, address, and location. Phone updates require fresh OTP verification.

### Community Decisions (Polling)
- Browse active public polls on the **Landing Page** or in your **Polls** tab.
- **Verified Voting**: Cast your vote by requesting a unique Identity Packet (OTP) via WhatsApp. This ensures "One Person, One Vote" integrity.
- **Vote Privacy**: If you have already cast a vote, you can request a fresh OTP to **View Your Vote**. Your choice remains hidden from the UI until your identity is cryptographically re-verified.

### Activity Audit
- View your personalized **Message History** to track all OTPs and notifications sent to your device.

---

## 🛠️ 4. Developer & API Guide

The platform provides a robust API for external system integrations, allowing other applications to trigger WhatsApp communications and manage entities.

### Authentication (`x-api-key`)
External requests must include the `x-api-key` header. The platform supports two tiers of keys:
- **Full Access Key**: Grants `Admin` permissions to all messaging, entity management, and system configuration endpoints.
- **Messaging-Only Key**: Restricted to communication endpoints (Broadcast, Group/Channel Message, Poll). This key **cannot** access status checks, chat registries, or group management.
- **Location**: Manage your API Keys from the **Settings > Security** tab.

### API Vector Reference
The Admin Dashboard includes a live-updating documentation hub:
1. Navigate to **Settings > General**.
2. Click the **API Documentation** button in the sidebar.
3. Access interactive cURL examples for all supported endpoints, including parameters for **Direct Group Messaging** and **Channel (Newsletter) Publication**.

### Clean API Endpoints (v1)
All external requests should use the following "clean" endpoints for better integration:

#### 1. Universal Broadcast
**Endpoint**: `POST /api/v1/broadcast`
**Header**: `x-api-key: YOUR_KEY`
**Payload**:
```json
{
  "targets": [
    { "id": "91XXXXXXXXXX@c.us", "type": "individual" },
    { "id": "120363000000000000@g.us", "type": "group" },
    { "id": "120363000000000000@newsletter", "type": "channel" }
  ],
  "message": "Unified system alert.",
  "mediaUrl": "https://example.com/alert.png",
  "mediaType": "image"
}
```

#### 2. Direct Channel Publication
**Endpoint**: `POST /api/v1/message/channel`
**Payload**:
```json
{
  "channelId": "120363000000000000@newsletter",
  "message": "Weekly digest is now available!",
  "mediaUrl": "https://example.com/digest.pdf",
  "mediaType": "document"
}
```

#### 3. Direct Group Message
**Endpoint**: `POST /api/v1/message/group`
**Payload**:
```json
{
  "groupId": "120363000000000000@g.us",
  "message": "Maintenance update for group members.",
  "mediaUrl": "https://example.com/notice.jpg",
  "mediaType": "image"
}
```

#### 4. Direct Single Message
**Endpoint**: `POST /api/v1/message/single`
**Payload**:
```json
{
  "number": "91XXXXXXXXXX",
  "message": "Your OTP code is 123456"
}
```

#### 5. Native WhatsApp Poll
**Endpoint**: `POST /api/v1/poll`
**Payload**:
```json
{
  "chatId": "120363000000000000@g.us",
  "question": "Choose your preferred slot:",
  "options": ["Morning", "Afternoon", "Evening"],
  "allowMultiple": false
}
```

### Security Considerations (SSRF)
The system includes an **SSRF Validation Layer**. If you provide a `mediaUrl`, the server will:
1. Validate the URL structure.
2. Resolve the hostname to an IP address.
3. Deny the request if the IP address belongs to a private or reserved network range (e.g., `127.0.0.1`, `10.x.x.x`).

---

## ❓ Troubleshooting

- **QR Code Connectivity:** Ensure the backend has internet access and the WhatsApp account is active on a mobile device.
- **OTP Latency:** Check the "Gateway Log" in your dashboard for real-time API response data.
- **Service Stability:** The frontend is hardened against initialization errors. If a "Blank Page" occurs, clear your browser cache and ensure the backend service is responding.

---

## 📅 Release History

### Beta v1.6.0-rev1 (2026-03-28)
- **Group Greetings**: Integrated a global and per-group option to enable or disable automatic greeting messages for new members. Default is disabled.
- **Beta Transition**: Platform officially enters Beta status with significant stability and security improvements.
- **Security**: Complete transition to **HttpOnly Secure Cookie** authentication.
- **UI/UX**: Modularized the Admin Dashboard and implemented lazy-loading for all management tabs.
- **Sanitization**: Integrated **DOMPurify** for secure client-side HTML rendering.

### Alpha v1.5.5 (2026-03-28)
- **Diagnostics**: Introduced an **Interactive Diagnostic Modal** for real-time API testing.
- **Media**: Enabled support for external **Media URLs** and **Media Types** in all communication vectors.

### Alpha v1.5.4 (2026-03-28)
- **UI/UX**: Improved legibility of the **API Vector Reference** by increasing font sizes for documentation and cURL examples.

### Alpha v1.5.3 (2026-03-27)
- **External Integration**: Configure an **API Key** in *Settings > Security* to allow external systems to trigger broadcasts and group messages.
- **Documentation**: Access the **API Vector Reference** sidebar in *Settings* for live-updating cURL examples.
- **Infrastructure**: Fixed WhatsApp node creation (Groups/Channels) and modernized the group welcome flow.

© 2026 WhatsApp Web Tool Team. All rights reserved.
