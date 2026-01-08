import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint } from '../entities/complaint.entity';
import { ComplaintResponse } from '../entities/complaint-response.entity';
import { ComplaintType } from '../entities/complaint-type.entity';
import { Course } from '../entities/course.entity';
import { Student } from '../entities/student.entity';
import { Personnel } from '../entities/personnel.entity';
import { User } from '../auth/entities/user.entity';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { RespondComplaintDto } from './dto/respond-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { RejectComplaintDto } from './dto/reject-complaint.dto';
import { StudentResponseDto } from './dto/student-response.dto';

@Injectable()
export class ComplaintService {
  constructor(
    @InjectRepository(Complaint)
    private complaintRepository: Repository<Complaint>,
    @InjectRepository(ComplaintResponse)
    private complaintResponseRepository: Repository<ComplaintResponse>,
    @InjectRepository(ComplaintType)
    private complaintTypeRepository: Repository<ComplaintType>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Personnel)
    private personnelRepository: Repository<Personnel>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getComplaintById(complaintId: number) {
    const complaint = await this.complaintRepository.findOne({
      where: { complaintId },
      relations: [
        'student',
        'student.user',
        'complaintType',
        'course',
        'handledByPersonnel',
        'handledByPersonnel.user',
        'completedByPersonnel',
        'completedByPersonnel.user',
        'responses',
        'responses.respondedByPersonnel',
        'responses.respondedByPersonnel.user',
        'responses.respondedByUser',
      ],
    });

    if (!complaint) {
      throw new NotFoundException('Şikayet bulunamadı');
    }

    return complaint;
  }

  async getComplaintByCode(uniqueCode: string) {
    const complaint = await this.complaintRepository.findOne({
      where: { uniqueCode },
      relations: [
        'student',
        'student.user',
        'complaintType',
        'course',
        'handledByPersonnel',
        'handledByPersonnel.user',
        'completedByPersonnel',
        'completedByPersonnel.user',
        'responses',
        'responses.respondedByPersonnel',
        'responses.respondedByPersonnel.user',
        'responses.respondedByUser',
      ],
    });

    if (!complaint) {
      throw new NotFoundException('Şikayet bulunamadı');
    }

    return complaint;
  }

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

    // Benzersiz kod oluştur
    let uniqueCode = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // 10 karakterlik rastgele kod oluştur (harf ve rakam)
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      uniqueCode = '';
      for (let i = 0; i < 10; i++) {
        uniqueCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Kodun benzersiz olup olmadığını kontrol et
      const existing = await this.complaintRepository.findOne({
        where: { uniqueCode },
      });

      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new BadRequestException('Benzersiz kod oluşturulamadı. Lütfen tekrar deneyin.');
    }

    // Şikayeti oluştur
    const complaint = this.complaintRepository.create({
      studentId: student.studentId,
      complaintTypeId: createComplaintDto.complaintTypeId,
      courseId: createComplaintDto.courseId || undefined,
      title: createComplaintDto.title,
      description: createComplaintDto.description,
      status: 'beklemede',
      isPublic: createComplaintDto.isPublic === true, // Explicitly check for true
      isAnonymous: createComplaintDto.isAnonymous === true, // Explicitly check for true
      uniqueCode,
    });

    const savedComplaint = await this.complaintRepository.save(complaint);

    // İlişkileri yükle
    return this.complaintRepository.findOne({
      where: { complaintId: savedComplaint.complaintId },
      relations: [
        'student',
        'complaintType',
        'course',
        'handledByPersonnel',
        'responses',
        'responses.respondedByPersonnel',
        'responses.respondedByPersonnel.user',
        'responses.respondedByUser',
      ],
    });
  }

  async getStudentComplaints(
    userId: number,
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    // Öğrenciyi bul
    const student = await this.studentRepository.findOne({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException('Öğrenci bulunamadı');
    }

    // Query builder oluştur
    const queryBuilder = this.complaintRepository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.complaintType', 'complaintType')
      .leftJoinAndSelect('complaint.course', 'course')
      .leftJoinAndSelect('complaint.handledByPersonnel', 'handledByPersonnel')
      .leftJoinAndSelect('handledByPersonnel.user', 'user')
      .leftJoinAndSelect('complaint.responses', 'responses')
      .leftJoinAndSelect('responses.respondedByPersonnel', 'respondedByPersonnel')
      .leftJoinAndSelect('respondedByPersonnel.user', 'respondedByPersonnelUser')
      .leftJoinAndSelect('responses.respondedByUser', 'respondedByUser')
      .where('complaint.studentId = :studentId', { studentId: student.studentId });

    // Filtreleme
    if (status) {
      queryBuilder.andWhere('complaint.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(complaint.title LIKE :search OR complaint.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sıralama
    const validSortFields = ['createdAt', 'title', 'status', 'resolvedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`complaint.${sortField}`, sortOrder);

    // Sayfalama
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPublicComplaints(limit: number = 3, search?: string) {
    // Herkese açık şikayetleri getir
    const queryBuilder = this.complaintRepository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('complaint.complaintType', 'complaintType')
      .leftJoinAndSelect('complaint.course', 'course')
      .leftJoinAndSelect('complaint.handledByPersonnel', 'handledByPersonnel')
      .leftJoinAndSelect('handledByPersonnel.user', 'handledByPersonnelUser')
      .leftJoinAndSelect('complaint.responses', 'responses')
      .leftJoinAndSelect('responses.respondedByPersonnel', 'respondedByPersonnel')
      .leftJoinAndSelect('respondedByPersonnel.user', 'respondedByPersonnelUser')
      .leftJoinAndSelect('responses.respondedByUser', 'respondedByUser')
      .where('complaint.isPublic = :isPublic', { isPublic: true });

    // Arama (büyük küçük harf duyarsız)
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(complaint.title) LIKE LOWER(:search) OR LOWER(complaint.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('complaint.createdAt', 'DESC')
      .take(limit);

    const complaints = await queryBuilder.getMany();
    
    // Responses'ı her complaint için sırala
    complaints.forEach(complaint => {
      if (complaint.responses && complaint.responses.length > 0) {
        complaint.responses.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
    });
    
    return complaints;
  }

  async getPublicComplaintById(complaintId: number) {
    const complaint = await this.complaintRepository.findOne({
      where: { 
        complaintId,
        isPublic: true,
      },
      relations: [
        'student',
        'student.user',
        'complaintType',
        'course',
        'handledByPersonnel',
        'handledByPersonnel.user',
        'responses',
        'responses.respondedByPersonnel',
        'responses.respondedByPersonnel.user',
        'responses.respondedByUser',
      ],
    });

    if (!complaint) {
      throw new NotFoundException('Herkese açık şikayet bulunamadı');
    }

    // Responses'ı sırala
    if (complaint.responses && complaint.responses.length > 0) {
      complaint.responses.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    return complaint;
  }

  async getPublicComplaintByCode(uniqueCode: string) {
    const complaint = await this.complaintRepository.findOne({
      where: { 
        uniqueCode,
        isPublic: true,
      },
      relations: [
        'student',
        'student.user',
        'complaintType',
        'course',
        'handledByPersonnel',
        'handledByPersonnel.user',
        'responses',
        'responses.respondedByPersonnel',
        'responses.respondedByPersonnel.user',
        'responses.respondedByUser',
      ],
    });

    if (!complaint) {
      throw new NotFoundException('Herkese açık şikayet bulunamadı');
    }

    // Responses'ı sırala
    if (complaint.responses && complaint.responses.length > 0) {
      complaint.responses.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    return complaint;
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

  async deleteComplaintByAdmin(complaintId: number) {
    // Şikayeti bul
    const complaint = await this.complaintRepository.findOne({
      where: { complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Şikayet bulunamadı');
    }

    // Şikayeti sil
    await this.complaintRepository.remove(complaint);

    return { message: 'Şikayet başarıyla silindi' };
  }

  // Personel için bekleyen şikayetleri getir
  // Hem 'beklemede' durumundaki şikayetleri hem de öğrenci cevabı olan cevaplanmış şikayetleri gösterir
  // Kilitli şikayetleri sadece kilitleyen personel görebilir
  async getPendingComplaints(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    personnelId?: number,
    complaintTypeId?: number,
  ) {
    // Önce tüm ilgili şikayetleri çek (beklemede + cevaplandı)
    const queryBuilder = this.complaintRepository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('complaint.complaintType', 'complaintType')
      .leftJoinAndSelect('complaint.course', 'course')
      .leftJoinAndSelect('complaint.responses', 'responses')
      .leftJoinAndSelect('responses.respondedByPersonnel', 'respondedByPersonnel')
      .leftJoinAndSelect('respondedByPersonnel.user', 'respondedByPersonnelUser')
      .leftJoinAndSelect('responses.respondedByUser', 'respondedByUser')
      .leftJoinAndSelect('complaint.completedByPersonnel', 'completedByPersonnel')
      .leftJoinAndSelect('completedByPersonnel.user', 'completedByPersonnelUser')
      .where('complaint.status IN (:...statuses)', { statuses: ['beklemede', 'cevaplandı'] });

    // Arama
    if (search) {
      queryBuilder.andWhere(
        '(complaint.title LIKE :search OR complaint.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Şikayet tipi filtresi
    if (complaintTypeId) {
      queryBuilder.andWhere('complaint.complaintTypeId = :complaintTypeId', { complaintTypeId });
    }

    // Sıralama
    const validSortFields = ['createdAt', 'title', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`complaint.${sortField}`, sortOrder);

    // Tüm sonuçları al
    const allComplaints = await queryBuilder.getMany();

    // Filtrele: beklemede olanlar VEYA cevaplandı ama en son personnel response'a öğrenci cevabı olanlar
    // Bitirilmiş şikayetler gösterilmez
    const filteredComplaints = allComplaints.filter((complaint) => {
      // Bitirilmiş şikayetler gösterilmez
      if (complaint.completedByPersonnelId !== null) {
        return false;
      }

      if (complaint.status === 'beklemede') {
        return true;
      }
      
      if (complaint.status === 'cevaplandı' && complaint.responses && complaint.responses.length > 0) {
        // En son personnel response'u bul
        const personnelResponses = complaint.responses
          .filter((r) => r.personnelResponse !== null)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        if (personnelResponses.length > 0) {
          const lastPersonnelResponse = personnelResponses[0];
          // Eğer en son personnel response'a öğrenci cevabı varsa, bu şikayet pending'e düşer
          return lastPersonnelResponse.studentResponse !== null && lastPersonnelResponse.studentResponse.trim() !== '';
        }
      }
      
      return false;
    });

    // Sayfalama
    const skip = (page - 1) * limit;
    const total = filteredComplaints.length;
    const paginatedComplaints = filteredComplaints.slice(skip, skip + limit);

    return {
      data: paginatedComplaints,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Personel için cevaplanmış tüm şikayetleri getir (kim cevaplamış olursa olsun)
  async getPersonnelComplaints(
    personnelId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const queryBuilder = this.complaintRepository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('complaint.complaintType', 'complaintType')
      .leftJoinAndSelect('complaint.course', 'course')
      .leftJoinAndSelect('complaint.handledByPersonnel', 'handledByPersonnel')
      .leftJoinAndSelect('handledByPersonnel.user', 'personnelUser')
      .leftJoinAndSelect('complaint.responses', 'responses')
      .leftJoinAndSelect('responses.respondedByPersonnel', 'respondedByPersonnel')
      .leftJoinAndSelect('respondedByPersonnel.user', 'respondedByPersonnelUser')
      .leftJoinAndSelect('responses.respondedByUser', 'respondedByUser')
      .where('complaint.status IN (:...statuses)', { statuses: ['cevaplandı', 'reddedildi'] })
      .andWhere('complaint.completedByPersonnelId IS NULL');

    // Arama
    if (search) {
      queryBuilder.andWhere(
        '(complaint.title LIKE :search OR complaint.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sıralama
    const validSortFields = ['createdAt', 'title', 'status', 'resolvedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`complaint.${sortField}`, sortOrder);

    // Sayfalama
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Personel için tamamlanan şikayetleri getir
  async getCompletedComplaints(
    personnelId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const queryBuilder = this.complaintRepository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('complaint.complaintType', 'complaintType')
      .leftJoinAndSelect('complaint.course', 'course')
      .leftJoinAndSelect('complaint.handledByPersonnel', 'handledByPersonnel')
      .leftJoinAndSelect('handledByPersonnel.user', 'personnelUser')
      .leftJoinAndSelect('complaint.completedByPersonnel', 'completedByPersonnel')
      .leftJoinAndSelect('completedByPersonnel.user', 'completedByPersonnelUser')
      .leftJoinAndSelect('complaint.completedByUser', 'completedByUser')
      .leftJoinAndSelect('complaint.responses', 'responses')
      .leftJoinAndSelect('responses.respondedByPersonnel', 'respondedByPersonnel')
      .leftJoinAndSelect('respondedByPersonnel.user', 'respondedByPersonnelUser')
      .leftJoinAndSelect('responses.respondedByUser', 'respondedByUser')
      .where('complaint.status = :status', { status: 'tamamlandı' });

    // Arama
    if (search) {
      queryBuilder.andWhere(
        '(complaint.title LIKE :search OR complaint.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sıralama
    const validSortFields = ['createdAt', 'title', 'status', 'resolvedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`complaint.${sortField}`, sortOrder);

    // Toplam sayı
    const total = await queryBuilder.getCount();

    // Sayfalama
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const complaints = await queryBuilder.getMany();

    return {
      data: complaints,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Şikayeti cevapla (ilk cevap veya öğrenci yanıtına cevap)
  async respondToComplaint(
    complaintId: number,
    personnelId: number | null,
    respondDto: RespondComplaintDto,
    userId?: number, // Admin için userId
  ) {
    const complaint = await this.complaintRepository.findOne({
      where: { complaintId },
      relations: ['responses'],
    });

    if (!complaint) {
      throw new NotFoundException('Şikayet bulunamadı');
    }

      // Eğer şikayet bitirilmişse, işlem yapılamaz
      if (complaint.completedByPersonnelId !== null) {
        throw new BadRequestException('Bu şikayet bitirilmiş, işlem yapılamaz');
      }

    // ComplaintResponse oluştur - sadece ID'leri kullan, relation'ları set etme
    const complaintResponse = this.complaintResponseRepository.create({
      complaintId: complaint.complaintId, // Doğrudan ID'yi kullan
      respondedByPersonnelId: personnelId, // Admin için null olabilir
      respondedByUserId: userId || null, // Admin için userId'yi kaydet
      personnelResponse: respondDto.response,
    });

    await this.complaintResponseRepository.save(complaintResponse);

    // Eğer ilk cevap ise complaint'i güncelle
    if (complaint.status === 'beklemede') {
      // responses relation'ını temizle, çünkü TypeORM bunu güncellemeye çalışabilir
      const responses = complaint.responses;
      (complaint as any).responses = undefined;
      // Admin için handledByPersonnelId null kalabilir
      complaint.handledByPersonnelId = personnelId;
      complaint.status = 'cevaplandı';
      complaint.resolvedAt = new Date();
      await this.complaintRepository.save(complaint);
      // relation'ı geri yükle (gerekirse)
      complaint.responses = responses;
    }

    // İlişkileri yükle
    return this.complaintRepository.findOne({
      where: { complaintId },
      relations: [
        'student',
        'student.user',
        'complaintType',
        'course',
        'handledByPersonnel',
        'handledByPersonnel.user',
        'completedByPersonnel',
        'completedByPersonnel.user',
        'responses',
        'responses.respondedByPersonnel',
        'responses.respondedByPersonnel.user',
        'responses.respondedByUser',
      ],
    });
  }

  // Şikayeti reddet
  async rejectComplaint(
    complaintId: number,
    personnelId: number | null,
    rejectDto: RejectComplaintDto,
    userId?: number, // Admin için userId
  ) {
    const complaint = await this.complaintRepository.findOne({
      where: { complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Şikayet bulunamadı');
    }

      // Eğer şikayet bitirilmişse, işlem yapılamaz
      if (complaint.completedByPersonnelId !== null) {
        throw new BadRequestException('Bu şikayet bitirilmiş, işlem yapılamaz');
      }

    // ComplaintResponse oluştur (reddetme nedeni olarak) - sadece ID'leri kullan
    const complaintResponse = this.complaintResponseRepository.create({
      complaintId: complaint.complaintId, // Doğrudan ID'yi kullan
      respondedByPersonnelId: personnelId,
      respondedByUserId: userId || null, // Admin için userId'yi kaydet
      personnelResponse: rejectDto.reason,
    });

    await this.complaintResponseRepository.save(complaintResponse);

    // Complaint'i güncelle
    // responses relation'ını temizle, çünkü TypeORM bunu güncellemeye çalışabilir
    const responses = complaint.responses;
    (complaint as any).responses = undefined;
    complaint.handledByPersonnelId = personnelId;
    complaint.status = 'reddedildi';
    complaint.resolvedAt = new Date();

    await this.complaintRepository.save(complaint);
    // relation'ı geri yükle (gerekirse)
    complaint.responses = responses;

    // İlişkileri yükle
    return this.complaintRepository.findOne({
      where: { complaintId },
      relations: [
        'student',
        'student.user',
        'complaintType',
        'course',
        'handledByPersonnel',
        'handledByPersonnel.user',
        'completedByPersonnel',
        'completedByPersonnel.user',
        'responses',
        'responses.respondedByPersonnel',
        'responses.respondedByPersonnel.user',
        'responses.respondedByUser', // Admin bilgisi için
      ],
    });
  }

  // Şikayeti güncelle
  async updateComplaint(
    userId: number,
    complaintId: number,
    updateDto: UpdateComplaintDto,
  ) {
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
      throw new BadRequestException('Bu şikayeti düzenleme yetkiniz yok');
    }

    // Sadece beklemede durumundaki şikayetler düzenlenebilir
    if (complaint.status !== 'beklemede') {
      throw new BadRequestException('Sadece beklemede durumundaki şikayetler düzenlenebilir');
    }

    // Şikayet tipi kontrolü
    if (updateDto.complaintTypeId) {
      const complaintType = await this.complaintTypeRepository.findOne({
        where: { complaintTypeId: updateDto.complaintTypeId },
      });

      if (!complaintType) {
        throw new NotFoundException('Şikayet tipi bulunamadı');
      }

      if (complaintType.requiresCourse && !updateDto.courseId) {
        throw new BadRequestException('Bu şikayet tipi için ders seçimi zorunludur');
      }
    }

    // Ders kontrolü
    if (updateDto.courseId) {
      const course = await this.courseRepository.findOne({
        where: { courseId: updateDto.courseId },
      });

      if (!course) {
        throw new NotFoundException('Ders bulunamadı');
      }
    }

    // Güncelle
    complaint.title = updateDto.title;
    complaint.description = updateDto.description;
    if (updateDto.complaintTypeId) {
      complaint.complaintTypeId = updateDto.complaintTypeId;
    }
    if (updateDto.courseId !== undefined) {
      complaint.courseId = updateDto.courseId || null;
    }
    if (updateDto.isPublic !== undefined) {
      complaint.isPublic = updateDto.isPublic;
    }
    if (updateDto.isAnonymous !== undefined) {
      complaint.isAnonymous = updateDto.isAnonymous;
    }

    const savedComplaint = await this.complaintRepository.save(complaint);

    // İlişkileri yükle
    return this.complaintRepository.findOne({
      where: { complaintId: savedComplaint.complaintId },
      relations: [
        'complaintType',
        'course',
        'handledByPersonnel',
        'handledByPersonnel.user',
        'responses',
        'responses.respondedByPersonnel',
        'responses.respondedByPersonnel.user',
        'responses.respondedByUser',
      ],
    });
  }

  // Öğrenci yanıtı ekle
  async addStudentResponse(
    userId: number,
    complaintId: number,
    studentResponseDto: StudentResponseDto,
  ) {
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
      relations: ['student', 'responses'],
    });

    if (!complaint) {
      throw new NotFoundException('Şikayet bulunamadı');
    }

    // Şikayetin öğrenciye ait olduğunu kontrol et
    if (complaint.studentId !== student.studentId) {
      throw new BadRequestException('Bu şikayete yanıt verme yetkiniz yok');
    }

    // Eğer şikayet bitirilmişse, öğrenci cevap veremez
    if (complaint.completedByPersonnelId !== null) {
      throw new BadRequestException('Bu şikayet bitirilmiş, yanıt verilemez');
    }

    // Şikayetin cevaplanmış olması gerekir (en az bir personnel response olmalı)
    const hasPersonnelResponse = complaint.responses?.some(
      (r) => r.personnelResponse !== null,
    );

    if (!hasPersonnelResponse) {
      throw new BadRequestException('Bu şikayet henüz cevaplanmamış');
    }

    // En son personnel response'u bul ve öğrenci yanıtını ekle
    const lastResponse = complaint.responses
      .filter((r) => r.personnelResponse !== null)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    if (!lastResponse) {
      throw new BadRequestException('Personel cevabı bulunamadı');
    }

    // Öğrenci yanıtını güncelle
    lastResponse.studentResponse = studentResponseDto.response;
    await this.complaintResponseRepository.save(lastResponse);

    // İlişkileri yükle
    return this.complaintRepository.findOne({
      where: { complaintId },
      relations: [
        'student',
        'student.user',
        'complaintType',
        'course',
        'handledByPersonnel',
        'handledByPersonnel.user',
        'responses',
        'responses.respondedByPersonnel',
        'responses.respondedByPersonnel.user',
        'responses.respondedByUser',
      ],
    });
  }

  // Şikayeti bitir
  async completeComplaint(complaintId: number, personnelId: number | null, userId?: number) {
    const complaint = await this.complaintRepository.findOne({
      where: { complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Şikayet bulunamadı');
    }

    // Eğer zaten bitirilmişse
    if (complaint.completedByPersonnelId !== null || complaint.completedByUserId !== null) {
      throw new BadRequestException('Bu şikayet zaten bitirilmiş');
    }

    // Şikayeti bitir
    complaint.completedByPersonnelId = personnelId;
    complaint.completedByUserId = userId || null; // Admin için userId'yi kaydet
    complaint.status = 'tamamlandı';
    if (!complaint.resolvedAt) {
      complaint.resolvedAt = new Date();
    }
    await this.complaintRepository.save(complaint);

    // İlişkileri yükle
    return this.complaintRepository.findOne({
      where: { complaintId },
      relations: [
        'student',
        'student.user',
        'complaintType',
        'course',
        'handledByPersonnel',
        'handledByPersonnel.user',
        'completedByPersonnel',
        'completedByPersonnel.user',
        'completedByUser',
        'responses',
        'responses.respondedByPersonnel',
        'responses.respondedByPersonnel.user',
        'responses.respondedByUser',
      ],
    });
  }
}

