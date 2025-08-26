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

// Business chat simulation utilities
export function simulateAgentAssignment(businessId: string, availableAgents: any[], algorithm: 'round_robin' | 'least_busy' = 'round_robin'): any {
  const businessAgents = availableAgents.filter(agent => 
    agent.businessId === businessId && 
    agent.status === 'available' && 
    agent.currentChatCount < agent.maxConcurrentChats
  );

  if (businessAgents.length === 0) {
    return {
      success: false,
      error: 'No available agents',
      fallback: 'queue_customer'
    };
  }

  let selectedAgent;
  if (algorithm === 'round_robin') {
    selectedAgent = businessAgents.reduce((prev, current) => 
      prev.currentChatCount <= current.currentChatCount ? prev : current
    );
  } else {
    selectedAgent = businessAgents.reduce((prev, current) => {
      const prevLoad = prev.currentChatCount / prev.maxConcurrentChats;
      const currentLoad = current.currentChatCount / current.maxConcurrentChats;
      return prevLoad <= currentLoad ? prev : current;
    });
  }

  return {
    success: true,
    assignedAgent: selectedAgent,
    algorithm,
    assignedAt: new Date(),
    businessId
  };
}

export function simulateBusinessConversationCreation(customerId: string, businessId: string, priority: 'low' | 'medium' | 'high' = 'medium'): any {
  return {
    conversationId: `business-conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'business',
    customerId,
    businessId,
    priority,
    status: 'pending_agent_assignment',
    createdAt: new Date(),
    metadata: {
      customerContext: {
        accountType: 'standard',
        previousInteractions: 0,
        preferredLanguage: 'en'
      },
      businessContext: {
        department: 'general_support',
        category: 'inquiry'
      }
    }
  };
}

export function simulateAgentResponse(conversationId: string, agentId: string, message: string, responseTime?: number): any {
  return {
    conversationId,
    agentId,
    message,
    timestamp: new Date(),
    responseTime: responseTime || Math.floor(Math.random() * 300) + 30, // 30-330 seconds
    messageType: 'agent_response',
    metadata: {
      source: 'agent_dashboard',
      automated: false
    }
  };
}

export function simulateAgentReassignment(conversationId: string, fromAgentId: string, toAgentId: string, reason: string): any {
  return {
    conversationId,
    fromAgentId,
    toAgentId,
    reason,
    reassignedAt: new Date(),
    metadata: {
      previousAgentStats: {
        responseTime: Math.floor(Math.random() * 300) + 60,
        messagesHandled: Math.floor(Math.random() * 10) + 1
      }
    }
  };
}

export function simulateBusinessHoursCheck(businessId: string, timezone: string = 'UTC'): any {
  const now = new Date();
  const currentHour = now.getUTCHours(); // Simplified for UTC
  
  // Simulate business hours 9 AM - 5 PM UTC
  const isBusinessHours = currentHour >= 9 && currentHour < 17;
  
  return {
    businessId,
    timezone,
    currentTime: now,
    isBusinessHours,
    nextOpenTime: isBusinessHours ? null : new Date(now.getTime() + (24 - currentHour + 9) * 60 * 60 * 1000),
    businessHours: {
      start: '09:00',
      end: '17:00',
      timezone
    }
  };
}

export function simulateAgentWorkloadUpdate(agentId: string, action: 'assign' | 'complete', conversationId?: string): any {
  return {
    agentId,
    action,
    conversationId,
    timestamp: new Date(),
    workloadChange: action === 'assign' ? +1 : -1,
    metadata: {
      source: 'workload_manager',
      reason: action === 'assign' ? 'new_conversation_assigned' : 'conversation_completed'
    }
  };
}

// Business chat testing scenarios
export function createBusinessChatTestScenario(name: string, config: {
  businessId: string;
  agents: Array<{ id: string; status: 'available' | 'busy' | 'offline'; currentChats: number; maxChats: number }>;
  customers: Array<{ id: string; priority: 'low' | 'medium' | 'high' }>;
}): any {
  return {
    scenarioName: name,
    createdAt: new Date(),
    businessId: config.businessId,
    agents: config.agents.map(agent => ({
      uuid: agent.id,
      businessId: config.businessId,
      name: `Agent ${agent.id}`,
      status: agent.status,
      currentChatCount: agent.currentChats,
      maxConcurrentChats: agent.maxChats,
      skills: ['general']
    })),
    pendingCustomers: config.customers.map(customer => ({
      customerId: customer.id,
      priority: customer.priority,
      waitingSince: new Date(),
      estimatedWaitTime: Math.floor(Math.random() * 300) + 60 // 1-5 minutes
    }))
  };
}