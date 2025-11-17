"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Video,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
}

export function OperationalCards() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await apiClient.getDashboardStats();
      if (response.error || !response.data) {
        throw new Error(response.error || "Failed to fetch dashboard stats");
      }
      return response.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds for queue updates
  });

  const recentActivity = useMemo(() => {
    if (!data?.recent_activity) return [];
    return data.recent_activity.slice(0, 5);
  }, [data]);

  const processingQueue = useMemo(() => {
    if (!data?.processing_queue) return [];
    return data.processing_queue;
  }, [data]);

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Failed to load data</CardDescription>
          </CardHeader>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Processing Queue</CardTitle>
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
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest processing jobs and results</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/video">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
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
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(activity.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-1.5 w-full" />
                </div>
              ))}
            </div>
          ) : processingQueue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No active jobs</p>
            </div>
          ) : (
            <div className="space-y-4">
              {processingQueue.map((item, index) => (
                <div key={item.session_id || index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {item.status === "processing" ? (
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-gray-400 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium truncate">{item.name}</span>
                    </div>
                    <Badge
                      variant={item.status === "processing" ? "default" : "secondary"}
                      className="text-xs flex-shrink-0 ml-2"
                    >
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

