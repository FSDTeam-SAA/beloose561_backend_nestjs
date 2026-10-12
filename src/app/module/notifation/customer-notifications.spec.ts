import { HttpException } from '@nestjs/common';
import { Types } from 'mongoose';
import { NotifationService } from './notifation.service';

describe('NotifationService customer notifications', () => {
  const userId = new Types.ObjectId().toString();
  const notificationId = new Types.ObjectId().toString();
  const notification = {
    _id: notificationId,
    recipientRole: 'customer',
    userId,
    isRead: false,
  };
  let model: Record<string, jest.Mock>;
  let service: NotifationService;

  beforeEach(() => {
    model = {
      find: jest.fn(),
      countDocuments: jest.fn(),
      findOneAndUpdate: jest.fn(),
      updateMany: jest.fn(),
      findOneAndDelete: jest.fn(),
    };
    service = new NotifationService(model as never, {} as never);
  });

  it('lists only the token owner notifications newest first with a default limit of 20', async () => {
    const limit = jest.fn().mockResolvedValue([notification]);
    const skip = jest.fn().mockReturnValue({ limit });
    const sort = jest.fn().mockReturnValue({ skip });
    model.find.mockReturnValue({ sort });
    model.countDocuments.mockResolvedValue(1);

    await expect(service.getCustomerNotifications(userId, {})).resolves.toEqual(
      {
        meta: { page: 1, limit: 20, total: 1 },
        data: [notification],
      },
    );
    expect(model.find).toHaveBeenCalledWith({
      recipientRole: 'customer',
      userId,
    });
    expect(sort).toHaveBeenCalledWith({ createdAt: 'desc' });
    expect(skip).toHaveBeenCalledWith(0);
    expect(limit).toHaveBeenCalledWith(20);
  });

  it('counts only unread notifications owned by the customer', async () => {
    model.countDocuments.mockResolvedValue(2);

    await expect(service.getCustomerUnreadCount(userId)).resolves.toBe(2);
    expect(model.countDocuments).toHaveBeenCalledWith({
      recipientRole: 'customer',
      userId,
      isRead: false,
    });
  });

  it('uses role and token ownership when marking one notification read', async () => {
    model.findOneAndUpdate.mockResolvedValue({ ...notification, isRead: true });

    await service.markCustomerAsRead(userId, notificationId);
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: notificationId, recipientRole: 'customer', userId },
      { isRead: true },
      { new: true },
    );
  });

  it('returns 404 for an invalid or unowned notification id', async () => {
    await expect(
      service.markCustomerAsRead(userId, 'not-an-object-id'),
    ).rejects.toMatchObject<HttpException>({ status: 404 });
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();

    model.findOneAndUpdate.mockResolvedValue(null);
    await expect(
      service.markCustomerAsRead(userId, notificationId),
    ).rejects.toMatchObject<HttpException>({ status: 404 });
  });

  it('marks all unread notifications owned by the customer read', async () => {
    model.updateMany.mockResolvedValue({ modifiedCount: 3 });

    await expect(service.markAllCustomerAsRead(userId)).resolves.toEqual({
      updated: 3,
    });
    expect(model.updateMany).toHaveBeenCalledWith(
      { recipientRole: 'customer', userId, isRead: false },
      { isRead: true },
    );
  });

  it('uses role and token ownership when deleting a notification', async () => {
    model.findOneAndDelete.mockResolvedValue(notification);

    await service.deleteCustomerNotification(userId, notificationId);
    expect(model.findOneAndDelete).toHaveBeenCalledWith({
      _id: notificationId,
      recipientRole: 'customer',
      userId,
    });
  });
});
