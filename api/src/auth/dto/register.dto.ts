import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(6, { message: 'password must be at least 6 characters' })
  password!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
