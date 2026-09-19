import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AuthModule } from '../src/app/module/auth/auth.module';
import { ConsumerProfileModule } from '../src/app/module/consumer-profile/consumer-profile.module';
import { ConsumerCatalogModule } from '../src/app/module/consumer-catalog/consumer-catalog.module';
import { RecommendationModule } from '../src/app/module/recommendation/recommendation.module';
import { QrcodesModule } from '../src/app/module/qrcodes/qrcodes.module';
import { JournalModule } from '../src/app/module/journal/journal.module';

it('wires consumer modules and exposes the demo routes in Swagger without a live database', async () => {
  const builder = Test.createTestingModule({
    imports: [
      AuthModule,
      ConsumerProfileModule,
      ConsumerCatalogModule,
      RecommendationModule,
      QrcodesModule,
      JournalModule,
    ],
  });
  for (const name of [
    'User',
    'MasterDatabase',
    'Inventory',
    'Retailer',
    'Humidor',
    'ConsumerProfile',
    'ConsumerActivity',
    'UserCigar',
    'Qrcode',
    'Journal',
  ]) {
    builder.overrideProvider(getModelToken(name)).useValue({});
  }
  const module = await builder.compile();
  const app = module.createNestApplication();
  app.setGlobalPrefix('api/v1');
  try {
    await app.init();
    const swagger = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Consumer tests').setVersion('1').build(),
    );
    for (const path of [
      '/auth/customer-register',
      '/master-database/{id}',
      '/consumer/scans/upc',
      '/qrcodes/resolve-store',
      '/consumer-profile/onboarding',
      '/consumer-cigars/{cigarId}/rating',
      '/consumer/cigars/{cigarId}',
      '/recommendations/me',
      '/journal',
      '/journal/{id}',
    ]) {
      expect(swagger.paths).toHaveProperty(`/api/v1${path}`);
    }
  } finally {
    await app.close();
  }
});
