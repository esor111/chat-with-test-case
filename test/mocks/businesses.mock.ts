export interface TestBusiness {
  uuid: string;
  name: string;
  description?: string;
  agents: string[];
  isActive: boolean;
  businessHours?: {
    start: string;
    end: string;
    timezone: string;
  };
}

export interface TestAgent {
  uuid: string;
  businessId: string;
  name: string;
  status: 'available' | 'busy' | 'offline';
  maxConcurrentChats: number;
  currentChatCount: number;
  skills: readonly string[];
}

export const TEST_BUSINESSES = {
  ACME_CORP: {
    uuid: 'business-uuid-1',
    name: 'Acme Corporation',
    description: 'Leading provider of innovative solutions',
    agents: ['agent-uuid-1', 'agent-uuid-2', 'agent-uuid-3'],
    isActive: true,
    businessHours: {
      start: '09:00',
      end: '17:00',
      timezone: 'UTC'
    }
  },

  TECH_SUPPORT: {
    uuid: 'business-uuid-2',
    name: 'Tech Support Inc',
    description: '24/7 technical support services',
    agents: ['agent-uuid-4', 'agent-uuid-5'],
    isActive: true,
    businessHours: {
      start: '00:00',
      end: '23:59',
      timezone: 'UTC'
    }
  },

  INACTIVE_BUSINESS: {
    uuid: 'business-uuid-3',
    name: 'Inactive Business',
    description: 'Currently not accepting chats',
    agents: [],
    isActive: false
  }
} as const;

export const TEST_AGENTS = {
  AGENT_1: {
    uuid: 'agent-uuid-1',
    businessId: 'business-uuid-1',
    name: 'John Support',
    status: 'available' as const,
    maxConcurrentChats: 5,
    currentChatCount: 2,
    skills: ['general', 'billing']
  },

  AGENT_2: {
    uuid: 'agent-uuid-2',
    businessId: 'business-uuid-1',
    name: 'Sarah Helper',
    status: 'busy' as const,
    maxConcurrentChats: 3,
    currentChatCount: 3,
    skills: ['technical', 'advanced']
  },

  AGENT_3: {
    uuid: 'agent-uuid-3',
    businessId: 'business-uuid-1',
    name: 'Mike Assistant',
    status: 'offline' as const,
    maxConcurrentChats: 4,
    currentChatCount: 0,
    skills: ['general']
  },

  AGENT_4: {
    uuid: 'agent-uuid-4',
    businessId: 'business-uuid-2',
    name: 'Tech Expert 1',
    status: 'available' as const,
    maxConcurrentChats: 8,
    currentChatCount: 1,
    skills: ['technical', 'hardware', 'software']
  },

  AGENT_5: {
    uuid: 'agent-uuid-5',
    businessId: 'business-uuid-2',
    name: 'Tech Expert 2',
    status: 'available' as const,
    maxConcurrentChats: 8,
    currentChatCount: 0,
    skills: ['technical', 'network', 'security']
  }
} as const;

// Business chat workflow data
export const TEST_BUSINESS_CONVERSATIONS = {
  ALICE_ACME_SUPPORT: {
    conversationId: 'conv-business-support',
    businessId: 'business-uuid-1',
    customerId: 'uuid-123', // Alice
    assignedAgentId: 'agent-uuid-1',
    priority: 'medium' as const,
    tags: ['billing', 'question'],
    createdAt: new Date('2024-01-01T14:00:00Z'),
    metadata: {
      customerContext: {
        accountType: 'premium',
        lastPurchase: '2024-01-01',
        issueCategory: 'billing'
      }
    }
  }
} as const;

// Utility functions for business testing
export function createMockBusiness(overrides: Partial<TestBusiness> = {}): TestBusiness {
  return {
    uuid: `business-${Date.now()}`,
    name: 'Test Business',
    agents: ['agent-uuid-1'],
    isActive: true,
    ...overrides
  };
}

export function createMockAgent(overrides: Partial<TestAgent> = {}): TestAgent {
  return {
    uuid: `agent-${Date.now()}`,
    businessId: 'business-uuid-1',
    name: 'Test Agent',
    status: 'available',
    maxConcurrentChats: 5,
    currentChatCount: 0,
    skills: ['general'],
    ...overrides
  };
}

// Agent assignment algorithms for testing
export function getNextAvailableAgent(businessId: string): TestAgent | null {
  const businessAgents = Object.values(TEST_AGENTS).filter(
    agent => agent.businessId === businessId &&
      agent.status === 'available' &&
      agent.currentChatCount < agent.maxConcurrentChats
  );

  if (businessAgents.length === 0) return null;

  // Round-robin: return agent with lowest current chat count
  return businessAgents.reduce((prev, current) =>
    prev.currentChatCount <= current.currentChatCount ? prev : current
  );
}

export function getLeastBusyAgent(businessId: string): TestAgent | null {
  const businessAgents = Object.values(TEST_AGENTS).filter(
    agent => agent.businessId === businessId &&
      agent.status === 'available' &&
      agent.currentChatCount < agent.maxConcurrentChats
  );

  if (businessAgents.length === 0) return null;

  // Return agent with lowest workload percentage
  return businessAgents.reduce((prev, current) => {
    const prevLoad = prev.currentChatCount / prev.maxConcurrentChats;
    const currentLoad = current.currentChatCount / current.maxConcurrentChats;
    return prevLoad <= currentLoad ? prev : current;
  });
}

// Extended test scenarios for business chat
export const TEST_BUSINESS_SCENARIOS = {
  // High-load scenario: All agents busy
  HIGH_LOAD_SCENARIO: {
    businessId: 'business-uuid-1',
    name: 'High Load Test',
    agents: [
      {
        ...TEST_AGENTS.AGENT_1,
        currentChatCount: 5, // At maximum capacity
        status: 'busy' as const
      },
      {
        ...TEST_AGENTS.AGENT_2,
        currentChatCount: 3, // At maximum capacity
        status: 'busy' as const
      },
      {
        ...TEST_AGENTS.AGENT_3,
        status: 'offline' as const
      }
    ],
    expectedBehavior: 'queue_customer'
  },

  // Optimal scenario: Agents available with different workloads
  OPTIMAL_LOAD_SCENARIO: {
    businessId: 'business-uuid-1',
    name: 'Optimal Load Test',
    agents: [
      {
        ...TEST_AGENTS.AGENT_1,
        currentChatCount: 2, // 40% capacity
        status: 'available' as const
      },
      {
        ...TEST_AGENTS.AGENT_2,
        currentChatCount: 1, // 33% capacity - should be selected
        status: 'available' as const
      },
      {
        ...TEST_AGENTS.AGENT_3,
        currentChatCount: 3, // 75% capacity
        status: 'available' as const
      }
    ],
    expectedAssignment: 'agent-uuid-2' // Least busy
  },

  // Edge case: Single agent scenario
  SINGLE_AGENT_SCENARIO: {
    businessId: 'business-uuid-2',
    name: 'Single Agent Test',
    agents: [
      {
        ...TEST_AGENTS.AGENT_4,
        currentChatCount: 3, // 37.5% capacity
        status: 'available' as const
      }
    ],
    expectedAssignment: 'agent-uuid-4'
  }
} as const;

// Business workflow simulation data
export const TEST_BUSINESS_WORKFLOWS = {
  STANDARD_INQUIRY: {
    workflowId: 'workflow-standard-inquiry',
    name: 'Standard Customer Inquiry',
    steps: [
      { step: 1, action: 'customer_initiates', expectedDuration: 0 },
      { step: 2, action: 'agent_assignment', expectedDuration: 30 }, // 30 seconds
      { step: 3, action: 'agent_first_response', expectedDuration: 120 }, // 2 minutes
      { step: 4, action: 'conversation_active', expectedDuration: 600 }, // 10 minutes
      { step: 5, action: 'issue_resolution', expectedDuration: 900 }, // 15 minutes
      { step: 6, action: 'conversation_closed', expectedDuration: 960 } // 16 minutes
    ],
    metrics: {
      averageResolutionTime: 960, // 16 minutes
      customerSatisfactionTarget: 4.5,
      firstResponseTimeTarget: 120 // 2 minutes
    }
  },

  ESCALATED_ISSUE: {
    workflowId: 'workflow-escalated-issue',
    name: 'Escalated Technical Issue',
    steps: [
      { step: 1, action: 'customer_initiates', expectedDuration: 0 },
      { step: 2, action: 'agent_assignment', expectedDuration: 30 },
      { step: 3, action: 'agent_first_response', expectedDuration: 120 },
      { step: 4, action: 'initial_troubleshooting', expectedDuration: 600 },
      { step: 5, action: 'escalation_decision', expectedDuration: 900 },
      { step: 6, action: 'supervisor_assignment', expectedDuration: 960 },
      { step: 7, action: 'supervisor_response', expectedDuration: 1080 },
      { step: 8, action: 'advanced_troubleshooting', expectedDuration: 1800 },
      { step: 9, action: 'issue_resolution', expectedDuration: 2400 },
      { step: 10, action: 'conversation_closed', expectedDuration: 2460 }
    ],
    metrics: {
      averageResolutionTime: 2460, // 41 minutes
      escalationRate: 0.15, // 15% of cases
      customerSatisfactionTarget: 4.2
    }
  }
} as const;

// Agent performance simulation data
export const TEST_AGENT_PERFORMANCE = {
  AGENT_1_STATS: {
    agentId: 'agent-uuid-1',
    period: '2024-01-01',
    metrics: {
      conversationsHandled: 45,
      averageResponseTime: 95, // seconds
      averageResolutionTime: 720, // 12 minutes
      customerSatisfactionScore: 4.6,
      escalationRate: 0.08, // 8%
      activeHours: 8,
      utilizationRate: 0.85 // 85%
    }
  },

  AGENT_2_STATS: {
    agentId: 'agent-uuid-2',
    period: '2024-01-01',
    metrics: {
      conversationsHandled: 38,
      averageResponseTime: 78, // seconds
      averageResolutionTime: 540, // 9 minutes
      customerSatisfactionScore: 4.8,
      escalationRate: 0.05, // 5%
      activeHours: 8,
      utilizationRate: 0.92 // 92%
    }
  }
} as const;

// Business hours and availability utilities
export function isBusinessOpen(businessId: string, timestamp: Date = new Date()): boolean {
  const business = Object.values(TEST_BUSINESSES).find(b => b.uuid === businessId);
  if (!business || !(business as any).businessHours) return true; // 24/7 if no hours specified

  const hour = timestamp.getUTCHours();
  const businessHours = (business as any).businessHours;
  const startHour = parseInt(businessHours.start.split(':')[0]);
  const endHour = parseInt(businessHours.end.split(':')[0]);

  return hour >= startHour && hour < endHour;
}

export function getAvailableAgentsCount(businessId: string): number {
  return Object.values(TEST_AGENTS).filter(
    agent => agent.businessId === businessId &&
      agent.status === 'available' &&
      agent.currentChatCount < agent.maxConcurrentChats
  ).length;
}

export function getBusinessCapacity(businessId: string): { current: number; maximum: number; utilizationRate: number } {
  const businessAgents = Object.values(TEST_AGENTS).filter(agent => agent.businessId === businessId);

  const current = businessAgents.reduce((sum, agent) => sum + agent.currentChatCount, 0);
  const maximum = businessAgents.reduce((sum, agent) => sum + agent.maxConcurrentChats, 0);
  const utilizationRate = maximum > 0 ? current / maximum : 0;

  return { current, maximum, utilizationRate };
}

export function simulateAgentStatusChange(agentId: string, newStatus: 'available' | 'busy' | 'offline', reason?: string): any {
  return {
    agentId,
    previousStatus: 'available', // Default
    newStatus,
    timestamp: new Date(),
    reason: reason || 'manual_change',
    metadata: {
      source: 'agent_dashboard',
      sessionId: `session-${agentId}-${Date.now()}`
    }
  };
}