import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColombiaPaymentService } from './colombia-payment.service';
import { Payment } from './entities/payment.entity';
import { Recharge } from './entities/recharge.entity';
import { Ride } from '../rides/entities/ride.entity';
import { User } from '../users/entities/user.entity';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Recharge, Ride, User]),
  ],
  controllers: [PaymentsController],
  providers: [ColombiaPaymentService],
  exports: [ColombiaPaymentService],
})
export class PaymentsModule {}