import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RidesModule } from './rides/rides.module';
import { User } from './users/entities/user.entity';
import { Ride } from './rides/entities/ride.entity';
import { Driver } from './rides/entities/driver.entity';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Base de datos TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isDevelopment = configService.get('NODE_ENV') === 'development';
        
        if (isDevelopment) {
          // Usar SQLite en desarrollo
          return {
            type: 'sqlite',
            database: 'lleevameq-dev.db',
            entities: [User, Ride, Driver],
            autoLoadEntities: true,
            synchronize: true,
            logging: false,
            // Configuración adicional para SQLite
            extra: {
              // Habilitar foreign keys
              pragma: ['foreign_keys = ON'],
            },
          };
        }

        // PostgreSQL para producción
        const databaseUrl = configService.get('DATABASE_URL');
        const config: any = {
          type: 'postgres',
          entities: [User, Ride, Driver],
          autoLoadEntities: true,
          synchronize: true, // ⚠️ Solo en desarrollo! En producción usar migrations
          logging: configService.get('NODE_ENV') === 'development',
          ssl: configService.get('NODE_ENV') === 'production' 
            ? { rejectUnauthorized: false }
            : false,
        };

        if (databaseUrl) {
          config.url = databaseUrl;
        } else {
          config.host = configService.get('DATABASE_HOST') || 'localhost';
          config.port = parseInt(configService.get('DATABASE_PORT') || '5432');
          config.username = configService.get('DATABASE_USER') || 'postgres';
          config.password = configService.get('DATABASE_PASSWORD') || 'postgres';
          config.database = configService.get('DATABASE_NAME') || 'lleevameq';
        }

        return config;
      },
      inject: [ConfigService],
    }),

    // Módulos de la aplicación
    AuthModule,
    UsersModule,
    RidesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
