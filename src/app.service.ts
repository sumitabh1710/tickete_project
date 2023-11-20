import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Slot } from './inventory/entity/slot.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Slot)
    private readonly slotRepository: Repository<Slot>,
  ) {}

  async getSlotsForDateAndProduct(
    productId: number,
    startDate: string,
  ): Promise<Slot[]> {
    try {
      const slots = await this.slotRepository.find({
        where: {
          productId: productId,
          startDate: startDate,
        },
        relations: ['paxAvailability', 'paxAvailability.price'],
      });

      return slots;
    } catch (error) {
      console.error('Error fetching slots:', error.message || error);

      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAvailableDatesForProduct(productId: number): Promise<string[]> {
    try {
      const result = await this.slotRepository
        .createQueryBuilder('slot')
        .select('DISTINCT slot.startDate', 'startDate')
        .where('slot.productId = :productId', { productId })
        .getRawMany();

      return result.map((item) => item.startDate);
    } catch (error) {
      console.error('Error fetching available dates:', error.message || error);

      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
