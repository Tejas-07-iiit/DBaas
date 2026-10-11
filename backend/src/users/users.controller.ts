import { Controller, Get, Patch, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FirebaseUser } from '../auth/interfaces/firebase-user.interface';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { updateUserSchema, UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() firebaseUser: FirebaseUser) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    return this.usersService.toResponse(user);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Body(new ZodValidationPipe(updateUserSchema)) updateDto: UpdateUserDto,
  ) {
    // Ensure user exists first
    await this.usersService.findOrCreateFromFirebase(firebaseUser);
    const user = await this.usersService.updateProfile(firebaseUser.uid, updateDto);
    return this.usersService.toResponse(user);
  }
}
