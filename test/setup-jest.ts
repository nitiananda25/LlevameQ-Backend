// Jest setup file for E2E tests
// This helps with module resolution issues

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { RidesModule } from '../src/rides/rides.module';
import { User } from '../src/users/entities/user.entity';
import { Ride } from '../src/rides/entities/ride.entity';

// Mock the AppModule for testing
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [User, Ride],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    RidesModule,
  ],
})
export class TestAppModule {}
