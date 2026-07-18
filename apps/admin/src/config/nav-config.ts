import { NavGroup } from '@/types';

/**
 * Navigation for the sidebar and the Cmd+K bar, grouped by domain. Each porulle
 * resource is one item.
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      }
    ]
  },
  {
    label: 'Catalog',
    items: [
      {
        title: 'Products',
        url: '/dashboard/products',
        icon: 'product',
        isActive: false,
        shortcut: ['p', 'p'],
        items: []
      },
      {
        title: 'Categories',
        url: '/dashboard/categories',
        icon: 'kanban',
        isActive: false,
        shortcut: ['c', 't'],
        items: []
      },
      {
        title: 'Brands',
        url: '/dashboard/brands',
        icon: 'badgeCheck',
        isActive: false,
        shortcut: ['b', 'b'],
        items: []
      }
    ]
  },
  {
    label: 'Sales',
    items: [
      {
        title: 'Orders',
        url: '/dashboard/orders',
        icon: 'billing',
        isActive: false,
        shortcut: ['o', 'o'],
        items: []
      },
      {
        title: 'Customers',
        url: '/dashboard/customers',
        icon: 'user',
        isActive: false,
        shortcut: ['c', 'c'],
        items: []
      },
      {
        title: 'Promotions',
        url: '/dashboard/promotions',
        icon: 'sparkles',
        isActive: false,
        shortcut: ['m', 'm'],
        items: []
      },
      {
        title: 'Pricing modifiers',
        url: '/dashboard/pricing-modifiers',
        icon: 'sparkles',
        isActive: false,
        shortcut: ['p', 'm'],
        items: []
      },
      {
        title: 'Gift cards',
        url: '/dashboard/gift-cards',
        icon: 'creditCard',
        isActive: false,
        shortcut: ['g', 'c'],
        items: []
      }
    ]
  },
  {
    label: 'Operations',
    items: [
      {
        title: 'Low stock',
        url: '/dashboard/inventory',
        icon: 'adjustments',
        isActive: false,
        shortcut: ['l', 'l'],
        items: []
      },
      {
        title: 'Health',
        url: '/dashboard/health',
        icon: 'warning',
        isActive: false,
        shortcut: ['h', 'h'],
        items: []
      },
      {
        title: 'Tax',
        url: '/dashboard/tax',
        icon: 'billing',
        isActive: false,
        shortcut: ['t', 'x'],
        items: []
      },
      {
        title: 'Shipping',
        url: '/dashboard/shipping',
        icon: 'product',
        isActive: false,
        shortcut: ['s', 'h'],
        items: []
      },
      {
        title: 'Staff',
        url: '/dashboard/staff',
        icon: 'teams',
        isActive: false,
        shortcut: ['s', 't'],
        items: []
      }
    ]
  }
];
