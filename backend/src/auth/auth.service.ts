import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      this.auditService.log({
        action: 'LOGIN_FAILURE',
        entity: 'User',
        userEmail: email,
        details: { reason: 'User not found' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.is_active) {
      this.auditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'LOGIN_FAILURE',
        entity: 'User',
        details: { reason: 'Account deactivated' },
      });
      throw new UnauthorizedException('Your account has been deactivated. Please contact an administrator.');
    }

    const isMatch = await bcrypt.compare(pass, user.password_hash);
    if (!isMatch) {
      this.auditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'LOGIN_FAILURE',
        entity: 'User',
        details: { reason: 'Invalid password' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    delete (user as Partial<User>).password_hash;
    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role },
    });

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        department: user.department,
      },
    };
  }

  async getProfile(user: User) {
    return this.usersService.findById(user.id);
  }
}
