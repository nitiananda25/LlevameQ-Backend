// 📁 UBICACIÓN: lleevameq-backend/src/payments/entities/recharge.entity.ts
// 📋 Historial de Recargas - Registro de dinero que el conductor envía a la plataforma

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne 
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// Método de pago usado para la recarga
export enum RechargeMethod {
  NEQUI = 'nequi',
  DAVIPLATA = 'daviplata',
  CARD = 'card',
  TRANSFER = 'transfer',
}

// Estado de la recarga
export enum RechargeStatus {
  PENDING = 'pending',    // Pendiente de verificación
  COMPLETED = 'completed', // Verificada y aplicada
  REJECTED = 'rejected',   // Rechazada
  CANCELLED = 'cancelled', // Cancelada
}

@Entity('historial_recargas')
export class Recharge {
  @PrimaryGeneratedColumn()
  id: number;

  // Relación con el conductor
  @ManyToOne(() => User, { eager: true })
  driver: User;

  @Column()
  driverId: number;

  // Monto de la recarga en COP
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  // Método de pago usado
  @Column({ type: 'varchar' })
  metodo: RechargeMethod;

  // Estado de la recarga
  @Column({ type: 'varchar', default: RechargeStatus.PENDING })
  estado: RechargeStatus;

  // Referencia o proof de pago (número de transacción, screenshot, etc.)
  @Column({ nullable: true })
  referencia_pago: string;

  // ID de transacción externo (Nequi, Daviplata, etc.)
  @Column({ nullable: true })
  transaction_id_externo: string;

  // Notas adicionales
  @Column({ nullable: true })
  notas: string;

  // Fecha de creación
  @CreateDateColumn()
  createdAt: Date;

  // Fecha de verificación/aprobación
  @Column({ type: 'datetime', nullable: true })
  verifiedAt: Date;

  // Admin que verificó (si aplica)
  @Column({ nullable: true })
  verifiedBy: string;
}