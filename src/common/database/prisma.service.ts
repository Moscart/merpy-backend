import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class PrismaService
  extends PrismaClient<
    Prisma.PrismaClientOptions,
    'query' | 'info' | 'warn' | 'error'
  >
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly logger: PinoLogger) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });

    this.logger.setContext(PrismaService.name);
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.info('Connected to the database');

    this.$on('query', (event: Prisma.QueryEvent) => {
      this.logger.debug(
        { query: event.query, params: event.params, duration: event.duration },
        'Prisma query executed'
      );
    });

    this.$on('error', (event: Prisma.LogEvent) => {
      this.logger.error(
        { message: event.message, target: event.target },
        'Prisma error occurred'
      );
    });

    this.$on('warn', (event: Prisma.LogEvent) => {
      this.logger.warn(
        { message: event.message, target: event.target },
        'Prisma warning occurred'
      );
    });

    this.$on('info', (event: Prisma.LogEvent) => {
      this.logger.info(
        { message: event.message, target: event.target },
        'Prisma info event'
      );
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
