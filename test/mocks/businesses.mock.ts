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