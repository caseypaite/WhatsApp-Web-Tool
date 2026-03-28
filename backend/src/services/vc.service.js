const settingsService = require('./settings.service');

/**
 * Service for managing Verifiable Credentials (VC) in W3C format.
 */
class VerifiableCredentialService {
  /**
   * Mocks the issuance of a Verifiable Credential.
   * @param {Object} userData - Data to be included in the credential.
   * @returns {Object} The signed W3C Verifiable Credential.
   */
  async issueCredential(userData) {
    const domain = await settingsService.get('website_domain') || process.env.WEBSITE_DOMAIN || 'identity-portal.io';
    const issuerUrl = domain.startsWith('http') ? domain : `https://${domain}`;

    const vc = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://www.w3.org/2018/credentials/examples/v1"
      ],
      "id": `${issuerUrl}/credentials/${userData.id}`,
      "type": ["VerifiableCredential", "IdentityCredential"],
      "issuer": `${issuerUrl}/issuer`,
      "issuanceDate": new Date().toISOString(),
      "credentialSubject": {
        "id": `did:example:${userData.id}`,
        "name": userData.name,
        "email": userData.email
      },
      "proof": {
        "type": "Ed25519Signature2018",
        "created": new Date().toISOString(),
        "proofPurpose": "assertionMethod",
        "verificationMethod": `${issuerUrl}/issuer/keys/1`,
        "jws": "eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..TCjH9"
      }
    };
    return vc;
  }

  /**
   * Verifies a W3C Verifiable Credential.
   * @param {Object} vc - The credential object.
   * @returns {boolean}
   */
  async verifyCredential(vc) {
    // In production, use a library like `jsonld-signatures` or `did-jwt-vc` to verify.
    console.log('Verifying W3C VC for user:', vc.credentialSubject.id);
    return true; 
  }
}

module.exports = new VerifiableCredentialService();
