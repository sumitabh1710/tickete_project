import { Injectable, Logger } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import { Observable, map } from 'rxjs';
import { Cron, CronExpression, Timeout, Interval } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Slot } from 'src/inventory/entity/slot.entity';
import { PaxAvailability } from 'src/inventory/entity/pax-availability.entity';
import { Price } from 'src/inventory/entity/price.entity';
import axios from 'axios';

@Injectable()
export class ThirdPartyService {
  private readonly logger: Logger = new Logger(ThirdPartyService.name);
  private readonly apiKey = '72f4915e6f47e50f4e7a852cc1697ed3';
  private readonly rateLimit = 1;
  private requestCount = 0;
  private isSyncPaused: boolean = false;

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Slot)
    private readonly slotRepository: Repository<Slot>,
    @InjectRepository(PaxAvailability)
    private readonly paxAvailabilityRepository: Repository<PaxAvailability>,
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
  ) {}

  async pauseSync(): Promise<void> {
    this.isSyncPaused = true;
    this.logger.log('Inventory sync paused');
  }

  async resumeSync(): Promise<void> {
    this.isSyncPaused = false;
    this.logger.log('Inventory sync resumed');
  }

  @Timeout(0) // Run immediately when the application starts
  async initializeScheduledTasks() {
    if (this.isSyncPaused) {
      this.logger.log('Inventory sync is paused.');
      return;
    }
    this.logger.log('Initializing scheduled tasks.');
    await this.fetchAvailabilityForNext30Days();
    await this.fetchAvailabilityForNext7Days();
    await this.fetchAvailabilityForToday();
  }

  // Schedule to run every day at midnight
  @Cron('0 0 * * *') // Cron expression for midnight every day
  async fetchAvailabilityForNext30Days() {
    this.logger.debug('Fetching availability for the next 30 days');
    const currentDate = new Date();
    const endDate = new Date(currentDate);
    endDate.setDate(currentDate.getDate() + 30);
    await this.fetchAvailability(currentDate, endDate);
  }

  // Schedule to run every 4 hours
  @Interval(14400000) // Interval expression for every 4 hours
  async fetchAvailabilityForNext7Days() {
    this.logger.debug('Fetching availability for the next 7 days');
    const currentDate = new Date();
    const endDate = new Date(currentDate);
    endDate.setDate(currentDate.getDate() + 7);
    await this.fetchAvailability(currentDate, endDate);
  }

  // Schedule to run every 15 minutes
  @Interval(900000) // Interval expression for every 15 minutes
  async fetchAvailabilityForToday() {
    this.logger.debug('Fetching availability for today');
    const currentDate = new Date();
    const endDate = new Date(currentDate);
    endDate.setMinutes(currentDate.getMinutes() + 15);
    await this.fetchAvailability(currentDate, endDate);
  }

  private async fetchAvailability(
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    while (startDate <= endDate) {
      const formattedDate = startDate.toISOString().split('T')[0];

      try {
        await this.handleRateLimit();
        await Promise.all([
          this.getInventoryForPeoduct14(formattedDate),
          this.getInventoryForPeoduct15(formattedDate),
        ]);
      } catch (error) {
        console.error('Error fetching inventory:', error.message || error);
        throw error;
      }

      startDate.setDate(startDate.getDate() + 1); // Move to the next day
    }
  }

  private async handleRateLimit() {
    if (this.requestCount >= this.rateLimit) {
      const waitTime = Math.ceil(2000);
      this.logger.debug(
        `Rate limit reached. Waiting for ${waitTime} milliseconds before the next request.`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestCount = 0;
    }
    this.requestCount++;
  }

  async getInventoryForPeoduct14(
    date: string,
  ): Promise<Observable<AxiosResponse<any>>> {
    const url = `https://leap-api.tickete.co/api/v1/inventory/14?date=${date}`;
    const headers = { 'x-api-key': this.apiKey };
    try {
      const response: AxiosResponse<any> = await axios.get(url, { headers });
      response.data.forEach((each) => {
        this.storeSlot(each, 14);
      });
      return response.data;
    } catch (error) {
      console.error(
        'Error fetching inventory for Product 14:',
        error.message || error,
      );
      throw error;
    }
  }

  async getInventoryForPeoduct15(
    date: string,
  ): Promise<Observable<AxiosResponse<any>>> {
    const url = `https://leap-api.tickete.co/api/v1/inventory/15?date=${date}`;
    const headers = { 'x-api-key': this.apiKey };
    try {
      const response: AxiosResponse<any> = await axios.get(url, { headers });
      response.data.forEach((each) => {
        this.storeSlot(each, 15);
      });
      return response.data;
    } catch (error) {
      console.error(
        'Error fetching inventory for Product 14:',
        error.message || error,
      );
      throw error;
    }
  }

  private async storeSlot(slotData: any, productId: number): Promise<void> {
    const existingSlot = await this.slotRepository.findOne({
      where: {
        providerSlotId: slotData.providerSlotId,
        productId: productId,
      },
    });

    if (existingSlot) {
      console.log(
        `Slot with providerSlotId ${slotData.providerSlotId} already exists. Skipping.`,
      );
      return;
    }

    const slot = this.slotRepository.create({
      startDate: slotData.startDate,
      startTime: slotData.startTime,
      endTime: slotData.endTime,
      providerSlotId: slotData.providerSlotId,
      remaining: slotData.remaining,
      currencyCode: slotData.currencyCode,
      variantId: slotData.variantId,
      productId: productId,
    });

    const savedSlot = await this.slotRepository.save(slot);

    for (const paxData of slotData.paxAvailability) {
      const price = this.priceRepository.create({
        discount: paxData.price.discount,
        finalPrice: paxData.price.finalPrice,
        originalPrice: paxData.price.originalPrice,
        currencyCode: paxData.price.currencyCode,
      });

      await this.priceRepository.save(price);

      const paxAvailability = this.paxAvailabilityRepository.create({
        max: paxData.max,
        min: paxData.min,
        remaining: paxData.remaining,
        type: paxData.type,
        isPrimary: paxData.isPrimary,
        description: paxData.description,
        name: paxData.name,
        slot: savedSlot,
        price: price,
      });

      await this.paxAvailabilityRepository.save(paxAvailability);
    }
  }
}
