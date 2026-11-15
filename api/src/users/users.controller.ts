import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('users')
export class UsersController {
  /** Stretch goal: GET /users/profile - the authenticated user, from the request. */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@Req() req: any) {
    return { user: req.user };
  }
}
