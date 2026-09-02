import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { BscPerspective } from '../../common/constants/enums';

export class CreateEntryDto {
  @IsOptional()
  @IsUUID()
  kpi_definition_id?: string;

  @IsEnum(BscPerspective, {
    message: 'Perspective must be FINANCIAL, CUSTOMER, INTERNAL_PROCESS, or LEARNING_GROWTH',
  })
  perspective: BscPerspective;

  @IsString()
  @IsNotEmpty({ message: 'Objective is required' })
  objective: string;

  @IsString()
  @IsOptional()
  deliverable?: string;

  @IsString()
  @IsNotEmpty({ message: 'Measurement is required' })
  measurement: string;

  @IsString()
  @IsNotEmpty({ message: 'Unit is required' })
  unit: string;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  weight?: number;

  @IsNumber()
  @Min(0.0001, { message: 'Plan value must be greater than 0' })
  plan_value: number;

  @IsNumber()
  @Min(0, { message: 'Actual value must be at least 0' })
  actual_value: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
