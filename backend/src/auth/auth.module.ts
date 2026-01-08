import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard, AdminGuard } from './guards/auth.guard';
import { User } from './entities/user.entity';
import { Student } from '../entities/student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Student]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'c47fbacbd3347e64177e5bda3ab985bf9c1e27affbb74e67757f35357e94c4fc9d8c6d7b17e3c286e714334e6253b4be50be0d9a9e4f59555a79b63ddcffee59',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, AdminGuard],
  exports: [AuthService, JwtModule, AuthGuard, AdminGuard],
})
export class AuthModule {}
