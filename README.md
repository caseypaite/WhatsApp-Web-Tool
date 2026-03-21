# AppStack - Integrated Identity & Communication Platform

AppStack is a robust, full-stack application designed for organisational identity management and integrated WhatsApp communication. It provides a centralized portal for user authentication, profile management, and powerful WhatsApp automation features including group and channel management.

## 🚀 Key Features

### 🔐 Authentication & Identity
- **Local JWT Authentication:** Secure, independent session management without external dependencies (removed Auth0).
- **Multi-Mode Login:** Support for traditional Email/Password login and modern Phone/OTP login.
- **Secure Signup:** Phone number verification via WhatsApp OTP during registration.
- **User Life-cycle:** Multi-stage user status (Pending Verification, Pending Approval, Active, Inactive) for strict organisational control.

### 📱 WhatsApp Integration
- **Instance Management:** Real-time connection status monitoring and QR code authentication.
- **Managed Entities:** Dashboard view of all WhatsApp Groups and Channels where the account has administrator privileges.
- **Entity Management:** Create and delete WhatsApp groups and broadcast channels directly from the portal.
- **Secure Deletion:** WhatsApp entity deletion is protected by a secondary WhatsApp OTP confirmation.
- **Message Logging:** Full audit trail of all messages sent through the system with delivery status (Success/Failed).

### 🖥️ Admin Dashboard
- **User Management:** Full CRUD operations on users, including status approval and role assignment.
- **Landing Page CMS:** Real-time configuration of the public landing page (Hero text, CTA, and background imagery).
- **System Settings:** Centralized control over system-wide configurations (Domain, OTP expiration, etc.).
- **Group Management:** Creation and management of internal organisational groups.

### 👤 User Dashboard
- **Tabbed Full-Page Layout:** Modern, clean interface with a collapsible icons-only sidebar.
- **Profile Management:** Comprehensive profile editing including address, location, and verified phone number.
- **Security Portal:** On-demand password changes secured by WhatsApp OTP.
- **Activity History:** Private view of all messages received/sent to the user's registered number.

## 🛠️ Technical Stack

- **Frontend:** React (Vite), Tailwind CSS, Lucide Icons, Axios.
- **Backend:** Node.js (Express), PostgreSQL (pg), JWT.
- **Automation:** WhatsApp-Web.js (Headless Chromium).
- **Deployment:** Systemd service management.

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v20+)
- PostgreSQL
- Chromium Browser (for WhatsApp automation)

### Automated Fresh Installation
For a new server setup, AppStack provides a comprehensive installation script that initializes the database, seeds data, and optionally sets up systemd services:

1. Create your `backend/.env` and `frontend/.env` files.
2. Run the installation script:
```bash
./scripts/fresh-install.sh
```
3. Follow the prompts to optionally install the application as a **systemd service** for automated startup and background execution.

### Manual Backend Setup
1. Navigate to `backend/`.
2. Install dependencies: `npm install`.
3. Configure `.env` (use `.env.example` as a template).
4. Seed the database: `node src/db/seeder.js`.
5. Start the server: `npm start`.

### Frontend Setup
1. Navigate to `frontend/`.
2. Install dependencies: `npm install`.
3. Configure `.env` with `VITE_API_BASE_URL`.
4. Start the development server: `npm run dev`.

## 📜 Version History
- **v1.0.0:** Initial stable release with WhatsApp core and CMS.
- **v1.1.0:** Dashboard UI overhaul, icons-only sidebar, and advanced WhatsApp entity management (Create/Delete).

---
© 2026 AppStack Team. All rights reserved.
