// src/inventory/entities/pax-availability.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Slot } from './slot.entity';
import { Price } from './price.entity';

@Entity('pax_availabilities')
export class PaxAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  max: number;

  @Column()
  min: number;

  @Column()
  remaining: number;

  @Column()
  type: string;

  @Column({ default: false })
  isPrimary: boolean;

  @Column()
  description: string;

  @Column()
  name: string;

  @OneToOne(() => Price, (price) => price.paxAvailability)
  @JoinColumn()
  price: Price;

  @ManyToOne(() => Slot, (slot) => slot.paxAvailability)
  slot: Slot;
}
