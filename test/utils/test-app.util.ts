
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

export async function createTestApp(port: number = 3001): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  
  // Configure WebSocket adapter for testing
  const { IoAdapter } = require('@nestjs/platform-socket.io');
  app.useWebSocketAdapter(new IoAdapter(app));
  
  await app.init();
  await app.listen(port);
  
  return app;
}

export async function restartTestApp(app: INestApplication, port: number = 3001): Promise<INestApplication> {
  await app.close();
  return createTestApp(port);
}