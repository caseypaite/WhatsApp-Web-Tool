# WhatsApp Web Tool
### Advanced Identity Management, Automated Messaging, and Community Governance Hub

WhatsApp Web Tool is a comprehensive full-stack platform designed for secure identity management, automated WhatsApp communication, and advanced community polling. It combines the power of W3C-compliant verifiable identity concepts with a robust WhatsApp automation engine.

## 🚀 Key Features

### 🔐 Secure Identity & RBAC
- **Identity Proofing**: Bind digital accounts to physical WhatsApp identities via 6-digit OTP verification.
- **Granular Access**: Full Role-Based Access Control (RBAC) supporting Admins, Editors, and Users.
- **Two-Step Activation**: Automated registration followed by mandatory administrative approval.

### 💬 WhatsApp Automation Engine
- **Broadcasting**: Bulk message transmission to multiple groups, channels, and newsletters simultaneously.
- **Message Templates**: Create and manage reusable templates with support for media (Images, PDF, Video, Audio).
- **Auto-Responders**: Keyword-based automated replies with Exact and Contains match logic.
- **Scheduled Messaging**: Queue transmissions for future delivery with automated retry logic.

### 🗳️ Advanced Polling Module
- **Dual Formats**: Support for General (Option-based) and Election (Candidate-based with manifestos and photos) polls.
- **Verified Voting**: Secure, one-vote-per-number logic enforced via WhatsApp OTP verification.
- **Public & Closed Access**: Host global public polls or restrict voting to specific organizational groups.
- **Real-time Results**: Live vote tracking and results visualization for administrators.

### 📋 Governance & Audit
- **Group Management**: Full oversight of system groups, including member messaging and role promotion.
- **Audit Trail**: Global message history tracking every transmission, including success/failure status and error logs.
- **CMS Integration**: Dynamically manage landing page content and hero sections directly from the Admin Dashboard.

## 🛠️ Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, React Router (HashRouter).
- **Backend**: Node.js, Express, PostgreSQL.
- **Engine**: WhatsApp-Web.js (Puppeteer-driven).
- **Security**: JWT Authentication, Bcrypt Password Hashing, TLS/SSL.

## 📦 Installation

Refer to the [USER_GUIDE.md](./USER_GUIDE.md) for detailed installation and deployment instructions.

## 🛡️ Security

Refer to the [SECURITY.md](./SECURITY.md) for details on authentication protocols, API protection, and data security measures.

---
© 2026 WhatsApp Web Tool. All rights reserved.
