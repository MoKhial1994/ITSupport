// Sample JWT Presets for quick testing and deserialization

export interface JwtPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  token: string;
  secret?: string;
  isBase64Secret?: boolean;
}

export const JWT_PRESETS: JwtPreset[] = [
  {
    id: 'standard-hs256',
    name: 'Standard HS256 User Token',
    category: 'Standard',
    description: 'Classic HMAC-SHA256 token with username, role, and standard claims.',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsInJvbGVzIjpbIkFkbWluIiwiRGF0YWJhc2VNYW5hZ2VyIl0sImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxOTk5OTk5OTk5fQ.kY_vK9G_HjLh2jO5gW039z_qT3P63gT8B2h5jK7mLoQ',
    secret: 'your-256-bit-secret-here-for-support-toolkit',
  },
  {
    id: 'azure-entra',
    name: 'Microsoft Entra ID (Azure AD)',
    category: 'Enterprise',
    description: 'Azure Active Directory access token with tenant ID, object ID, and UPN.',
    token:
      'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFhMmIzYzRkNWU2Zjc4OTAiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiJodHRwczovL2FwaS5tYW5hZ2VtZW50LmNsb3VkLmNvbSIsImlzcyI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzcyejY0YXl4LTYxZDEtNDBhMi05N2IzLTI1NjNmNGE1NmFhNS8iLCJpYXQiOjE3MjMwMDAwMDAsImV4cCI6MTk5OTAwMDAwMCwibmFtZSI6IkFsZXggTW9yZ2FuIiwidXBuIjoiYWxleC5tb3JnYW5AY29udG9zby5jb20iLCJvaWQiOiI1NGExYmNhZC1mMmFhLTQ3NDEtOTc4OS1hNWZkMDIxNTkyMzQiLCJ0aWQiOiI3Mno2NGF5eC02MWQxLTQwYTItOTdiMy0yNTYzZjRhNTZhYTUiLCJyb2xlcyI6WyJEZWJ1Z2dlci5SZWFkIiwiSW5zcGVjdGlvbi5BZG1pbiJdfQ.signature_placeholder_for_rsa_key_here',
  },
  {
    id: 'firebase-auth',
    name: 'Firebase ID Token',
    category: 'Cloud Auth',
    description: 'Firebase Authentication token with phone number, provider metadata, and user ID.',
    token:
      'eyJhbGciOiJSUzI1NiIsImtpZCI6ImRiOWM1ZmExYjJjM2Q0ZTUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vc3VwcG9ydC10b29sa2l0LXByb2QiLCJhdWQiOiJzdXBwb3J0LXRvb2xraXQtcHJvZCIsImF1dGhfdGltZSI6MTcyMzAwMDAwMCwidXNlcl9pZCI6IkZCVXNlcjk4Nzc2NTQiLCJzdWIiOiJGQlVzZXI5ODc3NjU0IiwiaWF0IjoxNzIzMDAwMDAwLCJleHAiOjE5OTk5MDAwMDAsImVtYWlsIjoiZGV2b3BzQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSIsImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDgyODIyMTAxOTgyIl0sImVtYWlsIjpbImRldm9wc0BnbWFpbC5jb20iXX19fQ.firebase_signature_block_here',
  },
  {
    id: 'oauth2-scopes',
    name: 'OAuth 2.0 API Scope Token',
    category: 'API Access',
    description: 'Access token with granual scopes, client ID, and audience.',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGguc2VydmljZS5jb20iLCJzdWIiOiJzZXJ2aWNlLWFjY291bnQtYXBwLTAxIiwiYXVkIjoiaHR0cHM6Ly9hcGkuc2VydmljZS5jb20vdjEiLCJzY29wZSI6InJlYWQ6aW5zcGVjdGlvbiB3cml0ZTppbnNwZWN0aW9uIGRlbGV0ZTpwbG90cyBhZG1pbjpzcWwiLCJleHAiOjE5OTk5OTk5OTksImlhdCI6MTcyMzAwMDAwMCwianRpIjoiYTJiM2M0ZDUteTY3ODktMDB4ZSJ9.vC16XGq09sQ5sZ5O8pT2U3V4W5X6Y7Z8a9b0c1d2e3f',
    secret: 'super-secret-api-key',
  },
  {
    id: 'expired-token',
    name: 'Expired Token Test',
    category: 'Diagnostics',
    description: 'An expired token (exp in 2021) for testing expiration and security warnings.',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWV4cGlyZWQtOTkiLCJuYW1lIjoiU2FtIFdpbHNvbiIsImlhdCI6MTYwOTQ1OTIwMCwiZXhwIjoxNjA5NDYyODAwLCJpc3MiOiJodHRwczovL2F1dGgub2xkLXN5c3RlbS5jb20ifQ.d0X5V0X9Z8Y7W6V5U4T3S2R1Q0P9O8N7M6L5K4J3I2H',
    secret: 'old-secret',
  },
  {
    id: 'insecure-none-alg',
    name: 'Vulnerable "none" Algorithm',
    category: 'Security Test',
    description: 'A token with alg: "none" and no signature for testing security vulnerability audit.',
    token:
      'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbi11c2VyIiwicm9sZXMiOlsiU3VwZXJBZG1pbiJdLCJpc3MiOiJtYWxpY2lvdXMtaW5qZWN0aW9uIiwiZXhwIjoxOTk5OTk5OTk5fQ.',
  },
];
