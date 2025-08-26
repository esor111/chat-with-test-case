// Profile integration testing utilities

export function expectValidProfileBatch(profileBatch: any): void {
  expect(profileBatch).toBeDefined();
  expect(profileBatch).toHaveProperty('profiles');
  expect(profileBatch).toHaveProperty('errors');
  expect(profileBatch).toHaveProperty('partial');
  
  expect(Array.isArray(profileBatch.profiles)).toBe(true);
  expect(Array.isArray(profileBatch.errors)).toBe(true);
  expect(typeof profileBatch.partial).toBe('boolean');
  
  profileBatch.profiles.forEach((profile: any) => {
    expectValidProfile(profile);
  });
}

export function expectValidProfile(profile: any): void {
  expect(profile).toBeDefined();
  expect(profile).toHaveProperty('uuid');
  expect(profile).toHaveProperty('name');
  
  expect(typeof profile.uuid).toBe('string');
  expect(typeof profile.name).toBe('string');
  expect(profile.name.length).toBeGreaterThan(0);
  
  if (profile.avatar) {
    expect(typeof profile.avatar).toBe('string');
  }
  
  if (profile.email) {
    expect(typeof profile.email).toBe('string');
    expect(profile.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  }
}

export function expectValidCacheOperation(cacheResult: any): void {
  expect(cacheResult).toBeDefined();
  expect(cacheResult).toHaveProperty('success');
  expect(typeof cacheResult.success).toBe('boolean');
  
  if (cacheResult.success) {
    expect(cacheResult).toHaveProperty('data');
  } else {
    expect(cacheResult).toHaveProperty('error');
    expect(typeof cacheResult.error).toBe('string');
  }
}

export function expectValidCachedProfile(cachedProfile: any): void {
  expect(cachedProfile).toBeDefined();
  expect(cachedProfile).toHaveProperty('uuid');
  expect(cachedProfile).toHaveProperty('name');
  expect(cachedProfile).toHaveProperty('cachedAt');
  expect(cachedProfile).toHaveProperty('ttl');
  
  expect(typeof cachedProfile.uuid).toBe('string');
  expect(typeof cachedProfile.name).toBe('string');
  expect(cachedProfile.cachedAt).toBeInstanceOf(Date);
  expect(typeof cachedProfile.ttl).toBe('number');
  expect(cachedProfile.ttl).toBeGreaterThan(0);
}

export function expectProfileCacheHit(cacheResult: any, expectedProfile: any): void {
  expectValidCacheOperation(cacheResult);
  expect(cacheResult.success).toBe(true);
  expect(cacheResult.data.uuid).toBe(expectedProfile.uuid);
  expect(cacheResult.data.name).toBe(expectedProfile.name);
}

export function expectProfileCacheMiss(cacheResult: any): void {
  expectValidCacheOperation(cacheResult);
  expect(cacheResult.success).toBe(false);
  expect(cacheResult.error).toMatch(/not found|expired|miss/i);
}

export function expectBatchProfileApiCall(apiCall: any, requestedUuids: string[]): void {
  expect(apiCall).toBeDefined();
  expect(apiCall).toHaveProperty('method');
  expect(apiCall).toHaveProperty('endpoint');
  expect(apiCall).toHaveProperty('payload');
  
  expect(apiCall.method).toBe('POST');
  expect(apiCall.endpoint).toBe('/api/batch/profiles');
  expect(apiCall.payload).toHaveProperty('uuids');
  expect(Array.isArray(apiCall.payload.uuids)).toBe(true);
  expect(apiCall.payload.uuids).toEqual(expect.arrayContaining(requestedUuids));
}

export function expectProfileFallback(profile: any, originalUuid: string): void {
  expect(profile).toBeDefined();
  expect(profile.uuid).toBe(originalUuid);
  
  // Fallback profile should have either cached name or "Unknown User"
  expect(profile.name).toBeDefined();
  expect(typeof profile.name).toBe('string');
  expect(profile.name.length).toBeGreaterThan(0);
}

export function expectStaleProfileServed(profile: any, expectedStaleData: any): void {
  expectValidProfile(profile);
  expect(profile.uuid).toBe(expectedStaleData.uuid);
  expect(profile.name).toBe(expectedStaleData.name);
  
  // Should indicate it's stale data
  if (profile.metadata) {
    expect(profile.metadata.isStale).toBe(true);
  }
}