import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User } from '../users/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
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

  async generateMagicLinkToken(userId: string, submissionId: string): Promise<string> {
    const payload = {
      sub: userId,
      type: 'MAGIC_LINK',
      submissionId,
    };
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  async verifyMagicLinkToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'MAGIC_LINK') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.is_active) {
        throw new UnauthorizedException('User account is invalid or deactivated.');
      }

      const loginPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      const accessToken = this.jwtService.sign(loginPayload);

      this.auditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'LOGIN_SUCCESS',
        entity: 'User',
        entityId: user.id,
        details: { method: 'MAGIC_LINK', submissionId: payload.submissionId },
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
        submissionId: payload.submissionId,
      };
    } catch (err: any) {
      throw new UnauthorizedException(
        'This review link has expired or is invalid. Please sign in with your credentials.',
      );
    }
  }

  async getProfile(user: User) {
    return this.usersService.findById(user.id);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (user && user.is_active) {
      const resetToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          type: 'PASSWORD_RESET',
        },
        { expiresIn: '1h' },
      );

      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

      await this.mailService.sendPasswordResetEmail({
        recipientEmail: user.email,
        recipientName: `${user.first_name} ${user.last_name}`,
        resetUrl,
      });

      this.auditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'User',
        entityId: user.id,
      });
    }

    return {
      message:
        'If an account with that email exists, a password reset link has been sent to your email.',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    try {
      const payload = this.jwtService.verify(dto.token);
      if (payload.type !== 'PASSWORD_RESET') {
        throw new BadRequestException('Invalid password reset token type');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.is_active) {
        throw new BadRequestException('User account is invalid or deactivated');
      }

      await this.usersService.update(user.id, { password: dto.password });

      this.auditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'PASSWORD_RESET_COMPLETED',
        entity: 'User',
        entityId: user.id,
      });

      return { message: 'Password has been reset successfully. You can now sign in.' };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('This reset link has expired or is invalid.');
    }
  }
}
