import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditQueryDto } from './dto/audit-query.dto';

export interface CreateAuditLogParams {
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  /** Remove sensitive fields from audit payloads before persisting */
  private sanitize(details?: Record<string, any> | null): Record<string, any> | null {
    if (!details) return null;
    const SENSITIVE_KEYS = ['password', 'password_hash', 'token', 'access_token', 'secret', 'authorization'];
    const sanitized = { ...details };
    for (const key of Object.keys(sanitized)) {
      if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return sanitized;
  }

  async log(params: CreateAuditLogParams): Promise<void> {
    try {
      const auditEntry = this.auditRepository.create({
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        userRole: params.userRole || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        details: this.sanitize(params.details),
        ipAddress: params.ipAddress || null,
      });

      await this.auditRepository.save(auditEntry);
    } catch (error) {
      // Fail-safe: Audit logging failures must never crash business transactions
      this.logger.error(`Failed to record audit log for action: ${params.action}`, error.stack);
    }
  }

  async findAll(query: AuditQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.auditRepository.createQueryBuilder('audit');

    if (query.action) {
      queryBuilder.andWhere('audit.action = :action', { action: query.action });
    }

    if (query.entity) {
      queryBuilder.andWhere('audit.entity = :entity', { entity: query.entity });
    }

    if (query.userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId: query.userId });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(LOWER(audit.userEmail) LIKE :search OR LOWER(audit.action) LIKE :search OR LOWER(audit.entity) LIKE :search OR LOWER(audit.entityId) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    queryBuilder
      .orderBy('audit.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRecentLogs(limit = 10) {
    return this.auditRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
