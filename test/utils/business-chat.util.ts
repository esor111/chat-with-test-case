// Business chat testing utilities

export function expectValidBusinessConversation(conversation: any): void {
  expect(conversation).toBeDefined();
  expect(conversation.type).toBe('business');
  expect(conversation).toHaveProperty('metadata');
  
  const metadata = conversation.metadata;
  expect(metadata).toHaveProperty('businessId');
  expect(metadata).toHaveProperty('assignedAgentId');
  expect(typeof metadata.businessId).toBe('string');
  expect(typeof metadata.assignedAgentId).toBe('string');
  
  if (metadata.priority) {
    expect(['low', 'medium', 'high']).toContain(metadata.priority);
  }
  
  if (metadata.tags) {
    expect(Array.isArray(metadata.tags)).toBe(true);
  }
}

export function expectValidAgentAssignment(assignment: any): void {
  expect(assignment).toBeDefined();
  expect(assignment).toHaveProperty('agentId');
  expect(assignment).toHaveProperty('businessId');
  expect(assignment).toHaveProperty('assignedAt');
  
  expect(typeof assignment.agentId).toBe('string');
  expect(typeof assignment.businessId).toBe('string');
  expect(assignment.assignedAt).toBeInstanceOf(Date);
}

export function expectValidAgent(agent: any): void {
  expect(agent).toBeDefined();
  expect(agent).toHaveProperty('uuid');
  expect(agent).toHaveProperty('businessId');
  expect(agent).toHaveProperty('name');
  expect(agent).toHaveProperty('status');
  expect(agent).toHaveProperty('maxConcurrentChats');
  expect(agent).toHaveProperty('currentChatCount');
  
  expect(typeof agent.uuid).toBe('string');
  expect(typeof agent.businessId).toBe('string');
  expect(typeof agent.name).toBe('string');
  expect(['available', 'busy', 'offline']).toContain(agent.status);
  expect(typeof agent.maxConcurrentChats).toBe('number');
  expect(typeof agent.currentChatCount).toBe('number');
  expect(agent.maxConcurrentChats).toBeGreaterThan(0);
  expect(agent.currentChatCount).toBeGreaterThanOrEqual(0);
  expect(agent.currentChatCount).toBeLessThanOrEqual(agent.maxConcurrentChats);
}

export function expectValidBusiness(business: any): void {
  expect(business).toBeDefined();
  expect(business).toHaveProperty('uuid');
  expect(business).toHaveProperty('name');
  expect(business).toHaveProperty('agents');
  expect(business).toHaveProperty('isActive');
  
  expect(typeof business.uuid).toBe('string');
  expect(typeof business.name).toBe('string');
  expect(Array.isArray(business.agents)).toBe(true);
  expect(typeof business.isActive).toBe('boolean');
}

export function expectAgentAvailability(agent: any, shouldBeAvailable: boolean): void {
  expectValidAgent(agent);
  
  if (shouldBeAvailable) {
    expect(agent.status).toBe('available');
    expect(agent.currentChatCount).toBeLessThan(agent.maxConcurrentChats);
  } else {
    expect(
      agent.status !== 'available' || 
      agent.currentChatCount >= agent.maxConcurrentChats
    ).toBe(true);
  }
}

export function expectRoundRobinAssignment(agents: any[], assignments: string[]): void {
  // Verify that agents are assigned in round-robin fashion
  const agentCounts = new Map<string, number>();
  
  assignments.forEach(agentId => {
    agentCounts.set(agentId, (agentCounts.get(agentId) || 0) + 1);
  });
  
  const counts = Array.from(agentCounts.values());
  const maxCount = Math.max(...counts);
  const minCount = Math.min(...counts);
  
  // In round-robin, the difference between max and min assignments should be at most 1
  expect(maxCount - minCount).toBeLessThanOrEqual(1);
}

export function expectLeastBusyAssignment(agents: any[], assignedAgentId: string): void {
  const assignedAgent = agents.find(agent => agent.uuid === assignedAgentId);
  expect(assignedAgent).toBeDefined();
  
  const availableAgents = agents.filter(agent => 
    agent.status === 'available' && 
    agent.currentChatCount < agent.maxConcurrentChats
  );
  
  // Assigned agent should have the lowest workload percentage among available agents
  const assignedWorkload = assignedAgent.currentChatCount / assignedAgent.maxConcurrentChats;
  
  availableAgents.forEach(agent => {
    const agentWorkload = agent.currentChatCount / agent.maxConcurrentChats;
    expect(assignedWorkload).toBeLessThanOrEqual(agentWorkload);
  });
}