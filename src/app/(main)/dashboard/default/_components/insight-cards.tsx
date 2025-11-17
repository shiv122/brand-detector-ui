"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { TrendingUp, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

const COLORS = [
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#10B981", // Green
  "#3B82F6", // Blue
  "#EC4899", // Pink
  "#FACC15", // Yellow
  "#06B6D4", // Cyan
  "#EF4444", // Red
];

export function InsightCards() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await apiClient.getDashboardStats();
      if (response.error || !response.data) {
        throw new Error(response.error || "Failed to fetch dashboard stats");
      }
      return response.data;
    },
    refetchInterval: 30000,
  });

  const topBrands = useMemo(() => {
    if (!data?.top_brands) return [];
    return data.top_brands.slice(0, 5);
  }, [data]);

  const pieChartData = useMemo(() => {
    if (!topBrands.length) return [];
    return topBrands.map((brand) => ({
      name: brand.name,
      value: brand.detections,
    }));
  }, [topBrands]);

  const pieChartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    topBrands.forEach((brand, index) => {
      const color = COLORS[index % COLORS.length];
      config[brand.name] = {
        label: brand.name,
        color: color,
      };
    });
    return config;
  }, [topBrands]);

  const totalDetections = useMemo(() => {
    return topBrands.reduce((sum, brand) => sum + brand.detections, 0);
  }, [topBrands]);

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Top Detected Brands</CardTitle>
            <CardDescription>Failed to load data</CardDescription>
          </CardHeader>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Brand Distribution</CardTitle>
            <CardDescription>Failed to load data</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top Detected Brands</CardTitle>
              <CardDescription>Most frequently detected logos</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/images">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : topBrands.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No brand data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topBrands.map((brand, index) => {
                const percentage = totalDetections > 0 
                  ? (brand.detections / totalDetections) * 100 
                  : 0;
                
                return (
                  <div key={brand.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{brand.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {brand.detections.toLocaleString()} detections
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Brand Distribution</CardTitle>
              <CardDescription>Top brands by detection count</CardDescription>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[220px]">
              <Spinner className="h-6 w-6" />
            </div>
          ) : pieChartData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground">
              <p className="text-sm">No data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              <ChartContainer config={pieChartConfig} className="w-full h-[220px] aspect-auto">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    strokeWidth={2}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {topBrands.map((brand, index) => (
                  <div key={brand.name} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{brand.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

