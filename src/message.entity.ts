import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  chatId: string;

  @Column()
  senderUuid: string;

  @Column('text')
  content: string;

  @CreateDateColumn({ precision: 6 })
  timestamp: Date;
}