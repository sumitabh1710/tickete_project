import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios/dist';
import { ThirdPartyService } from './third-party/third-party.service';
import { Slot } from './inventory/entity/slot.entity';
import { PaxAvailability } from './inventory/entity/pax-availability.entity';
import { Price } from './inventory/entity/price.entity';
import { ScheduleModule } from '@nestjs/schedule/dist';

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '1234',
      database: 'postgres',
      entities: [__dirname + './inventory/entity/.entity{.ts,.js}'],
      autoLoadEntities: true,
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Slot, PaxAvailability, Price]),
  ],
  controllers: [AppController],
  providers: [AppService, ThirdPartyService],
})
export class AppModule {}
