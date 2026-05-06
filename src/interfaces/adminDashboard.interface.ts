export type DashboardPeriod = "week" | "month" | "year";

export type DashboardKpi = {
  key:
    | "bookings"
    | "users"
    | "partners"
    | "revenue"
    | "active_services"
    | "completed_services"
    | "future_bookings";
  title: string;
  value: string;
  change: string;
  changePercent: number;
  positive: boolean;
  iconKey: "calendar" | "users" | "wrench" | "dollar" | "badge-check";
};

export type DashboardServicePoint = {
  label: string;
  value: number;
  color: string;
};

export type DashboardPartnerPoint = {
  name: string;
  role: string;
  completed: number;
  avatar: string | null;
};

export type DashboardCitySeries = {
  name: string;
  color: string;
  data: number[];
};

export type DashboardResponse = {
  period: DashboardPeriod;
  comparisonLabel: string;
  kpis: DashboardKpi[];
  topServices: {
    totalBookings: number;
    services: DashboardServicePoint[];
  };
  revenue: {
    bars: Array<{ label: string; amount: number }>;
    yTicks: number[];
    yTickLabels: string[];
  };
  topCities: {
    xLabels: string[];
    series: DashboardCitySeries[];
    yTicks: number[];
  };
  topPartners: DashboardPartnerPoint[];
};

export type DashboardOverviewMultiPeriodResponse = {
  currency: string;
  comparisonLabel: string;
  kpis: DashboardKpi[];
  topPartners: DashboardPartnerPoint[];
  topServices: Record<DashboardPeriod, DashboardResponse["topServices"]>;
  revenue: Record<DashboardPeriod, DashboardResponse["revenue"]>;
  topCities: Record<DashboardPeriod, DashboardResponse["topCities"]>;
};

export type ServicePartnerDashboardResponse = {
  period: DashboardPeriod;
  comparisonLabel: string;
  kpis: DashboardKpi[];
  topServices: {
    totalBookings: number;
    services: DashboardServicePoint[];
  };
  topRevenueServices: {
    services: DashboardServicePoint[];
  };
  revenue: DashboardResponse["revenue"];
};

export type ServicePartnerDashboardMultiPeriodResponse = {
  currency: string;
  comparisonLabel: string;
  kpis: DashboardKpi[];
  topServices: Record<
    DashboardPeriod,
    ServicePartnerDashboardResponse["topServices"]
  >;
  topRevenueServices: Record<
    DashboardPeriod,
    ServicePartnerDashboardResponse["topRevenueServices"]
  >;
  revenue: Record<DashboardPeriod, ServicePartnerDashboardResponse["revenue"]>;
};

export type AdminWeeklyStats = {
  currentWeek: number | null;
  previousWeek: number | null;
  totalCount: number | null;
};

export type AdminWeeklyStatsRevenue = {
  currentWeek: number | null;
  previousWeek: number | null;
  totalAmount: number | null;
}

export interface PartnerBookingStats {
  currentCompleted: number;
  previousCompleted: number;
  currentFuture: number;
  previousFuture: number;
  totalCompleted: number;
  totalFuture: number;
  currentRevenue: number;
  previousRevenue: number;
  totalRevenue: number;
}