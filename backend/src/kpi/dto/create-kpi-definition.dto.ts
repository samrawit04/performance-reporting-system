import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { BscPerspective, KpiDirection } from '../../common/constants/enums';

export class CreateKpiDefinitionDto {
  @IsEnum(BscPerspective, {
    message: 'Perspective must be FINANCIAL, CUSTOMER, INTERNAL_PROCESS, or LEARNING_GROWTH',
  })
  perspective: BscPerspective;

  @IsString()
  @IsNotEmpty({ message: 'Objective is required' })
  objective: string;

  @IsString()
  @IsNotEmpty({ message: 'Measurement description is required' })
  measurement: string;

  @IsString()
  @IsNotEmpty({ message: 'Unit is required' })
  unit: string;

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

  @IsNumber()
  @IsOptional()
  sort_order?: number;
}
