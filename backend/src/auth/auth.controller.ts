import { Controller, Post, Body, HttpCode, HttpStatus, Res, Get, UseGuards, Req, UseInterceptors, UploadedFile, Put } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from './guards/auth.guard';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('photo'))
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
    @UploadedFile() photo?: MulterFile,
  ) {
    const result = await this.authService.register(registerDto, photo);
    
    // Token'ı cookie'ye set et
    if (result.token) {
      res.cookie('access_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 dakika
      });
    }
    
    // Token'ı response'dan çıkar (güvenlik için)
    const { token, ...userData } = result;
    return userData;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    
    // Token'ı cookie'ye set et
    res.cookie('access_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 dakika
    });
    
    // Token'ı response'dan çıkar (güvenlik için)
    const { token, ...userData } = result;
    return userData;
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@Req() req: Request & { user?: { userId: number; roleType?: string } }) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('Kullanıcı bilgisi bulunamadı');
    }
    return this.authService.getCurrentUser(userId);
  }

  @Put('profile')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('photo'))
  async updateProfile(
    @Req() req: Request & { user?: { userId: number; roleType?: string } },
    @UploadedFile() photo?: MulterFile,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('Kullanıcı bilgisi bulunamadı');
    }
    
    // FormData'dan gelen verileri parse et
    const updateProfileDto: UpdateProfileDto = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: req.body.password || undefined,
      phoneNumber: req.body.phoneNumber || undefined,
      removePhoto: req.body.removePhoto === 'true',
    };
    
    return this.authService.updateProfile(userId, updateProfileDto, photo);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    // Cookie'yi temizle
    res.cookie('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });
    
    return { message: 'Başarıyla çıkış yapıldı' };
  }
}
