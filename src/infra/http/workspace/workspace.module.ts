import { Module } from '@nestjs/common';
import { PrismaService } from '@/infra/database/prisma.service';
import { UserFacade } from '@/modules/users/facade/user.facade';
import { WorkspaceFacade } from '@/modules/workspaces/facade/workspace.facade';
import { WorkspaceFacadeFactory } from '@/modules/workspaces/factory/workspace.facade.factory';
import { UserModule } from '../user/user.module';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [UserModule],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceService,
    {
      provide: WorkspaceFacade,
      useFactory: (prisma: PrismaService, userFacade: UserFacade) =>
        WorkspaceFacadeFactory.create(prisma, userFacade),
      inject: [PrismaService, UserFacade],
    },
  ],
})
export class WorkspaceModule {}
