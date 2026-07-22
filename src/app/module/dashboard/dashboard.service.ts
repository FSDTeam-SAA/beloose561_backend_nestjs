import { HttpException, Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import { Model } from 'mongoose';
import { InventoryService } from '../inventory/inventory.service';
import { Payment, PaymentDocument } from '../payment/entities/payment.entity';
import {
  Inventory,
  InventoryDocument,
} from '../inventory/entities/inventory.entity';
import {
  Retailer,
  RetailerDocument,
} from '../retailer/entities/retailer.entity';

const PAYMENT_DUE_SOON_DAYS = 3;
const MONTH_LABELS = [
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

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Retailer.name)
    private readonly retailerModel: Model<RetailerDocument>,
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
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

  private getYearDateRange(year?: number) {
    const targetYear = year ?? new Date().getFullYear();
    return {
      targetYear,
      startDate: new Date(`${targetYear}-01-01T00:00:00.000Z`),
      endDate: new Date(`${targetYear + 1}-01-01T00:00:00.000Z`),
    };
  }

  private async getRetailerByUserId(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);
    return retailer;
  }

  private formatRetailer(retailer: RetailerDocument) {
    return {
      _id: retailer._id,
      name: retailer.storeName,
      storeName: retailer.storeName,
      storeSlug: retailer.storeSlug,
      logo: retailer.logo,
    };
  }

  private async getMonthlySales(retailerId: unknown, year?: number) {
    const { targetYear, startDate, endDate } = this.getYearDateRange(year);
    const result = await this.inventoryModel.aggregate([
      {
        $match: {
          retailerId,
          salesHistory: {
            $elemMatch: { soldAt: { $gte: startDate, $lt: endDate } },
          },
        },
      },
      { $unwind: '$salesHistory' },
      {
        $match: {
          'salesHistory.soldAt': { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$salesHistory.soldAt' } },
          revenue: { $sum: '$salesHistory.totalAmount' },
          unitsSold: { $sum: '$salesHistory.quantitySold' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    return {
      year: targetYear,
      monthly: MONTH_LABELS.map((month, index) => {
        const found = result.find((item) => item._id.month === index + 1);
        return {
          month,
          revenue: Number(((found?.revenue as number) ?? 0).toFixed(2)),
          unitsSold: (found?.unitsSold as number) ?? 0,
        };
      }),
    };
  }

  async getRetailerCards(userId: string, year?: number) {
    const retailer = await this.getRetailerByUserId(userId);
    const [{ year: targetYear, monthly }, slowStockCount] = await Promise.all([
      this.getMonthlySales(retailer._id, year),
      this.inventoryModel.countDocuments({
        retailerId: retailer._id,
        status: 'active',
        quantity: { $gt: 0 },
        $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
      }),
    ]);

    const totalRevenue = monthly.reduce((sum, item) => sum + item.revenue, 0);
    const unitsSold = monthly.reduce((sum, item) => sum + item.unitsSold, 0);

    return {
      year: targetYear,
      retailer: this.formatRetailer(retailer),
      cards: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        unitsSold,
        avgOrderValue:
          unitsSold > 0 ? Number((totalRevenue / unitsSold).toFixed(2)) : 0,
        slowStock: slowStockCount,
      },
    };
  }

  async getRetailerSalesTrend(userId: string, year?: number) {
    const retailer = await this.getRetailerByUserId(userId);
    const { year: targetYear, monthly } = await this.getMonthlySales(
      retailer._id,
      year,
    );

    return {
      year: targetYear,
      retailer: this.formatRetailer(retailer),
      salesTrend: monthly.map((item) => ({
        month: item.month,
        revenue: item.revenue,
      })),
    };
  }

  async getRetailerTopProducts(userId: string, year?: number) {
    const retailer = await this.getRetailerByUserId(userId);
    const { targetYear, startDate, endDate } = this.getYearDateRange(year);

    const topProducts = await this.inventoryModel.aggregate([
      {
        $match: {
          retailerId: retailer._id,
          salesHistory: {
            $elemMatch: { soldAt: { $gte: startDate, $lt: endDate } },
          },
        },
      },
      { $unwind: '$salesHistory' },
      {
        $match: {
          'salesHistory.soldAt': { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          brand: { $first: '$brand' },
          unitsSold: { $sum: '$salesHistory.quantitySold' },
          revenue: { $sum: '$salesHistory.totalAmount' },
        },
      },
      { $sort: { unitsSold: -1, revenue: -1 } },
      { $limit: 5 },
    ]);

    return {
      year: targetYear,
      retailer: this.formatRetailer(retailer),
      topProducts: topProducts.map((item, index) => ({
        rank: index + 1,
        _id: item._id,
        name: item.name,
        brand: item.brand,
        unitsSold: item.unitsSold,
        revenue: Number(((item.revenue as number) ?? 0).toFixed(2)),
      })),
    };
  }

  async getRetailerStrengthDistribution(userId: string) {
    const retailer = await this.getRetailerByUserId(userId);
    const strengthDistribution = await this.inventoryModel.aggregate([
      { $match: { retailerId: retailer._id, status: { $ne: 'inactive' } } },
      {
        $group: {
          _id: { $ifNull: ['$strength', 'unknown'] },
          quantity: { $sum: '$quantity' },
          items: { $sum: 1 },
        },
      },
      { $sort: { quantity: -1 } },
    ]);

    const totalQuantity = strengthDistribution.reduce(
      (sum, item) => sum + ((item.quantity as number) ?? 0),
      0,
    );

    return {
      retailer: this.formatRetailer(retailer),
      strengthDistribution: strengthDistribution.map((item) => ({
        strength: item._id,
        quantity: item.quantity,
        items: item.items,
        percentage:
          totalQuantity > 0
            ? Number(
                (((item.quantity as number) / totalQuantity) * 100).toFixed(2),
              )
            : 0,
      })),
    };
  }

  async getRetailerBusinessInsights(userId: string, year?: number) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const targetYear = year ?? new Date().getFullYear();
    const startDate = new Date(`${targetYear}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${targetYear + 1}-01-01T00:00:00.000Z`);
    const monthLabels = [
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

    const baseMatch = {
      retailerId: retailer._id,
      salesHistory: {
        $elemMatch: { soldAt: { $gte: startDate, $lt: endDate } },
      },
    };

    const [salesByMonth, topProducts, strengthDistribution, slowStockCount] =
      await Promise.all([
        this.inventoryModel.aggregate([
          { $match: baseMatch },
          { $unwind: '$salesHistory' },
          {
            $match: {
              'salesHistory.soldAt': { $gte: startDate, $lt: endDate },
            },
          },
          {
            $group: {
              _id: { month: { $month: '$salesHistory.soldAt' } },
              revenue: { $sum: '$salesHistory.totalAmount' },
              unitsSold: { $sum: '$salesHistory.quantitySold' },
            },
          },
          { $sort: { '_id.month': 1 } },
        ]),
        this.inventoryModel.aggregate([
          { $match: baseMatch },
          { $unwind: '$salesHistory' },
          {
            $match: {
              'salesHistory.soldAt': { $gte: startDate, $lt: endDate },
            },
          },
          {
            $group: {
              _id: '$_id',
              name: { $first: '$name' },
              brand: { $first: '$brand' },
              unitsSold: { $sum: '$salesHistory.quantitySold' },
              revenue: { $sum: '$salesHistory.totalAmount' },
            },
          },
          { $sort: { unitsSold: -1, revenue: -1 } },
          { $limit: 5 },
        ]),
        this.inventoryModel.aggregate([
          { $match: { retailerId: retailer._id, status: { $ne: 'inactive' } } },
          {
            $group: {
              _id: { $ifNull: ['$strength', 'unknown'] },
              quantity: { $sum: '$quantity' },
              items: { $sum: 1 },
            },
          },
          { $sort: { quantity: -1 } },
        ]),
        this.inventoryModel.countDocuments({
          retailerId: retailer._id,
          status: 'active',
          quantity: { $gt: 0 },
          $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
        }),
      ]);

    const monthly = monthLabels.map((month, index) => {
      const found = salesByMonth.find((item) => item._id.month === index + 1);
      return {
        month,
        revenue: Number(((found?.revenue as number) ?? 0).toFixed(2)),
        unitsSold: (found?.unitsSold as number) ?? 0,
      };
    });

    const totalRevenue = monthly.reduce((sum, item) => sum + item.revenue, 0);
    const unitsSold = monthly.reduce((sum, item) => sum + item.unitsSold, 0);
    const totalStrengthQuantity = strengthDistribution.reduce(
      (sum, item) => sum + ((item.quantity as number) ?? 0),
      0,
    );

    return {
      year: targetYear,
      retailer: {
        _id: retailer._id,
        name: retailer.storeName,
        storeName: retailer.storeName,
        storeSlug: retailer.storeSlug,
        logo: retailer.logo,
      },
      cards: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        unitsSold,
        avgOrderValue:
          unitsSold > 0 ? Number((totalRevenue / unitsSold).toFixed(2)) : 0,
        slowStock: slowStockCount,
      },
      salesTrend: monthly.map((item) => ({
        month: item.month,
        revenue: item.revenue,
      })),
      unitsSoldByMonth: monthly.map((item) => ({
        month: item.month,
        unitsSold: item.unitsSold,
      })),
      strengthDistribution: strengthDistribution.map((item) => ({
        strength: item._id,
        quantity: item.quantity,
        items: item.items,
        percentage:
          totalStrengthQuantity > 0
            ? Number(
                (
                  ((item.quantity as number) / totalStrengthQuantity) *
                  100
                ).toFixed(2),
              )
            : 0,
      })),
      topProducts: topProducts.map((item, index) => ({
        rank: index + 1,
        _id: item._id,
        name: item.name,
        brand: item.brand,
        unitsSold: item.unitsSold,
        revenue: Number(((item.revenue as number) ?? 0).toFixed(2)),
      })),
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
