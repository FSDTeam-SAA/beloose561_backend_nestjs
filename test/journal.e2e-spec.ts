import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Types } from 'mongoose';
import request from 'supertest';
import type { App } from 'supertest/types';
import config from '../src/app/config';
import { JournalModule } from '../src/app/module/journal/journal.module';
import { JournalSchema } from '../src/app/module/journal/entities/journal.entity';

describe('Journal HTTP and personalization pipeline (mock database)', () => {
  let app: INestApplication<App>;
  let token: string;
  let retailerToken: string;
  const userId = new Types.ObjectId().toString();
  const cigarId = new Types.ObjectId().toString();
  const id = new Types.ObjectId().toString();
  let entries: any[];
  const chain = (value: unknown) => ({ select: () => Promise.resolve(value) });
  const journalModel = {
    create: jest.fn((data) => {
      const entry = { ...data, _id: id };
      entries.push(entry);
      return Promise.resolve(entry);
    }),
    exists: jest.fn(({ _id, userId: owner }) =>
      Promise.resolve(
        entries.find((e) => e._id === _id && String(e.userId) === owner) ??
          null,
      ),
    ),
    findOneAndUpdate: jest.fn(({ _id, userId: owner }, { $set }) => {
      const entry = entries.find(
        (e) => e._id === _id && String(e.userId) === owner,
      );
      if (entry) Object.assign(entry, $set);
      return Promise.resolve(entry ?? null);
    }),
    findOneAndDelete: jest.fn(({ _id, userId: owner }) => {
      const entry = entries.find(
        (e) => e._id === _id && String(e.userId) === owner,
      );
      entries = entries.filter((e) => e !== entry);
      return Promise.resolve(entry ?? null);
    }),
  };
  const stateModel = { findOneAndUpdate: jest.fn().mockResolvedValue({}) };
  const activityModel = { create: jest.fn().mockResolvedValue({}) };

  beforeAll(async () => {
    const builder = Test.createTestingModule({
      imports: [JwtModule.register({ global: true }), JournalModule],
    });
    const models = {
      Journal: journalModel,
      User: { findById: jest.fn().mockResolvedValue({ _id: userId }) },
      MasterDatabase: { findOne: jest.fn(() => chain({ _id: cigarId })) },
      Retailer: {},
      UserCigar: stateModel,
      ConsumerActivity: activityModel,
    };
    for (const [name, model] of Object.entries(models))
      builder.overrideProvider(getModelToken(name)).useValue(model);
    const module = await builder.compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    const jwt = module.get(JwtService);
    token = jwt.sign(
      { id: userId, role: 'customer' },
      { secret: config.jwt.accessTokenSecret },
    );
    retailerToken = jwt.sign(
      { id: userId, role: 'retailer' },
      { secret: config.jwt.accessTokenSecret },
    );
  });
  beforeEach(() => {
    entries = [];
    jest.clearAllMocks();
  });
  afterAll(async () => {
    await app.close();
  });

  it('creates a journal, smoked state, rating and journal activity with the smoking date', async () => {
    const smokedAt = '2026-09-01T10:00:00.000Z';
    await request(app.getHttpServer())
      .post('/api/v1/journal')
      .auth(token, { type: 'bearer' })
      .send({
        cigarId,
        smokedAt,
        rating: 5,
        flavorTags: [' CEDAR '],
        strengthImpression: ' Medium ',
        wouldSmokeAgain: true,
      })
      .expect(201);
    expect(stateModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId, cigarId },
      {
        $set: { hasSmoked: true, rating: 5 },
        $max: { lastSmokedAt: new Date(smokedAt) },
      },
      { new: true, upsert: true, runValidators: true },
    );
    expect(activityModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'journal_created',
        userId,
        cigarId,
        journalId: id,
        flavorTags: ['cedar'],
        strengthImpression: 'medium',
        wouldSmokeAgain: true,
      }),
    );
    expect(activityModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'smoked' }),
    );
    expect(activityModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'rating', rating: 5 }),
    );
  });

  it('allows repeat sessions without resetting an existing rating when none is supplied', async () => {
    for (let i = 0; i < 2; i++) {
      await request(app.getHttpServer())
        .post('/api/v1/journal')
        .auth(token, { type: 'bearer' })
        .send({ cigarId })
        .expect(201);
    }
    expect(entries).toHaveLength(2);
    expect(stateModel.findOneAndUpdate.mock.calls[0][1].$set).toEqual({
      hasSmoked: true,
    });
    expect(JournalSchema.path('userId').isRequired).toBe(true);
    expect(JournalSchema.path('cigarId').isRequired).toBe(true);
    expect(JournalSchema.indexes().some(([, options]) => options.unique)).toBe(
      false,
    );
  });

  it('protects ownership and cigar identity while preserving false and zero updates', async () => {
    entries.push({ _id: id, userId, cigarId });
    await request(app.getHttpServer())
      .patch(`/api/v1/journal/${id}`)
      .auth(token, { type: 'bearer' })
      .send({
        cigarId: new Types.ObjectId().toString(),
        userId: new Types.ObjectId().toString(),
        pricePaid: 0,
        wouldSmokeAgain: false,
      })
      .expect(200);
    expect(entries[0]).toMatchObject({
      cigarId,
      userId,
      pricePaid: 0,
      wouldSmokeAgain: false,
    });
    entries[0].userId = new Types.ObjectId().toString();
    await request(app.getHttpServer())
      .patch(`/api/v1/journal/${id}`)
      .auth(token, { type: 'bearer' })
      .send({ rating: 4 })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/api/v1/journal/${id}`)
      .auth(token, { type: 'bearer' })
      .expect(404);
    expect(entries).toHaveLength(1);
  });

  it('validates payloads, requires customer auth and describes immutable cigar IDs in Swagger', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/journal')
      .send({ cigarId })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/journal')
      .auth(retailerToken, { type: 'bearer' })
      .send({ cigarId })
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/journal')
      .auth(token, { type: 'bearer' })
      .send({ cigarId, rating: 6 })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/api/v1/journal/invalid')
      .auth(token, { type: 'bearer' })
      .send({})
      .expect(400);
    expect(journalModel.create).not.toHaveBeenCalled();
    const swagger = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Journal').setVersion('1').build(),
    );
    expect(swagger.paths['/api/v1/journal/{id}'].patch).toBeDefined();
    const update = swagger.components!.schemas!.UpdateJournalDto as {
      properties: Record<string, unknown>;
    };
    expect(update.properties.cigarId).toBeUndefined();
    expect(update.properties.rating).toBeDefined();
  });
});
