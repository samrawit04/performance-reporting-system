import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(createUserDto.password, saltRounds);

    const user = this.userRepository.create({
      email: createUserDto.email.toLowerCase().trim(),
      password_hash,
      first_name: createUserDto.first_name.trim(),
      last_name: createUserDto.last_name.trim(),
      role: createUserDto.role,
      department: createUserDto.department?.trim(),
      is_active: true,
    });

    const saved = await this.userRepository.save(user);
    // Don't expose password_hash
    delete (saved as Partial<User>).password_hash;
    return saved;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.email = :email', { email: email.toLowerCase().trim() })
      .getOne();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (updateUserDto.email && updateUserDto.email.toLowerCase().trim() !== user.email) {
      const emailConflict = await this.userRepository.findOne({
        where: { email: updateUserDto.email.toLowerCase().trim() },
      });
      if (emailConflict) {
        throw new ConflictException('A user with this email already exists');
      }
      user.email = updateUserDto.email.toLowerCase().trim();
    }

    if (updateUserDto.password) {
      const saltRounds = 10;
      user.password_hash = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    if (updateUserDto.first_name) {
      user.first_name = updateUserDto.first_name.trim();
    }

    if (updateUserDto.last_name) {
      user.last_name = updateUserDto.last_name.trim();
    }

    if (updateUserDto.role) {
      user.role = updateUserDto.role;
    }

    if (updateUserDto.department !== undefined) {
      user.department = updateUserDto.department?.trim();
    }

    if (updateUserDto.is_active !== undefined) {
      user.is_active = updateUserDto.is_active;
    }

    const saved = await this.userRepository.save(user);
    delete (saved as Partial<User>).password_hash;
    return saved;
  }

  async toggleActive(id: string): Promise<User> {
    const user = await this.findById(id);
    user.is_active = !user.is_active;
    const saved = await this.userRepository.save(user);
    delete (saved as Partial<User>).password_hash;
    return saved;
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.findById(id);
    user.is_active = false;
    await this.userRepository.save(user);
    return { message: `User ${user.email} deactivated successfully` };
  }
}
