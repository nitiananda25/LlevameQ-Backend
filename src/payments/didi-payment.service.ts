// 📁 UBICACIÓN: lleevameq-backend/src/payments/didi-payment.service.ts
// 💰 Servicio de Pagos - Estilo DiDi/InDrive
// Maneja pre-autorización, cobros y billetera digital

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Ride, PaymentMethod, RideStatus } from '../rides/entities/ride.entity';
import { User } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DidiPaymentService {
  private readonly logger = new Logger(DidiPaymentService.name);

  constructor(
    @InjectRepository(Payment) 
    private paymentRepo: Repository<Payment>,
    
    @InjectRepository(Ride) 
    private rideRepo: Repository<Ride>,
    
    @InjectRepository(User) 
    private userRepo: Repository<User>,
  ) {}

  // ========================================
  // 🎯 MÉTODO PRINCIPAL: Pre-autorización
  // ========================================
  
  /**
   * Pre-autoriza un pago ANTES de que el conductor acepte
   * Similar a DiDi/InDrive - precio fijo mostrado al usuario
   * 
   * @param rideId ID del viaje
   * @param method Método de pago: 'card' | 'wallet' | 'cash'
   * @param paymentToken Token de tarjeta tokenizada (opcional)
   * @returns Resultado de la pre-autorización
   */
  async preAuthorizePayment(
    rideId: number, 
    method: 'card' | 'wallet' | 'cash',
    paymentToken?: string
  ) {
    // Buscar viaje con relaciones
    const ride = await this.rideRepo.findOne({ 
      where: { id: rideId },
      relations: ['passenger', 'driver']
    });

    // Validaciones
    if (!ride) {
      throw new BadRequestException('Viaje no encontrado');
    }

    if (ride.status !== RideStatus.SEARCHING) {
      throw new BadRequestException('El viaje debe estar en estado SEARCHING');
    }

    // 1️⃣ Calcular precio FIJO (como DiDi)
    const finalPrice = this.calculateFixedPrice(ride);
    
    this.logger.log(`Pre-autorizando pago de $${finalPrice} para viaje #${rideId}`);

    // 2️⃣ Intentar cobro/validación según método
    let paymentResult;
    
    try {
      switch (method) {
        case 'card':
          // Cobro inmediato a tarjeta
          paymentResult = await this.chargeCard(
            paymentToken, 
            finalPrice, 
            ride.passenger
          );
          break;
        
        case 'wallet':
          // Descuento de billetera digital
          paymentResult = await this.chargeWallet(
            ride.passenger.id, 
            finalPrice
          );
          break;
        
        case 'cash':
          // Efectivo: solo marcamos como "pendiente de cobro"
          paymentResult = {
            success: true,
            requiresCash: true,
            amount: finalPrice,
            message: 'Pago en efectivo al conductor'
          };
          break;
        
        default:
          throw new BadRequestException('Método de pago no válido');
      }
    } catch (error) {
      this.logger.error(`Error en pre-autorización: ${error.message}`);
      throw new BadRequestException(
        `No se pudo procesar el pago: ${error.message}`
      );
    }

    // 3️⃣ Guardar registro de pago
    const payment = await this.createPaymentRecord(
      ride,
      method,
      finalPrice,
      paymentResult
    );

    // 4️⃣ Actualizar viaje con método de pago
    ride.paymentMethod =
      method === 'cash'
        ? PaymentMethod.CASH
        : method === 'card'
        ? PaymentMethod.CARD
        : PaymentMethod.WALLET;
    ride.finalPrice = finalPrice;
    await this.rideRepo.save(ride);

    this.logger.log(`Pago pre-autorizado exitosamente: Payment #${payment.id}`);

    return {
      success: true,
      payment,
      requiresCash: method === 'cash',
      message: this.getPaymentMessage(method, paymentResult)
    };
  }

  // ========================================
  // 💳 COBRO A TARJETA
  // ========================================
  
  /**
   * Procesa cobro a tarjeta tokenizada
   * En producción, aquí integrarías con ePayco, Stripe, etc.
   * 
   * @param token Token de la tarjeta
   * @param amount Monto a cobrar
   * @param user Usuario que paga
   * @returns Resultado del cobro
   */
  private async chargeCard(
    token: string, 
    amount: number, 
    user: User
  ) {
    if (!token) {
      throw new BadRequestException('Token de tarjeta requerido');
    }

    this.logger.log(`Cobrando $${amount} a tarjeta de ${user.firstName} ${user.lastName}`);

    // 🚧 SIMULACIÓN - En producción reemplazar con API real
    // Ejemplo: const result = await epayco.charge(token, amount);
    
    // Simulamos un cobro exitoso
    const isSuccessful = Math.random() > 0.1; // 90% éxito
    
    if (!isSuccessful) {
      throw new BadRequestException('Tarjeta rechazada o fondos insuficientes');
    }

    return {
      success: true,
      transactionId: uuidv4(),
      amount,
      method: 'card',
      last4: token.slice(-4), // Últimos 4 dígitos
      timestamp: new Date()
    };
  }

  // ========================================
  // 💰 COBRO A BILLETERA DIGITAL
  // ========================================
  
  /**
   * Descuenta de la billetera digital del usuario
   * Similar a la billetera de DiDi/Uber
   * 
   * @param userId ID del usuario
   * @param amount Monto a descontar
   * @returns Resultado del descuento
   */
  private async chargeWallet(userId: number, amount: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Verificar saldo suficiente
    if (user.walletBalance < amount) {
      throw new BadRequestException(
        `Saldo insuficiente. Tienes $${user.walletBalance}, necesitas $${amount}`
      );
    }

    // Descontar de la billetera
    user.walletBalance -= amount;
    await this.userRepo.save(user);

    this.logger.log(`Descontados $${amount} de billetera de ${user.firstName} ${user.lastName}. Nuevo saldo: $${user.walletBalance}`);

    return {
      success: true,
      transactionId: uuidv4(),
      amount,
      method: 'wallet',
      previousBalance: user.walletBalance + amount,
      newBalance: user.walletBalance,
      timestamp: new Date()
    };
  }

  // ========================================
  // 💵 CALCULAR PRECIO FIJO
  // ========================================
  
  /**
   * Calcula el precio FIJO del viaje
   * Fórmula: tarifa_base + (distancia * tarifa_km) + tarifa_tiempo
   * 
   * @param ride Viaje
   * @returns Precio final en pesos colombianos
   */
  private calculateFixedPrice(ride: Ride): number {
    // Tarifas configurables (en producción, desde BD o .env)
    const BASE_FARE = 3000;           // Tarifa base: $3,000
    const FARE_PER_KM = 1500;         // $1,500 por km
    const FARE_PER_MINUTE = 200;      // $200 por minuto
    const MIN_FARE = 4000;            // Tarifa mínima: $4,000

    // Calcular componentes
    const distanceCharge = (ride.distanceKm || 0) * FARE_PER_KM;
    const timeCharge = (ride.estimatedDurationMinutes || 0) * FARE_PER_MINUTE;
    
    // Precio total
    let totalPrice = BASE_FARE + distanceCharge + timeCharge;

    // Aplicar tarifa mínima
    if (totalPrice < MIN_FARE) {
      totalPrice = MIN_FARE;
    }

    // Redondear a múltiplo de 100
    totalPrice = Math.ceil(totalPrice / 100) * 100;

    this.logger.log(`Precio calculado: Base $${BASE_FARE} + Distancia $${distanceCharge} + Tiempo $${timeCharge} = $${totalPrice}`);

    return totalPrice;
  }

  // ========================================
  // 📝 CREAR REGISTRO DE PAGO
  // ========================================
  
  /**
   * Crea un registro en la base de datos del pago
   * 
   * @param ride Viaje
   * @param method Método de pago
   * @param amount Monto
   * @param result Resultado del cobro
   * @returns Entidad Payment guardada
   */
  private async createPaymentRecord(
    ride: Ride,
    method: string,
    amount: number,
    result: any
  ): Promise<Payment> {
    const payment = this.paymentRepo.create({
      ride,
      amount,
      method,
      status: method === 'cash' ? 'pending' : 'completed',
      transactionId: result.transactionId || uuidv4(),
      metadata: {
        ...result,
        timestamp: new Date(),
        rideId: ride.id,
        passengerId: ride.passenger.id
      }
    });

    return await this.paymentRepo.save(payment);
  }

  // ========================================
  // 💬 MENSAJE DE CONFIRMACIÓN
  // ========================================
  
  /**
   * Genera mensaje apropiado según el resultado del pago
   * 
   * @param method Método de pago usado
   * @param result Resultado del cobro
   * @returns Mensaje para el usuario
   */
  private getPaymentMessage(method: string, result: any): string {
    switch (method) {
      case 'card':
        return `Cobro exitoso a tarjeta terminada en ${result.last4}`;
      
      case 'wallet':
        return `Descontados $${result.amount} de tu billetera. Nuevo saldo: $${result.newBalance}`;
      
      case 'cash':
        return `Pago en efectivo al conductor: $${result.amount}`;
      
      default:
        return 'Pago procesado exitosamente';
    }
  }

  // ========================================
  // 💰 RECARGAR BILLETERA
  // ========================================
  
  /**
   * Recarga la billetera digital del usuario
   * 
   * @param userId ID del usuario
   * @param amount Monto a recargar
   * @param paymentToken Token de tarjeta para cobrar la recarga
   * @returns Nueva información de la billetera
   */
  async rechargeWallet(
    userId: number, 
    amount: number, 
    paymentToken: string
  ) {
    if (amount < 5000) {
      throw new BadRequestException('El monto mínimo de recarga es $5,000');
    }

    if (amount > 500000) {
      throw new BadRequestException('El monto máximo de recarga es $500,000');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Cobrar a la tarjeta
    const chargeResult = await this.chargeCard(paymentToken, amount, user);

    if (!chargeResult.success) {
      throw new BadRequestException('No se pudo procesar el cobro a la tarjeta');
    }

    // Aumentar saldo de billetera
    const previousBalance = user.walletBalance;
    user.walletBalance += amount;
    await this.userRepo.save(user);

    this.logger.log(`Recarga exitosa: +$${amount} a billetera de ${user.firstName} ${user.lastName}. Nuevo saldo: $${user.walletBalance}`);

    return {
      success: true,
      transactionId: chargeResult.transactionId,
      amount,
      previousBalance,
      newBalance: user.walletBalance,
      message: `Recarga exitosa de $${amount}`
    };
  }

  // ========================================
  // 🔍 OBTENER HISTORIAL DE PAGOS
  // ========================================
  
  /**
   * Obtiene el historial de pagos de un usuario
   * 
   * @param userId ID del usuario
   * @param limit Límite de registros (default: 20)
   * @returns Lista de pagos
   */
  async getPaymentHistory(userId: number, limit: number = 20) {
    const payments = await this.paymentRepo.find({
      where: { 
        ride: { 
          passenger: { id: userId } 
        } 
      },
      relations: ['ride'],
      order: { createdAt: 'DESC' },
      take: limit
    });

    return payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      date: payment.createdAt,
      rideId: payment.ride.id,
      origin: payment.ride.originAddress,
      destination: payment.ride.destinationAddress
    }));
  }

  // ========================================
  // ✅ COMPLETAR PAGO (después del viaje)
  // ========================================
  
  /**
   * Completa el pago después de que el viaje termina
   * Para efectivo, marca como cobrado
   * 
   * @param rideId ID del viaje
   * @returns Confirmación del pago completado
   */
  async completePayment(rideId: number) {
    const payment = await this.paymentRepo.findOne({
      where: { ride: { id: rideId } },
      relations: ['ride']
    });

    if (!payment) {
      throw new BadRequestException('Pago no encontrado');
    }

    if (payment.status === 'completed') {
      return {
        success: true,
        message: 'El pago ya estaba completado'
      };
    }

    // Marcar como completado
    payment.status = 'completed';
    payment.completedAt = new Date();
    await this.paymentRepo.save(payment);

    this.logger.log(`Pago #${payment.id} marcado como completado`);

    return {
      success: true,
      payment,
      message: 'Pago completado exitosamente'
    };
  }

  // ========================================
  // 🔙 REEMBOLSAR PAGO
  // ========================================
  
  /**
   * Reembolsa un pago (por cancelación u otro motivo)
   * 
   * @param rideId ID del viaje
   * @param reason Razón del reembolso
   * @returns Confirmación del reembolso
   */
  async refundPayment(rideId: number, reason: string) {
    const payment = await this.paymentRepo.findOne({
      where: { ride: { id: rideId } },
      relations: ['ride', 'ride.passenger']
    });

    if (!payment) {
      throw new BadRequestException('Pago no encontrado');
    }

    if (payment.status === 'refunded') {
      throw new BadRequestException('Este pago ya fue reembolsado');
    }

    const user = payment.ride.passenger;

    // Procesar reembolso según método
    if (payment.method === 'wallet') {
      // Devolver a billetera
      user.walletBalance += payment.amount;
      await this.userRepo.save(user);
    } else if (payment.method === 'card') {
      // En producción: API de reembolso a tarjeta
      this.logger.log(`Reembolso a tarjeta pendiente: $${payment.amount}`);
    }

    // Actualizar estado del pago
    payment.status = 'refunded';
    payment.metadata = {
      ...payment.metadata,
      refundReason: reason,
      refundDate: new Date()
    };
    await this.paymentRepo.save(payment);

    this.logger.log(`Pago #${payment.id} reembolsado: $${payment.amount}`);

    return {
      success: true,
      payment,
      amount: payment.amount,
      message: `Reembolso procesado: $${payment.amount}`
    };
  }
}
