import { TEST_USERS } from './users.mock';

export interface TestPresenceStatus {
  userUuid: string;
  status: 'online' | 'away' | 'offline';
  lastSeenAt: Date;
  deviceCount: number;
  devices: string[];
  lastActivity: Date;
}

export interface TestDeviceInfo {
  deviceId: string;
  userUuid: string;
  deviceType: 'web' | 'mobile' | 'desktop';
  connectedAt: Date;
  lastActivity: Date;
  socketId?: string;
}

export const TEST_PRESENCE_DATA = {
  ALICE_ONLINE: {
    userUuid: TEST_USERS.ALICE.uuid,
    status: 'online' as const,
    lastSeenAt: new Date(),
    deviceCount: 2,
    devices: ['device-alice-web', 'device-alice-mobile'],
    lastActivity: new Date()
  },

  BOB_AWAY: {
    userUuid: TEST_USERS.BOB.uuid,
    status: 'away' as const,
    lastSeenAt: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
    deviceCount: 1,
    devices: ['device-bob-web'],
    lastActivity: new Date(Date.now() - 3 * 60 * 1000)
  },

  CHARLIE_OFFLINE: {
    userUuid: TEST_USERS.CHARLIE.uuid,
    status: 'offline' as const,
    lastSeenAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    deviceCount: 0,
    devices: [],
    lastActivity: new Date(Date.now() - 10 * 60 * 1000)
  },

  DIANA_ONLINE_MULTI_DEVICE: {
    userUuid: TEST_USERS.DIANA.uuid,
    status: 'online' as const,
    lastSeenAt: new Date(),
    deviceCount: 3,
    devices: ['device-diana-web', 'device-diana-mobile', 'device-diana-desktop'],
    lastActivity: new Date()
  }
} as const;

export const TEST_DEVICE_DATA = {
  ALICE_WEB: {
    deviceId: 'device-alice-web',
    userUuid: TEST_USERS.ALICE.uuid,
    deviceType: 'web' as const,
    connectedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    lastActivity: new Date(),
    socketId: 'socket-alice-web-123'
  },

  ALICE_MOBILE: {
    deviceId: 'device-alice-mobile',
    userUuid: TEST_USERS.ALICE.uuid,
    deviceType: 'mobile' as const,
    connectedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    lastActivity: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
    socketId: 'socket-alice-mobile-456'
  },

  BOB_WEB: {
    deviceId: 'device-bob-web',
    userUuid: TEST_USERS.BOB.uuid,
    deviceType: 'web' as const,
    connectedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    lastActivity: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago (away threshold)
    socketId: 'socket-bob-web-789'
  },

  DIANA_WEB: {
    deviceId: 'device-diana-web',
    userUuid: TEST_USERS.DIANA.uuid,
    deviceType: 'web' as const,
    connectedAt: new Date(Date.now() - 45 * 60 * 1000),
    lastActivity: new Date(),
    socketId: 'socket-diana-web-101'
  },

  DIANA_MOBILE: {
    deviceId: 'device-diana-mobile',
    userUuid: TEST_USERS.DIANA.uuid,
    deviceType: 'mobile' as const,
    connectedAt: new Date(Date.now() - 20 * 60 * 1000),
    lastActivity: new Date(Date.now() - 30 * 1000), // 30 seconds ago
    socketId: 'socket-diana-mobile-102'
  },

  DIANA_DESKTOP: {
    deviceId: 'device-diana-desktop',
    userUuid: TEST_USERS.DIANA.uuid,
    deviceType: 'desktop' as const,
    connectedAt: new Date(Date.now() - 10 * 60 * 1000),
    lastActivity: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    socketId: 'socket-diana-desktop-103'
  }
} as const;

// Presence activity thresholds (in milliseconds)
export const PRESENCE_THRESHOLDS = {
  AWAY_THRESHOLD: 5 * 60 * 1000, // 5 minutes
  OFFLINE_THRESHOLD: 10 * 60 * 1000, // 10 minutes
  HEARTBEAT_INTERVAL: 30 * 1000, // 30 seconds
  CLEANUP_INTERVAL: 60 * 1000 // 1 minute
} as const;

// Utility functions for presence testing
export function createMockPresenceStatus(overrides: Partial<TestPresenceStatus> = {}): TestPresenceStatus {
  return {
    userUuid: TEST_USERS.ALICE.uuid,
    status: 'online',
    lastSeenAt: new Date(),
    deviceCount: 1,
    devices: ['device-test-123'],
    lastActivity: new Date(),
    ...overrides
  };
}

export function createMockDeviceInfo(overrides: Partial<TestDeviceInfo> = {}): TestDeviceInfo {
  return {
    deviceId: `device-${Date.now()}`,
    userUuid: TEST_USERS.ALICE.uuid,
    deviceType: 'web',
    connectedAt: new Date(),
    lastActivity: new Date(),
    ...overrides
  };
}

export function calculatePresenceStatus(lastActivity: Date): 'online' | 'away' | 'offline' {
  const now = Date.now();
  const timeSinceActivity = now - lastActivity.getTime();

  if (timeSinceActivity > PRESENCE_THRESHOLDS.OFFLINE_THRESHOLD) {
    return 'offline';
  } else if (timeSinceActivity > PRESENCE_THRESHOLDS.AWAY_THRESHOLD) {
    return 'away';
  } else {
    return 'online';
  }
}

export function shouldUserBeOffline(lastActivity: Date): boolean {
  const timeSinceActivity = Date.now() - lastActivity.getTime();
  return timeSinceActivity > PRESENCE_THRESHOLDS.OFFLINE_THRESHOLD;
}

export function shouldUserBeAway(lastActivity: Date): boolean {
  const timeSinceActivity = Date.now() - lastActivity.getTime();
  return timeSinceActivity > PRESENCE_THRESHOLDS.AWAY_THRESHOLD && 
         timeSinceActivity <= PRESENCE_THRESHOLDS.OFFLINE_THRESHOLD;
}

// Profile cache data for testing profile integration
export const TEST_PROFILE_CACHE_DATA = {
  CACHED_PROFILES: new Map([
    [TEST_USERS.ALICE.uuid, {
      uuid: TEST_USERS.ALICE.uuid,
      name: TEST_USERS.ALICE.name,
      avatar: 'https://example.com/avatars/alice.jpg',
      cachedAt: new Date(),
      ttl: 6 * 60 * 60 // 6 hours in seconds
    }],
    [TEST_USERS.BOB.uuid, {
      uuid: TEST_USERS.BOB.uuid,
      name: TEST_USERS.BOB.name,
      avatar: 'https://example.com/avatars/bob.jpg',
      cachedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      ttl: 6 * 60 * 60
    }]
  ]),

  EXPIRED_PROFILES: new Map([
    [TEST_USERS.CHARLIE.uuid, {
      uuid: TEST_USERS.CHARLIE.uuid,
      name: 'Old Charlie Name',
      avatar: 'https://example.com/avatars/charlie-old.jpg',
      cachedAt: new Date(Date.now() - 7 * 60 * 60 * 1000), // 7 hours ago (expired)
      ttl: 6 * 60 * 60
    }]
  ])
} as const;