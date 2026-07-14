// 📁 UBICACIÓN: lleevameq-backend/src/payments/colombia-payment.service.ts
// 💰 Sistema de Pagos para Colombia (Quindío)
// Modelo: Pasajero paga directo al conductor, conductor paga a LlevameQ

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Recharge, RechargeMethod, RechargeStatus } from './entities/recharge.entity';
import { Ride, PaymentMethod, RideStatus } from '../rides/entities/ride.entity';
import { User, DriverStatus, DriverAccountStatus } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

// ========================================
// 📋 MÉTODOS DE PAGO EN COLOMBIA (QUINDÍO)
// ========================================
export enum ColombiaPaymentMethod {
  CASH = 'cash',           // Efectivo (pasajero paga directo al conductor)
  NEQUI = 'nequi',         // Nequi (Davivenda) - transferencia directa
  DAVIPLATA = 'daviplata', // Daviplata - transferencia directa
  TRANSFER = 'transfer',   // Transferencia bancaria
  CARD = 'card',           // Tarjeta débito/crédito
}

// ========================================
// 💵 TIPOS DE TRANSACCIÓN EN LA PLATAFORMA
// ========================================
export enum TransactionType {
  DRIVER_RECHARGE = 'driver_recharge',   // Conductor recarga saldo
  RIDE_COMMISSION = 'ride_commission',   // Comisión por viaje
  RIDE_FEE = 'ride_fee',                 // Tarifa del viaje (pasajero→conductor)
  PLATFORM_FEE = 'platform_fee',         // Fee de plataforma
  REFUND = 'refund',                     // Reembolso
}

// ========================================
// 📊 RESULTADO DE TRANSACCIÓN
// ========================================
export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  amount: number;
  method: string;
  message: string;
  timestamp: Date;
}

@Injectable()
export class ColombiaPaymentService {
  private readonly logger = new Logger(ColombiaPaymentService.name);

  // Comisiones configurables
  private readonly RIDE_COMMISSION = 500; // 500 COP por viaje al conductor
  private readonly MIN_RECHARGE = 10000;  // Recarga mínima 10,000 COP
  private readonly MAX_RECHARGE = 500000; // Recarga máxima 500,000 COP

  constructor(
    @InjectRepository(Payment) 
    private paymentRepo: Repository<Payment>,
    
    @InjectRepository(Recharge)
    private rechargeRepo: Repository<Recharge>,
    
    @InjectRepository(Ride) 
    private rideRepo: Repository<Ride>,
    
    @InjectRepository(User) 
    private userRepo: Repository<User>,
  ) {}

  // ========================================
  // 🎯 1. RECARGA DEL CONDUCTOR (Conductor → LlevameQ)
  // ========================================
  
  /**
   * El conductor recarga saldo para poder recibir viajes
   * Cada viaje le descontará la comisión
   * 
   * @param driverId ID del conductor
   * @param amount Monto a recargar (10,000 - 500,000 COP)
   * @param method Método: 'nequi' | 'daviplata' | 'transfer' | 'card'
   * @param paymentProof Proof de pago (referencia, screenshot, etc.)
   */
  async driverRecharge(
    driverId: number,
    amount: number,
    method: ColombiaPaymentMethod,
    paymentProof?: string
  ): Promise<TransactionResult> {
    
    // Validaciones
    if (amount < this.MIN_RECHARGE) {
      throw new BadRequestException(
        `Recarga mínima: $${this.MIN_RECHARGE.toLocaleString('es-CO')} COP`
      );
    }

    if (amount > this.MAX_RECHARGE) {
      throw new BadRequestException(
        `Recarga máxima: $${this.MAX_RECHARGE.toLocaleString('es-CO')} COP`
      );
    }

    const driver = await this.userRepo.findOne({ where: { id: driverId } });
    
    if (!driver) {
      throw new BadRequestException('Conductor no encontrado');
    }

    if (driver.role !== 'driver') {
      throw new BadRequestException('Solo conductores pueden recargar');
    }

    this.logger.log(`💰 Recarga de $${amount} COP para conductor #${driverId}`);

    // 📌 En producción: integrar con API de Nequi/Daviplata
    // Por ahora simulamos la validación
    const transactionResult = await this.processRecharge(
      driverId, 
      amount, 
      method, 
      paymentProof
    );

    if (transactionResult.success) {
      // 1️⃣ Actualizar saldo_disponible del conductor
      driver.saldo_disponible = (driver.saldo_disponible || 0) + amount;
      
      // 2️⃣ Actualizar estado_cuenta según saldo
      if (driver.saldo_disponible >= 0) {
        driver.estado_cuenta = DriverAccountStatus.ACTIVE;
      }
      driver.ultima_recarga_at = new Date();
      await this.userRepo.save(driver);

      // 3️⃣ Registrar en historial_recargas
      await this.createRechargeRecord(
        driverId,
        amount,
        method,
        paymentProof,
        transactionResult.transactionId
      );

      // 4️⃣ Registrar transacción
      await this.createTransactionRecord(
        driverId,
        amount,
        TransactionType.DRIVER_RECHARGE,
        method,
        transactionResult.transactionId,
        { proof: paymentProof }
      );
    }

    return {
      ...transactionResult,
      amount,
      method,
      message: `Recarga exitosa. Saldo disponible: $${driver.saldo_disponible.toLocaleString('es-CO')} COP`
    };
  }

  // ========================================
  // 💳 2. PROCESAR RECARGA (Simulación - Production: API real)
  // ========================================
  
  private async processRecharge(
    driverId: number,
    amount: number,
    method: ColombiaPaymentMethod,
    proof?: string
  ): Promise<TransactionResult> {
    
    this.logger.log(`Procesando recarga por ${method}: $${amount}`);

    // 🚧 SIMULACIÓN - En producción reemplazar con API real:
    // - Nequi: https://docs.nequi.com/
    // - Daviplata: https://docs.daviplata.com/
    // - ePayco: https://docs.epayco.co/
    // - Stripe Colombia

    switch (method) {
      case ColombiaPaymentMethod.NEQUI:
        return this.processNequiPayment(driverId, amount, proof);
      
      case ColombiaPaymentMethod.DAVIPLATA:
        return this.processDaviplataPayment(driverId, amount, proof);
      
      case ColombiaPaymentMethod.CARD:
        return this.processCardPayment(driverId, amount, proof);
      
      case ColombiaPaymentMethod.TRANSFER:
        return this.processBankTransfer(driverId, amount, proof);
      
      default:
        throw new BadRequestException('Método de pago no válido');
    }
  }

  // ========================================
  // 📱 3. PAGO NEQUI (Más popular en Quindío)
  // ========================================
  
  private async processNequiPayment(
    driverId: number, 
    amount: number, 
    proof?: string
  ): Promise<TransactionResult> {
    // En producción: llamar API de Nequi Business
    // const result = await nequiClient.receivePayment({
    //   phone: '321XXXXXXX',
    //   amount: amount,
    //   reference: uuidv4()
    // });

    // Simulación: validar que proof tenga referencia
    if (!proof || proof.length < 6) {
      throw new BadRequestException(
        'Por favor ingresa la referencia de tu pago Nequi'
      );
    }

    return {
      success: true,
      transactionId: `NEQUI-${uuidv4().slice(0, 8).toUpperCase()}`,
      amount,
      method: 'nequi',
      message: 'Pago Nequi verificado',
      timestamp: new Date()
    };
  }

  // ========================================
  // 📱 4. PAGO DAVIPLATA
  // ========================================
  
  private async processDaviplataPayment(
    driverId: number, 
    amount: number, 
    proof?: string
  ): Promise<TransactionResult> {
    
    if (!proof || proof.length < 6) {
      throw new BadRequestException(
        'Por favor ingresa la referencia de tu pago Daviplata'
      );
    }

    return {
      success: true,
      transactionId: `DAVI-${uuidv4().slice(0, 8).toUpperCase()}`,
      amount,
      method: 'daviplata',
      message: 'Pago Daviplata verificado',
      timestamp: new Date()
    };
  }

  // ========================================
  // 💳 5. PAGO CON TARJETA
  // ========================================
  
  private async processCardPayment(
    driverId: number, 
    amount: number, 
    proof?: string
  ): Promise<TransactionResult> {
    // En producción: integrar con ePayco o Stripe
    // const result = await epayco.charge.create({
    //   token_card: token,
    //   value: amount,
    //   currency: 'COP'
    // });

    return {
      success: true,
      transactionId: `CARD-${uuidv4().slice(0, 8).toUpperCase()}`,
      amount,
      method: 'card',
      message: 'Pago con tarjeta procesado',
      timestamp: new Date()
    };
  }

  // ========================================
  // 🏦 6. TRANSFERENCIA BANCARIA
  // ========================================
  
  private async processBankTransfer(
    driverId: number, 
    amount: number, 
    proof?: string
  ): Promise<TransactionResult> {
    
    return {
      success: true,
      transactionId: `TRAN-${uuidv4().slice(0, 8).toUpperCase()}`,
      amount,
      method: 'transfer',
      message: 'Transferencia registrada - pendiente verificación',
      timestamp: new Date()
    };
  }

  // ========================================
  // 🚗 7. COBRO DE COMISIÓN POR VIAJE
  // ========================================
  
  /**
   * Se ejecuta cuando un viaje se completa
   * Descuenta la comisión del saldo del conductor
   * 
   * @param rideId ID del viaje completado
   */
  async chargeRideCommission(rideId: number): Promise<TransactionResult> {
    const ride = await this.rideRepo.findOne({ 
      where: { id: rideId },
      relations: ['driver', 'passenger']
    });

    if (!ride) {
      throw new BadRequestException('Viaje no encontrado');
    }

    if (ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException('El viaje debe estar completado');
    }

    const driver = ride.driver;
    const commission = this.RIDE_COMMISSION;

    // Verificar saldo suficiente (ahora usando saldo_disponible)
    if ((driver.saldo_disponible || 0) < commission) {
      throw new BadRequestException(
        `Saldo insuficiente. Recarga para continuar recibiendo viajes.`
      );
    }

    // Descontar comisión del saldo_disponible
    driver.saldo_disponible -= commission;
    
    // Actualizar estado_cuenta si el saldo queda negativo
    if (driver.saldo_disponible < 0) {
      driver.estado_cuenta = DriverAccountStatus.INACTIVE;
    }
    
    await this.userRepo.save(driver);

    // Registrar transacción
    await this.createTransactionRecord(
      driver.id,
      commission,
      TransactionType.RIDE_COMMISSION,
      'platform',
      `RIDE-${rideId}`,
      { rideId, passengerId: ride.passenger.id }
    );

    this.logger.log(
      `💸 Comisión de $${commission} COP cobrada al conductor #${driver.id}. Saldo restante: ${driver.saldo_disponible}`
    );

    return {
      success: true,
      transactionId: `COMM-${rideId}`,
      amount: commission,
      method: 'platform',
      message: `Comisión cobrada. Saldo restante: $${driver.saldo_disponible.toLocaleString('es-CO')} COP`,
      timestamp: new Date()
    };
  }

  // ========================================
  // 💰 8. CONSULTAR SALDO DEL CONDUCTOR
  // ========================================
  
  async getDriverBalance(driverId: number): Promise<{
    saldo_disponible: number;
    estado_cuenta: string;
    totalRecargas: number;
    totalComisiones: number;
    viajesCompletados: number;
    ultimaRecarga: Date | null;
  }> {
    const driver = await this.userRepo.findOne({ where: { id: driverId } });
    
    if (!driver) {
      throw new BadRequestException('Conductor no encontrado');
    }

    // Contar recargas desde historial_recargas
    const totalRecargas = await this.rechargeRepo.count({
      where: { 
        driverId,
        estado: RechargeStatus.COMPLETED
      }
    });

    return {
      saldo_disponible: driver.saldo_disponible || 0,
      estado_cuenta: driver.estado_cuenta || DriverAccountStatus.ACTIVE,
      totalRecargas,
      totalComisiones: 0,       // Ajustar con query real
      viajesCompletados: driver.totalRidesAsDriver || 0,
      ultimaRecarga: driver.ultima_recarga_at || null
    };
  }

  // ========================================
  // 📋 9. OBTENER INFO DE PAGO PARA PASAJERO
  // ========================================
  
  /**
   * Retorna los métodos de pago disponibles para el pasajero
   * (El pasajero paga directo al conductor, no a la plataforma)
   */
  getPassengerPaymentMethods(): string[] {
    return [
      'Efectivo - Paga directamente al conductor',
      'Nequi - Transfiere al conductor por Nequi',
      'Daviplata - Transfiere al conductor por Daviplata',
      'Transferencia - Transfiere al conductor por banco'
    ];
  }

  // ========================================
  // 📊 10. OBTENER INFO DE RECARGA PARA CONDUCTOR
  // ========================================
  
  getDriverRechargeInfo(): {
    minRecharge: number;
    maxRecharge: number;
    commissionPerRide: number;
    methods: string[];
    bankInfo: {
      bank: string;
      accountType: string;
      accountNumber: string;
      nit: string;
    };
  } {
    return {
      minRecharge: this.MIN_RECHARGE,
      maxRecharge: this.MAX_RECHARGE,
      commissionPerRide: this.RIDE_COMMISSION,
      methods: [
        'Nequi - Transferencia inmediata',
        'Daviplata - Transferencia inmediata',
        'Tarjeta Débito/Crédito',
        'Transferencia bancaria'
      ],
      bankInfo: {
        bank: 'Bancolombia',
        accountType: 'Ahorros',
        accountNumber: '1234567890',
        nit: '123456789-0'
      }
    };
  }

  // ========================================
  // 🏗️ 11. CREAR REGISTRO DE TRANSACCIÓN
  // ========================================
  
  private async createTransactionRecord(
    userId: number,
    amount: number,
    type: TransactionType,
    method: string,
    transactionId: string,
    metadata?: any
  ): Promise<Payment> {
    const payment = this.paymentRepo.create({
      amount,
      method: `${type}_${method}`,
      status: 'completed',
      transactionId,
      metadata: {
        userId,
        type,
        ...metadata
      },
      completedAt: new Date()
    });

    return await this.paymentRepo.save(payment);
  }

  // ========================================
  // 📈 12. HISTORIAL DE TRANSACCIONES
  // ========================================
  
  async getTransactionHistory(
    userId: number, 
    limit: number = 20
  ): Promise<Payment[]> {
    return await this.paymentRepo.find({
      where: {
        metadata: JSON.stringify({ userId })
      },
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  // ========================================
  // 📋 13. CREAR REGISTRO EN HISTORIAL_RECARGAS
  // ========================================
  
  private async createRechargeRecord(
    driverId: number,
    amount: number,
    method: ColombiaPaymentMethod,
    paymentProof: string | undefined,
    transactionId: string
  ): Promise<Recharge> {
    const recharge = this.rechargeRepo.create({
      driverId,
      monto: amount,
      metodo: this.mapToRechargeMethod(method),
      estado: RechargeStatus.COMPLETED,
      referencia_pago: paymentProof || null,
      transaction_id_externo: transactionId,
      verifiedAt: new Date(),
    });

    return await this.rechargeRepo.save(recharge);
  }

  // ========================================
  // 📋 14. OBTENER HISTORIAL DE RECARGAS
  // ========================================
  
  async getRechargeHistory(
    driverId: number, 
    limit: number = 20
  ): Promise<Recharge[]> {
    return await this.rechargeRepo.find({
      where: { driverId },
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  // ========================================
  // 🔄 MAPEAR MÉTODO DE PAGO A ENUM
  // ========================================
  
  private mapToRechargeMethod(method: ColombiaPaymentMethod): RechargeMethod {
    switch (method) {
      case ColombiaPaymentMethod.NEQUI:
        return RechargeMethod.NEQUI;
      case ColombiaPaymentMethod.DAVIPLATA:
        return RechargeMethod.DAVIPLATA;
      case ColombiaPaymentMethod.CARD:
        return RechargeMethod.CARD;
      case ColombiaPaymentMethod.TRANSFER:
        return RechargeMethod.TRANSFER;
      default:
        return RechargeMethod.TRANSFER;
    }
  }
}