import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadedFile as UploadedFileEntity } from './entities/uploaded-file.entity';
import { ClientTemplateParser } from './parsers/client-template.parser';
import { PdfDocParser } from './parsers/pdf-doc.parser';
import { ParsedPerformanceData } from './parsers/parser.interface';
import { FileProcessingStatus } from '../common/constants/enums';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  constructor(
    @InjectRepository(UploadedFileEntity)
    private readonly uploadedFileRepo: Repository<UploadedFileEntity>,
    private readonly clientTemplateParser: ClientTemplateParser,
    private readonly pdfDocParser: PdfDocParser,
  ) {}

  async processUpload(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ fileId: string; filename: string; preview: ParsedPerformanceData }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Save file to disk
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    const storedPath = path.join(uploadDir, uniqueFilename);
    fs.writeFileSync(storedPath, file.buffer);

    // Create DB record
    const uploadRecord = this.uploadedFileRepo.create({
      uploaded_by: userId,
      original_filename: file.originalname,
      stored_path: storedPath,
      mime_type: file.mimetype,
      file_size: file.size,
      processing_status: FileProcessingStatus.PROCESSING,
    });
    const savedRecord = await this.uploadedFileRepo.save(uploadRecord);

    // Select appropriate parser based on file format
    let parsedData: ParsedPerformanceData;
    const isPdfOrDoc = await this.pdfDocParser.canParse(file.originalname);

    if (isPdfOrDoc) {
      parsedData = await this.pdfDocParser.parse(file.buffer, file.originalname);
    } else {
      parsedData = await this.clientTemplateParser.parse(file.buffer);
    }

    if (parsedData.errors && parsedData.errors.length > 0) {
      savedRecord.processing_status = FileProcessingStatus.FAILED;
      savedRecord.processing_error = parsedData.errors.join('; ');
      await this.uploadedFileRepo.save(savedRecord);

      throw new BadRequestException({
        message: 'Failed to process performance document',
        errors: parsedData.errors,
      });
    }

    savedRecord.processing_status = FileProcessingStatus.COMPLETED;
    await this.uploadedFileRepo.save(savedRecord);

    return {
      fileId: savedRecord.id,
      filename: file.originalname,
      preview: parsedData,
    };
  }

  async getUploadById(id: string): Promise<UploadedFileEntity> {
    const file = await this.uploadedFileRepo.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException(`Upload record with ID ${id} not found`);
    }
    return file;
  }
}
