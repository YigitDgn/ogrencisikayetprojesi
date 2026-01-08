import { Controller, Get, Post, Put, Delete, Body, ParseIntPipe, Param, HttpCode, HttpStatus, UseGuards, Req, ForbiddenException, NotFoundException, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplaintService } from './complaint.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { RespondComplaintDto } from './dto/respond-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { RejectComplaintDto } from './dto/reject-complaint.dto';
import { StudentResponseDto } from './dto/student-response.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Personnel } from '../entities/personnel.entity';

@Controller('complaint')
export class ComplaintController {
  constructor(
    private readonly complaintService: ComplaintService,
    @InjectRepository(Personnel)
    private personnelRepository: Repository<Personnel>,
  ) {}

  @Get('types')
  async getComplaintTypes() {
    return this.complaintService.getComplaintTypes();
  }

  @Get('courses')
  async getCourses() {
    return this.complaintService.getCourses();
  }

  @Get('public')
  async getPublicComplaints(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 3;
    return this.complaintService.getPublicComplaints(limitNum, search);
  }

  @Get('public/:id')
  async getPublicComplaintById(
    @Param('id') id: string,
  ) {
    // ID veya uniqueCode ile herkese açık şikayeti getir
    const complaintId = parseInt(id, 10);
    if (!isNaN(complaintId)) {
      return this.complaintService.getPublicComplaintById(complaintId);
    } else {
      return this.complaintService.getPublicComplaintByCode(id);
    }
  }

  @Post()
  async createComplaint(
    @Body() createComplaintDto: CreateComplaintDto & { userId: number },
  ) {
    const { userId, ...complaintData } = createComplaintDto;
    return this.complaintService.createComplaint(userId, complaintData);
  }

  @Get('student/:userId')
  async getStudentComplaints(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.complaintService.getStudentComplaints(
      userId,
      pageNum,
      limitNum,
      status,
      search,
      sortBy || 'createdAt',
      sortOrder || 'DESC',
    );
  }

  // Şikayet detayını getir (kod ile)
  @Get('code/:code')
  @UseGuards(AuthGuard)
  async getComplaintByCode(
    @Param('code') code: string,
    @Req() req: any,
  ) {
    // Sadece personnel ve admin erişebilir
    if (req.user.roleType !== 'personnel' && req.user.roleType !== 'admin') {
      throw new ForbiddenException('Bu işlem için yetkiniz yok');
    }
    return this.complaintService.getComplaintByCode(code);
  }

  // Şikayet detayını getir (ID ile - eski uyumluluk için)
  @Get(':complaintId')
  @UseGuards(AuthGuard)
  async getComplaintById(
    @Param('complaintId', ParseIntPipe) complaintId: number,
    @Req() req: any,
  ) {
    // Sadece personnel ve admin erişebilir
    if (req.user.roleType !== 'personnel' && req.user.roleType !== 'admin') {
      throw new ForbiddenException('Bu işlem için yetkiniz yok');
    }
    return this.complaintService.getComplaintById(complaintId);
  }

  @Delete(':complaintId')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteComplaint(
    @Param('complaintId', ParseIntPipe) complaintId: number,
    @Req() req: any,
  ) {
    // Admin ve öğrenci silebilir
    if (req.user.roleType === 'admin') {
      return this.complaintService.deleteComplaintByAdmin(complaintId);
    } else if (req.user.roleType === 'student') {
      return this.complaintService.deleteComplaint(req.user.userId, complaintId);
    } else {
      throw new ForbiddenException('Bu işlem için yetkiniz yok');
    }
  }

  // Personel için bekleyen şikayetleri getir
  @Get('personnel/pending')
  @UseGuards(AuthGuard)
  async getPendingComplaints(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('complaintTypeId') complaintTypeId?: string,
  ) {
    if (req.user.roleType !== 'personnel') {
      throw new ForbiddenException('Bu işlem için personel yetkisi gerekli');
    }

    const personnel = await this.personnelRepository.findOne({
      where: { userId: req.user.userId },
    });

    if (!personnel) {
      throw new NotFoundException('Personel bulunamadı');
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const complaintTypeIdNum = complaintTypeId ? parseInt(complaintTypeId, 10) : undefined;
    return this.complaintService.getPendingComplaints(
      pageNum,
      limitNum,
      search,
      sortBy || 'createdAt',
      sortOrder || 'DESC',
      personnel.personnelId,
      complaintTypeIdNum,
    );
  }

  // Personel için kendi cevapladığı şikayetleri getir
  @Get('personnel/my-complaints')
  @UseGuards(AuthGuard)
  async getMyComplaints(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    if (req.user.roleType !== 'personnel') {
      throw new ForbiddenException('Bu işlem için personel yetkisi gerekli');
    }

    const personnel = await this.personnelRepository.findOne({
      where: { userId: req.user.userId },
    });

    if (!personnel) {
      throw new NotFoundException('Personel bulunamadı');
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.complaintService.getPersonnelComplaints(
      personnel.personnelId,
      pageNum,
      limitNum,
      search,
      sortBy || 'createdAt',
      sortOrder || 'DESC',
    );
  }

  // Personel için tamamlanan şikayetleri getir
  @Get('personnel/completed')
  @UseGuards(AuthGuard)
  async getCompletedComplaints(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    if (req.user.roleType !== 'personnel') {
      throw new ForbiddenException('Bu işlem için personel yetkisi gerekli');
    }

    const personnel = await this.personnelRepository.findOne({
      where: { userId: req.user.userId },
    });

    if (!personnel) {
      throw new NotFoundException('Personel bulunamadı');
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.complaintService.getCompletedComplaints(
      personnel.personnelId,
      pageNum,
      limitNum,
      search,
      sortBy || 'createdAt',
      sortOrder || 'DESC',
    );
  }

  // Şikayeti cevapla
  @Post('personnel/:id/respond')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async respondToComplaint(
    @Param('id', ParseIntPipe) id: number,
    @Body() respondDto: RespondComplaintDto,
    @Req() req: any,
  ) {
    // Admin ve personnel erişebilir
    if (req.user.roleType !== 'personnel' && req.user.roleType !== 'admin') {
      throw new ForbiddenException('Bu işlem için personel veya admin yetkisi gerekli');
    }

    // Personnel için personnelId'yi bul, admin için null
    let personnelId: number | null = null;
    if (req.user.roleType === 'personnel') {
      const personnel = await this.personnelRepository.findOne({
        where: { userId: req.user.userId },
      });

      if (!personnel) {
        throw new NotFoundException('Personel bulunamadı');
      }
      personnelId = personnel.personnelId;
    }

    return this.complaintService.respondToComplaint(
      id,
      personnelId,
      respondDto,
      req.user.userId, // Admin için userId'yi geçir
    );
  }

  // Şikayeti reddet
  @Post('personnel/:id/reject')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async rejectComplaint(
    @Param('id', ParseIntPipe) id: number,
    @Body() rejectDto: RejectComplaintDto,
    @Req() req: any,
  ) {
    // Admin ve personnel erişebilir
    if (req.user.roleType !== 'personnel' && req.user.roleType !== 'admin') {
      throw new ForbiddenException('Bu işlem için personel veya admin yetkisi gerekli');
    }

    // Personnel için personnelId'yi bul, admin için null
    let personnelId: number | null = null;
    if (req.user.roleType === 'personnel') {
      const personnel = await this.personnelRepository.findOne({
        where: { userId: req.user.userId },
      });

      if (!personnel) {
        throw new NotFoundException('Personel bulunamadı');
      }
      personnelId = personnel.personnelId;
    }

    return this.complaintService.rejectComplaint(
      id,
      personnelId,
      rejectDto,
      req.user.userId, // Admin için userId'yi geçir
    );
  }

  // Şikayeti güncelle
  @Put(':complaintId')
  @HttpCode(HttpStatus.OK)
  async updateComplaint(
    @Param('complaintId', ParseIntPipe) complaintId: number,
    @Body() updateDto: UpdateComplaintDto & { userId: number },
  ) {
    const { userId, ...complaintData } = updateDto;
    return this.complaintService.updateComplaint(userId, complaintId, complaintData);
  }

  // Öğrenci yanıtı ekle
  @Post(':complaintId/student-response')
  @HttpCode(HttpStatus.OK)
  async addStudentResponse(
    @Param('complaintId', ParseIntPipe) complaintId: number,
    @Body() studentResponseDto: StudentResponseDto & { userId: number },
  ) {
    const { userId, ...responseData } = studentResponseDto;
    return this.complaintService.addStudentResponse(userId, complaintId, responseData);
  }

  // Şikayeti bitir
  @Post('personnel/:id/complete')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async completeComplaint(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    // Admin ve personnel erişebilir
    if (req.user.roleType !== 'personnel' && req.user.roleType !== 'admin') {
      throw new ForbiddenException('Bu işlem için personel veya admin yetkisi gerekli');
    }

    // Personnel için personnelId'yi bul, admin için null
    let personnelId: number | null = null;
    if (req.user.roleType === 'personnel') {
      const personnel = await this.personnelRepository.findOne({
        where: { userId: req.user.userId },
      });

      if (!personnel) {
        throw new NotFoundException('Personel bulunamadı');
      }
      personnelId = personnel.personnelId;
    }

    return this.complaintService.completeComplaint(id, personnelId, req.user.userId);
  }
}

