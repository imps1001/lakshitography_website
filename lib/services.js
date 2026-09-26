"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const SERVICES_KEY = ["services"];

export function useServices() {
  const query = useQuery({
    queryKey: SERVICES_KEY,
    queryFn: () => api.get("/services").then((response) => response.data),
  });
  const services = query.data || [];
  const visible = services.filter((service) => service.visible);
  const prices = visible.map((service) => service.price_min).filter((price) => price != null);

  return {
    services,
    visible,
    loading: query.isLoading,
    startingPrice: prices.length ? Math.min(...prices) : null,
    bySlug: (slug) => services.find((service) => service.slug === slug),
  };
}
