import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RideStatus {
  SEARCHING = 'searching',           // Buscando conductor
  DRIVER_ASSIGNED = 'driver_assigned', // Conductor asignado, yendo al origen
  IN_PROGRESS = 'in_progress',       // Viaje en curso
  COMPLETED = 'completed',           // Viaje completado
  CANCELLED = 'cancelled',           // Viaje cancelado
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  WALLET = 'wallet',
}

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn()
  id: number;

  // Pasajero
  @ManyToOne(() => User, (user) => user.ridesAsPassenger, { eager: true })
  @JoinColumn({ name: 'passenger_id' })
  passenger: User;

  @Column({ name: 'passenger_id' })
  passengerId: number;

  // Conductor (nullable hasta que se asigne)
  @ManyToOne(() => User, (user) => user.ridesAsDriver, { eager: true, nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @Column({ name: 'driver_id', nullable: true })
  driverId: number;

  // Estado del viaje
  @Column({
    type: 'varchar',
    default: RideStatus.SEARCHING,
  })
  status: RideStatus;

  // Ubicación de origen
  @Column({ type: 'decimal', precision: 10, scale: 8 })
  originLat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  originLng: number;

  @Column()
  originAddress: string;

  // Ubicación de destino
  @Column({ type: 'decimal', precision: 10, scale: 8 })
  destinationLat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  destinationLng: number;

  @Column()
  destinationAddress: string;

  // Detalles del viaje
  @Column({ type: 'decimal', precision: 6, scale: 2 })
  distanceKm: number;

  @Column({ nullable: true })
  estimatedDurationMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  estimatedPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  finalPrice: number;

  // Pago
  @Column({
    type: 'varchar',
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Column({ default: false })
  isPaid: boolean;

  // Calificaciones
  @Column({ type: 'int', nullable: true })
  passengerRating: number; // 1-5

  @Column({ type: 'int', nullable: true })
  driverRating: number; // 1-5

  @Column({ nullable: true })
  passengerComment: string;

  @Column({ nullable: true })
  driverComment: string;

  // Tiempos
  @CreateDateColumn()
  createdAt: Date; // Cuando se solicitó

  @Column({ type: 'datetime', nullable: true })
  driverAssignedAt: Date; // Cuando se asignó conductor

  @Column({ type: 'datetime', nullable: true })
  startedAt: Date; // Cuando empezó el viaje

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date; // Cuando terminó

  @UpdateDateColumn()
  updatedAt: Date;

  // Razón de cancelación
  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ nullable: true })
  cancelledBy: string; // 'passenger' o 'driver'
}
