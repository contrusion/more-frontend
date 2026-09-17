# Gmail Push Notifications (Advanced Feature)

## Overview

Gmail Push Notifications allow real-time email sync by receiving webhook notifications from Google when new emails arrive, eliminating the need for polling or manual sync triggers.

---

## How It Works

### **Architecture**

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Gmail     │ ─────>  │  Google Pub/ │ ─────>  │  Your API   │
│   Account   │  Event  │  Sub Topic   │  Webhook│  Endpoint   │
└─────────────┘         └──────────────┘         └─────────────┘
                                                         │
                                                         ▼
                                                  ┌─────────────┐
                                                  │  Trigger    │
                                                  │  Email Sync │
                                                  └─────────────┘
```

### **Flow**

1. **Setup**: User connects Gmail account via OAuth
2. **Watch Request**: Backend sends `watch()` request to Gmail API for user's mailbox
3. **Google Monitoring**: Google monitors the Gmail inbox for changes
4. **Push Notification**: When new email arrives → Google publishes to Pub/Sub topic
5. **Webhook Trigger**: Pub/Sub calls your configured webhook endpoint
6. **Sync Execution**: Your backend triggers email sync for that specific user
7. **Real-time Updates**: Frontend sees new interactions immediately

---

## Implementation Steps

### **1. Google Cloud Setup**

#### **Enable Required APIs**
```bash
gcloud services enable pubsub.googleapis.com
gcloud services enable gmail.googleapis.com
```

#### **Create Pub/Sub Topic**
```bash
gcloud pubsub topics create gmail-notifications
```

#### **Grant Gmail Permission to Publish**
```bash
gcloud pubsub topics add-iam-policy-binding gmail-notifications \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

#### **Create Pub/Sub Subscription (Push)**
```bash
gcloud pubsub subscriptions create gmail-notifications-sub \
  --topic=gmail-notifications \
  --push-endpoint=https://your-domain.com/api/webhooks/gmail \
  --push-auth-service-account=your-service-account@project.iam.gserviceaccount.com
```

---

### **2. Backend Implementation**

#### **Send Watch Request** (When User Connects Gmail)

```java
@Service
public class GmailWatchService {
    
    private final Gmail gmailClient;
    
    /**
     * Start watching a user's Gmail inbox for changes
     * Watch expires after 7 days - must be renewed
     */
    public WatchResponse startWatching(String userId, String accessToken) throws IOException {
        Gmail gmail = createGmailClient(accessToken);
        
        WatchRequest watchRequest = new WatchRequest()
            .setTopicName("projects/your-project-id/topics/gmail-notifications")
            .setLabelIds(Collections.singletonList("INBOX"))
            .setLabelFilterAction("include");
        
        WatchResponse response = gmail.users()
            .watch(userId, watchRequest)
            .execute();
        
        // Store historyId and expiration in database
        saveWatchState(userId, response.getHistoryId(), response.getExpiration());
        
        return response;
    }
    
    /**
     * Renew watch before expiration (every 6 days)
     * Schedule this as a background job
     */
    @Scheduled(cron = "0 0 0 */6 * *") // Every 6 days
    public void renewAllWatches() {
        List<UserEmailToken> tokens = userEmailTokenRepository.findAll();
        
        for (UserEmailToken token : tokens) {
            try {
                startWatching(token.getUserId(), token.getAccessToken());
                log.info("Renewed Gmail watch for user: {}", token.getUserId());
            } catch (Exception e) {
                log.error("Failed to renew watch for user: {}", token.getUserId(), e);
            }
        }
    }
}
```

#### **Webhook Endpoint** (Receive Push Notifications)

```java
@RestController
@RequestMapping("/api/webhooks")
@Slf4j
public class GmailWebhookController {
    
    private final EmailSyncOrchestrator syncOrchestrator;
    
    /**
     * Gmail Push Notification webhook
     * Called by Google Pub/Sub when mailbox changes occur
     * 
     * SECURITY: Verify Pub/Sub JWT token in production
     */
    @PostMapping("/gmail")
    public ResponseEntity<Void> handleGmailNotification(@RequestBody PubSubMessage message) {
        log.info("Received Gmail push notification");
        
        try {
            // Decode Pub/Sub message
            String decodedData = new String(
                Base64.getDecoder().decode(message.getMessage().getData()),
                StandardCharsets.UTF_8
            );
            
            GmailNotification notification = objectMapper.readValue(
                decodedData, 
                GmailNotification.class
            );
            
            String emailAddress = notification.getEmailAddress();
            Long historyId = notification.getHistoryId();
            
            log.info("Gmail notification for: {}, historyId: {}", emailAddress, historyId);
            
            // Find user by email address
            UserEmailToken token = userEmailTokenRepository
                .findByEmailAddress(emailAddress)
                .orElseThrow(() -> new RuntimeException("User not found for email: " + emailAddress));
            
            // Trigger async email sync for this user
            CompletableFuture.runAsync(() -> {
                try {
                    syncOrchestrator.syncGmailForUser(token.getUserId());
                } catch (Exception e) {
                    log.error("Failed to sync emails for user: {}", token.getUserId(), e);
                }
            });
            
            // Respond immediately (Google expects 200 within 10 seconds)
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            log.error("Failed to process Gmail notification", e);
            return ResponseEntity.status(500).build();
        }
    }
}

// DTOs
@Data
class PubSubMessage {
    private Message message;
    private String subscription;
}

@Data
class Message {
    private String data;
    private Map<String, String> attributes;
    private String messageId;
    private String publishTime;
}

@Data
class GmailNotification {
    private String emailAddress;
    private Long historyId;
}
```

---

### **3. Security Configuration**

#### **Verify Pub/Sub JWT Token**

```java
@Component
public class PubSubTokenValidator {
    
    /**
     * Verify that webhook request is from Google Pub/Sub
     * Validates JWT token in Authorization header
     */
    public boolean validatePubSubToken(String authHeader) {
        try {
            // Extract JWT token
            String token = authHeader.replace("Bearer ", "");
            
            // Verify token signature and claims
            // Use Google's JWT validator library
            GoogleIdToken idToken = GoogleIdToken.parse(
                new JacksonFactory(), 
                token
            );
            
            // Verify issuer and audience
            return idToken.verifyIssuer("accounts.google.com") &&
                   idToken.verifyAudience(Collections.singleton("your-project-id"));
                   
        } catch (Exception e) {
            log.error("Invalid Pub/Sub token", e);
            return false;
        }
    }
}
```

#### **SecurityConfig Update**

```java
@Bean
@Order(1)
public SecurityFilterChain webhookSecurityFilterChain(HttpSecurity http) throws Exception {
    http
        .securityMatcher("/api/webhooks/**")
        .authorizeHttpRequests(authorize -> authorize
            .anyRequest().permitAll() // Validate via Pub/Sub JWT instead
        )
        .csrf(csrf -> csrf.disable());
    
    return http.build();
}
```

---

### **4. Database Schema Update**

Add watch state tracking to `user_email_tokens` table:

```sql
-- Add columns for Gmail watch tracking
ALTER TABLE api.user_email_tokens
ADD COLUMN watch_history_id BIGINT,
ADD COLUMN watch_expiration TIMESTAMP WITH TIME ZONE;

-- Index for quick lookup by email address
CREATE INDEX idx_user_email_tokens_email ON api.user_email_tokens(email_address);
```

---

## Benefits

✅ **Real-time Sync**: New emails trigger sync within seconds  
✅ **No Polling**: Eliminates need for periodic background jobs  
✅ **Reduced API Calls**: Only sync when changes occur (saves Gmail API quota)  
✅ **Better UX**: Users see new interactions immediately  
✅ **Scalable**: Google handles monitoring, you only process changes  

---

## Challenges & Considerations

### **1. Watch Expiration**
- Gmail watch expires after **7 days**
- Must implement renewal job (every 6 days recommended)
- Handle renewal failures gracefully

### **2. Webhook Endpoint Requirements**
- Must be **HTTPS** (no localhost testing)
- Must respond within **10 seconds** (use async processing)
- Must handle **duplicate notifications** (Google may retry)

### **3. Development/Testing**
- Cannot test locally without public HTTPS endpoint
- Use **ngrok** or deploy to staging environment
- Mock Pub/Sub notifications for local testing

### **4. Cost**
- Pub/Sub pricing: ~$0.40 per million messages
- Minimal cost for most use cases
- Gmail API calls still count against quota

### **5. User Disconnection**
- Unwatch when user revokes Gmail access
- Clean up Pub/Sub subscriptions for deleted users

---

## Fallback Strategy

If push notifications fail, fall back to:
1. **Sync on login** (always works)
2. **Periodic sync** (every 30-60 minutes while user active)
3. **Manual sync button** (user-initiated)

Store last sync timestamp and method:
```java
enum SyncTrigger {
    LOGIN,
    PUSH_NOTIFICATION,
    PERIODIC,
    MANUAL
}
```

---

## Implementation Timeline

### **Phase 3A** (Current - MVP)
- ✅ Sync on login only
- ✅ Manual sync button (optional)

### **Phase 3B** (Enhancement)
- ✅ Periodic background sync (every 30-60 min)
- ✅ Improved error handling

### **Phase 4** (Advanced - Real-time)
- ✅ Gmail Push Notifications
- ✅ Pub/Sub integration
- ✅ Watch renewal automation
- ✅ Production HTTPS deployment

---

## Testing Plan

### **Local Development**
```bash
# Use ngrok to expose local endpoint
ngrok http 8081

# Create Pub/Sub subscription with ngrok URL
gcloud pubsub subscriptions create gmail-notifications-test \
  --topic=gmail-notifications \
  --push-endpoint=https://abc123.ngrok.io/api/webhooks/gmail
```

### **Simulate Notification**
```bash
# Publish test message to Pub/Sub
gcloud pubsub topics publish gmail-notifications \
  --message='{"emailAddress":"test@gmail.com","historyId":12345}'
```

### **Monitor Logs**
```bash
# Backend logs should show webhook received
# Verify sync triggered correctly
```

---

## Production Checklist

- [ ] HTTPS endpoint configured
- [ ] Pub/Sub topic created in production GCP project
- [ ] Service account with proper permissions
- [ ] Push subscription pointing to production API
- [ ] JWT token validation enabled
- [ ] Watch renewal scheduled job deployed
- [ ] Monitoring/alerting for failed watches
- [ ] Database indexes created
- [ ] Error handling and retry logic tested
- [ ] Load testing with simulated notifications

---

## References

- [Gmail API Push Notifications](https://developers.google.com/gmail/api/guides/push)
- [Google Cloud Pub/Sub](https://cloud.google.com/pubsub/docs)
- [Watch Request Documentation](https://developers.google.com/gmail/api/reference/rest/v1/users/watch)
- [Pub/Sub Push Authentication](https://cloud.google.com/pubsub/docs/push#authentication)

---

## Additional Notes

- Watch requests are **per user mailbox** (not global)
- Each watch has unique `historyId` (track mailbox state)
- Use `historyId` to fetch only new changes (efficient)
- Consider rate limiting webhook endpoint to prevent abuse
- Log all notifications for debugging and audit trail

---

**Status**: 📋 Documented for future Phase 4 implementation  
**Priority**: Low (Phase 3A MVP works without this)  
**Effort**: Medium-High (requires production HTTPS + GCP setup)  
**Impact**: High (real-time sync significantly improves UX)
