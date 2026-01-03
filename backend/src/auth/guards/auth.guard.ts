import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.body?.userId || request.headers['x-user-id'];
    const roleType = request.body?.roleType || request.headers['x-role-type'];

    if (!userId) {
      throw new UnauthorizedException('Kullanıcı kimliği gerekli');
    }

    // userId'yi request'e ekle
    request.user = { userId: Number(userId), roleType };

    return true;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // FormData'dan veya body'den veya header'dan al
    let userId: string | number | undefined;
    let roleType: string | undefined;

    // Body kontrolü (JSON veya FormData)
    if (request.body) {
      // FormData için - userRoleType veya roleType kontrolü
      if (request.body.userId) {
        userId = request.body.userId;
      }
      // FormData'da userRoleType kullanıyoruz (yeni kullanıcının roleType'ı ile karışmaması için)
      if (request.body.userRoleType) {
        roleType = request.body.userRoleType;
      } else if (request.body.roleType) {
        // Fallback olarak roleType'ı da kontrol et
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
      throw new UnauthorizedException('Kullanıcı kimliği gerekli');
    }

    if (roleType !== 'admin') {
      throw new ForbiddenException('Bu işlem için admin yetkisi gerekli');
    }

    // userId'yi request'e ekle
    request.user = { userId: Number(userId), roleType };

    return true;
  }
}

