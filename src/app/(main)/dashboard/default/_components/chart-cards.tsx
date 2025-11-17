"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { BarChart3, TrendingUp, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

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

export function ChartCards() {
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

  // Process brand distribution data for line chart
  const brandDistributionData = useMemo(() => {
    if (!data?.brand_distribution || data.brand_distribution.length === 0) return [];
    
    // Get all unique brands from the distribution
    const allBrands = new Set<string>();
    data.brand_distribution.forEach((entry) => {
      Object.keys(entry).forEach((key) => {
        if (key !== "date") {
          allBrands.add(key);
        }
      });
    });

    // Get top 5 brands by total detections
    const brandTotals: Record<string, number> = {};
    data.brand_distribution.forEach((entry) => {
      Object.keys(entry).forEach((key) => {
        if (key !== "date") {
          brandTotals[key] = (brandTotals[key] || 0) + (entry[key] as number);
        }
      });
    });

    const topBrands = Array.from(allBrands)
      .sort((a, b) => (brandTotals[b] || 0) - (brandTotals[a] || 0))
      .slice(0, 5);

    // Transform data for chart
    return data.brand_distribution.map((entry) => {
      const chartEntry: Record<string, string | number> = {
        date: new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
      topBrands.forEach((brand) => {
        chartEntry[brand] = entry[brand] || 0;
      });
      return chartEntry;
    });
  }, [data]);

  // Assets per brand - stacked bar chart data
  const assetsPerBrandData = useMemo(() => {
    if (!data?.assets_per_brand) return [];
    
    const brandNames = Object.keys(data.assets_per_brand).slice(0, 5);
    const allAssetNames = new Set<string>();
    
    // Collect all unique asset names
    brandNames.forEach((brand) => {
      data.assets_per_brand[brand].forEach((asset) => {
        allAssetNames.add(asset.asset_name);
      });
    });
    
    const assetNamesArray = Array.from(allAssetNames).slice(0, 4);
    
    // Transform to chart format
    return brandNames.map((brand) => {
      const chartEntry: Record<string, string | number> = {
        brand: brand,
      };
      
      assetNamesArray.forEach((assetName) => {
        const assetData = data.assets_per_brand[brand].find(
          (a) => a.asset_name === assetName
        );
        chartEntry[assetName] = assetData ? assetData.count : 0;
      });
      
      return chartEntry;
    });
  }, [data]);

  // Top assets data
  const topAssetsData = useMemo(() => {
    if (!data?.top_assets) return [];
    return data.top_assets.slice(0, 6);
  }, [data]);


  // Sessions over time (last 7 days from recent activity)
  const sessionsOverTime = useMemo(() => {
    if (!data?.recent_activity) return [];
    
    const last7Days: Record<string, number> = {};
    const today = new Date();
    
    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      last7Days[dateKey] = 0;
    }

    // Count sessions per day
    data.recent_activity.forEach((activity) => {
      const activityDate = new Date(activity.created_at).toISOString().split("T")[0];
      if (last7Days.hasOwnProperty(activityDate)) {
        last7Days[activityDate]++;
      }
    });

    return Object.entries(last7Days).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sessions: count,
    }));
  }, [data]);

  const lineChartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    if (brandDistributionData.length > 0) {
      const firstEntry = brandDistributionData[0];
      Object.keys(firstEntry).forEach((key, index) => {
        if (key !== "date") {
          config[key] = {
            label: key,
            color: COLORS[index % COLORS.length],
          };
        }
      });
    }
    return config;
  }, [brandDistributionData]);

  const stackedBarChartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    if (assetsPerBrandData.length > 0) {
      const firstEntry = assetsPerBrandData[0];
      Object.keys(firstEntry).forEach((key, index) => {
        if (key !== "brand") {
          config[key] = {
            label: key,
            color: COLORS[index % COLORS.length],
          };
        }
      });
    }
    return config;
  }, [assetsPerBrandData]);

  const topAssetsChartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    topAssetsData.forEach((asset, index) => {
      config[asset.name] = {
        label: asset.name,
        color: COLORS[index % COLORS.length],
      };
    });
    return config;
  }, [topAssetsData]);

  const areaChartConfig: ChartConfig = {
    sessions: {
      label: "Sessions",
      color: "#10B981",
    },
  };

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Brand Distribution Over Time</CardTitle>
            <CardDescription>Failed to load data</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Brands</CardTitle>
            <CardDescription>Failed to load data</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Brand Distribution Over Time - Line Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Brand Distribution Over Time</CardTitle>
              <CardDescription>Top 5 brands detection trends (last 30 days)</CardDescription>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Spinner className="h-6 w-6" />
            </div>
          ) : brandDistributionData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p className="text-sm">No distribution data available</p>
            </div>
          ) : (
            <ChartContainer config={lineChartConfig} className="w-full h-[300px] aspect-auto">
              <LineChart data={brandDistributionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {Object.keys(brandDistributionData[0] || {})
                  .filter((key) => key !== "date")
                  .map((brand, index) => (
                    <Line
                      key={brand}
                      type="monotone"
                      dataKey={brand}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Assets per Brand - Stacked Bar Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assets per Brand</CardTitle>
              <CardDescription>Assets grouped by brand</CardDescription>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Spinner className="h-6 w-6" />
            </div>
          ) : assetsPerBrandData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p className="text-sm">No asset data available</p>
            </div>
          ) : (
            <ChartContainer config={stackedBarChartConfig} className="w-full h-[300px] aspect-auto">
              <BarChart data={assetsPerBrandData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="brand"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {Object.keys(assetsPerBrandData[0] || {})
                  .filter((key) => key !== "brand")
                  .map((assetName, index) => (
                    <Bar
                      key={assetName}
                      dataKey={assetName}
                      stackId="a"
                      fill={COLORS[index % COLORS.length]}
                      radius={index === 0 ? [4, 4, 0, 0] : undefined}
                    />
                  ))}
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Sessions Over Time - Area Chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sessions Over Time</CardTitle>
              <CardDescription>Processing sessions in the last 7 days</CardDescription>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Spinner className="h-6 w-6" />
            </div>
          ) : sessionsOverTime.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p className="text-sm">No session data available</p>
            </div>
          ) : (
            <ChartContainer config={areaChartConfig} className="w-full h-[300px] aspect-auto">
              <AreaChart data={sessionsOverTime}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke="#10B981"
                  fill="url(#colorSessions)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

