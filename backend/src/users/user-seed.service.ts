import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from '../common/constants/enums';

@Injectable()
export class UserSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UserSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedUsers();
  }

  async seedUsers() {
    try {
      const adminExists = await this.userRepository.findOne({
        where: { email: 'admin@performance.com' },
      });

      if (!adminExists) {
        this.logger.log('Seeding initial users...');

        const saltRounds = 10;
        const adminHash = await bcrypt.hash('admin123', saltRounds);
        const managerHash = await bcrypt.hash('manager123', saltRounds);
        const reviewerHash = await bcrypt.hash('reviewer123', saltRounds);

        const usersToSeed: Partial<User>[] = [
          {
            email: 'admin@performance.com',
            password_hash: adminHash,
            first_name: 'System',
            last_name: 'Admin',
            role: Role.ADMIN,
            department: 'Operations',
            is_active: true,
          },
          {
            email: 'dawit@performance.com',
            password_hash: managerHash,
            first_name: 'Dawit',
            last_name: 'Alemu',
            role: Role.MANAGER,
            department: 'Executive Operations',
            is_active: true,
          },
          {
            email: 'ceo@performance.com',
            password_hash: reviewerHash,
            first_name: 'Executive',
            last_name: 'Reviewer (CEO)',
            role: Role.REVIEWER,
            department: 'Executive Board',
            is_active: true,
          },
        ];

        for (const u of usersToSeed) {
          const user = this.userRepository.create(u);
          await this.userRepository.save(user);
        }

        this.logger.log('✅ Initial users seeded successfully:');
        this.logger.log('  - Admin: admin@performance.com / admin123');
        this.logger.log('  - Manager: dawit@performance.com / manager123');
        this.logger.log('  - Reviewer: ceo@performance.com / reviewer123');
      }
    } catch (err) {
      this.logger.warn(`Could not run user seeder: ${(err as Error).message}`);
    }
  }
}
