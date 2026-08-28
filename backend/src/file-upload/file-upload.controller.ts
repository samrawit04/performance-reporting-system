import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile as UploadedFileParam,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('excel')
  @UseInterceptors(FileInterceptor('file'))
  uploadExcel(
    @UploadedFileParam() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.fileUploadService.processUpload(file, user.id);
  }

  @Get(':id')
  getUpload(@Param('id', ParseUUIDPipe) id: string) {
    return this.fileUploadService.getUploadById(id);
  }
}
