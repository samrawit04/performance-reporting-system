import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { BscPerspective, KpiDirection } from '../../common/constants/enums';

export class UpdateKpiDefinitionDto {
  @IsEnum(BscPerspective)
  @IsOptional()
  perspective?: BscPerspective;

  @IsString()
  @IsOptional()
  objective?: string;

  @IsString()
  @IsOptional()
  measurement?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(KpiDirection)
  @IsOptional()
  direction?: KpiDirection;

  @IsNumber()
  @Min(0)
  @IsOptional()
  weight?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsNumber()
  @IsOptional()
  sort_order?: number;
}
