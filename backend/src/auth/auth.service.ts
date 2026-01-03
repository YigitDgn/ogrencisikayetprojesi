import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from './entities/user.entity';
import { Student } from '../entities/student.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Bu e-posta adresi zaten kullanılıyor');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = this.usersRepository.create({
      username: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      roleType: 'student', // Varsayılan olarak student
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

    return {
      userId: user.userId,
      username: user.username,
      email: user.email,
      roleType: user.roleType,
      student: user.student || null,
      admin: user.admin || null,
      personnel: user.personnel || null,
    };
  }
}
