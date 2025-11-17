"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Video,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const recentActivity = [
  {
    id: 1,
    type: "video",
    name: "sports_highlights.mp4",
    detections: 45,
    time: "2 minutes ago",
    status: "completed",
    size: "125 MB",
  },
  {
    id: 2,
    type: "image",
    name: "ad_campaign_01.jpg",
    detections: 3,
    time: "15 minutes ago",
    status: "completed",
    size: "2.4 MB",
  },
  {
    id: 3,
    type: "video",
    name: "commercial_spot.mp4",
    detections: 78,
    time: "1 hour ago",
    status: "completed",
    size: "89 MB",
  },
  {
    id: 4,
    type: "image",
    name: "product_photo.jpg",
    detections: 1,
    time: "2 hours ago",
    status: "completed",
    size: "1.8 MB",
  },
  {
    id: 5,
    type: "video",
    name: "event_coverage.mp4",
    detections: 92,
    time: "3 hours ago",
    status: "processing",
    size: "234 MB",
  },
];

const processingQueue = [
  { name: "video_001.mp4", progress: 75, status: "processing" },
  { name: "image_batch_01.zip", progress: 45, status: "processing" },
  { name: "commercial_02.mp4", progress: 0, status: "pending" },
];

export function OperationalCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest processing jobs and results</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/video">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div
                  className={`p-2 rounded-md ${
                    activity.type === "video"
                      ? "bg-blue-100 dark:bg-blue-900"
                      : "bg-purple-100 dark:bg-purple-900"
                  }`}
                >
                  {activity.type === "video" ? (
                    <Video className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{activity.name}</p>
                    {activity.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {activity.detections} detections
                    </Badge>
                    <span className="text-xs text-muted-foreground">{activity.size}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Processing Queue</CardTitle>
              <CardDescription>Current jobs in progress</CardDescription>
            </div>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {processingQueue.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.status === "processing" ? (
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-gray-400" />
                    )}
                    <span className="text-sm font-medium truncate">{item.name}</span>
                  </div>
                  <Badge variant={item.status === "processing" ? "default" : "secondary"} className="text-xs">
                    {item.status}
                  </Badge>
                </div>
                {item.status === "processing" && (
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 border-t">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/dashboard/video">
                  View Queue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

