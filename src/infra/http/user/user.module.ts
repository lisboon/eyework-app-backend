import { Module } from '@nestjs/common';
import { PrismaService } from '@/infra/database/prisma.service';
import { UserFacade } from '@/modules/users/facade/user.facade';
import { UserFacadeFactory } from '@/modules/users/factory/user.facade.factory';
import { AuthUserService } from '@/modules/users/service/auth.user.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: UserFacade,
      useFactory: (prisma: PrismaService, authUserService: AuthUserService) =>
        UserFacadeFactory.create(prisma, authUserService),
      inject: [PrismaService, AuthUserService],
    },
  ],
})
export class UserModule {}
