import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { MatchingService } from './matching.service';
import { RidesGateway } from './rides.gateway';
import { Ride } from './entities/ride.entity';
import { User } from '../users/entities/user.entity';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ride, User]),
    PaymentsModule,
  ],
  controllers: [RidesController],
  providers: [RidesService, MatchingService, RidesGateway],
  exports: [RidesService, MatchingService, RidesGateway],
})
export class RidesModule {}
