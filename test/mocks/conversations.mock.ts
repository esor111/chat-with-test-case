import { TEST_USERS } from './users.mock';

export interface TestConversation {
  id: string;
  type: 'direct' | 'group' | 'business';
  participants: string[];
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
}

export interface TestConversationParticipant {
  conversationId: string;
  userUuid: string;
  joinedAt: Date;
  leftAt?: Date;
  role: 'member' | 'admin' | 'agent';
  lastReadMessageId?: string;
  unreadCount: number;
}

export const TEST_CONVERSATIONS = {
  DIRECT_ALICE_BOB: {
    id: 'conv-direct-alice-bob',
    type: 'direct' as const,
    participants: [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid],
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z')
  },
  
  DIRECT_ALICE_CHARLIE: {
    id: 'conv-direct-alice-charlie',
    type: 'direct' as const,
    participants: [TEST_USERS.ALICE.uuid, TEST_USERS.CHARLIE.uuid],
    createdAt: new Date('2024-01-01T11:00:00Z'),
    updatedAt: new Date('2024-01-01T11:00:00Z')
  },

  GROUP_TEAM: {
    id: 'conv-group-team',
    type: 'group' as const,
    participants: [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid, TEST_USERS.CHARLIE.uuid],
    name: 'Team Chat',
    createdAt: new Date('2024-01-01T12:00:00Z'),
    updatedAt: new Date('2024-01-01T12:00:00Z')
  },

  GROUP_PROJECT: {
    id: 'conv-group-project',
    type: 'group' as const,
    participants: [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid, TEST_USERS.CHARLIE.uuid, TEST_USERS.DIANA.uuid],
    name: 'Project Discussion',
    createdAt: new Date('2024-01-01T13:00:00Z'),
    updatedAt: new Date('2024-01-01T13:00:00Z')
  },

  BUSINESS_SUPPORT: {
    id: 'conv-business-support',
    type: 'business' as const,
    participants: [TEST_USERS.ALICE.uuid, 'business-uuid-1', 'agent-uuid-1'],
    name: 'Customer Support',
    createdAt: new Date('2024-01-01T14:00:00Z'),
    updatedAt: new Date('2024-01-01T14:00:00Z'),
    metadata: {
      businessId: 'business-uuid-1',
      assignedAgentId: 'agent-uuid-1',
      priority: 'medium'
    }
  }
} as const;

export const TEST_CONVERSATION_PARTICIPANTS = {
  ALICE_IN_DIRECT: {
    conversationId: TEST_CONVERSATIONS.DIRECT_ALICE_BOB.id,
    userUuid: TEST_USERS.ALICE.uuid,
    joinedAt: new Date('2024-01-01T10:00:00Z'),
    role: 'member' as const,
    unreadCount: 0
  },

  BOB_IN_DIRECT: {
    conversationId: TEST_CONVERSATIONS.DIRECT_ALICE_BOB.id,
    userUuid: TEST_USERS.BOB.uuid,
    joinedAt: new Date('2024-01-01T10:00:00Z'),
    role: 'member' as const,
    unreadCount: 2
  },

  ALICE_IN_GROUP: {
    conversationId: TEST_CONVERSATIONS.GROUP_TEAM.id,
    userUuid: TEST_USERS.ALICE.uuid,
    joinedAt: new Date('2024-01-01T12:00:00Z'),
    role: 'admin' as const,
    unreadCount: 0
  },

  BOB_IN_GROUP: {
    conversationId: TEST_CONVERSATIONS.GROUP_TEAM.id,
    userUuid: TEST_USERS.BOB.uuid,
    joinedAt: new Date('2024-01-01T12:00:00Z'),
    role: 'member' as const,
    unreadCount: 1
  },

  CHARLIE_IN_GROUP: {
    conversationId: TEST_CONVERSATIONS.GROUP_TEAM.id,
    userUuid: TEST_USERS.CHARLIE.uuid,
    joinedAt: new Date('2024-01-01T12:00:00Z'),
    role: 'member' as const,
    unreadCount: 3
  }
} as const;

export const TEST_UNREAD_COUNT_DATA = {
  ALICE_COUNTS: new Map([
    [TEST_CONVERSATIONS.DIRECT_ALICE_BOB.id, 0],
    [TEST_CONVERSATIONS.GROUP_TEAM.id, 0]
  ]),
  
  BOB_COUNTS: new Map([
    [TEST_CONVERSATIONS.DIRECT_ALICE_BOB.id, 2],
    [TEST_CONVERSATIONS.GROUP_TEAM.id, 1]
  ]),
  
  CHARLIE_COUNTS: new Map([
    [TEST_CONVERSATIONS.GROUP_TEAM.id, 3]
  ])
} as const;

// Utility functions for conversation testing
export function createMockConversation(overrides: Partial<TestConversation> = {}): TestConversation {
  return {
    id: `conv-${Date.now()}`,
    type: 'direct',
    participants: [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

export function createMockConversationParticipant(overrides: Partial<TestConversationParticipant> = {}): TestConversationParticipant {
  return {
    conversationId: TEST_CONVERSATIONS.DIRECT_ALICE_BOB.id,
    userUuid: TEST_USERS.ALICE.uuid,
    joinedAt: new Date(),
    role: 'member',
    unreadCount: 0,
    ...overrides
  };
}