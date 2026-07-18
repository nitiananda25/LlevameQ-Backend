import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Ride } from '../../rides/entities/ride.entity';

export enum UserRole {
  PASSENGER = 'passenger',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

export enum DriverStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  IN_RIDE = 'in_ride',
}

export enum DriverAccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  phone: string;

  @Column({
    type: 'varchar',
    default: UserRole.PASSENGER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  // Campos para CONDUCTORES
  @Column({ nullable: true })
  vehiclePlate: string;

  @Column({ nullable: true })
  vehicleModel: string;

  @Column({ nullable: true })
  vehicleColor: string;

  @Column({ nullable: true })
  licenseNumber: string;

  @Column({
    type: 'varchar',
    default: DriverStatus.OFFLINE,
    nullable: true,
  })
  driverStatus: DriverStatus;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0, nullable: true })
  driverRating: number;

  @Column({ default: 0, nullable: true })
  totalRidesAsDriver: number;

  // Ubicación actual del conductor (para matching)
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  currentLat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  currentLng: number;

  @Column({ type: 'datetime', nullable: true })
  lastLocationUpdate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, nullable: true })
  saldo_disponible: number;

  @Column({
    type: 'varchar',
    default: DriverAccountStatus.ACTIVE,
    nullable: true,
  })
  estado_cuenta: DriverAccountStatus;

  @Column({ type: 'datetime', nullable: true })
  ultima_recarga_at: Date;

  // Campos para PASAJEROS
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  walletBalance: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  passengerRating: number;

  @Column({ default: 0 })
  totalRidesAsPassenger: number;

  @Column({ nullable: true })
  profilePhoto: string;

  // Relaciones
  @OneToMany(() => Ride, (ride) => ride.passenger)
  ridesAsPassenger: Ride[];

  @OneToMany(() => Ride, (ride) => ride.driver)
  ridesAsDriver: Ride[];

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
