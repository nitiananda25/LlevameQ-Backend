import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, DriverStatus } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async updateProfile(userId: number, updates: Partial<User>): Promise<User> {
    await this.userRepository.update(userId, updates);
    return this.findById(userId);
  }

  async updateDriverStatus(driverId: number, status: DriverStatus): Promise<User> {
    const driver = await this.findById(driverId);

    if (driver.role !== 'driver') {
      throw new Error('Usuario no es conductor');
    }

    driver.driverStatus = status;
    await this.userRepository.save(driver);

    return driver;
  }

  async updateLocation(
    userId: number,
    lat: number,
    lng: number,
  ): Promise<User> {
    await this.userRepository.update(userId, {
      currentLat: lat,
      currentLng: lng,
      lastLocationUpdate: new Date(),
    });

    return this.findById(userId);
  }

  async getDriverStats(driverId: number): Promise<any> {
    const driver = await this.findById(driverId);

    if (driver.role !== 'driver') {
      throw new Error('Usuario no es conductor');
    }

    return {
      totalRides: driver.totalRidesAsDriver,
      rating: driver.driverRating,
      status: driver.driverStatus,
    };
  }
}
