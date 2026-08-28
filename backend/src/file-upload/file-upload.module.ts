import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadedFile as UploadedFileEntity } from './entities/uploaded-file.entity';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { ClientTemplateParser } from './parsers/client-template.parser';

@Module({
  imports: [TypeOrmModule.forFeature([UploadedFileEntity])],
  controllers: [FileUploadController],
  providers: [FileUploadService, ClientTemplateParser],
  exports: [FileUploadService, ClientTemplateParser, TypeOrmModule],
})
export class FileUploadModule {}
