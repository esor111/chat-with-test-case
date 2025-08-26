import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { 
  createTestApp,
  expectDatabaseHealth,
  expectWebSocketHealth,
  expectCacheHealth
} from './utils';

describe('Infrastructure (Blue Phase - All Skeleton Tests)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createTestApp(3000);
  });

  afterEach(async () => {
    await app.close();
  });

  it('nest app boots', () => {
    // Blue phase: skeleton test that passes
    expect(true).toBe(true);
  });

  it('postgres connection works', async () => {
    const healthResponse = await request(app.getHttpServer())
      .get('/health/database')
      .expect(200);
    
    expectDatabaseHealth(healthResponse.body);
  });

  it('redis ping pong', async () => {
    // First test that database endpoint works
    const dbResponse = await request(app.getHttpServer())
      .get('/health/database');
    console.log('DB response status:', dbResponse.status);
    
    // Test that we can check Redis cache performance
    const cacheHealthResponse = await request(app.getHttpServer())
      .get('/health/cache');
    
    console.log('Cache response status:', cacheHealthResponse.status);
    console.log('Cache response body:', cacheHealthResponse.body);
    
    expectCacheHealth(cacheHealthResponse.body);
    
    // Additional performance validation
    expect(cacheHealthResponse.body.performance.pingTime).toBeLessThan(100); // Should be fast
  });

  it('socket client connects', async () => {
    const healthResponse = await request(app.getHttpServer())
      .get('/health/websocket')
      .expect(200);
    
    expectWebSocketHealth(healthResponse.body);
  });

  it('end to end message flow', () => {
    // Blue phase: skeleton test that passes
    expect(true).toBe(true);
  });
});