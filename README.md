# WhatsApp Web Tool
### Advanced Identity Management, Automated Messaging, and Community Governance Hub

WhatsApp Web Tool is a comprehensive full-stack platform designed for secure identity management, automated WhatsApp communication, and advanced community polling. It combines the power of W3C-compliant verifiable identity concepts with a robust WhatsApp automation engine.

## 🚀 Key Features

### 🔐 Secure Identity & RBAC
- **Identity Proofing**: Bind digital accounts to physical WhatsApp identities via 6-digit OTP verification.
- **Hierarchical Access**: Multi-tier Role-Based Access Control (RBAC) supporting **SuperAdmins**, Admins, Editors, and Users.
- **Administrative Sovereignty**: SuperAdmins and Admins can manage or delete any community poll, regardless of ownership.
- **Two-Step Activation**: Automated registration followed by mandatory administrative approval.

### 💬 WhatsApp Automation Engine
- **Broadcasting**: Bulk message transmission to multiple groups, channels, and newsletters simultaneously.
- **Message Templates**: Create and manage reusable templates with support for media (Images, PDF, Video, Audio).
- **Auto-Responders**: Keyword-based automated replies with Exact and Contains match logic.
- **Scheduled Messaging**: Queue transmissions for future delivery with automated retry logic.

### 🗳️ Advanced Polling Module
- **Dual Formats**: Support for General (Option-based) and Election (Candidate-based with manifestos and photos) polls.
- **Verified Voting**: Secure, one-vote-per-number logic enforced via WhatsApp OTP verification.
- **Identity Privacy**: Returning voters must verify identity via OTP to "View My Vote," ensuring privacy even if a device is shared.
- **Public & Closed Access**: Host global public polls or restrict voting to specific organizational groups.
- **Real-time Results**: Live vote tracking and results visualization for administrators with optimized eager-loading dashboards.

### 🤖 Intelligence & Governance
- **Multi-Provider AI Assistant**: Integrated support for **Google Gemini 2.0** and Mistral AI for autonomous community query resolution.
- **Custom AI Personality**: Tailor the AI's behavior, tone, and instructions via a centralized system prompt setting.
- **WhatsApp Admin Commands**: Manage system status and AI configurations directly via WhatsApp (e.g., `/status`, `/ai enable`, `/ai model`).
- **Membership Sync**: Automated removal of deactivated portal users from all managed WhatsApp groups.
- **Group Gatekeeper**: Automated "Entrance Lobby" requiring identity verification from new group members.
- **Command-Based Reporting**: On-demand system status and poll results via WhatsApp commands (e.g., `/status`, `/report polls`).
- **Daily Heartbeat**: Automated daily system health reports (CPU, Memory, Msg volume) sent to Super Admins.

## 🛠️ Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, React Router (HashRouter).
- **Backend**: Node.js, Express, PostgreSQL.
- **Engine**: WhatsApp-Web.js (Puppeteer-driven).
- **Security**: JWT Authentication, Bcrypt Password Hashing, TLS/SSL.

## 📦 Installation

Refer to the [USER_GUIDE.md](./USER_GUIDE.md) for detailed installation and deployment instructions.

## 🛡️ Security

Refer to the [SECURITY.md](./SECURITY.md) for details on authentication protocols, API protection, and data security measures.

### 📅 Latest Releases

#### [Alpha v1.5.5] - 2026-03-28
- **Feature**: Implemented **Interactive API Diagnostic Modal** with dynamic parameter forms.
- **Feature**: Support for **External Media URLs** and **Media Types** across all messaging endpoints.
- **Enhancement**: Added descriptive node names and improved discoverability in the API Vector Reference.
- **Fix**: Resolved component render crashes by isolating documentation logic into a dedicated modal.

#### [Alpha v1.5.4] - 2026-03-28
- **Enhancement**: Increased font sizes in the **API Vector Reference** sidebar for better readability and accessibility.
- **Maintenance**: Minor UI cleanup and optimization.

#### [Alpha v1.5.3] - 2026-03-27
- **Feature**: Implemented **API Key Authentication** (`x-api-key`) for external system integrations.
- **Feature**: Added **Interactive API Vector Reference** in the Admin Dashboard with expandable cURL examples.
- **Feature**: New endpoints for **Direct Group Messaging** and **Channel Publication**.
- **Fix**: Corrected WhatsApp Group and Channel (Newsletter) creation logic to align with library standards.
- **Fix**: Dynamically set Site Title across the application based on system settings.
- **Enhancement**: Refactored WhatsApp Welcome Message to a friendly greeting with frontend URL redirection.

---
© 2026 WhatsApp Web Tool. All rights reserved.
