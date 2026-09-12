import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import config from '../src/app/config';
import { ConsumerProfileController } from '../src/app/module/consumer-profile/consumer-profile.controller';
import { ConsumerProfileService } from '../src/app/module/consumer-profile/consumer-profile.service';
import { ConsumerCigarController } from '../src/app/module/consumer-cigar/consumer-cigar.controller';
import { ConsumerCigarService } from '../src/app/module/consumer-cigar/consumer-cigar.service';
import { ConsumerScanController } from '../src/app/module/consumer-scan/consumer-scan.controller';
import { ConsumerScanService } from '../src/app/module/consumer-scan/consumer-scan.service';
import { ConsumerActivityService } from '../src/app/module/consumer-activity/consumer-activity.service';

describe('Consumer route validation and authorization', () => {
  let app: INestApplication<App>;
  let customerToken: string;
  let retailerToken: string;
  const userId = '507f1f77bcf86cd799439011';
  const cigarId = '507f1f77bcf86cd799439012';
  const profile = {
    getMyProfile: jest.fn().mockResolvedValue(null),
    updateMyProfile: jest.fn().mockResolvedValue({ onboardingCompleted: true }),
  };
  const cigars = { rateCigar: jest.fn().mockResolvedValue({ rating: 5 }) };
  const scan = {
    scan: jest.fn().mockResolvedValue({ cigar: { id: cigarId }, store: null }),
  };
  const activity = { record: jest.fn().mockResolvedValue({}) };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [JwtModule.register({ global: true })],
      controllers: [
        ConsumerProfileController,
        ConsumerCigarController,
        ConsumerScanController,
      ],
      providers: [
        { provide: ConsumerProfileService, useValue: profile },
        { provide: ConsumerCigarService, useValue: cigars },
        { provide: ConsumerScanService, useValue: scan },
        { provide: ConsumerActivityService, useValue: activity },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    const jwt = module.get(JwtService);
    customerToken = jwt.sign(
      { id: userId, role: 'customer', email: 'customer@example.com' },
      { secret: config.jwt.accessTokenSecret },
    );
    retailerToken = jwt.sign(
      { id: userId, role: 'retailer', email: 'retailer@example.com' },
      { secret: config.jwt.accessTokenSecret },
    );
  });

  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => app.close());

  it('requires a customer token for taste profiles', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/consumer-profile/me')
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/consumer-profile/me')
      .auth(retailerToken, { type: 'bearer' })
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/consumer-profile/me')
      .auth(customerToken, { type: 'bearer' })
      .expect(200);
    expect(profile.getMyProfile).toHaveBeenCalledWith(userId);
  });

  it('uses token ownership and strips userId from onboarding payloads', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/consumer-profile/onboarding')
      .auth(customerToken, { type: 'bearer' })
      .send({ userId: cigarId, preferredStrengths: ['medium'] })
      .expect(201);
    expect(profile.updateMyProfile).toHaveBeenCalledWith(
      userId,
      { preferredStrengths: ['medium'] },
      true,
    );
  });

  it('rejects invalid ratings and cigar IDs before writing', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/consumer-cigars/${cigarId}/rating`)
      .auth(customerToken, { type: 'bearer' })
      .send({ rating: 6 })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/consumer-cigars/invalid/rating')
      .auth(customerToken, { type: 'bearer' })
      .send({ rating: 5 })
      .expect(400);
    expect(cigars.rateCigar).not.toHaveBeenCalled();
  });

  it('allows guest scans without creating user activity', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/consumer/scans/upc')
      .send({ code: ' 001234567890 ' })
      .expect(200);
    expect(scan.scan).toHaveBeenCalledWith('001234567890', undefined);
    expect(activity.record).not.toHaveBeenCalled();
  });

  it('tracks authenticated scans but rejects invalid supplied tokens', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/consumer/scans/upc/001234567890')
      .auth(customerToken, { type: 'bearer' })
      .expect(200);
    expect(activity.record).toHaveBeenCalledWith(userId, 'scan_upc', {
      cigarId,
      retailerId: undefined,
    });
    await request(app.getHttpServer())
      .get('/api/v1/consumer/scans/upc/001234567890')
      .auth('invalid-token', { type: 'bearer' })
      .expect(401);
  });
});
