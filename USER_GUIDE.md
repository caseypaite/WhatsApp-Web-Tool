# AppStack User Guide

Welcome to the AppStack User Guide. This document provides step-by-step instructions for deployment, administration, and standard usage.

---

## 🏗️ 1. Server Deployment

### Automated Installation
AppStack includes an automated script to handle database creation, schema initialization, and service setup.

1. **Environment Setup:** Copy `.env.example` to `.env` in both `backend/` and `frontend/` folders and fill in your details.
2. **Run Installer:**
   ```bash
   ./scripts/fresh-install.sh
   ```
3. **Systemd Integration:** During installation, the script will ask if you want to install the services as systemd units. This is highly recommended for production environments to ensure the app restarts automatically if the server reboots.

### Manual Service Control
If you installed via systemd, use these commands:
- **Restart All:** `sudo systemctl restart appstack-backend appstack-frontend`
- **Check Status:** `sudo systemctl status appstack-backend`
- **View Logs:** `sudo journalctl -u appstack-backend -f`

---

## 🔑 2. Getting Started

### Registration
1. Go to the **Register** page.
2. Enter your details: Name, Email, Password, and Phone Number.
3. Click **Send OTP**. A 6-digit code will be sent to your WhatsApp.
4. Enter the OTP and complete the form (Address, location details).
5. Once submitted, your account will be in **Pending Approval** state. An administrator must activate your account before you can log in.

### Login
- **Email/Password:** Traditional login using your registered credentials.
- **Phone/OTP:** Enter your registered phone number to receive a temporary login code via WhatsApp.

---

## 🛠️ 2. Administrator Guide

### User Management
- Access the **Users** tab.
- View all registered users and their current status.
- Use the **Actions** menu to change a user's status (e.g., set to `ACTIVE` to allow login).
- Assign roles (Admin, Editor, User) to control system access.

### WhatsApp Instance Management
- Access the **WhatsApp Instance** tab.
- **Connecting:** If disconnected, a QR code will appear. Scan it using your WhatsApp mobile app (Linked Devices).
- **Managed Entities:** Once connected, you will see a list of groups and channels where your account is an admin.
- **Creating Groups:** Click **New Group**, provide a name and comma-separated phone numbers.
- **Creating Channels:** Click **New Channel** and provide a name and description.
- **Deleting Entities:** Click the red **Delete** icon next to a group/channel. You must request and enter an OTP sent to your WhatsApp to confirm the deletion.

### Landing Page CMS
- Access the **Landing Page** tab.
- Modify the **Hero Headline**, **CTA Button Text**, and **Hero Image URL**.
- View the **Live Preview** on the right side.
- Click **Save Changes** to update the public site immediately.

---

## 👤 3. User Guide

### Dashboard Overview
- Use the sidebar on the left to navigate. The sidebar is collapsed by default (icons only). Click the **Menu** icon at the top to expand it.

### Profile Management
- View your account info in the **My Profile** tab.
- Click **Edit Profile** to update your name, address, or location.
- **Updating Phone Number:** Click **Change** next to your phone number. You must verify the new number with an OTP to save the change.

### Security
- Access the **Security** tab to change your password.
- You must verify this action with an OTP sent to your registered WhatsApp number for enhanced security.

### Message History
- Access the **Messages** tab to see a history of all automated messages (OTP, notifications) sent to your account.

---

## ❓ Troubleshooting

- **QR Code Not Loading:** Ensure the backend service is running and has internet access. Try restarting the service if it hangs on "Initializing".
- **OTP Not Received:** Verify that the WhatsApp account used by the server is connected and has a "READY" status in the Admin Dashboard.
- **Blank Page:** Clear your browser cache or perform a hard refresh (Ctrl+F5).

---
© 2026 AppStack Team. All rights reserved.
