// Conversation testing utilities

export function expectValidConversation(conversation: any): void {
  expect(conversation).toBeDefined();
  expect(conversation).toHaveProperty('id');
  expect(conversation).toHaveProperty('type');
  expect(conversation).toHaveProperty('participants');
  expect(conversation).toHaveProperty('createdAt');
  expect(conversation).toHaveProperty('updatedAt');
  
  expect(typeof conversation.id).toBe('string');
  expect(['direct', 'group', 'business']).toContain(conversation.type);
  expect(Array.isArray(conversation.participants)).toBe(true);
  expect(conversation.participants.length).toBeGreaterThan(0);
}

export function expectValidConversationList(conversations: any[]): void {
  expect(Array.isArray(conversations)).toBe(true);
  
  conversations.forEach(conversation => {
    expectValidConversation(conversation);
  });
}

export function expectValidConversationParticipant(participant: any): void {
  expect(participant).toBeDefined();
  expect(participant).toHaveProperty('conversationId');
  expect(participant).toHaveProperty('userUuid');
  expect(participant).toHaveProperty('joinedAt');
  expect(participant).toHaveProperty('role');
  expect(participant).toHaveProperty('unreadCount');
  
  expect(typeof participant.conversationId).toBe('string');
  expect(typeof participant.userUuid).toBe('string');
  expect(['member', 'admin', 'agent']).toContain(participant.role);
  expect(typeof participant.unreadCount).toBe('number');
  expect(participant.unreadCount).toBeGreaterThanOrEqual(0);
}

export function expectDirectConversationRules(conversation: any): void {
  expectValidConversation(conversation);
  expect(conversation.type).toBe('direct');
  expect(conversation.participants.length).toBe(2);
}

export function expectGroupConversationRules(conversation: any): void {
  expectValidConversation(conversation);
  expect(conversation.type).toBe('group');
  expect(conversation.participants.length).toBeGreaterThanOrEqual(2);
  expect(conversation.participants.length).toBeLessThanOrEqual(8);
}

export function expectBusinessConversationRules(conversation: any): void {
  expectValidConversation(conversation);
  expect(conversation.type).toBe('business');
  expect(conversation.participants.length).toBeGreaterThanOrEqual(2);
  expect(conversation).toHaveProperty('metadata');
  expect(conversation.metadata).toHaveProperty('businessId');
  expect(conversation.metadata).toHaveProperty('assignedAgentId');
}

// Conversation creation utilities
export function createTestConversation(type: 'direct' | 'group' | 'business', participants: string[], options: any = {}): any {
  const baseConversation = {
    id: `test-conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    participants,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...options
  };

  if (type === 'business' && !baseConversation.metadata) {
    baseConversation.metadata = {
      businessId: 'test-business-id',
      assignedAgentId: 'test-agent-id',
      priority: 'medium'
    };
  }

  return baseConversation;
}

export function createDirectConversation(user1: string, user2: string, options: any = {}): any {
  return createTestConversation('direct', [user1, user2], options);
}

export function createGroupConversation(participants: string[], name?: string, options: any = {}): any {
  const groupOptions = {
    name: name || `Test Group ${Date.now()}`,
    ...options
  };
  return createTestConversation('group', participants, groupOptions);
}

export function createBusinessConversation(customerId: string, businessId: string, agentId: string, options: any = {}): any {
  const businessOptions = {
    metadata: {
      businessId,
      assignedAgentId: agentId,
      priority: 'medium',
      ...options.metadata
    },
    ...options
  };
  return createTestConversation('business', [customerId, businessId, agentId], businessOptions);
}

// Participant management utilities
export function addParticipantToConversation(conversation: any, userUuid: string, role: 'member' | 'admin' | 'agent' = 'member'): any {
  if (conversation.participants.includes(userUuid)) {
    throw new Error('User is already a participant in this conversation');
  }

  if (conversation.type === 'direct') {
    throw new Error('Cannot add participants to direct conversations');
  }

  if (conversation.type === 'group' && conversation.participants.length >= 8) {
    throw new Error('Group conversation cannot have more than 8 participants');
  }

  return {
    ...conversation,
    participants: [...conversation.participants, userUuid],
    updatedAt: new Date()
  };
}

export function removeParticipantFromConversation(conversation: any, userUuid: string): any {
  if (!conversation.participants.includes(userUuid)) {
    throw new Error('User is not a participant in this conversation');
  }

  if (conversation.type === 'direct') {
    throw new Error('Cannot remove participants from direct conversations');
  }

  return {
    ...conversation,
    participants: conversation.participants.filter((p: string) => p !== userUuid),
    updatedAt: new Date()
  };
}

export function createConversationParticipant(conversationId: string, userUuid: string, role: 'member' | 'admin' | 'agent' = 'member'): any {
  return {
    conversationId,
    userUuid,
    joinedAt: new Date(),
    role,
    unreadCount: 0,
    lastReadMessageId: null
  };
}

export function updateParticipantUnreadCount(participant: any, count: number): any {
  return {
    ...participant,
    unreadCount: Math.max(0, count)
  };
}

export function markParticipantAsRead(participant: any, messageId: string): any {
  return {
    ...participant,
    unreadCount: 0,
    lastReadMessageId: messageId
  };
}

// Conversation validation utilities
export function validateConversationCreation(type: 'direct' | 'group' | 'business', participants: string[]): { valid: boolean; error?: string } {
  if (type === 'direct') {
    if (participants.length !== 2) {
      return { valid: false, error: 'Direct conversations must have exactly 2 participants' };
    }
  }

  if (type === 'group') {
    if (participants.length < 2) {
      return { valid: false, error: 'Group conversations must have at least 2 participants' };
    }
    if (participants.length > 8) {
      return { valid: false, error: 'Group conversations cannot have more than 8 participants' };
    }
  }

  if (type === 'business') {
    if (participants.length < 2) {
      return { valid: false, error: 'Business conversations must have at least 2 participants' };
    }
  }

  // Check for duplicate participants
  const uniqueParticipants = new Set(participants);
  if (uniqueParticipants.size !== participants.length) {
    return { valid: false, error: 'Conversation cannot have duplicate participants' };
  }

  return { valid: true };
}

export function expectConversationCreationError(type: 'direct' | 'group' | 'business', participants: string[], expectedError: string): void {
  const validation = validateConversationCreation(type, participants);
  expect(validation.valid).toBe(false);
  expect(validation.error).toContain(expectedError);
}

export function canUserJoinConversation(conversation: any, userUuid: string): { canJoin: boolean; reason?: string } {
  if (conversation.participants.includes(userUuid)) {
    return { canJoin: false, reason: 'User is already a participant' };
  }

  if (conversation.type === 'direct') {
    return { canJoin: false, reason: 'Cannot join direct conversations' };
  }

  if (conversation.type === 'group' && conversation.participants.length >= 8) {
    return { canJoin: false, reason: 'Group conversation is at maximum capacity' };
  }

  return { canJoin: true };
}

export function canUserLeaveConversation(conversation: any, userUuid: string): { canLeave: boolean; reason?: string } {
  if (!conversation.participants.includes(userUuid)) {
    return { canLeave: false, reason: 'User is not a participant' };
  }

  if (conversation.type === 'direct') {
    return { canLeave: false, reason: 'Cannot leave direct conversations' };
  }

  return { canLeave: true };
}