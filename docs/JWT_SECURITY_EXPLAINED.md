# Email OAuth Security - How JWT Validation Works

## Your Security Concern (Valid!)

**Q:** "What if someone calls the API with an old/expired JWT token?"

**A:** Spring Security **automatically rejects it** before your controller code runs!

---

## Complete Security Flow

### ❌ **Attack Attempt: Using Expired JWT**

```bash
# Attacker tries to use expired token
curl -H "Authorization: Bearer eyJhbGci...EXPIRED_TOKEN" \
     http://localhost:8081/api/email/gmail/auth-url
```

**What happens:**

```
1. Request arrives at Spring Boot
   ↓
2. Spring Security Filter Chain intercepts
   ↓
3. OAuth2ResourceServerFilter extracts JWT from Authorization header
   ↓
4. JwtDecoder validates token:
   ┌─────────────────────────────────────────────┐
   │ Validation Checks (ALL must pass):         │
   │                                             │
   │ ✓ Signature valid? (using public key)      │
   │ ✓ Issuer correct? (matches Keycloak)       │
   │ ✗ Expiration time? EXPIRED! ← FAILS HERE   │
   │ ✓ Not-before time?                          │
   │ ✓ Audience correct?                         │
   └─────────────────────────────────────────────┘
   ↓
5. Validation FAILS → Return 401 Unauthorized
   {
     "error": "invalid_token",
     "error_description": "Jwt expired at 2026-02-07T10:30:00Z"
   }
   ↓
6. Controller method NEVER CALLED ✅
   EmailController.getGmailAuthUrl() is NOT executed
```

**Result:** Attacker gets **401 Unauthorized**. Your code never runs.

---

### ✅ **Valid Request Flow**

```bash
# User with valid token
curl -H "Authorization: Bearer eyJhbGci...VALID_TOKEN" \
     http://localhost:8081/api/email/gmail/auth-url
```

**What happens:**

```
1. Request arrives at Spring Boot
   ↓
2. Spring Security Filter Chain intercepts
   ↓
3. OAuth2ResourceServerFilter extracts JWT
   ↓
4. JwtDecoder validates token:
   ┌─────────────────────────────────────────────┐
   │ Validation Checks:                          │
   │                                             │
   │ ✓ Signature valid? YES                      │
   │ ✓ Issuer correct? YES                       │
   │ ✓ Expiration time? VALID (not expired)      │
   │ ✓ Not-before time? YES                      │
   │ ✓ Audience correct? YES                     │
   │                                             │
   │ ALL CHECKS PASS ✅                          │
   └─────────────────────────────────────────────┘
   ↓
5. Create Authentication object
   JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt)
   - auth.getName() = user ID from "sub" claim
   - auth.getAuthorities() = roles from "realm_access"/"resource_access"
   ↓
6. Pass to controller
   getGmailAuthUrl(Authentication auth)
   - auth parameter is guaranteed valid
   - auth.getName() returns authenticated user ID
```

---

## Where Validation Happens

### **1. Application Configuration**

**File:** `application.properties`

```properties
# Tells Spring Security where to validate JWTs
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080/realms/mo
spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:8080/realms/mo/protocol/openid-connect/certs
```

**What this does:**
- Downloads Keycloak's **public keys** from jwk-set-uri
- Validates JWT **signature** using these keys
- Validates **issuer** matches issuer-uri
- Validates **expiration**, **not-before**, etc.

---

### **2. Security Configuration**

**File:** `SecurityConfig.java`

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(authorize -> authorize
            // Gmail callback is PUBLIC (Google redirects here)
            .requestMatchers("/api/email/gmail/callback").permitAll()
            
            // All other email endpoints require VALID JWT
            .requestMatchers("/api/email/**").authenticated()
            
            .anyRequest().authenticated()
        )
        // Enable OAuth2 Resource Server with JWT validation
        .oauth2ResourceServer(oauth2 -> oauth2
            .jwt(jwt -> jwt.jwtAuthenticationConverter(keycloakJwtAuthenticationConverter()))
        )
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // No sessions
        );
    
    return http.build();
}
```

**What this does:**
- `.authenticated()` = Requires valid JWT
- `.oauth2ResourceServer()` = Enables JWT validation
- `.sessionCreationPolicy(STATELESS)` = Every request validated (no session)

---

### **3. JWT Validation Process**

**Automatic validation by `NimbusJwtDecoder`:**

```java
// Spring Security does this internally (you don't write this code)
public Jwt decode(String token) {
    // 1. Parse JWT
    SignedJWT signedJWT = SignedJWT.parse(token);
    
    // 2. Verify signature using public key
    JWSVerifier verifier = new RSASSAVerifier(publicKey);
    if (!signedJWT.verify(verifier)) {
        throw new JwtException("Invalid signature");
    }
    
    // 3. Extract claims
    JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
    
    // 4. Validate expiration
    Date expirationTime = claims.getExpirationTime();
    if (new Date().after(expirationTime)) {
        throw new JwtException("Token expired"); // ← Expired tokens rejected here!
    }
    
    // 5. Validate issuer
    if (!claims.getIssuer().equals(expectedIssuer)) {
        throw new JwtException("Invalid issuer");
    }
    
    // 6. Validate not-before time
    Date notBefore = claims.getNotBeforeTime();
    if (new Date().before(notBefore)) {
        throw new JwtException("Token not yet valid");
    }
    
    // 7. All checks passed - create Jwt object
    return new Jwt(token, issuedAt, expiresAt, headers, claims);
}
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│ 1. NETWORK LAYER                                            │
│    - HTTPS in production (prevents token interception)     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SPRING SECURITY FILTER CHAIN                             │
│    - Extracts JWT from Authorization header                │
│    - Routes to OAuth2ResourceServerFilter                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. JWT DECODER VALIDATION                                   │
│    ✓ Signature verification (cryptographic proof)           │
│    ✓ Expiration check (exp claim)                           │
│    ✓ Issuer validation (iss claim)                          │
│    ✓ Not-before check (nbf claim)                           │
│    ✓ Audience check (aud claim, if configured)              │
│                                                             │
│    If ANY check fails → 401 Unauthorized                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    VALIDATION PASSED
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. AUTHORIZATION (SecurityConfig rules)                    │
│    - Check if user has required roles                       │
│    - Check if endpoint requires authentication              │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    AUTHORIZATION PASSED
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. CONTROLLER (Your Code)                                  │
│    - getGmailAuthUrl(Authentication auth)                   │
│    - auth.getName() guaranteed to be current user           │
│    - JWT guaranteed to be valid and not expired             │
└─────────────────────────────────────────────────────────────┘
```

---

## Common Attack Scenarios (All Prevented)

### **Attack 1: Expired Token**
```bash
Authorization: Bearer eyJhbGci...EXPIRED
```
**Defense:** JWT validation checks `exp` claim → 401 Unauthorized

---

### **Attack 2: Tampered Token**
```bash
# Attacker changes user ID in token payload
Authorization: Bearer eyJhbGci...TAMPERED
```
**Defense:** Signature verification fails → 401 Unauthorized

---

### **Attack 3: Token from Wrong Issuer**
```bash
# Token from different Keycloak realm or OAuth provider
Authorization: Bearer eyJhbGci...WRONG_ISSUER
```
**Defense:** Issuer validation fails → 401 Unauthorized

---

### **Attack 4: Replay Attack (Old Valid Token)**
```bash
# Reuse token from yesterday (still within expiration)
Authorization: Bearer eyJhbGci...OLD_BUT_VALID
```
**Defense:** 
- ✅ Token is still valid (not expired) → Request succeeds
- ⚠️ To prevent: Use short expiration times (5-15 min)
- ⚠️ Keycloak regenerates tokens on refresh

**Mitigation strategies:**
1. **Short token lifetime:** Configure Keycloak for 5-15 min access tokens
2. **Refresh tokens:** Client refreshes regularly for new access tokens
3. **Token revocation:** Implement token blacklist if needed (advanced)
4. **Audit logging:** Log all sensitive operations with timestamps

---

### **Attack 5: No Token**
```bash
# No Authorization header
curl http://localhost:8081/api/email/gmail/auth-url
```
**Defense:** Spring Security requires authentication → 401 Unauthorized

---

## Additional Security Measures in Our Code

### **1. OAuth State Parameter (CSRF Protection)**

**File:** `GmailTokenService.java`

```java
@Override
public String generateAuthUrl(String userId) {
    // Generate random state parameter
    String state = UUID.randomUUID().toString();
    
    // Link state to user ID (prevents CSRF)
    stateToUserIdMap.put(state, userId);
    
    // Include state in OAuth URL
    authUrl.setState(state);
}

@Override
public String handleOAuthCallback(String code, String state) {
    // Validate state matches what we generated
    String userId = stateToUserIdMap.remove(state);
    if (userId == null) {
        throw new IllegalArgumentException("Invalid state - possible CSRF attack!");
    }
    // Continue with token exchange...
}
```

**Prevents:** Attacker tricking user into authorizing attacker's Gmail

---

### **2. Token Encryption at Rest**

**File:** `EncryptedStringConverter.java`

```java
@Converter
public class EncryptedStringConverter {
    @Override
    public String convertToDatabaseColumn(String plaintext) {
        return encryptionService.encrypt(plaintext); // AES-256-GCM
    }
}
```

**Prevents:** Database breach exposing working OAuth tokens

---

### **3. Public Callback Endpoint**

**File:** `SecurityConfig.java`

```java
.requestMatchers("/api/email/gmail/callback").permitAll()
```

**Why:** Google's OAuth redirect can't send JWT (user hasn't logged in to our app during redirect)

**Security:** State parameter links callback back to authenticated user who initiated OAuth flow

---

## Testing JWT Validation

### **Test 1: Valid Token**
```bash
# Get fresh token from Keycloak
TOKEN=$(curl -X POST http://localhost:8080/realms/mo/protocol/openid-connect/token \
  -d "client_id=mo-fe" \
  -d "username=test@example.com" \
  -d "password=password" \
  -d "grant_type=password" | jq -r '.access_token')

# Use valid token
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8081/api/email/gmail/auth-url

# Expected: 200 OK with authUrl
```

---

### **Test 2: Expired Token**
```bash
# Use old token (from yesterday)
EXPIRED_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6..."

curl -H "Authorization: Bearer $EXPIRED_TOKEN" \
     http://localhost:8081/api/email/gmail/auth-url

# Expected: 401 Unauthorized
{
  "error": "invalid_token",
  "error_description": "Jwt expired at 2026-02-06T10:30:00Z"
}
```

---

### **Test 3: Invalid Signature**
```bash
# Tamper with token (change one character)
TAMPERED_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6...TAMPERED"

curl -H "Authorization: Bearer $TAMPERED_TOKEN" \
     http://localhost:8081/api/email/gmail/auth-url

# Expected: 401 Unauthorized
{
  "error": "invalid_token",
  "error_description": "An error occurred while attempting to decode the Jwt: Signed JWT rejected: Invalid signature"
}
```

---

### **Test 4: No Token**
```bash
curl http://localhost:8081/api/email/gmail/auth-url

# Expected: 401 Unauthorized
{
  "timestamp": "2026-02-07T14:30:00.000+00:00",
  "status": 401,
  "error": "Unauthorized",
  "path": "/api/email/gmail/auth-url"
}
```

---

## Recommended Additional Security (Future)

### **1. Rate Limiting**
```java
// Add to EmailController (future)
@RateLimiter(name = "emailOAuth", fallbackMethod = "rateLimitFallback")
@GetMapping("/gmail/auth-url")
public ResponseEntity<Map<String, String>> getGmailAuthUrl(Authentication auth) {
    // ...
}
```

**Prevents:** Brute force attempts, DoS attacks

---

### **2. Audit Logging**
```java
// Add to GmailTokenService
@Override
public String handleOAuthCallback(String code, String state) {
    String userId = validateState(state);
    
    // Audit log OAuth consent
    auditLogger.log(AuditEvent.builder()
        .userId(userId)
        .action("GMAIL_OAUTH_CONSENT")
        .timestamp(LocalDateTime.now())
        .ipAddress(requestContext.getRemoteAddr())
        .build());
    
    // Continue with token exchange...
}
```

**Benefits:** Track who authorized what, when, from where

---

### **3. Token Revocation List (Advanced)**
```java
// Future: Check if token was revoked (logout, security incident)
@Component
public class JwtRevocationValidator {
    private final RedisTemplate<String, String> redis;
    
    public boolean isRevoked(String jti) {
        // Check if token JTI is in revocation list
        return redis.hasKey("revoked:token:" + jti);
    }
}
```

**Use case:** Immediate token invalidation (user logout, security breach)

---

## Summary

### **Your Original Concern:**
> "What if someone sends an old/expired token?"

### **Answer:**
✅ **Spring Security automatically rejects it!**

**Validation happens:**
- ✅ **Before** controller method runs
- ✅ **Every single request** (stateless)
- ✅ **Automatically** (no code needed)
- ✅ **Cryptographically** (can't fake)

**Your controller code receives:**
- ✅ **Valid JWT only** (not expired)
- ✅ **Current user ID** (from validated token)
- ✅ **Correct roles/permissions**

**Attackers get:**
- ❌ **401 Unauthorized** (expired token)
- ❌ **401 Unauthorized** (tampered token)
- ❌ **401 Unauthorized** (wrong issuer)
- ❌ **401 Unauthorized** (no token)

**Bottom line:** The `Authentication` object in your controller is **guaranteed** to represent a currently authenticated user with a valid, non-expired JWT.
