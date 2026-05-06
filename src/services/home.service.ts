import logger from "@/utils/logger";
import {
  HomePublicStatsDto,
  HomeServiceDto,
  HomeServiceTypeDto,
  ServiceListParams,
} from "@/interfaces/home.interface";
import { serviceRepository } from "@/repositories/service.repository";

/**
 * @name getServiceTypesPublic
 * @description Returns service types for the public home page.
 * @access Private
 */
export const getServiceTypesPublic = async (): Promise<
  HomeServiceTypeDto[]
> => {
  logger.info("[DB] getServiceTypesPublic CALLED");
  const serviceTypes = await serviceRepository.getServiceTypes();

  return serviceTypes.map((st) => ({
    id: st.id,
    name: st.name,
    image: st.image ?? "",
  }));
};

/**
 * @name getPopularServicesPublic
 * @description Returns popular services based on booking counts with a fallback to newest services to fill remaining slots.
 * @access Private
 */
export const getPopularServicesPublic = async ({
  limit,
}: ServiceListParams): Promise<HomeServiceDto[]> => {
  logger.info("[DB] getPopularServicesPublic CALLED");

  const effectiveLimit = Math.min(50, Math.max(1, limit ?? 10));

  const bookingCounts =
    await serviceRepository.getPopularServiceIds(effectiveLimit);

  const popularServiceIds = bookingCounts
    .map((row) => Number(row.serviceId))
    .filter((id) => Number.isFinite(id));

  const popularServices =
    await serviceRepository.getServicesByIds(popularServiceIds);

  const byId = new Map(popularServices.map((s) => [s.id, s]));

  const orderedPopular = popularServiceIds
    .map((id) => byId.get(id))
    .filter((s) => Boolean(s));

  const remaining = Math.max(0, effectiveLimit - orderedPopular.length);

  const fallbackRows =
    remaining > 0
      ? await serviceRepository.getLatestServices(remaining, popularServiceIds)
      : [];

  const rows = [...orderedPopular, ...fallbackRows];

  return rows.map((s) => ({
    id: s!.id,
    name: s!.name,
    price: String(s!.price),
    image: (s!.images?.[0] ?? "") as string,
  }));
};

/**
 * @name getAllServicesPublic
 * @description Returns latest available services for the public home page (limited).
 * @access Private
 */
export const getAllServicesPublic = async ({
  limit,
}: ServiceListParams): Promise<HomeServiceDto[]> => {
  logger.info("[DB] getAllServicesPublic CALLED");
  const effectiveLimit = Math.min(50, Math.max(1, limit ?? 12));

  const rows = await serviceRepository.getLatestServices(effectiveLimit);

  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    price: String(s.price),
    image: (s.images?.[0] ?? "") as string,
  }));
};

/**
 * @name searchServicesPublic
 * @description Searches available services by name for the public home page (limited).
 * @access Private
 */
export const searchServicesPublic = async ({
  q,
  limit,
}: {
  q: string;
  limit?: number;
}): Promise<HomeServiceDto[]> => {
  const effectiveLimit = Math.min(50, Math.max(1, limit ?? 12));
  const query = q.trim();

  if (!query) return [];

  const rows = await serviceRepository.searchServices(query, effectiveLimit);

  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    price: String(s.price),
    image: (s.images?.[0] ?? "") as string,
  }));
};

/**
 * @name getPublicStats
 * @description Returns public counts for customers and services.
 * @access Public
 */
export const getPublicStats = async (): Promise<HomePublicStatsDto> => {
  try {
    const [customersGlobally, servicesCount, servicesPartnerCount] = await Promise.all([
      serviceRepository.countGlobalCustomers(),
      serviceRepository.countActiveServices(),
      serviceRepository.countActivePartners(),
    ]);

    return {
      customersGlobally: customersGlobally ?? 0,
      servicesCount: servicesCount ?? 0,
      servicesPartnerCount: servicesPartnerCount ?? 0,
    };
  } catch {
    return {
      customersGlobally: 0,
      servicesCount: 0,
      servicesPartnerCount: 0,
    };
  }
};
