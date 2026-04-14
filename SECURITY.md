# Security Documentation

This document outlines the security protocols and architecture implemented in the WhatsApp Web Tool platform to ensure data integrity, privacy, and secure communication.

## 1. Authentication & Authorization

### JSON Web Tokens (JWT)
The primary authentication mechanism for user sessions is based on industry-standard JWT.
- **Issuance**: Upon successful login, the backend generates a token signed with a server-side `JWT_SECRET`.
- **Transmission**: The frontend includes this token in the `Authorization: Bearer <token>` header for all protected requests. In production, this is managed via **HttpOnly Secure Cookies** to prevent XSS-based token theft.
- **Verification**: The backend validates the signature and expiration of the token before processing any request.

### API Key Authentication (`x-api-key`)
The platform supports two tiers of API key access for external system integrations:
- **Full Access API Key**: Grants complete `Admin` level permissions. This key can be used for any administrative operation, including management of users, groups, and system configuration.
- **Messaging-Only API Key**: Grants a restricted `MessagingOnly` role. This key is limited to communication vectors (Broadcasts, Polls, Direct Messages) and cannot access management, status, or administrative endpoints.
- **Configuration**: Both keys can be managed in the **Settings > Security** tab of the Admin Dashboard.

### Simple Auth Fallback (`x-simple-auth`)
A secondary, development-focused authentication method exists for legacy scripts or local testing.
- **Header**: `x-simple-auth`
- **Secret**: Defined by the `SIMPLE_AUTH_PASSWORD` environment variable.
- **Environment**: This method is restricted and intended for development environments. It grants `Admin` permissions to the system.

### Role-Based Access Control (RBAC)
The system enforces granular access control at the route level.
- **Roles**: Supported roles include `SuperAdmin`, `Admin`, `Editor`, and `User`.
- **SuperAdmin Sovereignty**: Users with the `SuperAdmin` role have unrestricted access to all organizational units, including the ability to manage or delete community polls regardless of ownership.
- **Enforcement**: Middleware (`checkRole`) verifies that the authenticated user possesses the necessary privileges for the requested endpoint.

## 2. Communication Security

### TLS/SSL Encryption
All communication between the frontend and backend is encrypted using **Transport Layer Security (TLS)**.
- Public endpoints utilize HTTPS to prevent eavesdropping and Man-in-the-Middle (MITM) attacks.

### Cross-Origin Resource Sharing (CORS)
Strict CORS policies are enforced to prevent unauthorized cross-site requests.
- **Whitelisting**: The backend only accepts requests from explicitly defined origins.
- **CSRF Protection**: By restricting origins and requiring custom headers (Authorization, x-api-key, or x-simple-auth), the risk of Cross-Site Request Forgery is significantly mitigated.

### SSRF Protection
To prevent **Server-Side Request Forgery (SSRF)** when processing external media:
- **URL Validation**: All media URLs provided to the messaging API are validated against a blacklist of private IP ranges (e.g., 127.0.0.1, 192.168.x.x, 10.x.x.x).
- **DNS Resolution**: The system resolves hostnames and checks the resulting IP addresses to ensure they point to public, global internet resources before attempting to fetch content.

## 3. Data Protection

### Password Security
- **Hashing**: User passwords are never stored in plain text.
- **Algorithm**: The system uses **bcryptjs** with a salt factor of 10.
- **Complexity Policy**: A strict password policy is enforced:
  - Minimum **8 characters**.
  - Requirement for **Uppercase**, **Lowercase**, **Numeric**, and **Special** characters.

### Identity Proofing (WhatsApp OTP)
Critical or sensitive operations utilize **Multi-Factor Authentication (MFA)** via WhatsApp.
- **Verified Packets**: Registration, profile phone updates, and poll voting require a 6-digit OTP sent to the user's registered WhatsApp number.
- **Vote Privacy**: Cast votes are hidden from the user interface. Accessing a previously cast vote requires a fresh MFA challenge (OTP) to prove identity before the choice is revealed.

## 4. Infrastructure & Environment

### Database Integrity
- **Connection Pooling**: Implemented to prevent resource exhaustion and protect against DoS attacks.
- **Input Sanitization**: All database interactions use parameterized queries to prevent SQL Injection.

### Environment Isolation
- Sensitive configuration (API keys, DB credentials, JWT secrets) is stored in protected `.env` files and excluded from version control.

---
*Last Updated: April 11, 2026*
