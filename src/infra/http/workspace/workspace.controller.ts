import {
  Controller,
  Get,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type { WorkspaceMembership } from '@/modules/workspaces/domain/workspace-membership';
import { AuthGuard, type AuthenticatedUser } from '../auth/auth-guard';
import { CurrentUser } from '../shared/current-user.decorator';
import { WorkspaceService } from './workspace.service';

@Controller('workspaces')
@UseGuards(AuthGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post('individual')
  async createIndividual(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<WorkspaceMembership> {
    const { created, ...workspace } =
      await this.workspaceService.createIndividual({ userId: user.id });
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return workspace;
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<WorkspaceMembership[]> {
    return this.workspaceService.list({ userId: user.id });
  }
}
