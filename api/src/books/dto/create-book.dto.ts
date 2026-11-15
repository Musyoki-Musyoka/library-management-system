import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  author!: string;

  @IsString()
  @IsNotEmpty()
  isbn!: string;

  @IsOptional()
  @IsUrl({}, { message: 'coverImage must be a valid URL' })
  coverImage?: string;

  @IsOptional()
  @IsInt()
  @Min(1000)
  publishedYear?: number;

  @IsInt()
  @Min(1)
  totalCopies!: number;

  @IsInt()
  @IsPositive()
  genreId!: number;
}
