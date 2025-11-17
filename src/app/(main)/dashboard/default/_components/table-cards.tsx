"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app-config";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Image as ImageIcon, Video, ArrowUpRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";

const detectionHistory = [
  {
    id: 1,
    type: "video",
    filename: "sports_highlights.mp4",
    detections: 45,
    brands: ["Nike", "Adidas", "Puma"],
    confidence: 0.85,
    date: "2024-01-15",
    time: "14:32",
  },
  {
    id: 2,
    type: "image",
    filename: "ad_campaign_01.jpg",
    detections: 3,
    brands: ["Coca-Cola"],
    confidence: 0.92,
    date: "2024-01-15",
    time: "13:15",
  },
  {
    id: 3,
    type: "video",
    filename: "commercial_spot.mp4",
    detections: 78,
    brands: ["Apple", "Samsung", "Google"],
    confidence: 0.78,
    date: "2024-01-15",
    time: "11:45",
  },
  {
    id: 4,
    type: "image",
    filename: "product_photo.jpg",
    detections: 1,
    brands: ["Nike"],
    confidence: 0.95,
    date: "2024-01-15",
    time: "10:20",
  },
  {
    id: 5,
    type: "video",
    filename: "event_coverage.mp4",
    detections: 92,
    brands: ["Nike", "Adidas", "Reebok", "Puma"],
    confidence: 0.82,
    date: "2024-01-14",
    time: "16:10",
  },
];

export function TableCards() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Detection History</CardTitle>
            <CardDescription>Recent detection results and analysis</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/images">
              View All
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Detections</TableHead>
              <TableHead>Brands</TableHead>
              {APP_CONFIG.showConfidence && <TableHead>Confidence</TableHead>}
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detectionHistory.map((item) => (
              <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{item.filename}</TableCell>
                <TableCell>
                  <Badge variant={item.type === "video" ? "default" : "secondary"} className="text-xs">
                    {item.type === "video" ? (
                      <Video className="h-3 w-3 mr-1" />
                    ) : (
                      <ImageIcon className="h-3 w-3 mr-1" />
                    )}
                    {item.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.detections}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 flex-wrap">
                    {item.brands.slice(0, 2).map((brand) => (
                      <Badge key={brand} variant="secondary" className="text-xs">
                        {brand}
                      </Badge>
                    ))}
                    {item.brands.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{item.brands.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                {APP_CONFIG.showConfidence && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {(item.confidence * 100).toFixed(0)}%
                      </span>
                      <div className="w-16 bg-muted rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${item.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground">
                  <div className="text-sm">{item.date}</div>
                  <div className="text-xs">{item.time}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

