"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Image as ImageIcon, Video, Activity } from "lucide-react";

const overviewData = [
  {
    title: "Total Detections",
    value: "12,847",
    change: "+18.2%",
    trend: "up",
    icon: Target,
    description: "All time detections",
  },
  {
    title: "Images Processed",
    value: "3,421",
    change: "+12.5%",
    trend: "up",
    icon: ImageIcon,
    description: "Total images analyzed",
  },
  {
    title: "Videos Processed",
    value: "287",
    change: "+8.3%",
    trend: "up",
    icon: Video,
    description: "Total videos analyzed",
  },
  {
    title: "Avg Confidence",
    value: "91.5%",
    change: "+2.1%",
    trend: "up",
    icon: Activity,
    description: "Average detection confidence",
  },
];

export function OverviewCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overviewData.map((item) => {
        const Icon = item.icon;
        const isPositive = item.trend === "up";
        
        return (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={isPositive ? "default" : "destructive"}
                  className="text-xs font-normal"
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {item.change}
                </Badge>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

