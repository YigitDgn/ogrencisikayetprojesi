import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Önce cookie'den token'ı al
    let token = request.cookies?.access_token;
    
    // Cookie yoksa Authorization header'dan al (fallback)
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    // Hala token yoksa eski yöntemi dene (geriye dönük uyumluluk)
    if (!token) {
      const userId = request.body?.userId || request.headers['x-user-id'];
      const roleType = request.body?.roleType || request.headers['x-role-type'];
      
      if (userId) {
        request.user = { userId: Number(userId), roleType };
        return true;
      }
      throw new UnauthorizedException('Yetkisiz erişim. Lütfen tekrar giriş yapın.');
    }

    try {
      // Token'ı doğrula
      const payload = this.jwtService.verify(token);
      request.user = {
        userId: payload.sub,
        email: payload.email,
        roleType: payload.roleType,
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Yetkisiz erişim. Lütfen tekrar giriş yapın.');
    }
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Önce cookie'den token'ı al
    let token = request.cookies?.access_token;
    
    // Cookie yoksa Authorization header'dan al (fallback)
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    // Hala token yoksa eski yöntemi dene (geriye dönük uyumluluk)
    if (!token) {
      let userId: string | number | undefined;
      let roleType: string | undefined;

      // Body kontrolü (JSON veya FormData)
      if (request.body) {
        if (request.body.userId) {
          userId = request.body.userId;
        }
        if (request.body.userRoleType) {
          roleType = request.body.userRoleType;
        } else if (request.body.roleType) {
          roleType = request.body.roleType;
        }
      }

      // Header kontrolü
      if (!userId) {
        userId = request.headers['x-user-id'];
      }
      if (!roleType) {
        roleType = request.headers['x-role-type'];
      }

      if (!userId) {
        throw new UnauthorizedException('Yetkisiz erişim. Lütfen tekrar giriş yapın.');
      }

      if (roleType !== 'admin') {
        throw new ForbiddenException('Bu işlem için admin yetkisi gerekli');
      }

      request.user = { userId: Number(userId), roleType };
      return true;
    }

    try {
      // Token'ı doğrula
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      
      // Veritabanından kullanıcının güncel roleType'ını kontrol et
      const user = await this.usersRepository.findOne({
        where: { userId },
        select: ['userId', 'email', 'roleType'],
      });
      
      if (!user) {
        throw new UnauthorizedException('Kullanıcı bulunamadı');
      }
      
      if (user.roleType !== 'admin') {
        throw new ForbiddenException('Bu işlem için admin yetkisi gerekli');
      }
      
      request.user = {
        userId: user.userId,
        email: user.email,
        roleType: user.roleType,
      };
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Yetkisiz erişim. Lütfen tekrar giriş yapın.');
    }
  }
}

