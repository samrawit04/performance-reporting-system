import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PeriodType } from '../../common/constants/enums';
import { CreateEntryDto } from './create-entry.dto';

export class CreateSubmissionDto {
  @IsOptional()
  @IsUUID()
  executive_id?: string; // If not provided, defaults to current user

  @IsEnum(PeriodType)
  period_type: PeriodType;

  @IsOptional()
  @IsDateString()
  period_start?: string;

  @IsOptional()
  @IsDateString()
  period_end?: string;

  @IsString()
  @IsNotEmpty({ message: 'Period label is required (e.g. Monthly — 2026-08)' })
  period_label: string;

  @IsOptional()
  @IsUUID()
  source_file_id?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEntryDto)
  entries: CreateEntryDto[];
}
