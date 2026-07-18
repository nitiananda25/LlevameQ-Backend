import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Ride, RideStatus, PaymentMethod } from './entities/ride.entity';
import { User, DriverStatus } from '../users/entities/user.entity';
import { MatchingService } from './matching.service';
import { ColombiaPaymentService } from '../payments/colombia-payment.service';
// Validation decorators
import { IsNumber, IsString, IsEnum } from 'class-validator';

export class CreateRideDto {
  @IsNumber()
  originLat: number;

  @IsNumber()
  originLng: number;

  @IsString()
  originAddress: string;

  @IsNumber()
  destinationLat: number;

  @IsNumber()
  destinationLng: number;

  @IsString()
  destinationAddress: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private matchingService: MatchingService,
    private paymentService: ColombiaPaymentService,
  ) {}

  /**
   * Crear nueva solicitud de viaje
   */
  async createRide(passengerId: number, createRideDto: CreateRideDto): Promise<Ride> {
    // Verificar que el pasajero existe
    const passenger = await this.userRepository.findOne({
      where: { id: passengerId },
    });

    if (!passenger) {
      throw new NotFoundException('Pasajero no encontrado');
    }

    // Verificar que no tiene otro viaje activo
    const activeRide = await this.rideRepository.findOne({
      where: {
        passengerId,
        status: In([RideStatus.SEARCHING, RideStatus.DRIVER_ASSIGNED, RideStatus.IN_PROGRESS]),
      },
    });

    if (activeRide) {
      throw new BadRequestException('Ya tienes un viaje activo');
    }

    // Calcular distancia y precio
    const distance = this.calculateDistance(
      createRideDto.originLat,
      createRideDto.originLng,
      createRideDto.destinationLat,
      createRideDto.destinationLng,
    );

    const estimatedDuration = this.estimateDuration(distance);
    const estimatedPrice = this.calculatePrice(distance, estimatedDuration);

    // Crear viaje
    const ride = this.rideRepository.create({
      passenger,
      passengerId,
      ...createRideDto,
      distanceKm: distance,
      estimatedDurationMinutes: estimatedDuration,
      estimatedPrice,
      status: RideStatus.SEARCHING,
    });

    await this.rideRepository.save(ride);

    this.logger.log(`Nuevo viaje creado: ${ride.id} - ${distance}km - $${estimatedPrice}`);

    return ride;
  }

  /**
   * Asignar conductor a viaje
   */
  async assignDriverToRide(rideId: number, driverId: number): Promise<Ride> {
    return this.matchingService.assignDriver(rideId, driverId);
  }

  /**
   * Buscar conductores disponibles para un viaje
   */
  async findDriversForRide(rideId: number): Promise<User[]> {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });

    if (!ride) {
      throw new NotFoundException('Viaje no encontrado');
    }

    return this.matchingService.findAvailableDrivers(ride);
  }

  /**
   * Iniciar viaje (cuando el conductor llega al origen)
   */
  async startRide(rideId: number, driverId: number): Promise<Ride> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ['passenger', 'driver'],
    });

    if (!ride) {
      throw new NotFoundException('Viaje no encontrado');
    }

    if (ride.driverId !== driverId) {
      throw new BadRequestException('No eres el conductor de este viaje');
    }

    if (ride.status !== RideStatus.DRIVER_ASSIGNED) {
      throw new BadRequestException('El viaje no está listo para iniciar');
    }

    ride.status = RideStatus.IN_PROGRESS;
    ride.startedAt = new Date();

    await this.rideRepository.save(ride);

    this.logger.log(`Viaje ${rideId} iniciado`);

    return ride;
  }

  /**
   * Completar viaje
   * Al completar, se cobra la comisión al conductor
   */
  async completeRide(rideId: number, driverId: number): Promise<Ride> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ['passenger', 'driver'],
    });

    if (!ride) {
      throw new NotFoundException('Viaje no encontrado');
    }

    if (ride.driverId !== driverId) {
      throw new BadRequestException('No eres el conductor de este viaje');
    }

    if (ride.status !== RideStatus.IN_PROGRESS) {
      throw new BadRequestException('El viaje no está en progreso');
    }

    ride.status = RideStatus.COMPLETED;
    ride.completedAt = new Date();
    ride.finalPrice = ride.estimatedPrice; // Puede ajustarse según distancia real
    ride.isPaid = ride.paymentMethod !== PaymentMethod.CASH;

    await this.rideRepository.save(ride);

    // 💰 Cobrar comisión al conductor (nuevo flujo Colombia)
    try {
      await this.paymentService.chargeRideCommission(rideId);
      this.logger.log(`💸 Comisión cobrada al conductor #${driverId} por viaje #${rideId}`);
    } catch (error) {
      // Si falla el cobro, aún completamos el viaje pero advertimos
      this.logger.warn(`⚠️ No se pudo cobrar comisión: ${error.message}`);
    }

    // Actualizar estadísticas
    await this.updateUserStats(ride);

    // Liberar conductor
    const driver = await this.userRepository.findOne({ where: { id: driverId } });
    if (driver) {
      driver.driverStatus = DriverStatus.ONLINE;
      await this.userRepository.save(driver);
    }

    this.logger.log(`Viaje ${rideId} completado`);

    return ride;
  }

  /**
   * Cancelar viaje
   */
  async cancelRide(
    rideId: number,
    userId: number,
    reason: string,
  ): Promise<Ride> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ['passenger', 'driver'],
    });

    if (!ride) {
      throw new NotFoundException('Viaje no encontrado');
    }

    if (ride.passengerId !== userId && ride.driverId !== userId) {
      throw new BadRequestException('No tienes permiso para cancelar este viaje');
    }

    if (ride.status === RideStatus.COMPLETED) {
      throw new BadRequestException('No se puede cancelar un viaje completado');
    }

    ride.status = RideStatus.CANCELLED;
    ride.cancellationReason = reason;
    ride.cancelledBy = ride.passengerId === userId ? 'passenger' : 'driver';

    await this.rideRepository.save(ride);

    // Liberar conductor si estaba asignado
    await this.matchingService.cancelMatching(rideId);

    this.logger.log(`Viaje ${rideId} cancelado por ${ride.cancelledBy}`);

    return ride;
  }

  /**
   * Calificar viaje
   */
  async rateRide(
    rideId: number,
    userId: number,
    rating: number,
    comment: string,
  ): Promise<Ride> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ['passenger', 'driver'],
    });

    if (!ride) {
      throw new NotFoundException('Viaje no encontrado');
    }

    if (ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException('Solo puedes calificar viajes completados');
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('La calificación debe estar entre 1 y 5');
    }

    // Determinar quién está calificando
    if (ride.passengerId === userId) {
      ride.driverRating = rating;
      ride.driverComment = comment;

      // Actualizar rating del conductor
      if (ride.driver) {
        await this.updateDriverRating(ride.driverId);
      }
    } else if (ride.driverId === userId) {
      ride.passengerRating = rating;
      ride.passengerComment = comment;

      // Actualizar rating del pasajero
      await this.updatePassengerRating(ride.passengerId);
    } else {
      throw new BadRequestException('No puedes calificar este viaje');
    }

    await this.rideRepository.save(ride);

    this.logger.log(`Viaje ${rideId} calificado`);

    return ride;
  }

  /**
   * Obtener viajes de un usuario
   */
  async getUserRides(userId: number, role: 'passenger' | 'driver'): Promise<Ride[]> {
    const where = role === 'passenger' 
      ? { passengerId: userId }
      : { driverId: userId };

    return this.rideRepository.find({
      where,
      relations: ['passenger', 'driver'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtener viaje por ID
   */
  async getRideById(rideId: number): Promise<Ride> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ['passenger', 'driver'],
    });

    if (!ride) {
      throw new NotFoundException('Viaje no encontrado');
    }

    return ride;
  }

  // ========== MÉTODOS PRIVADOS ==========

  /**
   * Calcular distancia entre dos puntos (Haversine)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
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

    return Math.round(distance * 100) / 100; // Redondear a 2 decimales
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Estimar duración del viaje en minutos
   */
  private estimateDuration(distanceKm: number): number {
    const avgSpeedKmH = 30; // Velocidad promedio en ciudad
    const durationHours = distanceKm / avgSpeedKmH;
    const durationMinutes = Math.ceil(durationHours * 60);
    return durationMinutes;
  }

  /**
   * Calcular precio del viaje
   */
  private calculatePrice(distanceKm: number, durationMinutes: number): number {
    const TARIFA_BASE = parseFloat(process.env.TARIFA_BASE || '3000');
    const TARIFA_POR_KM = parseFloat(process.env.TARIFA_POR_KM || '1500');
    const TARIFA_POR_MINUTO = parseFloat(process.env.TARIFA_POR_MINUTO || '200');
    const TARIFA_MINIMA = parseFloat(process.env.TARIFA_MINIMA || '4000');

    let price = TARIFA_BASE + distanceKm * TARIFA_POR_KM + durationMinutes * TARIFA_POR_MINUTO;

    // Aplicar recargos por hora
    const hour = new Date().getHours();
    const HORA_NOCTURNA_INICIO = parseInt(process.env.HORA_NOCTURNA_INICIO || '22');
    const HORA_NOCTURNA_FIN = parseInt(process.env.HORA_NOCTURNA_FIN || '6');
    const HORA_PICO_MANANA_INICIO = parseInt(process.env.HORA_PICO_MANANA_INICIO || '7');
    const HORA_PICO_MANANA_FIN = parseInt(process.env.HORA_PICO_MANANA_FIN || '9');
    const HORA_PICO_TARDE_INICIO = parseInt(process.env.HORA_PICO_TARDE_INICIO || '17');
    const HORA_PICO_TARDE_FIN = parseInt(process.env.HORA_PICO_TARDE_FIN || '19');

    // Recargo nocturno
    if (hour >= HORA_NOCTURNA_INICIO || hour < HORA_NOCTURNA_FIN) {
      const RECARGO_NOCTURNO = parseFloat(process.env.RECARGO_NOCTURNO || '1.2');
      price *= RECARGO_NOCTURNO;
    }

    // Recargo hora pico
    if (
      (hour >= HORA_PICO_MANANA_INICIO && hour < HORA_PICO_MANANA_FIN) ||
      (hour >= HORA_PICO_TARDE_INICIO && hour < HORA_PICO_TARDE_FIN)
    ) {
      const RECARGO_HORA_PICO = parseFloat(process.env.RECARGO_HORA_PICO || '1.3');
      price *= RECARGO_HORA_PICO;
    }

    // Asegurar tarifa mínima
    price = Math.max(price, TARIFA_MINIMA);

    return Math.round(price);
  }

  /**
   * Actualizar estadísticas del usuario después de un viaje
   */
  private async updateUserStats(ride: Ride): Promise<void> {
    // Actualizar pasajero
    const passenger = await this.userRepository.findOne({
      where: { id: ride.passengerId },
    });

    if (passenger) {
      passenger.totalRidesAsPassenger += 1;
      await this.userRepository.save(passenger);
    }

    // Actualizar conductor
    if (ride.driverId) {
      const driver = await this.userRepository.findOne({
        where: { id: ride.driverId },
      });

      if (driver) {
        driver.totalRidesAsDriver += 1;
        await this.userRepository.save(driver);
      }
    }
  }

  /**
   * Actualizar rating promedio del conductor
   */
  private async updateDriverRating(driverId: number): Promise<void> {
    const rides = await this.rideRepository.find({
      where: { driverId, driverRating: Not(null) },
    });

    if (rides.length > 0) {
      const totalRating = rides.reduce((sum, ride) => sum + ride.driverRating, 0);
      const avgRating = totalRating / rides.length;

      await this.userRepository.update(driverId, {
        driverRating: Math.round(avgRating * 100) / 100,
      });
    }
  }

  /**
   * Actualizar rating promedio del pasajero
   */
  private async updatePassengerRating(passengerId: number): Promise<void> {
    const rides = await this.rideRepository.find({
      where: { passengerId, passengerRating: Not(null) },
    });

    if (rides.length > 0) {
      const totalRating = rides.reduce((sum, ride) => sum + ride.passengerRating, 0);
      const avgRating = totalRating / rides.length;

      await this.userRepository.update(passengerId, {
        passengerRating: Math.round(avgRating * 100) / 100,
      });
    }
  }
}

// (Se usa Not e In importados desde 'typeorm')
