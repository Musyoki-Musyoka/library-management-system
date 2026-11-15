import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';
import { QueryBooksDto } from './dto/query-books.dto.js';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryBooksDto) {
    // If the controller passed raw strings, coerce them here too.
    const genreId = query.genreId !== undefined ? Number(query.genreId) : undefined;
    const search = query.search?.trim() || undefined;
    const page = Number(query.page ?? 1) || 1;
    const limit = Number(query.limit ?? 10) || 10;

    const where: Prisma.BookWhereInput = {
      ...(genreId !== undefined && !Number.isNaN(genreId) ? { genreId } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { author: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        include: { genre: true },
        orderBy: { title: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { genre: true, reviews: true },
    });
    if (!book) {
      throw new NotFoundException(`Book ${id} not found`);
    }
    return book;
  }

  async create(dto: CreateBookDto) {
    const genre = await this.prisma.genre.findUnique({ where: { id: dto.genreId } });
    if (!genre) {
      throw new BadRequestException(`Genre ${dto.genreId} does not exist`);
    }

    const duplicate = await this.prisma.book.findUnique({ where: { isbn: dto.isbn } });
    if (duplicate) {
      throw new ConflictException(`A book with ISBN ${dto.isbn} already exists`);
    }

    return this.prisma.book.create({
      data: {
        title: dto.title,
        author: dto.author,
        isbn: dto.isbn,
        coverImage: dto.coverImage,
        publishedYear: dto.publishedYear,
        totalCopies: dto.totalCopies,
        availableCopies: dto.totalCopies,
        genreId: dto.genreId,
      },
      include: { genre: true },
    });
  }

  async update(id: number, dto: UpdateBookDto) {
    const existing = await this.prisma.book.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Book ${id} not found`);
    }

    if (dto.genreId !== undefined) {
      const genre = await this.prisma.genre.findUnique({ where: { id: dto.genreId } });
      if (!genre) {
        throw new BadRequestException(`Genre ${dto.genreId} does not exist`);
      }
    }

    if (dto.isbn && dto.isbn !== existing.isbn) {
      const duplicate = await this.prisma.book.findUnique({ where: { isbn: dto.isbn } });
      if (duplicate) {
        throw new ConflictException(`A book with ISBN ${dto.isbn} already exists`);
      }
    }

    const data: Prisma.BookUpdateInput = {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.author !== undefined ? { author: dto.author } : {}),
      ...(dto.isbn !== undefined ? { isbn: dto.isbn } : {}),
      ...(dto.coverImage !== undefined ? { coverImage: dto.coverImage } : {}),
      ...(dto.publishedYear !== undefined ? { publishedYear: dto.publishedYear } : {}),
      ...(dto.genreId !== undefined ? { genre: { connect: { id: dto.genreId } } } : {}),
    };

    if (dto.totalCopies !== undefined) {
      const borrowed = existing.totalCopies - existing.availableCopies;
      const newAvailable = dto.totalCopies - borrowed;
      if (newAvailable < 0) {
        throw new BadRequestException(
          `totalCopies cannot be lower than the ${borrowed} copies currently borrowed`,
        );
      }
      data.totalCopies = dto.totalCopies;
      data.availableCopies = newAvailable;
    }

    return this.prisma.book.update({
      where: { id },
      data,
      include: { genre: true },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.book.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Book ${id} not found`);
    }
    await this.prisma.book.delete({ where: { id } });
    return { deleted: true, id };
  }
}
