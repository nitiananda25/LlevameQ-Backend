import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as request from 'supertest';

describe('Full Journey E2E (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  // Test users
  let passengerToken: string;
  let driverToken: string;
  let passengerId: number;
  let driverId: number;
  let rideId: number;

  const passengerData = {
    email: 'passenger@test.com',
    password: 'password123',
    name: 'Test Passenger',
    phone: '+1234567890',
    role: 'passenger',
  };

  const driverData = {
    email: 'driver@test.com',
    password: 'password123',
    name: 'Test Driver',
    phone: '+1234567891',
    role: 'driver',
    vehiclePlate: 'ABC-123',
    vehicleModel: 'Honda PCX',
  };

  const rideData = {
    originLat: 4.711,
    originLng: -74.0721,
    originAddress: 'Carrera 7 # 71-21, Bogotá',
    destinationLat: 4.7525,
    destinationLng: -74.0775,
    destinationAddress: 'Carrera 11 # 93-30, Bogotá',
    paymentMethod: 'cash',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    dataSource = app.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // Clean up database
    if (dataSource) {
      await dataSource.query('DELETE FROM rides');
      await dataSource.query('DELETE FROM users');
    }
    await app.close();
  });

  describe('Step 1: Register Users', () => {
    it('should register a passenger', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(passengerData)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user).toHaveProperty('id');
      passengerToken = response.body.access_token;
      passengerId = response.body.user.id;
    });

    it('should register a driver', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(driverData)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user).toHaveProperty('id');
      driverToken = response.body.access_token;
      driverId = response.body.user.id;
    });
  });

  describe('Step 2: Login Users', () => {
    it('should login passenger', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: passengerData.email, password: passengerData.password })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      passengerToken = response.body.access_token;
    });

    it('should login driver', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: driverData.email, password: driverData.password })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      driverToken = response.body.access_token;
    });
  });

  describe('Step 3: Passenger creates a ride', () => {
    it('should create a new ride request', async () => {
      const response = await request(app.getHttpServer())
        .post('/rides')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send(rideData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('SEARCHING');
      expect(response.body.passengerId).toBe(passengerId);
      rideId = response.body.id;
    });

    it('should fail if passenger has active ride', async () => {
      const response = await request(app.getHttpServer())
        .post('/rides')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send(rideData)
        .expect(400);

      expect(response.body.message).toContain('ya tienes un viaje activo');
    });
  });

  describe('Step 4: Driver accepts the ride', () => {
    it('should assign driver to ride', async () => {
      const response = await request(app.getHttpServer())
        .post(`/rides/${rideId}/assign`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(201);

      expect(response.body.status).toBe('DRIVER_ASSIGNED');
      expect(response.body.driverId).toBe(driverId);
    });

    it('should fail if ride already has driver', async () => {
      const response = await request(app.getHttpServer())
        .post(`/rides/${rideId}/assign`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(400);

      expect(response.body.message).toContain('conductor asignado');
    });
  });

  describe('Step 5: Driver starts the ride', () => {
    it('should start the ride', async () => {
      const response = await request(app.getHttpServer())
        .post(`/rides/${rideId}/start`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(201);

      expect(response.body.status).toBe('IN_PROGRESS');
    });

    it('should fail if ride not in ASSIGNED status', async () => {
      const response = await request(app.getHttpServer())
        .post(`/rides/${rideId}/start`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(400);

      expect(response.body.message).toContain('no puede iniciar');
    });
  });

  describe('Step 6: Driver completes the ride', () => {
    it('should complete the ride', async () => {
      const response = await request(app.getHttpServer())
        .post(`/rides/${rideId}/complete`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(201);

      expect(response.body.status).toBe('COMPLETED');
      expect(response.body).toHaveProperty('finalPrice');
      expect(response.body).toHaveProperty('actualDurationMinutes');
    });

    it('should fail if ride not in progress', async () => {
      const response = await request(app.getHttpServer())
        .post(`/rides/${rideId}/complete`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(400);

      expect(response.body.message).toContain('no puede completar');
    });
  });

  describe('Step 7: Verify ride history', () => {
    it('should get ride details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rides/${rideId}`)
        .set('Authorization', `Bearer ${passengerToken}`)
        .expect(200);

      expect(response.body.id).toBe(rideId);
      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.driverId).toBe(driverId);
      expect(response.body.passengerId).toBe(passengerId);
    });

    it('should get passenger ride history', async () => {
      const response = await request(app.getHttpServer())
        .get('/rides')
        .set('Authorization', `Bearer ${passengerToken}`)
        .query('role=passenger')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].status).toBe('COMPLETED');
    });

    it('should get driver ride history', async () => {
      const response = await request(app.getHttpServer())
        .get('/rides')
        .set('Authorization', `Bearer ${driverToken}`)
        .query('role=driver')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].status).toBe('COMPLETED');
    });
  });

  describe('Step 8: Passenger can create new ride after completion', () => {
    it('should allow new ride after completion', async () => {
      const newRideData = {
        ...rideData,
        originLat: 4.7525,
        originLng: -74.0775,
        destinationLat: 4.711,
        destinationLng: -74.0721,
      };

      const response = await request(app.getHttpServer())
        .post('/rides')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send(newRideData)
        .expect(201);

      expect(response.body.status).toBe('SEARCHING');

      // Clean up - cancel the new ride
      await request(app.getHttpServer())
        .post(`/rides/${response.body.id}/cancel`)
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ reason: 'Test completed' });
    });
  });

  describe('Step 9: Cancel ride scenario', () => {
    it('should allow passenger to cancel ride', async () => {
      // Create a new ride to cancel
      const createResponse = await request(app.getHttpServer())
        .post('/rides')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send(rideData)
        .expect(201);

      const newRideId = createResponse.body.id;

      const cancelResponse = await request(app.getHttpServer())
        .post(`/rides/${newRideId}/cancel`)
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ reason: 'Changed plans' })
        .expect(201);

      expect(cancelResponse.body.status).toBe('CANCELLED');
    });
  });
});
