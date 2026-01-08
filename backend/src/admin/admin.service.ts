import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../auth/entities/user.entity';
import { Complaint } from '../entities/complaint.entity';
import { Student } from '../entities/student.entity';
import { Admin } from '../entities/admin.entity';
import { Personnel } from '../entities/personnel.entity';
import { Department } from '../entities/department.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Complaint)
    private complaintRepository: Repository<Complaint>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(Personnel)
    private personnelRepository: Repository<Personnel>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
  ) {}

  // Mevcut bir department bul veya oluştur
  private async getOrCreateDefaultDepartment(): Promise<Department> {
    // Önce departmentId=1 olan department'ı kontrol et
    let department = await this.departmentRepository.findOne({
      where: { departmentId: 1 },
    });

    if (!department) {
      // İlk department'ı bul (herhangi bir where koşulu olmadan)
      const departments = await this.departmentRepository.find({
        order: { departmentId: 'ASC' },
        take: 1,
      });
      department = departments.length > 0 ? departments[0] : null;

      // Hiç department yoksa varsayılan bir tane oluştur
      if (!department) {
        department = this.departmentRepository.create({
          departmentName: 'Genel Bölüm',
          departmentCode: 'GEN',
          facultyName: 'Genel Fakülte',
        });
        department = await this.departmentRepository.save(department);
      }
    }

    return department;
  }

  async getAllUsers(page: number = 1, limit: number = 10, search?: string, roleType?: string) {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.student', 'student')
      .leftJoinAndSelect('user.admin', 'admin')
      .leftJoinAndSelect('user.personnel', 'personnel');

    // Arama filtresi - büyük küçük harf ve Türkçe karakter duyarsız (boşluklar sayılır)
    if (search) {
      // Türkçe karakterleri normalize et (hem büyük hem küçük harfli)
      const normalizeTurkish = (text: string): string => {
        return text
          .toLowerCase()
          .replace(/ı/g, 'i')
          .replace(/ğ/g, 'g')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ö/g, 'o')
          .replace(/ç/g, 'c')
          .replace(/İ/g, 'i')
          .replace(/Ğ/g, 'g')
          .replace(/Ü/g, 'u')
          .replace(/Ş/g, 's')
          .replace(/Ö/g, 'o')
          .replace(/Ç/g, 'c');
      };
      
      // Sadece baş/son boşlukları kaldır ve normalize et (aradaki boşluklar korunur)
      const normalizedSearch = normalizeTurkish(search.trim());
      
      // Veritabanındaki verileri de normalize ederek arama yap
      // PostgreSQL'de REPLACE kullanarak Türkçe karakterleri normalize ediyoruz (hem büyük hem küçük)
      // Boşluklar korunur ve LIKE ile kısmi eşleşme yapılır
      // Ad ve soyadı birleştirerek de arama yapıyoruz (boşlukla birleştirilmiş)
      queryBuilder.where(
        `(
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(user.firstName, 'ı', 'i'), 'İ', 'i'), 'ğ', 'g'), 'Ğ', 'g'), 'ü', 'u'), 'Ü', 'u'), 'ş', 's'), 'Ş', 's'), 'ö', 'o'), 'Ö', 'o'), 'ç', 'c'), 'Ç', 'c')) LIKE :search OR
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(user.lastName, 'ı', 'i'), 'İ', 'i'), 'ğ', 'g'), 'Ğ', 'g'), 'ü', 'u'), 'Ü', 'u'), 'ş', 's'), 'Ş', 's'), 'ö', 'o'), 'Ö', 'o'), 'ç', 'c'), 'Ç', 'c')) LIKE :search OR
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(user.email, 'ı', 'i'), 'İ', 'i'), 'ğ', 'g'), 'Ğ', 'g'), 'ü', 'u'), 'Ü', 'u'), 'ş', 's'), 'Ş', 's'), 'ö', 'o'), 'Ö', 'o'), 'ç', 'c'), 'Ç', 'c')) LIKE :search OR
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(user.firstName || ' ' || user.lastName, 'ı', 'i'), 'İ', 'i'), 'ğ', 'g'), 'Ğ', 'g'), 'ü', 'u'), 'Ü', 'u'), 'ş', 's'), 'Ş', 's'), 'ö', 'o'), 'Ö', 'o'), 'ç', 'c'), 'Ç', 'c')) LIKE :search
        )`,
        { search: `%${normalizedSearch}%` }
      );
    }

    // Rol filtresi
    if (roleType && roleType !== 'all') {
      if (search) {
        queryBuilder.andWhere('user.roleType = :roleType', { roleType });
      } else {
        queryBuilder.where('user.roleType = :roleType', { roleType });
      }
    }

    // Toplam sayıyı al
    const total = await queryBuilder.getCount();

    // Sayfalama ve sıralama
    const users = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Her öğrenci için şikayet sayısını al
    const usersWithComplaintCount = await Promise.all(
      users.map(async (user) => {
        let complaintCount = 0;
        if (user.student) {
          complaintCount = await this.complaintRepository.count({
            where: { studentId: user.student.studentId },
          });
        }
        return {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roleType: user.roleType,
          phoneNumber: user.phoneNumber,
          createdAt: user.createdAt,
          photo: user.photo || null,
          student: user.student || null,
          admin: user.admin || null,
          personnel: user.personnel || null,
          complaintCount,
        };
      })
    );

    return {
      data: usersWithComplaintCount,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteUser(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { userId },
      relations: ['student', 'admin', 'personnel'],
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Öğrenci ise önce şikayetlerini sil
    if (user.student) {
      const complaints = await this.complaintRepository.find({
        where: { studentId: user.student.studentId },
      });
      if (complaints.length > 0) {
        await this.complaintRepository.remove(complaints);
      }
    }

    // Fotoğrafı sil (varsa)
    if (user.photo) {
      const photoPath = path.join(process.cwd(), user.photo.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    // İlişkili kayıtları sil
    if (user.student) {
      await this.studentRepository.remove(user.student);
    }
    if (user.admin) {
      await this.adminRepository.remove(user.admin);
    }
    if (user.personnel) {
      // Personnel'e ait şikayetleri kontrol et (eğer handledByPersonnelId varsa)
      const handledComplaints = await this.complaintRepository.find({
        where: { handledByPersonnelId: user.personnel.personnelId },
      });
      if (handledComplaints.length > 0) {
        // Şikayetlerin handledByPersonnelId'sini null yap
        for (const complaint of handledComplaints) {
          complaint.handledByPersonnelId = null;
          await this.complaintRepository.save(complaint);
        }
      }
      await this.personnelRepository.remove(user.personnel);
    }

    // User'ı sil
    await this.usersRepository.remove(user);

    return { message: 'Kullanıcı başarıyla silindi' };
  }

  async getAllComplaints(
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    complaintTypeId?: number,
  ) {
    const queryBuilder = this.complaintRepository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.student', 'student')
      .leftJoinAndSelect('student.user', 'studentUser')
      .leftJoinAndSelect('complaint.complaintType', 'complaintType')
      .leftJoinAndSelect('complaint.course', 'course')
      .leftJoinAndSelect('complaint.handledByPersonnel', 'handledByPersonnel')
      .leftJoinAndSelect('handledByPersonnel.user', 'handledByPersonnelUser')
      .leftJoinAndSelect('complaint.completedByPersonnel', 'completedByPersonnel')
      .leftJoinAndSelect('completedByPersonnel.user', 'completedByPersonnelUser')
      .leftJoinAndSelect('complaint.completedByUser', 'completedByUser')
      .leftJoinAndSelect('complaint.responses', 'responses')
      .leftJoinAndSelect('responses.respondedByPersonnel', 'respondedByPersonnel')
      .leftJoinAndSelect('respondedByPersonnel.user', 'respondedByPersonnelUser')
      .leftJoinAndSelect('responses.respondedByUser', 'respondedByUser');

    // Status filtresi
    if (status === 'pending' || status === 'beklemede') {
      queryBuilder.where('complaint.status = :status', { status: 'beklemede' });
    } else if (status === 'answered' || status === 'cevaplandı') {
      queryBuilder.where('complaint.status = :status', { status: 'cevaplandı' });
    } else if (status === 'completed' || status === 'tamamlandı') {
      queryBuilder.where('complaint.status = :status', { status: 'tamamlandı' });
    } else if (status === 'rejected' || status === 'reddedildi') {
      queryBuilder.where('complaint.status = :status', { status: 'reddedildi' });
    }

    // Arama
    if (search) {
      queryBuilder.andWhere(
        '(complaint.title LIKE :search OR complaint.description LIKE :search OR studentUser.firstName LIKE :search OR studentUser.lastName LIKE :search OR studentUser.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Tip filtresi
    if (complaintTypeId) {
      queryBuilder.andWhere('complaint.complaintTypeId = :complaintTypeId', { complaintTypeId });
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

  async getUserComplaints(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { userId },
      relations: ['student'],
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (!user.student) {
      return {
        data: [],
        total: 0,
      };
    }

    const complaints = await this.complaintRepository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.student', 'student')
      .leftJoinAndSelect('student.user', 'studentUser')
      .leftJoinAndSelect('complaint.complaintType', 'complaintType')
      .leftJoinAndSelect('complaint.course', 'course')
      .leftJoinAndSelect('complaint.handledByPersonnel', 'handledByPersonnel')
      .leftJoinAndSelect('handledByPersonnel.user', 'handledByPersonnelUser')
      .leftJoinAndSelect('complaint.responses', 'responses')
      .leftJoinAndSelect('responses.respondedByPersonnel', 'respondedByPersonnel')
      .leftJoinAndSelect('respondedByPersonnel.user', 'respondedByPersonnelUser')
      .leftJoinAndSelect('responses.respondedByUser', 'respondedByUser')
      .where('complaint.studentId = :studentId', { studentId: user.student.studentId })
      .orderBy('complaint.createdAt', 'DESC')
      .getMany();

    return {
      data: complaints,
      total: complaints.length,
    };
  }

  async createUser(createUserDto: CreateUserDto, photo?: { buffer: Buffer; originalname: string }) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Bu e-posta adresi zaten kullanılıyor');
    }

    // Fotoğrafı uploads klasörüne kaydet
    let photoPath: string | undefined = undefined;
    if (photo) {
      // uploads klasörünü oluştur (yoksa)
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Dosya adını oluştur (timestamp + originalname)
      const fileExt = path.extname(photo.originalname);
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
      const filePath = path.join(uploadsDir, fileName);

      // Dosyayı kaydet
      fs.writeFileSync(filePath, photo.buffer);
      
      // Sadece dosya yolunu kaydet
      photoPath = `/uploads/${fileName}`;
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      email: createUserDto.email,
      password: hashedPassword,
      roleType: createUserDto.roleType,
      phoneNumber: createUserDto.phoneNumber || undefined,
      photo: photoPath,
    });

    const savedUser = await this.usersRepository.save(user);

    // Rol tipine göre ilgili tabloya kayıt oluştur
    if (createUserDto.roleType === 'student') {
      const student = this.studentRepository.create({
        userId: savedUser.userId,
        studentNumber: `STU${savedUser.userId}`,
        enrollmentYear: new Date().getFullYear(),
        currentYear: 1,
      });
      await this.studentRepository.save(student);
    } else if (createUserDto.roleType === 'admin') {
      const admin = this.adminRepository.create({
        userId: savedUser.userId,
        adminLevel: 'admin',
        permissions: undefined,
      });
      await this.adminRepository.save(admin);
    } else if (createUserDto.roleType === 'personnel') {
      // Personnel için department bul veya oluştur
      const department = await this.getOrCreateDefaultDepartment();
      const personnel = this.personnelRepository.create({
        userId: savedUser.userId,
        employeeNumber: `EMP${savedUser.userId}`,
        position: 'Personel',
        departmentId: department.departmentId,
        hireDate: new Date(),
      });
      await this.personnelRepository.save(personnel);
    }

    // İlişkileri yükle
    const userWithRelations = await this.usersRepository.findOne({
      where: { userId: savedUser.userId },
      relations: ['student', 'admin', 'personnel'],
    });

    return {
      userId: savedUser.userId,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      email: savedUser.email,
      roleType: savedUser.roleType,
      student: userWithRelations?.student || null,
      admin: userWithRelations?.admin || null,
      personnel: userWithRelations?.personnel || null,
    };
  }

  async updateUser(userId: number, updateUserDto: UpdateUserDto, photo?: { buffer: Buffer; originalname: string }) {
    let user = await this.usersRepository.findOne({
      where: { userId },
      relations: ['student', 'admin', 'personnel'],
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // E-posta değiştirilemez - güvenlik nedeniyle kilitli

    // Fotoğraf güncellemesi
    let photoPath: string | undefined | null = undefined;
    if (updateUserDto.removePhoto) {
      // Fotoğrafı kaldır
      if (user.photo) {
        const oldPhotoPath = path.join(process.cwd(), user.photo.replace('/uploads/', 'uploads/'));
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      photoPath = null; // null olarak işaretle
    } else if (photo) {
      // Eski fotoğrafı sil
      if (user.photo) {
        const oldPhotoPath = path.join(process.cwd(), user.photo.replace('/uploads/', 'uploads/'));
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }

      // Yeni fotoğrafı kaydet
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileExt = path.extname(photo.originalname);
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, photo.buffer);
      photoPath = `/uploads/${fileName}`;
    }

    // Kullanıcı bilgilerini güncelle
    if (updateUserDto.firstName !== undefined) {
      user.firstName = updateUserDto.firstName;
    }
    if (updateUserDto.lastName !== undefined) {
      user.lastName = updateUserDto.lastName;
    }
    // E-posta değiştirilemez - güvenlik nedeniyle kilitli
    if (updateUserDto.password !== undefined) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    if (updateUserDto.phoneNumber !== undefined) {
      user.phoneNumber = updateUserDto.phoneNumber;
    }
    if (photoPath !== undefined) {
      user.photo = photoPath as any;
    }

    // Rol değişikliği kontrolü
    // roleType her zaman gönderilmeli, undefined değilse ve değişmişse güncelle
    console.log('Current user roleType:', user.roleType);
    console.log('UpdateUserDto roleType:', updateUserDto.roleType);
    console.log('Role change needed?', updateUserDto.roleType !== undefined && updateUserDto.roleType !== user.roleType);
    
    if (updateUserDto.roleType !== undefined && updateUserDto.roleType !== user.roleType) {
      // Önce user entity'sindeki tüm ilişkileri temizle (save işleminden önce)
      const userId = user.userId;
      const studentId = user.student?.studentId;
      const adminId = user.admin?.adminId;
      const personnelId = user.personnel?.personnelId;
      
      // User entity'sindeki ilişkileri temizle
      (user as any).student = undefined;
      (user as any).admin = undefined;
      (user as any).personnel = undefined;
      
      // RoleType'ı güncelle
      user.roleType = updateUserDto.roleType;
      
      // User'ı kaydet (roleType güncellemesi için - ilişkiler temizlendiği için sorun olmayacak)
      await this.usersRepository.save(user);
      
      // Eski rol kaydını sil (user save edildikten sonra)
      if (studentId) {
        // Öğrenci ise önce şikayetlerini sil
        const complaints = await this.complaintRepository.find({
          where: { studentId },
        });
        if (complaints.length > 0) {
          await this.complaintRepository.remove(complaints);
        }
        // Student kaydını doğrudan ID ile sil
        await this.studentRepository.delete({ studentId });
      }
      if (adminId) {
        await this.adminRepository.delete({ adminId });
      }
      if (personnelId) {
        // Personnel'e ait şikayetleri kontrol et
        const handledComplaints = await this.complaintRepository.find({
          where: { handledByPersonnelId: personnelId },
        });
        if (handledComplaints.length > 0) {
          for (const complaint of handledComplaints) {
            complaint.handledByPersonnelId = null;
            await this.complaintRepository.save(complaint);
          }
        }
        // Personnel kaydını doğrudan ID ile sil
        await this.personnelRepository.delete({ personnelId });
      }

      // Yeni rol kaydı oluştur
      if (updateUserDto.roleType === 'student') {
        const student = this.studentRepository.create({
          userId: userId,
          studentNumber: `STU${userId}`,
          enrollmentYear: new Date().getFullYear(),
          currentYear: 1,
        });
        await this.studentRepository.save(student);
      } else if (updateUserDto.roleType === 'admin') {
        const admin = this.adminRepository.create({
          userId: userId,
          adminLevel: 'admin',
          permissions: undefined,
        });
        await this.adminRepository.save(admin);
      } else if (updateUserDto.roleType === 'personnel') {
        // Personnel için department bul veya oluştur
        const department = await this.getOrCreateDefaultDepartment();
        const personnel = this.personnelRepository.create({
          userId: userId,
          employeeNumber: `EMP${userId}`,
          position: 'Personel',
          departmentId: department.departmentId,
          hireDate: new Date(),
        });
        await this.personnelRepository.save(personnel);
      }
      
      // User'ı yeniden yükle (ilişkileri temizlemek için - relations olmadan)
      user = await this.usersRepository.findOne({
        where: { userId },
        relations: [], // Relations yükleme
      });
      
      if (!user) {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }
      
      // Relations'ları da manuel olarak temizle
      (user as any).student = undefined;
      (user as any).admin = undefined;
      (user as any).personnel = undefined;
    } else if (updateUserDto.roleType !== undefined) {
      // RoleType değişmemiş ama güncelleme isteniyor, sadece roleType'ı güncelle
      user.roleType = updateUserDto.roleType;
    }

    const savedUser = await this.usersRepository.save(user);

    // İlişkileri yükle
    const userWithRelations = await this.usersRepository.findOne({
      where: { userId: savedUser.userId },
      relations: ['student', 'admin', 'personnel'],
    });

    return {
      userId: savedUser.userId,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      email: savedUser.email,
      roleType: savedUser.roleType,
      photo: savedUser.photo || null,
      student: userWithRelations?.student || null,
      admin: userWithRelations?.admin || null,
      personnel: userWithRelations?.personnel || null,
    };
  }
}

