import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './entities/user.entity';
import { Student } from '../entities/student.entity';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto, photo?: MulterFile) {
    // E-posta adresinin @university.edu ile bitmesi gerekiyor
    if (!registerDto.email.toLowerCase().endsWith('@university.edu')) {
      throw new ConflictException('E-posta adresi @university.edu ile bitmelidir');
    }

    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
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

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = this.usersRepository.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      password: hashedPassword,
      roleType: 'student', // Varsayılan olarak student
      photo: photoPath,
    });

    const savedUser = await this.usersRepository.save(user);

    // Student tablosuna da kayıt oluştur
    const student = this.studentRepository.create({
      userId: savedUser.userId,
      studentNumber: `STU${savedUser.userId}`, // Geçici öğrenci numarası
      enrollmentYear: new Date().getFullYear(),
      currentYear: 1,
    });
    await this.studentRepository.save(student);

    // İlişkileri yükle
    const userWithRelations = await this.usersRepository.findOne({
      where: { userId: savedUser.userId },
      relations: ['student', 'admin', 'personnel'],
    });

    // JWT token oluştur
    const payload = {
      sub: savedUser.userId,
      email: savedUser.email,
      roleType: savedUser.roleType,
    };
    const token = this.jwtService.sign(payload);

    return {
      userId: savedUser.userId,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      email: savedUser.email,
      roleType: savedUser.roleType,
      student: userWithRelations?.student || null,
      admin: userWithRelations?.admin || null,
      personnel: userWithRelations?.personnel || null,
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
      relations: ['student', 'admin', 'personnel'],
    });

    if (!user) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }

    // JWT token oluştur
    const payload = {
      sub: user.userId,
      email: user.email,
      roleType: user.roleType,
    };
    const token = this.jwtService.sign(payload);

    return {
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleType: user.roleType,
      student: user.student || null,
      admin: user.admin || null,
      personnel: user.personnel || null,
      token,
    };
  }

  async getCurrentUser(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { userId },
      relations: ['student', 'admin', 'personnel'],
    });

    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    return {
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleType: user.roleType,
      phoneNumber: user.phoneNumber,
      photo: user.photo,
      student: user.student || null,
      admin: user.admin || null,
      personnel: user.personnel || null,
    };
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto, photo?: MulterFile) {
    const user = await this.usersRepository.findOne({
      where: { userId },
      relations: ['student', 'admin', 'personnel'],
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Fotoğraf güncellemesi
    let photoPath: string | undefined | null = undefined;
    if (updateProfileDto.removePhoto) {
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
    if (updateProfileDto.firstName !== undefined) {
      user.firstName = updateProfileDto.firstName;
    }
    if (updateProfileDto.lastName !== undefined) {
      user.lastName = updateProfileDto.lastName;
    }
    if (updateProfileDto.password !== undefined) {
      user.password = await bcrypt.hash(updateProfileDto.password, 10);
    }
    if (updateProfileDto.phoneNumber !== undefined) {
      user.phoneNumber = updateProfileDto.phoneNumber;
    }
    if (photoPath !== undefined) {
      user.photo = photoPath as any;
    }

    await this.usersRepository.save(user);

    // İlişkileri yükle
    const userWithRelations = await this.usersRepository.findOne({
      where: { userId },
      relations: ['student', 'admin', 'personnel'],
    });

    if (!userWithRelations) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return {
      userId: userWithRelations.userId,
      firstName: userWithRelations.firstName,
      lastName: userWithRelations.lastName,
      email: userWithRelations.email,
      roleType: userWithRelations.roleType,
      phoneNumber: userWithRelations.phoneNumber,
      photo: userWithRelations.photo,
      student: userWithRelations.student || null,
      admin: userWithRelations.admin || null,
      personnel: userWithRelations.personnel || null,
    };
  }
}
