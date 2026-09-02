import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadedFile as UploadedFileEntity } from './entities/uploaded-file.entity';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { ClientTemplateParser } from './parsers/client-template.parser';
import { PdfDocParser } from './parsers/pdf-doc.parser';

@Module({
  imports: [TypeOrmModule.forFeature([UploadedFileEntity])],
  controllers: [FileUploadController],
  providers: [FileUploadService, ClientTemplateParser, PdfDocParser],
  exports: [FileUploadService, ClientTemplateParser, PdfDocParser, TypeOrmModule],
})
export class FileUploadModule {}
