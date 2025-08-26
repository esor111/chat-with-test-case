// Presence tracking testing utilities

export function expectValidPresenceStatus(presence: any): void {
  expect(presence).toBeDefined();
  expect(presence).toHaveProperty('userUuid');
  expect(presence).toHaveProperty('status');
  expect(presence).toHaveProperty('lastSeenAt');
  expect(presence).toHaveProperty('deviceCount');
  
  expect(typeof presence.userUuid).toBe('string');
  expect(['online', 'away', 'offline']).toContain(presence.status);
  expect(presence.lastSeenAt).toBeInstanceOf(Date);
  expect(typeof presence.deviceCount).toBe('number');
  expect(presence.deviceCount).toBeGreaterThanOrEqual(0);
  
  if (presence.devices) {
    expect(Array.isArray(presence.devices)).toBe(true);
    expect(presence.devices.length).toBe(presence.deviceCount);
  }
}

export function expectUserOnline(presence: any): void {
  expectValidPresenceStatus(presence);
  expect(presence.status).toBe('online');
  expect(presence.deviceCount).toBeGreaterThan(0);
  
  // Last seen should be recent (within last minute)
  const timeSinceLastSeen = Date.now() - presence.lastSeenAt.getTime();
  expect(timeSinceLastSeen).toBeLessThan(60 * 1000); // 1 minute
}

export function expectUserAway(presence: any): void {
  expectValidPresenceStatus(presence);
  expect(presence.status).toBe('away');
  
  // Last seen should be between 5-10 minutes ago
  const timeSinceLastSeen = Date.now() - presence.lastSeenAt.getTime();
  expect(timeSinceLastSeen).toBeGreaterThan(5 * 60 * 1000); // 5 minutes
  expect(timeSinceLastSeen).toBeLessThan(10 * 60 * 1000); // 10 minutes
}

export function expectUserOffline(presence: any): void {
  expectValidPresenceStatus(presence);
  expect(presence.status).toBe('offline');
  expect(presence.deviceCount).toBe(0);
  
  // Last seen should be more than 10 minutes ago
  const timeSinceLastSeen = Date.now() - presence.lastSeenAt.getTime();
  expect(timeSinceLastSeen).toBeGreaterThan(10 * 60 * 1000); // 10 minutes
}

export function expectValidDeviceInfo(device: any): void {
  expect(device).toBeDefined();
  expect(device).toHaveProperty('deviceId');
  expect(device).toHaveProperty('userUuid');
  expect(device).toHaveProperty('deviceType');
  expect(device).toHaveProperty('connectedAt');
  expect(device).toHaveProperty('lastActivity');
  
  expect(typeof device.deviceId).toBe('string');
  expect(typeof device.userUuid).toBe('string');
  expect(['web', 'mobile', 'desktop']).toContain(device.deviceType);
  expect(device.connectedAt).toBeInstanceOf(Date);
  expect(device.lastActivity).toBeInstanceOf(Date);
  
  if (device.socketId) {
    expect(typeof device.socketId).toBe('string');
  }
}

export function expectMultiDevicePresence(presence: any, expectedDeviceCount: number): void {
  expectValidPresenceStatus(presence);
  expect(presence.deviceCount).toBe(expectedDeviceCount);
  
  if (expectedDeviceCount > 0) {
    expect(presence.status).not.toBe('offline');
    expect(presence.devices).toBeDefined();
    expect(presence.devices.length).toBe(expectedDeviceCount);
  } else {
    expect(presence.status).toBe('offline');
  }
}

export function expectPresenceBroadcast(broadcast: any): void {
  expect(broadcast).toBeDefined();
  expect(broadcast).toHaveProperty('userUuid');
  expect(broadcast).toHaveProperty('status');
  expect(broadcast).toHaveProperty('timestamp');
  expect(broadcast).toHaveProperty('recipients');
  
  expect(typeof broadcast.userUuid).toBe('string');
  expect(['online', 'away', 'offline']).toContain(broadcast.status);
  expect(broadcast.timestamp).toBeInstanceOf(Date);
  expect(Array.isArray(broadcast.recipients)).toBe(true);
}

export function expectPresencePersistence(beforeRestart: any, afterRestart: any): void {
  expectValidPresenceStatus(beforeRestart);
  expectValidPresenceStatus(afterRestart);
  
  expect(afterRestart.userUuid).toBe(beforeRestart.userUuid);
  
  // Status might change due to time elapsed, but should be logical
  if (beforeRestart.status === 'online') {
    expect(['online', 'away', 'offline']).toContain(afterRestart.status);
  }
  
  // Device count should be preserved or reduced (devices might disconnect)
  expect(afterRestart.deviceCount).toBeLessThanOrEqual(beforeRestart.deviceCount);
}

export function expectActivityTracking(activity: any): void {
  expect(activity).toBeDefined();
  expect(activity).toHaveProperty('userUuid');
  expect(activity).toHaveProperty('activityType');
  expect(activity).toHaveProperty('timestamp');
  expect(activity).toHaveProperty('deviceId');
  
  expect(typeof activity.userUuid).toBe('string');
  expect(['message', 'websocket', 'api_call', 'heartbeat']).toContain(activity.activityType);
  expect(activity.timestamp).toBeInstanceOf(Date);
  expect(typeof activity.deviceId).toBe('string');
}

export function expectInactivityDetection(inactiveUsers: string[], expectedInactiveUser: string): void {
  expect(Array.isArray(inactiveUsers)).toBe(true);
  expect(inactiveUsers).toContain(expectedInactiveUser);
  
  inactiveUsers.forEach(userUuid => {
    expect(typeof userUuid).toBe('string');
  });
}

export function expectGracefulOfflineTransition(transition: any): void {
  expect(transition).toBeDefined();
  expect(transition).toHaveProperty('userUuid');
  expect(transition).toHaveProperty('fromStatus');
  expect(transition).toHaveProperty('toStatus');
  expect(transition).toHaveProperty('reason');
  expect(transition).toHaveProperty('timestamp');
  
  expect(typeof transition.userUuid).toBe('string');
  expect(['online', 'away']).toContain(transition.fromStatus);
  expect(transition.toStatus).toBe('offline');
  expect(['websocket_disconnect', 'inactivity', 'manual']).toContain(transition.reason);
  expect(transition.timestamp).toBeInstanceOf(Date);
}

// Presence simulation utilities
export function simulateUserOnline(userUuid: string, deviceId?: string): any {
  return {
    userUuid,
    status: 'online',
    lastSeenAt: new Date(),
    deviceCount: 1,
    devices: [deviceId || `device-${userUuid}-${Date.now()}`],
    lastActivity: new Date()
  };
}

export function simulateUserAway(userUuid: string, minutesAgo: number = 6): any {
  const awayTime = new Date(Date.now() - minutesAgo * 60 * 1000);
  return {
    userUuid,
    status: 'away',
    lastSeenAt: awayTime,
    deviceCount: 1,
    devices: [`device-${userUuid}-away`],
    lastActivity: awayTime
  };
}

export function simulateUserOffline(userUuid: string, minutesAgo: number = 15): any {
  const offlineTime = new Date(Date.now() - minutesAgo * 60 * 1000);
  return {
    userUuid,
    status: 'offline',
    lastSeenAt: offlineTime,
    deviceCount: 0,
    devices: [],
    lastActivity: offlineTime
  };
}

export function simulateMultiDeviceUser(userUuid: string, deviceCount: number = 2): any {
  const devices = Array.from({ length: deviceCount }, (_, i) => 
    `device-${userUuid}-${i + 1}-${Date.now()}`
  );
  
  return {
    userUuid,
    status: 'online',
    lastSeenAt: new Date(),
    deviceCount,
    devices,
    lastActivity: new Date()
  };
}

export function simulateDeviceConnection(userUuid: string, deviceType: 'web' | 'mobile' | 'desktop' = 'web'): any {
  return {
    deviceId: `device-${userUuid}-${deviceType}-${Date.now()}`,
    userUuid,
    deviceType,
    connectedAt: new Date(),
    lastActivity: new Date(),
    socketId: `socket-${userUuid}-${deviceType}-${Math.random().toString(36).substr(2, 9)}`
  };
}

export function simulateDeviceDisconnection(device: any, reason: 'manual' | 'timeout' | 'error' = 'manual'): any {
  return {
    ...device,
    disconnectedAt: new Date(),
    disconnectReason: reason,
    socketId: null
  };
}

export function simulatePresenceUpdate(userUuid: string, newStatus: 'online' | 'away' | 'offline', reason?: string): any {
  return {
    userUuid,
    previousStatus: 'online', // Default previous status
    newStatus,
    timestamp: new Date(),
    reason: reason || 'activity_change',
    deviceCount: newStatus === 'offline' ? 0 : 1
  };
}

export function simulateActivityHeartbeat(userUuid: string, deviceId: string, activityType: 'message' | 'websocket' | 'api_call' | 'heartbeat' = 'heartbeat'): any {
  return {
    userUuid,
    deviceId,
    activityType,
    timestamp: new Date(),
    metadata: {
      source: 'test_simulation',
      sessionId: `session-${userUuid}-${Date.now()}`
    }
  };
}

export function simulatePresenceBroadcast(userUuid: string, status: 'online' | 'away' | 'offline', recipients: string[]): any {
  return {
    userUuid,
    status,
    timestamp: new Date(),
    recipients,
    broadcastId: `broadcast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    metadata: {
      source: 'presence_service',
      reason: 'status_change'
    }
  };
}

export function simulateInactivityDetection(userUuid: string, lastActivity: Date, thresholdMinutes: number = 5): any {
  const timeSinceActivity = Date.now() - lastActivity.getTime();
  const thresholdMs = thresholdMinutes * 60 * 1000;
  
  return {
    userUuid,
    lastActivity,
    timeSinceActivity,
    thresholdMs,
    isInactive: timeSinceActivity > thresholdMs,
    detectedAt: new Date(),
    recommendedStatus: timeSinceActivity > 10 * 60 * 1000 ? 'offline' : 'away'
  };
}

// Presence testing scenarios
export function createPresenceTestScenario(name: string, users: Array<{ uuid: string; status: 'online' | 'away' | 'offline'; deviceCount?: number }>): any {
  return {
    scenarioName: name,
    createdAt: new Date(),
    users: users.map(user => ({
      userUuid: user.uuid,
      status: user.status,
      deviceCount: user.deviceCount || (user.status === 'offline' ? 0 : 1),
      devices: user.status === 'offline' ? [] : 
        Array.from({ length: user.deviceCount || 1 }, (_, i) => `device-${user.uuid}-${i + 1}`),
      lastActivity: user.status === 'offline' ? 
        new Date(Date.now() - 15 * 60 * 1000) : 
        user.status === 'away' ? 
          new Date(Date.now() - 6 * 60 * 1000) : 
          new Date()
    }))
  };
}