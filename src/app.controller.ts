import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { ThirdPartyService } from './third-party/third-party.service';
import { Slot } from './inventory/entity/slot.entity';
import { Observable } from 'rxjs';

@Controller('api/v1/experience')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly thirdPartyService: ThirdPartyService,
  ) {}

  @Post('pause')
  async pauseSync(): Promise<string> {
    this.thirdPartyService.pauseSync();
    return 'Inventory sync paused';
  }

  @Post('resume')
  async resumeSync(): Promise<string> {
    this.thirdPartyService.resumeSync();
    return 'Inventory sync resumed';
  }

  @Get(':id/slots')
  async getSlotsForDateAndProduct(
    @Param('id') productId: number,
    @Query('date') startDate: string,
  ): Promise<Slot[]> {
    return this.appService.getSlotsForDateAndProduct(productId, startDate);
  }

  @Get(':id/dates')
  async getAvailableDatesForProduct(@Param('id') productId: number): Promise<string[]> {
    return this.appService.getAvailableDatesForProduct(productId);
  }
}
