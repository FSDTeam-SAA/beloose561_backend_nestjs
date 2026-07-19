import { HttpException, Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import { Model } from 'mongoose';
import { InventoryService } from '../inventory/inventory.service';
import { Payment, PaymentDocument } from '../payment/entities/payment.entity';

const PAYMENT_DUE_SOON_DAYS = 3;

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    private readonly inventoryService: InventoryService,
  ) {}

  async dashboardOverView() {
    const totalUser = await this.userModel.countDocuments();
    const activeUser = await this.userModel.countDocuments({
      status: 'active',
    });
    const suspended = await this.userModel.countDocuments({
      status: 'suspended',
    });

    const totalEarning = await this.paymentModel.aggregate([
      {
        $match: {
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    return {
      totalUser,
      activeUser,
      suspended,
      totalEarning: totalEarning[0]?.total || 0,
    };
  }

  async getTotalEarningChart(year?: number) {
    const targetYear = year ?? new Date().getFullYear();

    const result = await this.paymentModel.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: {
            $gte: new Date(`${targetYear}-01-01`),
            $lte: new Date(`${targetYear}-12-31T23:59:59`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          totalRevenue: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const chartData = months.map((label, i) => {
      const found = result.find((r) => r._id.month === i + 1);
      const totalRevenue = found
        ? Number(Number(found.totalRevenue).toFixed(2))
        : 0;
      return { month: label, totalRevenue };
    });

    const totalYearRevenue = chartData.reduce((s, d) => s + d.totalRevenue, 0);

    return {
      year: targetYear,
      summary: {
        totalRevenue: Number(totalYearRevenue.toFixed(2)),
      },
      chartData,
    };
  }

  // "What should I do today?" retailer dashboard - urgent/attention cards,
  // today's snapshot, and quick-action status for the customer-experience
  // features (Daily Featured / Staff Picks / New Arrivals).
  async getRetailerActionCenter(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);

    const [insights, opportunities, dailyFeatured, staffPicks, newArrivals] =
      await Promise.all([
        this.inventoryService.getDashboardInsights(userId),
        this.inventoryService.getInventoryOpportunities(userId),
        this.inventoryService.getMyDailyFeatured(userId),
        this.inventoryService.getMyStaffPicks(userId),
        this.inventoryService.getMyNewArrivals(userId),
      ]);

    const now = new Date();
    const daysUntilRenewal = user.subscriptionExpiry
      ? Math.ceil(
          (new Date(user.subscriptionExpiry).getTime() - now.getTime()) /
            86400000,
        )
      : null;
    const paymentDueSoon =
      user.isSubscription &&
      daysUntilRenewal !== null &&
      daysUntilRenewal >= 0 &&
      daysUntilRenewal <= PAYMENT_DUE_SOON_DAYS;

    const urgent: Record<string, unknown>[] = [];
    if (insights.outOfStock.length > 0) {
      urgent.push({
        type: 'out_of_stock',
        title: 'Out of Stock',
        message: `${insights.outOfStock.length} cigar(s) have no stock left`,
        items: insights.outOfStock,
      });
    }
    if (dailyFeatured.today.length === 0) {
      urgent.push({
        type: 'daily_featured_not_set',
        title: 'Daily Featured Not Set',
        message: "You haven't set today's featured cigar yet",
      });
    }
    if (paymentDueSoon) {
      urgent.push({
        type: 'payment_due',
        title: 'Payment Due',
        message: `Your subscription renews in ${daysUntilRenewal} day(s)`,
        renewsAt: user.subscriptionExpiry,
      });
    }

    const needsAttention: Record<string, unknown>[] = [];
    if (insights.lowStock.length > 0) {
      needsAttention.push({
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${insights.lowStock.length} cigar(s) are running low`,
        items: insights.lowStock,
      });
    }
    if (insights.underReview.length > 0) {
      needsAttention.push({
        type: 'under_review',
        title: 'Products Under Review',
        message: `${insights.underReview.length} cigar(s) you submitted are waiting for admin approval`,
        items: insights.underReview,
      });
    }
    if (opportunities.count > 0) {
      needsAttention.push({
        type: 'inventory_opportunities',
        title: 'Inventory Opportunities',
        message: `${opportunities.count} cigar(s) haven't sold in ${opportunities.days}+ days`,
        items: opportunities.data,
      });
    }

    return {
      greetingName: user.fullName,
      date: now,
      urgent,
      needsAttention,
      snapshot: {
        totalStock: insights.totalStock,
        totalSearches: insights.topSearched.reduce(
          (sum, item) => sum + item.searches,
          0,
        ),
        // QR scan counts and sales-attributed revenue aren't tracked by
        // any existing module yet, so they're intentionally omitted here
        // rather than faked.
      },
      topSearched: insights.topSearched,
      quickActions: {
        dailyFeatured: {
          isSet: dailyFeatured.today.length > 0,
          items: dailyFeatured.today,
        },
        staffPicks: {
          count: staffPicks.count,
          items: staffPicks.data,
        },
        newArrivals: {
          count: newArrivals.count,
          items: newArrivals.data,
        },
      },
    };
  }
}
