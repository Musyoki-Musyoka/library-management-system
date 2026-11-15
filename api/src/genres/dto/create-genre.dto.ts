import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateGenreDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase letters, numbers and hyphens' })
  slug?: string;
}
