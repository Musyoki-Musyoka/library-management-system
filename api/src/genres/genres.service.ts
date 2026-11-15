import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGenreDto } from './dto/create-genre.dto.js';
import { UpdateGenreDto } from './dto/update-genre.dto.js';

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  async create(dto: CreateGenreDto) {
    const slug = dto.slug ?? this.slugify(dto.name);

    const existing = await this.prisma.genre.findFirst({
      where: { OR: [{ name: dto.name }, { slug }] },
    });
    if (existing) {
      throw new ConflictException(`Genre "${dto.name}" already exists`);
    }

    return this.prisma.genre.create({ data: { name: dto.name, slug } });
  }

  async findAll() {
    return this.prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { books: true } } },
    });
  }

  async findOne(id: number) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
      include: { books: true },
    });
    if (!genre) {
      throw new NotFoundException(`Genre ${id} not found`);
    }
    return genre;
  }

  async update(id: number, dto: UpdateGenreDto) {
    await this.findOne(id);

    const data: { name?: string; slug?: string } = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = dto.slug;
    else if (dto.name !== undefined) data.slug = this.slugify(dto.name);

    try {
      return await this.prisma.genre.update({ where: { id }, data });
    } catch {
      throw new ConflictException('A genre with that name or slug already exists');
    }
  }

  async remove(id: number) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
      include: { _count: { select: { books: true } } },
    });
    if (!genre) {
      throw new NotFoundException(`Genre ${id} not found`);
    }
    if (genre._count.books > 0) {
      throw new ConflictException(
        `Cannot delete genre ${id}: ${genre._count.books} book(s) still reference it`,
      );
    }
    await this.prisma.genre.delete({ where: { id } });
    return { deleted: true, id };
  }
}
