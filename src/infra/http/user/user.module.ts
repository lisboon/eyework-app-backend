import { Module } from '@nestjs/common';
import { UserFacade } from '@/modules/users/facade/user.facade';
import { UserFacadeFactory } from '@/modules/users/factory/user.facade.factory';
import { PrismaService } from '@/infra/database/prisma.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: UserFacade,
      useFactory: (prisma: PrismaService) => UserFacadeFactory.create(prisma),
      inject: [PrismaService],
    },
  ],
})
export class UserModule {}
