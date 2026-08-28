import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../common/constants/enums';

export class UpdateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsEnum(Role, { message: 'Role must be ADMIN, MANAGER, or REVIEWER' })
  @IsOptional()
  role?: Role;

  @IsString()
  @IsOptional()
  department?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
