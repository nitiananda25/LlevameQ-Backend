import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Post,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { DriverStatus } from './entities/user.entity';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me')
  async updateProfile(@Request() req, @Body() updates: any) {
    return this.usersService.updateProfile(req.user.id, updates);
  }

  @Post('driver/status')
  async updateDriverStatus(
    @Request() req,
    @Body('status') status: DriverStatus,
  ) {
    return this.usersService.updateDriverStatus(req.user.id, status);
  }

  @Post('location')
  async updateLocation(
    @Request() req,
    @Body('lat') lat: number,
    @Body('lng') lng: number,
  ) {
    return this.usersService.updateLocation(req.user.id, lat, lng);
  }

  @Get('driver/stats')
  async getDriverStats(@Request() req) {
    return this.usersService.getDriverStats(req.user.id);
  }
}
