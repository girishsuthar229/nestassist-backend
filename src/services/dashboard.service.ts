import { UserRole } from "@/enums/userRole.enum";
import {
  DashboardKpi,
  DashboardPartnerPoint,
  DashboardPeriod,
  DashboardOverviewMultiPeriodResponse,
  ServicePartnerDashboardMultiPeriodResponse,
} from "@/interfaces/adminDashboard.interface";
import * as RoleRepository from "@/repositories/role.repository";
import { Booking, Payment, Service, ServiceType } from "@/models";
import { dashboardRepository } from "@/repositories/dashboard.repository";
import { CurrencySymbol } from "@/enums/log.enum";

const PERIOD_DAYS: Record<DashboardPeriod, number> = {
  week: 7,
  month: 30,
  year: 365,
};

const KPI_COMPARE_LABEL = "Then Last Week";

const SERVICE_COLORS = ["#4EA8DE", "#F4A261", "#34C38F", "#C77DFF", "#8E7CFF"];

const CITY_COLORS = ["#F2A452", "#8E7CFF", "#34C38F", "#4EA8DE", "#E76F51"];

const formatCity = (city: string) =>
  city.charAt(0).toUpperCase() + city.slice(1);

const safeGet = (res: PromiseSettledResult<any>, fallback: any = null) =>
  res.status === "fulfilled" ? res.value : fallback;

const buildRange = (period: DashboardPeriod) => {
  const now = new Date();

  if (period === "year") {
    const currentYear = now.getFullYear();

    const currentStart = new Date(currentYear, 0, 1);
    currentStart.setHours(0, 0, 0, 0);

    const currentEnd = new Date(currentYear, 11, 31);
    currentEnd.setHours(23, 59, 59, 999);

    const previousStart = new Date(currentYear - 1, 0, 1);
    previousStart.setHours(0, 0, 0, 0);

    const previousEnd = new Date(currentYear - 1, 11, 31);
    previousEnd.setHours(23, 59, 59, 999);

    return {
      days:
        (currentEnd.getTime() - currentStart.getTime()) /
          (1000 * 60 * 60 * 24) +
        1,
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
    };
  }

  const days = PERIOD_DAYS[period];
  const currentStart = new Date(now);
  currentStart.setDate(now.getDate() - (days - 1));
  currentStart.setHours(0, 0, 0, 0);

  const currentEnd = new Date(now);
  currentEnd.setHours(23, 59, 59, 999);

  const previousEnd = new Date(currentStart);
  previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);

  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousEnd.getDate() - (days - 1));
  previousStart.setHours(0, 0, 0, 0);

  return { days, currentStart, currentEnd, previousStart, previousEnd };
};

const calculateChange = (current: number, previous: number) => {
  if (current === 0 && previous === 0) {
    return { percent: 0, positive: true };
  }

  if (previous === 0) {
    return { percent: current > 0 ? 100 : 0, positive: current >= 0 };
  }

  const percent = ((current - previous) / previous) * 100;
  const cappedPercent = Math.max(-100, Math.min(100, percent));
  return { percent: cappedPercent, positive: cappedPercent >= 0 };
};

const formatCompactNumber = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }
  return `${Math.round(value)}`;
};

const formatChangeString = (percent: number) => {
  const rounded = Math.round(percent);
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
};

const getBucketLabels = (period: DashboardPeriod, yearStart?: Date) => {
  if (period === "week")
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  if (period === "month") return ["Week 1", "Week 2", "Week 3", "Week 4"];

  const start = yearStart ?? new Date();
  const labels: string[] = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i, 1);
    labels.push(d.toLocaleString("en-US", { month: "short" }));
  }
  return labels;
};

const getBucketIndex = (
  date: Date,
  period: DashboardPeriod,
  yearStart?: Date,
) => {
  if (period === "week") {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  }

  if (period === "month") {
    const dayOfMonth = date.getDate();
    if (dayOfMonth <= 7) return 0;
    if (dayOfMonth <= 14) return 1;
    if (dayOfMonth <= 21) return 2;
    return 3;
  }

  const start = yearStart ?? new Date(date.getFullYear(), 0, 1);
  const months =
    (date.getFullYear() - start.getFullYear()) * 12 +
    (date.getMonth() - start.getMonth());
  return Math.max(0, Math.min(11, months));
};

/**
 * @name getDashboardOverviewOptimized
 * @description Returns admin dashboard response with week/month/year chart sections in one call.
 *              KPIs and topPartners are returned once (derived from the "week" payload).
 * @access Private
 */
export const getDashboardOverviewOptimized =
  async (): Promise<DashboardOverviewMultiPeriodResponse> => {
    // ================= RANGES =================
    const ranges = {
      week: buildRange("week"),
      month: buildRange("month"),
      year: buildRange("year"),
    };

    const yearRange = ranges.year;

    // ================= COMMON DATA =================
    const customerRoleId = await RoleRepository.getRoleIdByName(
      UserRole.CUSTOMER,
    );
    if (!customerRoleId) {
      throw new Error("CUSTOMER role not configured properly");
    }

    const [
      bookingsRes,
      topPartnersRes,
      bookingStatsRes,
      userStatsRes,
      partnerStatsRes,
      revenueStatsRes,
    ] = await Promise.allSettled([
      dashboardRepository.getBookingsWithRelations(
        yearRange.currentStart,
        yearRange.currentEnd,
      ),

      dashboardRepository.getTopPartnersRaw(),
      dashboardRepository.getWeeklyBookingStats(
        ranges.week.currentStart,
        ranges.week.currentEnd,
        ranges.week.previousStart,
        ranges.week.previousEnd,
      ),

      dashboardRepository.getWeeklyUserStats(
        customerRoleId,
        ranges.week.currentStart,
        ranges.week.currentEnd,
        ranges.week.previousStart,
        ranges.week.previousEnd,
      ),

      dashboardRepository.getWeeklyPartnerStats(
        ranges.week.currentStart,
        ranges.week.currentEnd,
        ranges.week.previousStart,
        ranges.week.previousEnd,
      ),

      dashboardRepository.getWeeklyRevenueStats(
        ranges.week.currentStart,
        ranges.week.currentEnd,
        ranges.week.previousStart,
        ranges.week.previousEnd,
      ),
    ]);

    const allBookings = safeGet(bookingsRes, []);
    const topPartnerRowsRaw = safeGet(topPartnersRes, []);
    const bookingStats = safeGet(bookingStatsRes, { current: 0, previous: 0 });
    const userStats = safeGet(userStatsRes, { current: 0, previous: 0 });
    const partnerStats = safeGet(partnerStatsRes, { current: 0, previous: 0 });
    const revenueStats = safeGet(revenueStatsRes, { current: 0, previous: 0 });

    // ================= FILTER BOOKINGS =================
    const filter = (start: Date, end: Date) =>
      allBookings.filter(
        (b: Booking) =>
          new Date(b.createdAt) >= start && new Date(b.createdAt) <= end,
      );

    const bookingsByPeriod = {
      week: filter(ranges.week.currentStart, ranges.week.currentEnd),
      month: filter(ranges.month.currentStart, ranges.month.currentEnd),
      year: allBookings,
    };

    // ================= CURRENCY =================
    const latestBooking = allBookings[0] as Booking & { payment?: Payment };
    const currency = latestBooking?.payment?.currency || "INR";
    const currencySymbol = (CurrencySymbol as any)[currency] || "₹";

    // ================= KPI =================
    const bookingsChange = calculateChange(
      bookingStats.current,
      bookingStats.previous,
    );

    const usersChange = calculateChange(userStats.current, userStats.previous);

    const partnersChange = calculateChange(
      partnerStats.current,
      partnerStats.previous,
    );

    const revenueChange = calculateChange(
      revenueStats.current,
      revenueStats.previous,
    );

    const kpis: DashboardKpi[] = [
      {
        key: "bookings",
        title: "Total Services Booked",
        value: formatCompactNumber(bookingStats.total),
        change: formatChangeString(bookingsChange.percent),
        changePercent: Math.round(bookingsChange.percent),
        positive: bookingsChange.positive,
        iconKey: "calendar",
      },
      {
        key: "users",
        title: "Active Users",
        value: formatCompactNumber(userStats.total),
        change: formatChangeString(usersChange.percent),
        changePercent: Math.round(usersChange.percent),
        positive: usersChange.positive,
        iconKey: "users",
      },
      {
        key: "partners",
        title: "Active Service Partners",
        value: formatCompactNumber(partnerStats.total),
        change: formatChangeString(partnersChange.percent),
        changePercent: Math.round(partnersChange.percent),
        positive: partnersChange.positive,
        iconKey: "wrench",
      },
      {
        key: "revenue",
        title: "Total Revenue",
        value: `${currencySymbol}${formatCompactNumber(Number(revenueStats.total ?? 0))}`,
        change: formatChangeString(revenueChange.percent),
        changePercent: Math.round(revenueChange.percent),
        positive: revenueChange.positive,
        iconKey: "dollar",
      },
    ];

    // ================= TOP SERVICES =================
    const buildTopServices = (bookings: Booking[]) => {
      const map = new Map<string, number>();

      bookings.forEach((b) => {
        const name =
          (b as Booking & { serviceType?: ServiceType }).serviceType?.name ||
          "Unknown";
        map.set(name, (map.get(name) ?? 0) + 1);
      });

      const services = [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, value], idx) => ({
          label,
          value,
          color: SERVICE_COLORS[idx % SERVICE_COLORS.length],
        }));

      return {
        totalBookings: bookings.length,
        services,
      };
    };

    // ================= REVENUE =================
    const buildRevenue = (
      bookings: Booking[],
      period: DashboardPeriod,
      symbol: string,
    ) => {
      const baseDate = period === "year" ? ranges.year.currentStart : undefined;

      const labels = getBucketLabels(period, baseDate);
      const buckets = new Array(labels.length).fill(0);

      bookings.forEach((b) => {
        const idx = getBucketIndex(new Date(b.createdAt), period, baseDate);
        buckets[idx] += Number(b.amount ?? 0);
      });

      const bars = labels.map((label, i) => ({
        label,
        amount: Math.round(buckets[i]),
      }));

      const max = Math.max(...bars.map((b) => b.amount), 0);
      const step = max > 0 ? Math.ceil(max / 5) : 1;

      return {
        bars,
        yTicks: [0, step, step * 2, step * 3, step * 4, step * 5],
        yTickLabels: [0, step, step * 2, step * 3, step * 4, step * 5].map(
          (t, i) => (i === 0 ? "0" : `${symbol}${formatCompactNumber(t)}`),
        ),
      };
    };

    // ================= TOP CITIES =================
    const buildTopCities = (bookings: Booking[], period: DashboardPeriod) => {
      const baseDate = period === "year" ? ranges.year.currentStart : undefined;

      const labels = getBucketLabels(period, baseDate);
      const map = new Map<string, number[]>();

      bookings.forEach((b) => {
        const addr = (b as any).address;
        const rawCity = addr?.city ?? addr?.dataValues?.city;

        if (!rawCity) return;

        const city = rawCity.trim().toLowerCase();

        if (!city) return;

        if (!map.has(city)) {
          map.set(city, new Array(labels.length).fill(0));
        }

        const idx = getBucketIndex(new Date(b.createdAt), period, baseDate);

        map.get(city)![idx] += 1;
      });

      const series = [...map.entries()]
        .sort(
          (a, b) =>
            b[1].reduce((s, x) => s + x, 0) - a[1].reduce((s, x) => s + x, 0),
        )
        .slice(0, 5)
        .map(([name, data], idx) => ({
          name: formatCity(name),
          data,
          color: CITY_COLORS[idx % CITY_COLORS.length],
        }));

      const max = Math.max(...series.flatMap((s) => s.data), 0);
      const step = max > 0 ? Math.ceil(max / 5) : 1;

      return {
        xLabels: labels,
        series,
        yTicks: [0, step, step * 2, step * 3, step * 4, step * 5],
      };
    };

    // ================= TOP PARTNERS =================
    const partnerMap = new Map<number, number>();

    (topPartnerRowsRaw as any[]).forEach((row) => {
      const id = Number(row.servicePartnerId);
      if (!Number.isFinite(id)) return;
      partnerMap.set(id, Number(row.bookingCount) || 0);
    });

    const partnerIds = [...partnerMap.keys()];
    const profiles = await dashboardRepository.getPartnersWithUsers(partnerIds);

    const profileMap = new Map(
      profiles.map((p) => [
        p.id,
        {
          name: (p as any).user?.name ?? `Partner #${p.id}`,
          avatar: (p as any).user?.profileImage ?? null,
        },
      ]),
    );

    const topPartners: DashboardPartnerPoint[] = partnerIds.map(
      (partnerId) => ({
        name: profileMap.get(partnerId)?.name ?? `Partner #${partnerId}`,
        role: "Service Partner",
        completed: partnerMap.get(partnerId) ?? 0,
        avatar: profileMap.get(partnerId)?.avatar ?? null,
      }),
    );

    // ================= FINAL RESPONSE =================
    return {
      currency: currencySymbol,
      comparisonLabel: KPI_COMPARE_LABEL,
      kpis,
      topPartners,
      topServices: {
        week: buildTopServices(bookingsByPeriod.week),
        month: buildTopServices(bookingsByPeriod.month),
        year: buildTopServices(bookingsByPeriod.year),
      },
      revenue: {
        week: buildRevenue(bookingsByPeriod.week, "week", currencySymbol),
        month: buildRevenue(bookingsByPeriod.month, "month", currencySymbol),
        year: buildRevenue(bookingsByPeriod.year, "year", currencySymbol),
      },
      topCities: {
        week: buildTopCities(bookingsByPeriod.week, "week"),
        month: buildTopCities(bookingsByPeriod.month, "month"),
        year: buildTopCities(bookingsByPeriod.year, "year"),
      },
    };
  };

/**
 * @name getServicePartnerDashboardOptimized
 * @description Returns service partner dashboard response with week/month/year chart sections in one call.
 *              KPIs are returned once (derived from the "week" payload).
 * @access Private
 */
export const getServicePartnerDashboardOptimized = async (
  servicePartnerId: number,
): Promise<ServicePartnerDashboardMultiPeriodResponse> => {
  // ================= RANGES =================
  const ranges = {
    week: buildRange("week"),
    month: buildRange("month"),
    year: buildRange("year"),
  };

  const yearRange = ranges.year;

  // ================= COMMON DATA =================
  const [subCategories, bookingStats, allBookings] = await Promise.all([
    dashboardRepository.getPartnerSubCategories(servicePartnerId),

    dashboardRepository.getPartnerBookingStatsAggregated(
      servicePartnerId,
      ranges.week.currentStart,
      ranges.week.currentEnd,
      ranges.week.previousStart,
      ranges.week.previousEnd,
    ),

    dashboardRepository.getPartnerBookings(
      servicePartnerId,
      yearRange.currentStart,
      yearRange.currentEnd,
    ),
  ]);

  // ================= FILTER BOOKINGS =================
  const filterBookings = (start: Date, end: Date) =>
    allBookings.filter((booking) => {
      const time = new Date(booking.createdAt).getTime();
      return time >= start.getTime() && time <= end.getTime();
    });

  const bookingsByPeriod = {
    week: filterBookings(ranges.week.currentStart, ranges.week.currentEnd),
    month: filterBookings(ranges.month.currentStart, ranges.month.currentEnd),
    year: allBookings,
  };

  // ================= CURRENCY =================
  const latestBooking = allBookings[0] as Booking & { payment?: Payment };
  const currency = latestBooking?.payment?.currency || "INR";
  const currencySymbol = (CurrencySymbol as any)[currency] || "₹";

  // ================= KPI =================
  const subCategoryIds = subCategories.map((s) => s.subCategoryId);

  const activeServicesCount =
    await dashboardRepository.countServicesBySubCategories(subCategoryIds);

  const completedChange = calculateChange(
    bookingStats.currentCompleted,
    bookingStats.previousCompleted,
  );

  const futureChange = calculateChange(
    bookingStats.currentFuture,
    bookingStats.previousFuture,
  );

  const revenueChange = calculateChange(
    bookingStats.currentRevenue,
    bookingStats.previousRevenue,
  );

  const kpis: DashboardKpi[] = [
    {
      key: "revenue",
      title: "Total Revenue",
      value: `${currencySymbol}${formatCompactNumber(bookingStats.totalRevenue)}`,
      change: formatChangeString(revenueChange.percent),
      changePercent: Math.round(revenueChange.percent),
      positive: revenueChange.positive,
      iconKey: "dollar",
    },
    {
      key: "active_services",
      title: "Active Services Offered",
      value: formatCompactNumber(Number(activeServicesCount)),
      change: formatChangeString(0),
      changePercent: 0,
      positive: true,
      iconKey: "wrench",
    },
    {
      key: "completed_services",
      title: "Completed Services",
      value: formatCompactNumber(bookingStats.totalCompleted),
      change: formatChangeString(completedChange.percent),
      changePercent: Math.round(completedChange.percent),
      positive: completedChange.positive,
      iconKey: "badge-check",
    },
    {
      key: "future_bookings",
      title: "Future Bookings",
      value: formatCompactNumber(bookingStats.totalFuture),
      change: formatChangeString(futureChange.percent),
      changePercent: Math.round(futureChange.percent),
      positive: futureChange.positive,
      iconKey: "calendar",
    },
  ];

  // ================= SHARED BUILDER =================
  const buildDashboardSection = (
    bookings: Booking[],
    period: DashboardPeriod,
    symbol: string,
  ) => {
    const serviceBookingMap = new Map<string, number>();
    const serviceRevenueMap = new Map<string, number>();

    const labels = getBucketLabels(
      period,
      period === "year" ? ranges.year.currentStart : undefined,
    );

    const revenueBuckets = new Array(labels.length).fill(0);

    bookings.forEach((booking) => {
      const serviceName =
        (booking as Booking & { service?: Service }).service?.name ||
        "Unknown Service";

      serviceBookingMap.set(
        serviceName,
        (serviceBookingMap.get(serviceName) ?? 0) + 1,
      );

      const amount = Number(booking.amount ?? 0);

      serviceRevenueMap.set(
        serviceName,
        (serviceRevenueMap.get(serviceName) ?? 0) + amount,
      );

      const idx = getBucketIndex(
        new Date(booking.createdAt),
        period,
        period === "year" ? ranges.year.currentStart : undefined,
      );

      revenueBuckets[idx] += amount;
    });

    const topServices = [...serviceBookingMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value], idx) => ({
        label,
        value,
        color: SERVICE_COLORS[idx % SERVICE_COLORS.length],
      }));

    const topRevenueServices = [...serviceRevenueMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value], idx) => ({
        label,
        value,
        bookings: serviceBookingMap.get(label) ?? 0,
        color: CITY_COLORS[idx % CITY_COLORS.length],
      }));

    const bars = labels.map((label, idx) => ({
      label,
      amount: Math.round(revenueBuckets[idx] ?? 0),
    }));

    const maxBar = Math.max(...bars.map((b) => b.amount), 0);
    const step = maxBar > 0 ? Math.ceil(maxBar / 5) : 1;

    const yTicks = [0, step, step * 2, step * 3, step * 4, step * 5];
    const yTickLabels = yTicks.map((tick, idx) =>
      idx === 0 ? "0" : `${symbol}${formatCompactNumber(tick)}`,
    );

    return {
      currency: symbol,
      topServices: {
        totalBookings: bookings.length,
        services: topServices,
      },
      topRevenueServices: {
        totalBookings: bookings.length,
        services: topRevenueServices,
      },
      revenue: {
        bars,
        yTicks,
        yTickLabels,
      },
    };
  };

  const weekData = buildDashboardSection(bookingsByPeriod.week, "week", currencySymbol);
  const monthData = buildDashboardSection(bookingsByPeriod.month, "month", currencySymbol);
  const yearData = buildDashboardSection(bookingsByPeriod.year, "year", currencySymbol);

  // ================= FINAL RESPONSE =================
  return {
    currency: currencySymbol,
    comparisonLabel: KPI_COMPARE_LABEL,
    kpis,
    topServices: {
      week: weekData.topServices,
      month: monthData.topServices,
      year: yearData.topServices,
    },
    topRevenueServices: {
      week: weekData.topRevenueServices,
      month: monthData.topRevenueServices,
      year: yearData.topRevenueServices,
    },
    revenue: {
      week: weekData.revenue,
      month: monthData.revenue,
      year: yearData.revenue,
    },
  };
};
