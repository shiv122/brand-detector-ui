"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Target, Image as ImageIcon, Video, Database, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

export function OverviewCards() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await apiClient.getDashboardStats();
      if (response.error || !response.data) {
        throw new Error(response.error || "Failed to fetch dashboard stats");
      }
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const overviewData = [
    {
      title: "Total Detections",
      value: data?.overview.total_detections ?? 0,
      icon: Target,
      description: "All time detections",
    },
    {
      title: "Images Processed",
      value: data?.overview.images_processed ?? 0,
      icon: ImageIcon,
      description: "Total images analyzed",
    },
    {
      title: "Videos Processed",
      value: data?.overview.videos_processed ?? 0,
      icon: Video,
      description: "Total videos analyzed",
    },
    {
      title: "Total Assets",
      value: data?.overview.total_assets ?? 0,
      icon: Package,
      description: "Total classified assets",
    },
  ];

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewData.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <item.icon className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">Error</div>
              <p className="text-xs text-muted-foreground mt-2">Failed to load data</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overviewData.map((item) => {
        const Icon = item.icon;
        
        return (
          <Card key={item.title} className="relative overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <Spinner className="h-5 w-5" />
              </div>
            )}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatNumber(item.value)}</div>
                  <span className="text-xs text-muted-foreground mt-2 block">{item.description}</span>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

