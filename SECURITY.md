# Security Documentation

This document outlines the security protocols and architecture implemented in the AppStack platform to ensure data integrity, privacy, and secure communication.

## 1. Authentication & Authorization

### JSON Web Tokens (JWT)
The primary authentication mechanism for user sessions is based on industry-standard JWT.
- **Issuance**: Upon successful login, the backend generates a token signed with a server-side `JWT_SECRET`.
- **Transmission**: The frontend includes this token in the `Authorization: Bearer <token>` header for all protected requests.
- **Verification**: The backend validates the signature and expiration of the token before processing any request.

### API Key Support (`x-simple-auth`)
For automation, administrative scripts, or legacy integration, the platform supports a header-based API key.
- **Header**: `x-simple-auth`
- **Secret**: Defined by the `SIMPLE_AUTH_PASSWORD` environment variable.
- **Usage**: Providing this key grants administrative access without requiring a standard user login session.

### Role-Based Access Control (RBAC)
The system enforces granular access control at the route level.
- **Roles**: Supported roles include `Admin`, `Editor`, and `User`.
- **Enforcement**: Middleware (`checkRole`) verifies that the authenticated user possesses the necessary privileges for the requested endpoint. Administrative routes (e.g., system settings, global user lists) are strictly restricted to the `Admin` role.

## 2. Communication Security

### TLS/SSL Encryption
All communication between the frontend and backend is encrypted using **Transport Layer Security (TLS)**.
- Public endpoints (e.g., `https://app.kcdev.qzz.io` and `https://backend.kcdev.qzz.io`) utilize HTTPS to prevent eavesdropping and Man-in-the-Middle (MITM) attacks.

### Cross-Origin Resource Sharing (CORS)
Strict CORS policies are enforced to prevent unauthorized cross-site requests.
- **Whitelisting**: The backend only accepts requests from explicitly defined origins (configured via `ALLOWED_ORIGINS` in `.env`).
- **CSRF Protection**: By restricting origins and requiring custom headers (Authorization/x-simple-auth), the risk of Cross-Site Request Forgery is significantly mitigated.

## 3. Data Protection

### Password Security
- **Hashing**: User passwords are never stored in plain text.
- **Algorithm**: The system uses **bcryptjs** with a salt factor of 10. This ensures that even in the event of a database breach, original passwords remain cryptographically secure.

### Identity Proofing (WhatsApp OTP)
Critical or sensitive operations utilize **Multi-Factor Authentication (MFA)** via WhatsApp.
- **Verified Packets**: Registration, profile phone updates, and entity deletions require a 6-digit OTP sent to the user's registered WhatsApp number.
- **Cryptographic Anchor**: This binds the digital portal account to a physical mobile identity.

## 4. Infrastructure & Environment

### Database Integrity
- **Connection Pooling**: Implemented to prevent resource exhaustion and protect against certain types of Denial of Service (DoS) attacks related to database connections.
- **Input Sanitization**: All database interactions use parameterized queries to prevent SQL Injection.

### Environment Isolation
- Sensitive configuration (API keys, DB credentials, JWT secrets) is stored in protected `.env` files.
- These secrets are never exposed to the client-side code and are excluded from version control.

---
*Last Updated: March 22, 2026*
