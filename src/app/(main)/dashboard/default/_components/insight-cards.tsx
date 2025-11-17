"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, Zap, Clock, BarChart3 } from "lucide-react";
import Link from "next/link";

const topBrands = [
  { name: "Nike", detections: 234, change: "+12.5%", percentage: 18.7 },
  { name: "Adidas", detections: 189, change: "+8.2%", percentage: 15.1 },
  { name: "Coca-Cola", detections: 156, change: "+5.3%", percentage: 12.5 },
  { name: "Apple", detections: 142, change: "+15.8%", percentage: 11.4 },
  { name: "Samsung", detections: 98, change: "+3.1%", percentage: 7.8 },
];

const modelStats = [
  { model: "YOLOv8n", accuracy: 92, speed: 45, usage: 65, color: "bg-blue-500" },
  { model: "YOLOv8s", accuracy: 94, speed: 32, usage: 25, color: "bg-green-500" },
  { model: "YOLOv8m", accuracy: 96, speed: 18, usage: 10, color: "bg-purple-500" },
];

export function InsightCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top Detected Brands</CardTitle>
              <CardDescription>Most frequently detected logos this month</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/images">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topBrands.map((brand, index) => (
              <div key={brand.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{brand.name}</p>
                      <p className="text-xs text-muted-foreground">{brand.detections} detections</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {brand.change}
                    </Badge>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {brand.percentage}%
                    </span>
                  </div>
                </div>
                <Progress value={brand.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Model Performance</CardTitle>
              <CardDescription>Current model usage statistics</CardDescription>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {modelStats.map((model) => (
              <div key={model.model} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{model.model}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {model.usage}%
                  </Badge>
                </div>
                <Progress value={model.usage} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{model.accuracy}% accuracy</span>
                  <span>{model.speed} FPS</span>
                </div>
              </div>
            ))}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Avg Processing</span>
                </div>
                <span className="text-sm font-bold">12.5ms</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">per frame</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

