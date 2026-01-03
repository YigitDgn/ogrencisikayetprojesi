import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
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
  async getAllUsers() {
    return this.adminService.getAllUsers();
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

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  @Get('complaints')
  async getAllComplaints() {
    return this.adminService.getAllComplaints();
  }
}

