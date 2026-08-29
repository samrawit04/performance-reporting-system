import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { KpiModule } from './kpi/kpi.module';
import { PerformanceModule } from './performance/performance.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { AiModule } from './ai/ai.module';
import { ReviewModule } from './review/review.module';
import { MailModule } from './mail/mail.module';
import { CreateUsersTable1724836800000 } from './migrations/1724836800000-CreateUsersTable';
import { CreatePhase2Tables1724836900000 } from './migrations/1724836900000-CreatePhase2Tables';
import { CreateAiAnalysesTable1724837000000 } from './migrations/1724837000000-CreateAiAnalysesTable';
import { CreateReviewFeedbacksTable1724837100000 } from './migrations/1724837100000-CreateReviewFeedbacksTable';

@Module({
  imports: [
    // Environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database connection — Neon PostgreSQL via DATABASE_URL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false, // Migrations only
        migrationsRun: true, // Auto-run pending migrations on start
        migrations: [
          CreateUsersTable1724836800000,
          CreatePhase2Tables1724836900000,
          CreateAiAnalysesTable1724837000000,
          CreateReviewFeedbacksTable1724837100000,
        ],
        ssl: {
          rejectUnauthorized: false, // Required for Neon PostgreSQL
        },
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),

    UsersModule,
    AuthModule,
    KpiModule,
    PerformanceModule,
    FileUploadModule,
    AiModule,
    ReviewModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
