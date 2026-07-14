import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, DriverStatus, UserRole, DriverAccountStatus } from '../users/entities/user.entity';
import { Ride, RideStatus } from './entities/ride.entity';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  private readonly MATCHING_RADIUS_KM = parseFloat(process.env.MATCHING_RADIUS_KM || '5');

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
  ) {}

  /**
   * Busca conductores disponibles cerca del origen del viaje
   * Solo retorna conductores con estado_cuenta = ACTIVE (saldo >= 0)
   */
  async findAvailableDrivers(ride: Ride): Promise<User[]> {
    this.logger.log(`Buscando conductores cerca de (${ride.originLat}, ${ride.originLng})`);

    // Obtener todos los conductores online Y con cuenta activa (saldo >= 0)
    const onlineDrivers = await this.userRepository.find({
      where: {
        role: UserRole.DRIVER,
        driverStatus: DriverStatus.ONLINE,
        isActive: true,
        estado_cuenta: DriverAccountStatus.ACTIVE, // ✅ Solo conductores con saldo positivo
      },
    });

    if (onlineDrivers.length === 0) {
      this.logger.warn('No hay conductores disponibles (ninguno tiene saldo suficiente)');
      return [];
    }

    // Filtrar por distancia
    const nearbyDrivers = onlineDrivers
      .map((driver) => ({
        driver,
        distance: this.calculateDistance(
          ride.originLat,
          ride.originLng,
          driver.currentLat,
          driver.currentLng,
        ),
      }))
      .filter((item) => item.distance <= this.MATCHING_RADIUS_KM)
      .sort((a, b) => a.distance - b.distance)
      .map((item) => item.driver);

    this.logger.log(`Encontrados ${nearbyDrivers.length} conductores cerca`);

    return nearbyDrivers;
  }

  /**
   * Asigna un conductor al viaje
   */
  async assignDriver(rideId: number, driverId: number): Promise<Ride> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ['passenger', 'driver'],
    });

    if (!ride) {
      throw new Error('Viaje no encontrado');
    }

    if (ride.status !== RideStatus.SEARCHING) {
      throw new Error('El viaje no está buscando conductor');
    }

    const driver = await this.userRepository.findOne({
      where: { id: driverId },
    });

    if (!driver) {
      throw new Error('Conductor no encontrado');
    }

    if (driver.driverStatus !== DriverStatus.ONLINE) {
      throw new Error('Conductor no disponible');
    }

    // Asignar conductor
    ride.driver = driver;
    ride.driverId = driverId;
    ride.status = RideStatus.DRIVER_ASSIGNED;
    ride.driverAssignedAt = new Date();

    // Actualizar estado del conductor
    driver.driverStatus = DriverStatus.IN_RIDE;
    await this.userRepository.save(driver);

    await this.rideRepository.save(ride);

    this.logger.log(`Viaje ${rideId} asignado al conductor ${driverId}`);

    return ride;
  }

  /**
   * Calcula distancia entre dos puntos usando fórmula de Haversine
   * Retorna distancia en kilómetros
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    if (!lat1 || !lon1 || !lat2 || !lon2) {
      return Infinity;
    }

    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Cancela matching y libera conductor si aplica
   */
  async cancelMatching(rideId: number): Promise<void> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ['driver'],
    });

    if (!ride) {
      return;
    }

    // Si había conductor asignado, liberarlo
    if (ride.driver) {
      const driver = await this.userRepository.findOne({
        where: { id: ride.driverId },
      });

      if (driver && driver.driverStatus === DriverStatus.IN_RIDE) {
        driver.driverStatus = DriverStatus.ONLINE;
        await this.userRepository.save(driver);
      }
    }

    this.logger.log(`Matching cancelado para viaje ${rideId}`);
  }
}
