// src/inventory/entities/price.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { PaxAvailability } from './pax-availability.entity';

@Entity('prices')
export class Price {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  finalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  originalPrice: number;

  @Column()
  currencyCode: string;

  @OneToOne(() => PaxAvailability, (paxAvailability) => paxAvailability.price)
  paxAvailability: PaxAvailability;
}
