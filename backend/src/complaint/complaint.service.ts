import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint } from '../entities/complaint.entity';
import { ComplaintType } from '../entities/complaint-type.entity';
import { Course } from '../entities/course.entity';
import { Student } from '../entities/student.entity';
import { CreateComplaintDto } from './dto/create-complaint.dto';

@Injectable()
export class ComplaintService {
  constructor(
    @InjectRepository(Complaint)
    private complaintRepository: Repository<Complaint>,
    @InjectRepository(ComplaintType)
    private complaintTypeRepository: Repository<ComplaintType>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async getComplaintTypes() {
    return this.complaintTypeRepository.find({
      order: { typeName: 'ASC' },
    });
  }

  async getCourses() {
    return this.courseRepository.find({
      relations: ['department'],
      order: { courseName: 'ASC' },
    });
  }

  async createComplaint(userId: number, createComplaintDto: CreateComplaintDto) {
    // Öğrenciyi bul
    const student = await this.studentRepository.findOne({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException('Öğrenci bulunamadı');
    }

    // Şikayet tipini kontrol et
    const complaintType = await this.complaintTypeRepository.findOne({
      where: { complaintTypeId: createComplaintDto.complaintTypeId },
    });

    if (!complaintType) {
      throw new NotFoundException('Şikayet tipi bulunamadı');
    }

    // Eğer şikayet tipi ders gerektiriyorsa, courseId zorunlu
    if (complaintType.requiresCourse && !createComplaintDto.courseId) {
      throw new BadRequestException('Bu şikayet tipi için ders seçimi zorunludur');
    }

    // Ders kontrolü (eğer seçildiyse)
    if (createComplaintDto.courseId) {
      const course = await this.courseRepository.findOne({
        where: { courseId: createComplaintDto.courseId },
      });

      if (!course) {
        throw new NotFoundException('Ders bulunamadı');
      }
    }

    // Şikayeti oluştur
    const complaint = this.complaintRepository.create({
      studentId: student.studentId,
      complaintTypeId: createComplaintDto.complaintTypeId,
      courseId: createComplaintDto.courseId || undefined,
      title: createComplaintDto.title,
      description: createComplaintDto.description,
      status: 'beklemede',
      isPublic: createComplaintDto.isPublic || false,
      isAnonymous: createComplaintDto.isAnonymous || false,
    });

    const savedComplaint = await this.complaintRepository.save(complaint);

    // İlişkileri yükle
    return this.complaintRepository.findOne({
      where: { complaintId: savedComplaint.complaintId },
      relations: ['student', 'complaintType', 'course', 'handledByPersonnel'],
    });
  }

  async getStudentComplaints(userId: number) {
    // Öğrenciyi bul
    const student = await this.studentRepository.findOne({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException('Öğrenci bulunamadı');
    }

    // Öğrencinin şikayetlerini getir
    return this.complaintRepository.find({
      where: { studentId: student.studentId },
      relations: ['complaintType', 'course', 'handledByPersonnel'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPublicComplaints(limit: number = 3) {
    // Herkese açık şikayetleri getir
    return this.complaintRepository.find({
      where: { isPublic: true },
      relations: ['student', 'complaintType', 'course'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async deleteComplaint(userId: number, complaintId: number) {
    // Öğrenciyi bul
    const student = await this.studentRepository.findOne({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException('Öğrenci bulunamadı');
    }

    // Şikayeti bul
    const complaint = await this.complaintRepository.findOne({
      where: { complaintId },
      relations: ['student'],
    });

    if (!complaint) {
      throw new NotFoundException('Şikayet bulunamadı');
    }

    // Şikayetin öğrenciye ait olduğunu kontrol et
    if (complaint.studentId !== student.studentId) {
      throw new BadRequestException('Bu şikayeti silme yetkiniz yok');
    }

    // Şikayeti sil
    await this.complaintRepository.remove(complaint);

    return { message: 'Şikayet başarıyla silindi' };
  }
}

