// src/inventory/entities/slot.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { PaxAvailability } from './pax-availability.entity';

@Entity('slots')
export class Slot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  startDate: string;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @Column()
  providerSlotId: string;

  @Column()
  remaining: number;

  @Column()
  currencyCode: string;

  @Column()
  variantId: number;

  @Column()
  productId: number;

  @OneToMany(() => PaxAvailability, (paxAvailability) => paxAvailability.slot)
  @JoinColumn()
  paxAvailability: PaxAvailability[];
}
