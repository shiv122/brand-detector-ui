import {
  Home,
  Image,
  Video,
  Tags,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Detection",
    items: [
      {
        title: "Home",
        url: "/dashboard/default",
        icon: Home,
      },
      {
        title: "Image Detection",
        url: "/dashboard/images",
        icon: Image,
      },
      {
        title: "Video Detection",
        url: "/dashboard/video",
        icon: Video,
      },
      {
        title: "Classification",
        url: "/dashboard/classification",
        icon: Tags,
      },
    ],
  },
];
