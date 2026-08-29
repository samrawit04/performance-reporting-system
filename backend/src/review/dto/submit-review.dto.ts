import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ReviewAction } from '../../common/constants/enums';

export class SubmitReviewDto {
  @IsEnum(ReviewAction, {
    message: 'Action must be APPROVED or RETURNED',
  })
  action: ReviewAction;

  @IsString()
  @IsNotEmpty({ message: 'Overall feedback narrative is required' })
  overall_feedback: string;

  @IsObject()
  @IsOptional()
  perspective_feedback?: {
    FINANCIAL?: string;
    CUSTOMER?: string;
    INTERNAL_PROCESS?: string;
    LEARNING_GROWTH?: string;
  };

  @IsArray()
  @IsOptional()
  recommended_focus_areas?: string[];
}
