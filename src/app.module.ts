import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { HealthController } from './health.controller';
import { ProfileService } from './profile.service';
import { Message } from './message.entity';
import { MessageRead } from './message-read.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: process.env.NODE_ENV === 'test' ? 'sqlite' : 'postgres',
      database: process.env.NODE_ENV === 'test' ? './test-db.sqlite' : process.env.DB_NAME || 'chat_mvp_test',
      host: process.env.NODE_ENV === 'test' ? undefined : (process.env.DB_HOST || 'localhost'),
      port: process.env.NODE_ENV === 'test' ? undefined : (parseInt(process.env.DB_PORT) || 5432),
      username: process.env.NODE_ENV === 'test' ? undefined : (process.env.DB_USERNAME || 'postgres'),
      password: process.env.NODE_ENV === 'test' ? undefined : (process.env.DB_PASSWORD || 'postgres'),
      entities: [Message, MessageRead],
      synchronize: true, // Only for development/testing
      logging: false,
    }),
    TypeOrmModule.forFeature([Message, MessageRead]),
  ],
  controllers: [AppController, ChatController, HealthController],
  providers: [AppService, ChatService, ChatGateway, ProfileService],
})
export class AppModule {}