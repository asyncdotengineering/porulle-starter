import type { Filter } from "@/lib/types";

export interface ActiveFilterBadge {
  filterLabel: string;
  label: string;
  paramKey: string;
  value: string;
}

export function getActiveFilterBadges(
  filters: Filter[],
  activeFilters: Record<string, string | string[] | undefined>,
): ActiveFilterBadge[] {
  const badges: ActiveFilterBadge[] = [];

  for (const filter of filters) {
    const currentValue = activeFilters[filter.paramKey];
    if (!currentValue) continue;

    const values = Array.isArray(currentValue) ? currentValue : [currentValue];

    for (const value of values) {
      const filterValue = filter.values.find((v) => v.value === value);
      if (!filterValue) continue;

      badges.push({
        filterLabel: filter.label,
        label: filterValue.label,
        paramKey: filter.paramKey,
        value,
      });
    }
  }

  return badges;
}
