# Gmail OAuth Setup Guide

This guide will help you set up Google Cloud OAuth credentials for Gmail API integration.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `More-Email-Integration` (or your preferred name)
4. Click "Create"

## Step 2: Enable Gmail API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click on "Gmail API"
4. Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (for testing with personal Gmail)
3. Click "Create"
4. Fill in required fields:
   - **App name**: More Email Integration
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click "Save and Continue"
6. **Scopes**: Click "Add or Remove Scopes"
   - Add: `https://www.googleapis.com/auth/gmail.readonly`
   - Add: `https://www.googleapis.com/auth/gmail.metadata`
   - Add: `https://www.googleapis.com/auth/gmail.labels`
7. Click "Update" → "Save and Continue"
8. **Test users**: Add your Gmail account for testing
   - Click "Add Users"
   - Enter your Gmail address
   - Click "Add"
9. Click "Save and Continue" → "Back to Dashboard"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Enter name: `More API OAuth Client`
5. **Authorized redirect URIs**: Add the following:
   ```
   http://localhost:8081/api/email/gmail/callback
   ```
   (Add production URL later: `https://your-domain.com/api/email/gmail/callback`)
6. Click "Create"
7. **IMPORTANT**: Copy both:
   - Client ID
   - Client Secret

## Step 5: Configure Backend Environment Variables

You need to set these environment variables on your system. **Do NOT commit actual secret values to Git!**

### 5.1: Generate Encryption Key

**PowerShell:**
```powershell
# Generate 32-byte base64 encryption key
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

**OR using OpenSSL (if installed):**
```bash
openssl rand -base64 32
```

Copy the output - you'll use it as `EMAIL_TOKEN_ENCRYPTION_KEY`.

### 5.2: Set Windows System Environment Variables

#### Option A: PowerShell (Recommended - Quick Setup)

**Run PowerShell as Administrator** and execute:

```powershell
# Set user environment variables (persists across restarts)
[System.Environment]::SetEnvironmentVariable('GOOGLE_CLIENT_ID', 'your-client-id.apps.googleusercontent.com', 'User')
[System.Environment]::SetEnvironmentVariable('GOOGLE_CLIENT_SECRET', 'GOCSPX-your-secret-here', 'User')
[System.Environment]::SetEnvironmentVariable('EMAIL_TOKEN_ENCRYPTION_KEY', 'your-generated-base64-key', 'User')

# Verify variables are set
[System.Environment]::GetEnvironmentVariable('GOOGLE_CLIENT_ID', 'User')
[System.Environment]::GetEnvironmentVariable('GOOGLE_CLIENT_SECRET', 'User')
[System.Environment]::GetEnvironmentVariable('EMAIL_TOKEN_ENCRYPTION_KEY', 'User')
```

**⚠️ IMPORTANT:** Restart your IDE (IntelliJ/VS Code/Eclipse) after setting variables so it picks up the new values.

#### Option B: Windows GUI (Alternative)

1. Press `Windows + R`, type `sysdm.cpl`, press Enter
2. Click **"Advanced"** tab → **"Environment Variables"**
3. Under **"User variables"** (top section), click **"New"**
4. Add each variable:
   - **Variable name:** `GOOGLE_CLIENT_ID`  
     **Variable value:** `your-client-id.apps.googleusercontent.com`
   
   - **Variable name:** `GOOGLE_CLIENT_SECRET`  
     **Variable value:** `GOCSPX-your-secret-here`
   
   - **Variable name:** `EMAIL_TOKEN_ENCRYPTION_KEY`  
     **Variable value:** `your-generated-base64-key`

5. Click **OK** on all dialogs
6. **Restart your IDE** to pick up the new variables

#### Option C: .env File (Alternative for Multi-Project Setup)

**1. Create `.env` file in project root** (same level as pom.xml):

```properties
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here
EMAIL_TOKEN_ENCRYPTION_KEY=your-generated-base64-key
```

**2. Add `.env` to `.gitignore`:**

```gitignore
.env
*.env
```

**3. Create `.env.example`** (commit this as template):

```properties
# Copy this to .env and fill in your actual values
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
EMAIL_TOKEN_ENCRYPTION_KEY=generate-with-powershell-or-openssl
```

**4. Add Spring Boot dotenv support** (optional - enables automatic .env loading):

Add to `pom.xml`:
```xml
<dependency>
    <groupId>me.paulschwarz</groupId>
    <artifactId>spring-dotenv</artifactId>
    <version>4.0.0</version>
</dependency>
```

### 5.3: Verify Variables in application.properties

Your `application.properties` should reference variables (safe to commit):

```properties
# Google OAuth Configuration
google.oauth.client-id=${GOOGLE_CLIENT_ID}
google.oauth.client-secret=${GOOGLE_CLIENT_SECRET}
google.oauth.redirect-uri=${BACKEND_URL:http://localhost:8081}/api/email/gmail/callback
google.oauth.scopes=https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.metadata,https://www.googleapis.com/auth/gmail.labels

# Email Token Encryption
email.token.encryption.key=${EMAIL_TOKEN_ENCRYPTION_KEY}
```

**✅ Safe to commit** - these are placeholders, not actual secrets!

### 5.4: Security Reminders

**Important:** 
- ✅ **Commit:** `application.properties` with variable placeholders like `${GOOGLE_CLIENT_ID}`
- ✅ **Commit:** `.env.example` as a template for other developers
- ❌ **NEVER commit:** `.env` file with actual secrets
- ❌ **NEVER commit:** Hardcoded secret values in any file
- 🔑 **Key rotation:** Annual (every 12 months) - industry standard
- 📅 **Next rotation:** February 7, 2027
- 🏢 **Production:** Use Azure Key Vault / AWS Secrets Manager (see PRODUCTION_READINESS.md)

## Step 6: Test OAuth Flow

1. Start the backend: `mvn spring-boot:run`
2. Get auth URL: `GET http://localhost:8081/api/email/gmail/auth-url`
3. Open the `authUrl` in browser
4. Grant permissions
5. You'll be redirected to `http://localhost:4200/interactions/email-sync?status=success`

## Step 7: Verify Token Storage

Check the database:

```sql
SELECT * FROM api.user_email_tokens;
```

You should see your encrypted OAuth tokens stored.

## Troubleshooting

### Error: "Redirect URI mismatch"
- Ensure redirect URI in Google Cloud Console matches exactly: `http://localhost:8081/api/email/gmail/callback`
- Check `BACKEND_URL` environment variable

### Error: "Invalid OAuth state parameter"
- OAuth state expired (10 min timeout)
- Try generating new auth URL

### Error: "Access blocked: This app's request is invalid"
- Add your Gmail account to "Test users" in OAuth consent screen
- App must be in "Testing" mode for external users

### Error: "Token refresh failed"
- Check if refresh token exists in database
- May need to re-authorize (click auth URL again with `approval_prompt=force`)

## Security Notes

- **Never commit** `GOOGLE_CLIENT_SECRET` to version control
- Use environment variables for all secrets
- For production:
  - Use HTTPS redirect URI
  - Verify OAuth consent screen
  - Consider using managed secret storage (AWS Secrets Manager, Azure Key Vault)

## Next Steps

Once OAuth is working:
1. Test email sync functionality
2. Implement Gmail service to fetch emails
3. Add LinkedIn email parsing
4. Test full flow: Auth → Sync → Parse → Store
