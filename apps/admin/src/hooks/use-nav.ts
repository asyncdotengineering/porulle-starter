'use client';

// The admin panel is single-role (any signed-in admin sees everything), so nav
// filtering is a pass-through. Kept as hooks so the sidebar API stays unchanged.
import type { NavGroup, NavItem } from '@/types';

export function useFilteredNavItems(items: NavItem[]) {
  return items;
}

export function useFilteredNavGroups(groups: NavGroup[]) {
  return groups;
}
