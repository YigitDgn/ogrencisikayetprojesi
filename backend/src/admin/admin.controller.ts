import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus, UseInterceptors, UploadedFile, UseGuards, Req, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminGuard } from '../auth/guards/auth.guard';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('roleType') roleType?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getAllUsers(pageNum, limitNum, search, roleType);
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('photo'))
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() photo?: MulterFile,
  ) {
    return this.adminService.createUser(createUserDto, photo);
  }

  @Put('users/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('photo'))
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @UploadedFile() photo?: MulterFile,
  ) {
    // FormData'dan gelen verileri parse et
    // E-posta değiştirilemez, bu yüzden DTO'ya dahil etmiyoruz
    const updateUserDto: UpdateUserDto = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: req.body.password || undefined,
      roleType: req.body.roleType && req.body.roleType.trim() !== '' ? req.body.roleType : undefined, // roleType boş string ise undefined yap
      phoneNumber: req.body.phoneNumber || undefined,
      removePhoto: req.body.removePhoto === 'true',
    };
    
    // Debug: roleType kontrolü
    console.log('UpdateUserDto roleType:', updateUserDto.roleType);
    console.log('Request body roleType:', req.body.roleType);
    console.log('Request body keys:', Object.keys(req.body));
    
    return this.adminService.updateUser(id, updateUserDto, photo);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  @Get('complaints')
  async getAllComplaints(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('complaintTypeId') complaintTypeId?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const complaintTypeIdNum = complaintTypeId ? parseInt(complaintTypeId, 10) : undefined;
    return this.adminService.getAllComplaints(
      pageNum,
      limitNum,
      status,
      search,
      sortBy || 'createdAt',
      sortOrder || 'DESC',
      complaintTypeIdNum,
    );
  }

  @Get('users/:userId/complaints')
  async getUserComplaints(@Param('userId', ParseIntPipe) userId: number) {
    return this.adminService.getUserComplaints(userId);
  }
}

