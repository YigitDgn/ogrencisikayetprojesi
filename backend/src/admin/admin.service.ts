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
import { CreateUserDto } from './dto/create-user.dto';

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
  ) {}

  async getAllUsers() {
    const users = await this.usersRepository.find({
      relations: ['student', 'admin', 'personnel'],
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => ({
      userId: user.userId,
      username: user.username,
      email: user.email,
      roleType: user.roleType,
      createdAt: user.createdAt,
      photo: user.photo ? `http://localhost:3000${user.photo}` : null,
      student: user.student || null,
      admin: user.admin || null,
      personnel: user.personnel || null,
    }));
  }

  async deleteUser(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { userId },
      relations: ['student', 'admin', 'personnel'],
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
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

    // User'ı sil
    await this.usersRepository.remove(user);

    return { message: 'Kullanıcı başarıyla silindi' };
  }

  async getAllComplaints() {
    const complaints = await this.complaintRepository.find({
      relations: ['student', 'complaintType', 'course', 'handledByPersonnel'],
      order: { createdAt: 'DESC' },
    });

    return complaints;
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
      username: createUserDto.username,
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
      // Personnel için departmentId gerekli, şimdilik null bırakıyoruz
      // İleride form'dan alınabilir
      const personnel = this.personnelRepository.create({
        userId: savedUser.userId,
        employeeNumber: `EMP${savedUser.userId}`,
        position: 'Personel',
        departmentId: 1, // Varsayılan department, sonra güncellenebilir
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
      username: savedUser.username,
      email: savedUser.email,
      roleType: savedUser.roleType,
      student: userWithRelations?.student || null,
      admin: userWithRelations?.admin || null,
      personnel: userWithRelations?.personnel || null,
    };
  }
}

