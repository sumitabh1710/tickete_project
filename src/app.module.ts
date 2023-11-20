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
import { join } from 'path';

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'dpg-cldhmv6g1b2c73f7i8eg-a.oregon-postgres.render.com',
      port: 5432,
      username: 'tickete_project_user',
      password: '1sJBR3lApxpq8HN4AXc8rTA7aONMfmtn',
      database: 'tickete_project',
      entities: [join(__dirname, './inventory/entity/*.entity{.ts,.js}')],
      autoLoadEntities: true,
      synchronize: true,
      ssl: true,
    }),
    TypeOrmModule.forFeature([Slot, PaxAvailability, Price]),
  ],
  controllers: [AppController],
  providers: [AppService, ThirdPartyService],
})
export class AppModule {}
