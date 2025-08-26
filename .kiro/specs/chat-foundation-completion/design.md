# Foundation Completion Design Document

## Overview

This design document outlines the architecture for completing the chat backend foundation by adding comprehensive test coverage for all missing functionality. The design builds upon our existing 17-test foundation and extends it to cover all Phase 1 MVP requirements through mock implementations that will later be transformed to real systems.

## Architecture

### Foundation Extension Strategy

Our approach extends the existing foundation architecture with new test categories while maintaining the same patterns and principles:

```
Current Foundation (17 tests)
├── Infrastructure Tests (5 tests)
├── User Outcome Tests (7 tests)  
├── End-to-End Smoke Test (1 test)
└── Reliability Tests (4 tests)

Extended Foundation (32+ tests)
├── Infrastructure Tests (5 tests) ✅ Existing
├── User Outcome Tests (7 tests) ✅ Existing
├── End-to-End Smoke Test (1 test) ✅ Existing
├── Reliability Tests (4 tests) ✅ Existing
├── Conversation Management Tests (5 tests) 🆕 New
├── Business Chat Tests (4 tests) 🆕 New
├── Profile Integration Tests (4 tests) 🆕 New
├── Presence Tracking Tests (3 tests) 🆕 New
├── Advanced Features Tests (4+ tests) 🆕 New
```

### Test Architecture Patterns

#### Mock Service Pattern
All new tests follow the established mock service pattern:

```typescript
// Existing Pattern (ProfileService)
class MockProfileService {
  async getProfiles(uuids: string[]): Promise<UserProfile[]> {
    return TEST_USERS_DATA.filter(user => uuids.includes(user.uuid));
  }
}

// Extended Pattern (ConversationService)
class MockConversationService {
  async createConversation(dto: CreateConversationDto): Promise<Conversation> {
    return {
      id: generateTestUuid(),
      type: dto.type,
      participants: dto.participants,
      createdAt: new Date()
    };
  }
}
```

#### Test Data Management
Extend existing test data structures with new entities:

```typescript
// Existing Test Data
export const TEST_USERS = {
  ALICE: { uuid: 'uuid-123', name: 'Alice Johnson' },
  BOB: { uuid: 'uuid-456', name: 'Bob Smith' },
  // ...
};

// Extended Test Data
export const TEST_CONVERSATIONS = {
  DIRECT_ALICE_BOB: {
    id: 'conv-direct-1',
    type: 'direct',
    participants: ['uuid-123', 'uuid-456']
  },
  GROUP_TEAM: {
    id: 'conv-group-1', 
    type: 'group',
    participants: ['uuid-123', 'uuid-456', 'uuid-789']
  }
};

export const TEST_BUSINESSES = {
  ACME_CORP: {
    uuid: 'biz-uuid-1',
    name: 'Acme Corporation',
    agents: ['agent-uuid-1', 'agent-uuid-2']
  }
};
```

## Components and Interfaces

### Conversation Management Component

```typescript
interface ConversationService {
  // Core conversation operations
  createConversation(dto: CreateConversationDto): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation>;
  addParticipant(conversationId: string, userId: string): Promise<void>;
  removeParticipant(conversationId: string, userId: string): Promise<void>;
  
  // Validation and business rules
  validateParticipantLimits(type: ConversationType, participantCount: number): boolean;
  canUserAccessConversation(userId: string, conversationId: string): Promise<boolean>;
  
  // Conversation listing and management
  getUserConversations(userId: string): Promise<ConversationPreview[]>;
  archiveConversation(conversationId: string, userId: string): Promise<void>;
}

interface CreateConversationDto {
  type: 'direct' | 'group' | 'business';
  participants: string[];
  name?: string;
  businessId?: string;
}

interface Conversation {
  id: string;
  type: ConversationType;
  participants: string[];
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: ConversationMetadata;
}
```

### Business Chat Component

```typescript
interface BusinessChatService {
  // Business conversation creation
  createBusinessConversation(userId: string, businessId: string): Promise<Conversation>;
  assignAgent(conversationId: string): Promise<string>; // Returns agent UUID
  reassignAgent(conversationId: string, newAgentId: string): Promise<void>;
  
  // Agent management
  getAvailableAgents(businessId: string): Promise<Agent[]>;
  getAgentWorkload(agentId: string): Promise<AgentWorkload>;
  
  // Business rules
  isBusinessHoursActive(businessId: string): Promise<boolean>;
  canAgentAccessConversation(agentId: string, conversationId: string): Promise<boolean>;
}

interface Agent {
  uuid: string;
  businessId: string;
  status: 'available' | 'busy' | 'offline';
  maxConcurrentChats: number;
  currentChatCount: number;
}

interface BusinessConversationMetadata {
  businessId: string;
  assignedAgentId: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  customerContext?: any;
}
```

### Profile Integration Component

```typescript
interface ProfileIntegrationService {
  // Batch profile operations
  getProfilesBatch(userUuids: string[]): Promise<UserProfile[]>;
  getCachedProfiles(userUuids: string[]): Promise<Map<string, UserProfile>>;
  
  // Cache management
  cacheProfiles(profiles: UserProfile[]): Promise<void>;
  invalidateProfileCache(userUuid: string): Promise<void>;
  
  // Fallback handling
  getProfileWithFallback(userUuid: string): Promise<UserProfile>;
  handleProfileServiceUnavailable(userUuids: string[]): Promise<UserProfile[]>;
}

interface KahaMainV3Client {
  // External API integration
  batchGetProfiles(uuids: string[]): Promise<ProfileApiResponse>;
  validateUserExists(uuid: string): Promise<boolean>;
  validateBusinessExists(uuid: string): Promise<boolean>;
}

interface ProfileApiResponse {
  profiles: UserProfile[];
  errors: ProfileError[];
  partial: boolean;
}
```

### Presence Tracking Component

```typescript
interface PresenceService {
  // Presence state management
  setUserOnline(userUuid: string, deviceId?: string): Promise<void>;
  setUserOffline(userUuid: string, deviceId?: string): Promise<void>;
  getUserPresence(userUuid: string): Promise<PresenceStatus>;
  
  // Activity tracking
  updateLastActivity(userUuid: string): Promise<void>;
  checkInactiveUsers(): Promise<string[]>; // Returns UUIDs of inactive users
  
  // Multi-device support
  addUserDevice(userUuid: string, deviceId: string): Promise<void>;
  removeUserDevice(userUuid: string, deviceId: string): Promise<void>;
  getUserDevices(userUuid: string): Promise<string[]>;
  
  // Presence broadcasting
  broadcastPresenceChange(userUuid: string, status: PresenceStatus): Promise<void>;
}

interface PresenceStatus {
  isOnline: boolean;
  lastSeenAt: Date;
  deviceCount: number;
  status: 'online' | 'away' | 'offline';
}
```

### Unread Count Management Component

```typescript
interface UnreadCountService {
  // Unread count operations
  incrementUnreadCount(conversationId: string, userUuid: string): Promise<void>;
  resetUnreadCount(conversationId: string, userUuid: string): Promise<void>;
  getUnreadCount(conversationId: string, userUuid: string): Promise<number>;
  
  // Bulk operations
  getUnreadCounts(userUuid: string): Promise<Map<string, number>>;
  updateLastReadMessage(conversationId: string, userUuid: string, messageId: string): Promise<void>;
  
  // Group conversation handling
  incrementUnreadForParticipants(conversationId: string, excludeUserUuid: string): Promise<void>;
  calculateInitialUnreadCount(conversationId: string, userUuid: string, joinedAt: Date): Promise<number>;
}

interface ReadStatus {
  conversationId: string;
  userUuid: string;
  lastReadMessageId: string;
  lastReadAt: Date;
  unreadCount: number;
}
```

## Data Models

### Extended Database Schema (Mock)

```typescript
// Existing entities remain unchanged
interface Message {
  id: string;
  chatId: string; // Will become conversationId
  senderUuid: string;
  content: string;
  timestamp: Date;
}

// New entities for foundation testing
interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'business';
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
  metadata?: any;
}

interface ConversationParticipant {
  conversationId: string;
  userUuid: string;
  joinedAt: Date;
  leftAt?: Date;
  role: 'member' | 'admin' | 'agent';
  lastReadMessageId?: string;
  unreadCount: number;
}

interface UserPresence {
  userUuid: string;
  status: 'online' | 'away' | 'offline';
  lastSeenAt: Date;
  deviceIds: string[];
  updatedAt: Date;
}

interface BusinessConversation {
  conversationId: string;
  businessId: string;
  assignedAgentId: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  createdAt: Date;
  metadata?: any;
}
```

### Cache Data Structures

```typescript
// Redis cache structures for foundation testing
interface CachedProfile {
  uuid: string;
  name: string;
  avatar?: string;
  cachedAt: Date;
  ttl: number;
}

interface CachedPresence {
  userUuid: string;
  status: PresenceStatus;
  devices: Set<string>;
  lastActivity: Date;
}

interface CachedUnreadCounts {
  userUuid: string;
  counts: Map<string, number>; // conversationId -> count
  lastUpdated: Date;
}
```

## Error Handling

### Error Categories and Handling Strategies

```typescript
// Conversation Management Errors
class ConversationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

class ParticipantLimitExceededError extends ConversationError {
  constructor(type: string, limit: number) {
    super(`${type} conversation cannot exceed ${limit} participants`, 'PARTICIPANT_LIMIT_EXCEEDED');
  }
}

// Profile Integration Errors
class ProfileServiceError extends Error {
  constructor(message: string, public isRetryable: boolean = true) {
    super(message);
  }
}

class ProfileNotFoundError extends ProfileServiceError {
  constructor(uuid: string) {
    super(`Profile not found for UUID: ${uuid}`, false);
  }
}

// Business Chat Errors
class BusinessChatError extends Error {
  constructor(message: string, public businessId?: string) {
    super(message);
  }
}

class NoAvailableAgentsError extends BusinessChatError {
  constructor(businessId: string) {
    super(`No available agents for business: ${businessId}`, businessId);
  }
}
```

### Error Recovery Strategies

```typescript
interface ErrorRecoveryStrategy {
  // Retry mechanisms
  retryWithExponentialBackoff<T>(operation: () => Promise<T>, maxRetries: number): Promise<T>;
  
  // Fallback strategies
  handleServiceUnavailable<T>(fallbackValue: T): T;
  handlePartialFailure<T>(partialResults: T[], errors: Error[]): T[];
  
  // Circuit breaker pattern
  executeWithCircuitBreaker<T>(operation: () => Promise<T>, serviceName: string): Promise<T>;
}
```

## Testing Strategy

### Test Organization

```typescript
// New test files to be created
describe('Conversation Management Foundation', () => {
  // conversation-management.e2e-spec.ts
  // Tests for conversation creation, participant management, validation
});

describe('Business Chat Foundation', () => {
  // business-chat.e2e-spec.ts  
  // Tests for business conversations, agent assignment, workflows
});

describe('Profile Integration Foundation', () => {
  // profile-integration.e2e-spec.ts
  // Tests for batch profile fetching, caching, fallback handling
});

describe('Presence Tracking Foundation', () => {
  // presence-tracking.e2e-spec.ts
  // Tests for online/offline status, multi-device, activity tracking
});

describe('Advanced Features Foundation', () => {
  // advanced-features.e2e-spec.ts
  // Tests for unread counts, message management, permissions
});
```

### Mock Implementation Strategy

```typescript
// All new services follow the same mock pattern as existing ProfileService
class MockConversationService implements ConversationService {
  private conversations = new Map<string, Conversation>();
  private participants = new Map<string, ConversationParticipant[]>();
  
  async createConversation(dto: CreateConversationDto): Promise<Conversation> {
    // Mock implementation with validation
    this.validateParticipantLimits(dto.type, dto.participants.length);
    
    const conversation: Conversation = {
      id: generateTestUuid(),
      type: dto.type,
      participants: dto.participants,
      createdAt: new Date()
    };
    
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }
  
  validateParticipantLimits(type: ConversationType, count: number): boolean {
    const limits = { direct: 2, group: 8, business: 3 };
    if (type === 'direct' && count !== 2) {
      throw new ParticipantLimitExceededError(type, limits[type]);
    }
    if (type === 'group' && (count < 2 || count > 8)) {
      throw new ParticipantLimitExceededError(type, limits[type]);
    }
    return true;
  }
}
```

## Performance Considerations

### Test Performance Optimization

```typescript
// Shared test utilities for performance
class FoundationTestUtils {
  // Batch operations for test setup
  static async createTestConversations(count: number): Promise<Conversation[]> {
    // Efficient batch creation for performance tests
  }
  
  static async simulateConcurrentUsers(userCount: number, operation: () => Promise<void>): Promise<void> {
    // Concurrent operation simulation
  }
  
  // Memory management for large test suites
  static async cleanupTestData(): Promise<void> {
    // Efficient cleanup between tests
  }
}
```

### Mock Service Performance

```typescript
// Efficient mock implementations
class MockRedisCache {
  private cache = new Map<string, { value: any, expiry: Date }>();
  
  async get(key: string): Promise<any> {
    const entry = this.cache.get(key);
    if (!entry || entry.expiry < new Date()) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }
  
  async setex(key: string, ttl: number, value: any): Promise<void> {
    this.cache.set(key, {
      value,
      expiry: new Date(Date.now() + ttl * 1000)
    });
  }
}
```

This design ensures that our foundation completion maintains the same high-quality patterns established in our existing foundation while comprehensively covering all Phase 1 MVP requirements through mock implementations that can be seamlessly transformed to real systems.