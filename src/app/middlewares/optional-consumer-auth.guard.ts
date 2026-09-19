import { ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import AuthGuard from './auth.guard';

// Guests can browse. A supplied token must still be valid.
@Injectable()
export class OptionalConsumerAuthGuard extends AuthGuard(
  'customer',
  'retailer',
  'admin',
) {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.headers.authorization) return true;
    return super.canActivate(context);
  }
}
