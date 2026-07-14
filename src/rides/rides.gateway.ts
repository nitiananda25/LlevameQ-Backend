import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

interface LocationUpdate {
  lat: number;
  lng: number;
  rideId: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class RidesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RidesGateway.name);
  private connectedUsers = new Map<string, number>(); // socketId -> userId
  private userSockets = new Map<number, string>(); // userId -> socketId

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);
      this.userSockets.delete(userId);
      this.logger.log(`Usuario ${userId} desconectado`);
    }
  }

  /**
   * Cliente se autentica y se une a su sala personal
   */
  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number },
  ) {
    const { userId } = data;
    
    this.connectedUsers.set(client.id, userId);
    this.userSockets.set(userId, client.id);
    
    // Unir a sala personal del usuario
    client.join(`user:${userId}`);
    
    this.logger.log(`Usuario ${userId} autenticado`);
    
    return { status: 'authenticated', userId };
  }

  /**
   * Unirse a sala de un viaje específico
   */
  @SubscribeMessage('join-ride')
  async handleJoinRide(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rideId: number },
  ) {
    const { rideId } = data;
    const userId = this.connectedUsers.get(client.id);

    if (!userId) {
      return { error: 'No autenticado' };
    }

    client.join(`ride:${rideId}`);
    
    this.logger.log(`Usuario ${userId} se unió al viaje ${rideId}`);
    
    return { status: 'joined', rideId };
  }

  /**
   * Salir de sala de viaje
   */
  @SubscribeMessage('leave-ride')
  async handleLeaveRide(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rideId: number },
  ) {
    const { rideId } = data;
    client.leave(`ride:${rideId}`);
    
    this.logger.log(`Cliente ${client.id} salió del viaje ${rideId}`);
    
    return { status: 'left', rideId };
  }

  /**
   * Actualizar ubicación del conductor
   */
  @SubscribeMessage('update-location')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LocationUpdate,
  ) {
    const userId = this.connectedUsers.get(client.id);

    if (!userId) {
      return { error: 'No autenticado' };
    }

    const { lat, lng, rideId } = data;

    // Actualizar ubicación en base de datos
    await this.userRepository.update(userId, {
      currentLat: lat,
      currentLng: lng,
      lastLocationUpdate: new Date(),
    });

    // Broadcast a todos en la sala del viaje
    this.server.to(`ride:${rideId}`).emit('location-updated', {
      userId,
      lat,
      lng,
      timestamp: new Date(),
    });

    this.logger.debug(`Ubicación actualizada: Usuario ${userId}, Viaje ${rideId}`);

    return { status: 'location-updated' };
  }

  /**
   * Notificar nuevo viaje a conductores cercanos
   */
  notifyNewRide(driverIds: number[], rideData: any) {
    driverIds.forEach((driverId) => {
      this.server.to(`user:${driverId}`).emit('new-ride-request', rideData);
    });

    this.logger.log(`Nueva solicitud de viaje notificada a ${driverIds.length} conductores`);
  }

  /**
   * Notificar asignación de conductor a pasajero
   */
  notifyDriverAssigned(passengerId: number, driverData: any) {
    this.server.to(`user:${passengerId}`).emit('driver-assigned', driverData);
    this.logger.log(`Conductor asignado notificado a pasajero ${passengerId}`);
  }

  /**
   * Notificar cambio de estado del viaje
   */
  notifyRideStatusChange(rideId: number, status: string, data?: any) {
    this.server.to(`ride:${rideId}`).emit('ride-status-changed', {
      rideId,
      status,
      ...data,
      timestamp: new Date(),
    });

    this.logger.log(`Estado del viaje ${rideId} cambiado a: ${status}`);
  }

  /**
   * Enviar mensaje a un usuario específico
   */
  sendToUser(userId: number, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Enviar mensaje a todos en un viaje
   */
  sendToRide(rideId: number, event: string, data: any) {
    this.server.to(`ride:${rideId}`).emit(event, data);
  }
}
