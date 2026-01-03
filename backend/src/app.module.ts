import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ComplaintModule } from './complaint/complaint.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'yigit',
      password: '123456',
      database: 'ogrencisikayet',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Development için - production'da false olmalı
    }),
    AuthModule,
    AdminModule,
    ComplaintModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
