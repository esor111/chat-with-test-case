import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';

@Controller('health')
export class HealthController {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  @Get('database')
  async checkDatabase() {
    try {
      const startTime = Date.now();
      await this.messageRepository.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      return {
        status: 'ok',
        connection: 'healthy',
        lastQuery: {
          success: true,
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'error',
        connection: 'unhealthy',
        lastQuery: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  @Get('websocket')
  checkWebSocket() {
    return {
      status: 'ok',
      server: 'running',
      connections: {
        active: 0,
        total: 0
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }
}