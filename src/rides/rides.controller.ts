import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RidesService, CreateRideDto } from './rides.service';

@Controller('rides')
@UseGuards(AuthGuard('jwt'))
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  /**
   * POST /api/rides - Crear nuevo viaje
   */
  @Post()
  async createRide(@Request() req, @Body() createRideDto: CreateRideDto) {
    const userId = req.user.id;
    return this.ridesService.createRide(userId, createRideDto);
  }

  /**
   * GET /api/rides - Obtener viajes del usuario
   */
  @Get()
  async getUserRides(@Request() req, @Query('role') role: 'passenger' | 'driver') {
    const userId = req.user.id;
    const userRole = role || req.user.role;
    return this.ridesService.getUserRides(userId, userRole);
  }

  /**
   * GET /api/rides/:id - Obtener viaje por ID
   */
  @Get(':id')
  async getRide(@Param('id') id: number) {
    return this.ridesService.getRideById(id);
  }

  /**
   * GET /api/rides/:id/drivers - Buscar conductores disponibles
   */
  @Get(':id/drivers')
  async findDrivers(@Param('id') id: number) {
    return this.ridesService.findDriversForRide(id);
  }

  /**
   * POST /api/rides/:id/assign - Asignar conductor (para conductores)
   */
  @Post(':id/assign')
  async assignDriver(@Param('id') rideId: number, @Request() req) {
    const driverId = req.user.id;
    return this.ridesService.assignDriverToRide(rideId, driverId);
  }

  /**
   * POST /api/rides/:id/start - Iniciar viaje (conductor)
   */
  @Post(':id/start')
  async startRide(@Param('id') rideId: number, @Request() req) {
    const driverId = req.user.id;
    return this.ridesService.startRide(rideId, driverId);
  }

  /**
   * POST /api/rides/:id/complete - Completar viaje (conductor)
   */
  @Post(':id/complete')
  async completeRide(@Param('id') rideId: number, @Request() req) {
    const driverId = req.user.id;
    return this.ridesService.completeRide(rideId, driverId);
  }

  /**
   * POST /api/rides/:id/cancel - Cancelar viaje
   */
  @Post(':id/cancel')
  async cancelRide(
    @Param('id') rideId: number,
    @Request() req,
    @Body('reason') reason: string,
  ) {
    const userId = req.user.id;
    return this.ridesService.cancelRide(rideId, userId, reason);
  }

  /**
   * POST /api/rides/:id/rate - Calificar viaje
   */
  @Post(':id/rate')
  async rateRide(
    @Param('id') rideId: number,
    @Request() req,
    @Body('rating') rating: number,
    @Body('comment') comment: string,
  ) {
    const userId = req.user.id;
    return this.ridesService.rateRide(rideId, userId, rating, comment);
  }
}
