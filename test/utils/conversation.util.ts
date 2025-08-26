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