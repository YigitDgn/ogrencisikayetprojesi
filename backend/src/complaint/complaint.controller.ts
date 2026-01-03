import { Controller, Get, Post, Delete, Body, ParseIntPipe, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ComplaintService } from './complaint.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';

// Geçici olarak guard kullanmıyoruz, userId'yi body'den alacağız
// Production'da JWT guard kullanılmalı
@Controller('complaint')
export class ComplaintController {
  constructor(private readonly complaintService: ComplaintService) {}

  @Get('types')
  async getComplaintTypes() {
    return this.complaintService.getComplaintTypes();
  }

  @Get('courses')
  async getCourses() {
    return this.complaintService.getCourses();
  }

  @Post()
  async createComplaint(
    @Body() createComplaintDto: CreateComplaintDto & { userId: number },
  ) {
    const { userId, ...complaintData } = createComplaintDto;
    return this.complaintService.createComplaint(userId, complaintData);
  }

  @Get('student/:userId')
  async getStudentComplaints(@Param('userId', ParseIntPipe) userId: number) {
    return this.complaintService.getStudentComplaints(userId);
  }

  @Get('public')
  async getPublicComplaints() {
    return this.complaintService.getPublicComplaints(3);
  }

  @Delete(':complaintId')
  @HttpCode(HttpStatus.OK)
  async deleteComplaint(
    @Param('complaintId', ParseIntPipe) complaintId: number,
    @Body() body: { userId: number },
  ) {
    return this.complaintService.deleteComplaint(body.userId, complaintId);
  }
}

