import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('message_reads')
export class MessageRead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  messageId: string;

  @Column()
  readerUuid: string;

  @CreateDateColumn()
  readAt: Date;
}