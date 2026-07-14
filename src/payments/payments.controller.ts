// 📁 UBICACIÓN: lleevameq-backend/src/payments/payments.controller.ts
// 🎮 Controlador de Pagos - Endpoints para la app

import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ColombiaPaymentService, ColombiaPaymentMethod } from './colombia-payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentService: ColombiaPaymentService) {}

  // ========================================
  // 💰 RECARGA (Conductor → LlevameQ)
  // ========================================
  
  /**
   * POST /api/payments/recharge
   * El conductor recarga saldo para recibir viajes
   * 
   * Body: { "amount": 50000, "method": "nequi", "paymentProof": "REF123456" }
   */
  @UseGuards(JwtAuthGuard)
  @Post('recharge')
  async driverRecharge(
    @Request() req,
    @Body() body: {
      amount: number;
      method: ColombiaPaymentMethod;
      paymentProof?: string;
    }
  ) {
    return await this.paymentService.driverRecharge(
      req.user.userId,
      body.amount,
      body.method,
      body.paymentProof
    );
  }

  // ========================================
  // 💵 CONSULTAR SALDO
  // ========================================
  
  /**
   * GET /api/payments/balance
   * Retorna el saldo del conductor
   */
  @UseGuards(JwtAuthGuard)
  @Get('balance')
  async getBalance(@Request() req) {
    return await this.paymentService.getDriverBalance(req.user.userId);
  }

  // ========================================
  // 📋 MÉTODOS DE PAGO (Para Pasajero)
  // ========================================
  
  /**
   * GET /api/payments/passenger-methods
   * Retorna los métodos de pago disponibles para el pasajero
   */
  @Get('passenger-methods')
  getPassengerMethods() {
    return {
      methods: this.paymentService.getPassengerPaymentMethods(),
      note: 'El pasajero paga directamente al conductor por el método de su elección'
    };
  }

  // ========================================
  // 💳 INFO DE RECARGA (Para Conductor)
  // ========================================
  
  /**
   * GET /api/payments/recharge-info
   * Retorna información de cómo recargar
   */
  @Get('recharge-info')
  getRechargeInfo() {
    return this.paymentService.getDriverRechargeInfo();
  }

  // ========================================
  // 📊 HISTORIAL DE TRANSACCIONES
  // ========================================
  
  /**
   * GET /api/payments/history
   * Retorna el historial de transacciones
   */
  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory(@Request() req) {
    return await this.paymentService.getTransactionHistory(req.user.userId);
  }
}