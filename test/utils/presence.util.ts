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