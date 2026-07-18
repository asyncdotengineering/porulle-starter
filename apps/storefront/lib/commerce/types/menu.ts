export type MenuItemType =
  | "COLLECTION"
  | "COLLECTIONS"
  | "FRONTPAGE"
  | "HTTP"
  | "PAGE"
  | "PRODUCT"
  | "SEARCH";

export type MenuItem = {
  id: string;
  items: MenuItem[];
  title: string;
  type: MenuItemType;
  url: string;
};

export type Menu = {
  handle: string;
  id: string;
  items: MenuItem[];
  title: string;
};
