"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Download, TrendingUp, Clock, Target, Package, BarChart3, ChevronDown } from "lucide-react";
import type { VideoFrameData } from "@/lib/api-client";
import { apiClient } from "@/lib/api-client";
import { SlidingNumber } from "@/components/ui/sliding-number";
import { APP_CONFIG } from "@/config/app-config";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  LabelList,
} from "recharts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

function getBaseUrl() {
  return API_BASE_URL.replace(/\/api$/, "") || "http://localhost:8000";
}

function getConfidenceVariant(confidence: number) {
  const percentage = confidence * 100;
  if (percentage >= 80) return "default";
  if (percentage >= 60) return "secondary";
  if (percentage >= 40) return "outline";
  return "destructive";
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function SlidingTime({ seconds }: { seconds: number }) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return (
    <div className="flex items-center gap-0.5 tabular-nums">
      <SlidingNumber
        number={h}
        className="text-3xl font-bold text-primary"
        inView={true}
        padStart={true}
        transition={{ stiffness: 200, damping: 20, mass: 0.4 }}
      />
      <span className="text-3xl font-bold text-primary">:</span>
      <SlidingNumber
        number={m}
        className="text-3xl font-bold text-primary"
        inView={true}
        padStart={true}
        transition={{ stiffness: 200, damping: 20, mass: 0.4 }}
      />
      <span className="text-3xl font-bold text-primary">:</span>
      <SlidingNumber
        number={s}
        className="text-3xl font-bold text-primary"
        inView={true}
        padStart={true}
        transition={{ stiffness: 200, damping: 20, mass: 0.4 }}
      />
    </div>
  );
}

function SlidingTimeSmall({ seconds }: { seconds: number }) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return (
    <div className="flex items-center gap-0.5 tabular-nums">
      <SlidingNumber
        number={h}
        className="text-xs font-semibold text-muted-foreground"
        inView={true}
        padStart={true}
        transition={{ stiffness: 200, damping: 20, mass: 0.4 }}
      />
      <span className="text-xs text-muted-foreground">:</span>
      <SlidingNumber
        number={m}
        className="text-xs font-semibold text-muted-foreground"
        inView={true}
        padStart={true}
        transition={{ stiffness: 200, damping: 20, mass: 0.4 }}
      />
      <span className="text-xs text-muted-foreground">:</span>
      <SlidingNumber
        number={s}
        className="text-xs font-semibold text-muted-foreground"
        inView={true}
        padStart={true}
        transition={{ stiffness: 200, damping: 20, mass: 0.4 }}
      />
    </div>
  );
}

const chartColorVars = ["#8B5CF6", "#F97316", "#10B981", "#3B82F6", "#EC4899", "#FACC15"];

const getChartColor = (index: number) => chartColorVars[index % chartColorVars.length];

interface VideoResultsProps {
  frames: VideoFrameData[];
  logoCounts: Record<string, number>;
  processedVideoUrl: string | null;
  sessionId: string | null;
  framesPerSecond: number;
  isProcessing: boolean;
  progressPercentage: number;
  isVideoCreating: boolean;
  isVideoProcessing: boolean;
  realtimeCsvFiles: Record<string, string>;
}

export function VideoResults({
  frames,
  logoCounts,
  processedVideoUrl,
  sessionId,
  framesPerSecond,
  isProcessing,
  progressPercentage,
  isVideoCreating,
  isVideoProcessing,
  realtimeCsvFiles = {},
}: VideoResultsProps) {
  const [previewedFrame, setPreviewedFrame] = useState<VideoFrameData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [hoveredFrame, setHoveredFrame] = useState<number | null>(null);
  const [framesToShow, setFramesToShow] = useState(200);
  const [hoveredDetectionIndex, setHoveredDetectionIndex] = useState<number | null>(null);
  const [isBrandTimeOpen, setIsBrandTimeOpen] = useState(false);
  const [isAssetStatsOpen, setIsAssetStatsOpen] = useState(false);
  const [expandedBrandAssets, setExpandedBrandAssets] = useState<Set<string>>(new Set());
  const frameImageRef = useRef<HTMLImageElement | null>(null);
  const framesPerPage = 200;

  const handleDownloadCSV = async () => {
    const effectiveSessionId = sessionId || frames[frames.length - 1]?.session_summary?.session_id;
    if (!effectiveSessionId) {
      console.error("No session ID available for CSV export");
      return;
    }

    try {
      const response = await apiClient.exportSessionToCSV(effectiveSessionId);
      if (response.data) {
        Object.entries(response.data.csv_files).forEach(([key, filename]) => {
          apiClient.downloadCSVFile(filename);
        });
      }
    } catch (error) {
      console.error("Failed to download CSV:", error);
    }
  };

  // Calculate unique logos from frames if logoCounts is empty
  const uniqueLogos = useMemo(() => {
    if (Object.keys(logoCounts).length > 0) {
      return Object.keys(logoCounts);
    }
    // Fallback: calculate from frames
    const logoSet = new Set<string>();
    frames.forEach((frame) => {
      frame.detections?.forEach((detection) => {
        if (detection.class_name) {
          logoSet.add(detection.class_name);
        }
      });
    });
    return Array.from(logoSet);
  }, [logoCounts, frames]);

  const totalDetections = frames.reduce(
    (sum, frame) => sum + (frame.total_detections || 0),
    0
  );

  // Calculate screen time
  const safeFramesPerSecond = framesPerSecond > 0 ? framesPerSecond : 30;
  const frameInterval = 1 / safeFramesPerSecond;
  const totalLogoTime = frames.reduce((sum, frame) => {
    return sum + (frame.total_detections || 0) * frameInterval;
  }, 0);

  const individualLogoTime = useMemo(() => {
    const logoTimeMap = new Map<string, number>();
    frames.forEach((frame) => {
      frame.detections?.forEach((detection) => {
        const logoName = detection.class_name;
        const currentTime = logoTimeMap.get(logoName) || 0;
        logoTimeMap.set(logoName, currentTime + frameInterval);
      });
    });

    return Array.from(logoTimeMap.entries())
      .map(([name, time]) => ({
        name,
        time,
        formattedTime: formatDuration(time),
      }))
      .sort((a, b) => b.time - a.time);
  }, [frames, frameInterval]);

  const brandDistributionData = useMemo(() => {
    const counts = new Map<string, number>();

    if (Object.keys(logoCounts).length > 0) {
      Object.entries(logoCounts).forEach(([brand, count]) => counts.set(brand, count));
    } else {
      frames.forEach((frame) => {
        frame.detections?.forEach((detection) => {
          if (detection.class_name) {
            counts.set(detection.class_name, (counts.get(detection.class_name) || 0) + 1);
          }
        });
      });
    }

    return Array.from(counts.entries())
      .filter(([_, value]) => value >= 5) // Only include brands with 5+ detections
      .map(([brand, value], index) => ({
        brand,
        value,
        key: `brand_${index}`,
        color: getChartColor(index),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [logoCounts, frames]);

  const pieChartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {
      value: { label: "Detections", color: "hsl(var(--chart-1))" },
    };

    brandDistributionData.forEach((item, index) => {
      config[item.key] = {
        label: item.brand,
        color: item.color,
      };
    });

    return config;
  }, [brandDistributionData]);

  const brandConfidenceData = useMemo(() => {
    const brandMap = new Map<string, { count: number; confidenceSum: number }>();

    frames.forEach((frame) => {
      frame.detections?.forEach((detection) => {
        if (!detection.class_name) return;
        const entry = brandMap.get(detection.class_name) || { count: 0, confidenceSum: 0 };
        entry.count += 1;
        entry.confidenceSum += detection.confidence || 0;
        brandMap.set(detection.class_name, entry);
      });
    });

    return Array.from(brandMap.entries())
      .filter(([_, data]) => data.count >= 5) // Only include brands with 5+ detections
      .map(([brand, data]) => ({
        brand,
        count: data.count,
        avgConfidence: data.count > 0 ? data.confidenceSum / data.count : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [frames]);

  const brandTimelineBrands = useMemo(
    () =>
      brandDistributionData.slice(0, 4).map((item, index) => ({
        name: item.brand,
        key: `timeline_${index}`,
        color: getChartColor(index),
      })),
    [brandDistributionData]
  );

  const brandTimelineData = useMemo(() => {
    if (frames.length === 0 || brandTimelineBrands.length === 0) return [];
    const samplingStep = Math.max(1, Math.floor(frames.length / 60));
    const points: Array<Record<string, number | string>> = [];

    for (let i = 0; i < frames.length; i += samplingStep) {
      const frame = frames[i];
      if (!frame) continue;
      const timeSeconds =
        frame.frame_number !== undefined && frame.frame_number !== null
          ? frame.frame_number / safeFramesPerSecond
          : i * frameInterval;
      const timeLabel = formatDuration(timeSeconds);
      const point: Record<string, number | string> = {
        time: timeLabel,
        total: frame.total_detections || 0,
      };

      brandTimelineBrands.forEach((brand) => {
        const count =
          frame.detections?.filter((detection) => detection.class_name === brand.name).length || 0;
        point[brand.key] = count;
      });

      points.push(point);
    }

    return points;
  }, [frames, frameInterval, safeFramesPerSecond, brandTimelineBrands]);

  const brandTimelineChartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {
      total: { label: "Total Detections", color: "#94A3B8" },
    };

    brandTimelineBrands.forEach((brand) => {
      config[brand.key] = { label: brand.name, color: brand.color };
    });

    return config;
  }, [brandTimelineBrands]);

  // Confidence over time data
  const confidenceOverTimeData = useMemo(() => {
    if (frames.length === 0) return [];
    const safeFramesPerSecond = framesPerSecond > 0 ? framesPerSecond : 1;
    const frameInterval = 1 / safeFramesPerSecond;

    // Sample every Nth frame to avoid too many data points
    const sampleRate = Math.max(1, Math.floor(frames.length / 50));
    const sampledFrames = frames.filter((_, index) => index % sampleRate === 0);

    return sampledFrames.map((frame, index) => {
      const avgConfidence =
        frame.detections && frame.detections.length > 0
          ? frame.detections.reduce((sum, d) => sum + (d.confidence || 0), 0) / frame.detections.length
          : 0;
      return {
        time: `${(index * sampleRate * frameInterval).toFixed(1)}s`,
        timestamp: index * sampleRate * frameInterval,
        confidence: Number((avgConfidence * 100).toFixed(2)),
      };
    });
  }, [frames, framesPerSecond]);

  const confidenceOverTimeConfig = useMemo<ChartConfig>(
    () => ({
      confidence: { label: "Avg Confidence %", color: "#8B5CF6" },
    }),
    []
  );

  // Detection count per brand (bar chart)
  const brandCountBarData = useMemo(() => {
    return brandConfidenceData.map((item, index) => ({
      brand: item.brand.length > 12 ? `${item.brand.substring(0, 12)}...` : item.brand,
      fullBrand: item.brand,
      count: item.count,
      key: `bar_${index}`,
      color: getChartColor(index),
    }));
  }, [brandConfidenceData]);

  const brandCountBarConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};
    brandCountBarData.forEach((item) => {
      config[item.key] = {
        label: item.fullBrand,
        color: item.color,
      };
    });
    return config;
  }, [brandCountBarData]);

  // Detection vs confidence contrast data
  const brandContrastData = useMemo(() => {
    return brandConfidenceData.map((item) => ({
      brand: item.brand.length > 12 ? `${item.brand.substring(0, 12)}...` : item.brand,
      fullBrand: item.brand,
      detections: item.count,
      confidence: Number((item.avgConfidence * 100).toFixed(2)),
    }));
  }, [brandConfidenceData]);

  const brandContrastChartConfig = useMemo<ChartConfig>(
    () => ({
      detections: { label: "Detections", color: "#F97316" },
      confidence: { label: "Avg Confidence %", color: "#0EA5E9" },
    }),
    []
  );

  // Combined frame detection and confidence over time
  const combinedFrameData = useMemo(() => {
    if (frames.length === 0) return [];
    const safeFramesPerSecond = framesPerSecond > 0 ? framesPerSecond : 1;
    const frameInterval = 1 / safeFramesPerSecond;

    // Sample every Nth frame
    const sampleRate = Math.max(1, Math.floor(frames.length / 50));
    const sampledFrames = frames.filter((_, index) => index % sampleRate === 0);

    return sampledFrames.map((frame, index) => {
      const avgConfidence =
        frame.detections && frame.detections.length > 0
          ? frame.detections.reduce((sum, d) => sum + (d.confidence || 0), 0) / frame.detections.length
          : 0;
      return {
        time: `${(index * sampleRate * frameInterval).toFixed(1)}s`,
        timestamp: index * sampleRate * frameInterval,
        detections: frame.total_detections || 0,
        confidence: Number((avgConfidence * 100).toFixed(2)),
      };
    });
  }, [frames, framesPerSecond]);

  const combinedFrameConfig = useMemo<ChartConfig>(
    () => ({
      detections: { label: "Detections per Frame", color: "#F97316" },
      confidence: { label: "Avg Confidence %", color: "#8B5CF6" },
    }),
    []
  );

  // Brand Frequency Radial Chart Data
  const brandFrequencyRadialData = useMemo(() => {
    if (brandDistributionData.length === 0) return [];
    const maxValue = Math.max(...brandDistributionData.map((item) => item.value), 1);
    return brandDistributionData.slice(0, 6).map((item, index) => ({
      brand: item.brand.length > 15 ? `${item.brand.substring(0, 15)}...` : item.brand,
      fullBrand: item.brand,
      value: Number(((item.value / maxValue) * 100).toFixed(2)),
      count: item.value,
      key: `radial_${index}`,
      color: item.color,
    }));
  }, [brandDistributionData]);

  const brandFrequencyRadialConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};
    brandFrequencyRadialData.forEach((item) => {
      config[item.key] = {
        label: item.fullBrand,
        color: item.color,
      };
    });
    return config;
  }, [brandFrequencyRadialData]);

  // Asset Statistics (classifications per brand)
  const assetStats = useMemo(() => {
    // Map: brand -> Map: asset (classification) -> count
    const brandAssetMap = new Map<string, Map<string, number>>();
    let totalAssets = 0;
    let totalConfidence = 0;

    frames.forEach((frame) => {
      frame.detections?.forEach((detection) => {
        const brandName = detection.class_name;
        if (!brandName) return;

        // Get classifications (assets) for this detection
        if (detection.classification && detection.classification.length > 0) {
          // Initialize brand map if needed
          if (!brandAssetMap.has(brandName)) {
            brandAssetMap.set(brandName, new Map<string, number>());
          }

          const assetMap = brandAssetMap.get(brandName)!;

          // Count each classification (asset) for this brand
          detection.classification.forEach((asset: { class_name: string; confidence: number }) => {
            const assetName = asset.class_name;
            assetMap.set(assetName, (assetMap.get(assetName) || 0) + 1);
            totalAssets += 1;
            totalConfidence += asset.confidence || 0;
          });
        }
      });
    });

    // Convert to flat array: brand -> assets with counts
    const perBrand = Array.from(brandAssetMap.entries())
      .map(([brand, assetMap]) => {
        const assets = Array.from(assetMap.entries())
          .map(([assetName, count]) => ({ assetName, count }))
          .sort((a, b) => b.count - a.count);
        return {
          brand,
          assets,
          totalAssets: assets.reduce((sum, a) => sum + a.count, 0),
        };
      })
      .sort((a, b) => b.totalAssets - a.totalAssets);

    return {
      total: totalAssets,
      avgConfidence: totalAssets > 0 ? totalConfidence / totalAssets : 0,
      perBrand,
      uniqueAssets: new Set(
        Array.from(brandAssetMap.values())
          .flatMap((assetMap) => Array.from(assetMap.keys()))
      ).size,
    };
  }, [frames]);

  // Stacked Asset-Brand Data (assets as categories, brands stacked)
  const stackedAssetBrandData = useMemo(() => {
    // First, collect all unique assets and their brand contributions
    const assetMap = new Map<string, Map<string, number>>();

    assetStats.perBrand.forEach((brandData) => {
      brandData.assets.forEach((asset) => {
        if (!assetMap.has(asset.assetName)) {
          assetMap.set(asset.assetName, new Map<string, number>());
        }
        const brandMap = assetMap.get(asset.assetName)!;
        brandMap.set(brandData.brand, (brandMap.get(brandData.brand) || 0) + asset.count);
      });
    });

    // Get top assets by total count
    const assetTotals = Array.from(assetMap.entries())
      .map(([assetName, brandMap]) => ({
        assetName,
        total: Array.from(brandMap.values()).reduce((sum, count) => sum + count, 0),
        brands: brandMap,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // Get all unique brands that appear in these assets
    const allBrands = new Set<string>();
    assetTotals.forEach((asset) => {
      asset.brands.forEach((_, brand) => allBrands.add(brand));
    });
    const brandList = Array.from(allBrands).slice(0, 6); // Limit to 6 brands for readability

    // Create data array for stacked chart
    return assetTotals.map((asset) => {
      const dataPoint: Record<string, string | number> = {
        asset: asset.assetName.length > 20 ? `${asset.assetName.substring(0, 20)}...` : asset.assetName,
        fullAsset: asset.assetName,
      };
      brandList.forEach((brand) => {
        dataPoint[brand] = asset.brands.get(brand) || 0;
      });
      return dataPoint;
    });
  }, [assetStats.perBrand]);

  const stackedAssetBrandConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};
    // Get unique brands from the data
    const brandSet = new Set<string>();
    assetStats.perBrand.forEach((brandData) => {
      brandSet.add(brandData.brand);
    });
    const brands = Array.from(brandSet).slice(0, 6);

    brands.forEach((brand, index) => {
      config[brand] = {
        label: brand,
        color: getChartColor(index),
      };
    });

    return config;
  }, [assetStats.perBrand]);

  // Asset Distribution by Type (top assets across all brands)
  const assetDistributionData = useMemo(() => {
    const assetCountMap = new Map<string, number>();

    assetStats.perBrand.forEach((brandData) => {
      brandData.assets.forEach((asset) => {
        assetCountMap.set(
          asset.assetName,
          (assetCountMap.get(asset.assetName) || 0) + asset.count
        );
      });
    });

    return Array.from(assetCountMap.entries())
      .map(([assetName, count], index) => ({
        asset: assetName,
        count,
        key: `dist_${index}`,
        color: getChartColor(index),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [assetStats.perBrand]);

  const assetDistributionChartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};
    assetDistributionData.forEach((item) => {
      config[item.key] = {
        label: item.asset,
        color: item.color,
      };
    });
    return config;
  }, [assetDistributionData]);

  const reversedFrames = useMemo(() => {
    return [...frames].reverse();
  }, [frames]);

  const visibleFrames = useMemo(() => {
    return reversedFrames.slice(0, framesToShow);
  }, [reversedFrames, framesToShow]);

  const hasMoreFrames = framesToShow < reversedFrames.length;

  const loadMoreFrames = useCallback(() => {
    if (hasMoreFrames) {
      setFramesToShow((prev) => prev + framesPerPage);
    }
  }, [hasMoreFrames, framesPerPage]);

  const getCurrentFrameData = useCallback(
    (frameNumber: number) => {
      return frames.find((frame) => frame.frame_number === frameNumber);
    },
    [frames]
  );

  const getFrameImageUrl = useCallback((frame: VideoFrameData) => {
    if (frame.frame_url) {
      return `${getBaseUrl()}${frame.frame_url}`;
    }
    return "";
  }, []);

  const previewFrame = useCallback((frame: VideoFrameData) => {
    setPreviewedFrame(frame);
    setShowPreview(true);
    setHoveredDetectionIndex(null);
  }, []);

  const calculateBboxPosition = (
    bbox: [number, number, number, number],
    imgElement: HTMLImageElement | null
  ) => {
    if (!imgElement) return null;

    const imgRect = imgElement.getBoundingClientRect();
    const naturalWidth = imgElement.naturalWidth;
    const naturalHeight = imgElement.naturalHeight;
    const displayedWidth = imgRect.width;
    const displayedHeight = imgRect.height;

    // Calculate scale factors
    const scaleX = displayedWidth / naturalWidth;
    const scaleY = displayedHeight / naturalHeight;
    const scale = Math.min(scaleX, scaleY); // object-contain uses min scale

    // Calculate actual displayed dimensions
    const actualWidth = naturalWidth * scale;
    const actualHeight = naturalHeight * scale;

    // Calculate offsets (centering)
    const offsetX = (displayedWidth - actualWidth) / 2;
    const offsetY = (displayedHeight - actualHeight) / 2;

    // Scale bbox coordinates
    const [x1, y1, x2, y2] = bbox;
    const left = offsetX + x1 * scale;
    const top = offsetY + y1 * scale;
    const width = (x2 - x1) * scale;
    const height = (y2 - y1) * scale;

    return { left, top, width, height };
  };

  // Get sessionId from frames if not provided in props
  const effectiveSessionId = useMemo(() => {
    if (sessionId) return sessionId;
    // Try to get sessionId from the last frame's session_summary
    const lastFrame = frames[frames.length - 1];
    return lastFrame?.session_summary?.session_id || null;
  }, [sessionId, frames]);

  return (
    <div className="space-y-6">
      {/* Statistics Section */}
      {frames.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Detection Statistics</CardTitle>
            <CardDescription>Real-time detection metrics and brand analytics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="data" className="space-y-6">
              <TabsList className="grid grid-cols-2 gap-2 w-full">
                <TabsTrigger value="data">Data View</TabsTrigger>
                <TabsTrigger value="charts">Charts View</TabsTrigger>
              </TabsList>

              <TabsContent value="data" className="space-y-4">
                {/* Overview Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative border rounded-lg p-5 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <SlidingNumber
                        number={totalDetections}
                        className="text-3xl font-bold text-primary tabular-nums"
                        inView={true}
                        transition={{ stiffness: 200, damping: 20, mass: 0.4 }}
                      />
                      <p className="text-sm font-medium text-muted-foreground">Total Logos</p>
                    </div>
                  </div>

                  <div className="relative border rounded-lg p-5 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <SlidingNumber
                        number={uniqueLogos.length}
                        className="text-3xl font-bold text-primary tabular-nums"
                        inView={true}
                        transition={{ stiffness: 200, damping: 20, mass: 0.4 }}
                      />
                      <p className="text-sm font-medium text-muted-foreground">Unique Brands</p>
                    </div>
                  </div>

                  <div className="relative border rounded-lg p-5 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <SlidingTime seconds={totalLogoTime} />
                      <p className="text-sm font-medium text-muted-foreground">Screen Time</p>
                    </div>
                  </div>
                </div>

                {/* Brand Screen Time - Collapsible */}
                {individualLogoTime.length > 0 && (
                  <Collapsible open={isBrandTimeOpen} onOpenChange={setIsBrandTimeOpen} className="border rounded-lg">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="text-left">
                          <h4 className="text-sm font-semibold">Brand Screen Time</h4>
                          <p className="text-xs text-muted-foreground">{individualLogoTime.length} brands detected</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {individualLogoTime.length}
                        </Badge>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isBrandTimeOpen ? "rotate-180" : ""}`} />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
                        {individualLogoTime.map((logo) => (
                          <div
                            key={logo.name}
                            className="flex items-center justify-between p-2.5 border rounded-md bg-card hover:bg-muted/30 transition-colors"
                          >
                            <span className="text-sm font-medium truncate flex-1" title={logo.name}>
                              {logo.name}
                            </span>
                            <div className="ml-2 shrink-0">
                              <SlidingTimeSmall seconds={logo.time} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Asset Statistics - Collapsible */}
                {assetStats.total > 0 && (
                  <Collapsible open={isAssetStatsOpen} onOpenChange={setIsAssetStatsOpen} className="border rounded-lg">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div className="text-left">
                          <h4 className="text-sm font-semibold">Asset Statistics</h4>
                          <p className="text-xs text-muted-foreground">
                            {assetStats.total} assets across {assetStats.perBrand.length} brands
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {assetStats.uniqueAssets} unique
                        </Badge>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isAssetStatsOpen ? "rotate-180" : ""}`} />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div className="relative border rounded-lg p-4 bg-gradient-to-br from-primary/5 to-primary/10">
                          <div className="flex items-start justify-between mb-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Package className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <SlidingNumber
                              number={assetStats.total}
                              className="text-2xl font-bold text-primary tabular-nums"
                              inView={true}
                              transition={{ stiffness: 200, damping: 20, mass: 0.4 }}
                            />
                            <p className="text-xs font-medium text-muted-foreground">Total Assets</p>
                          </div>
                        </div>

                        <div className="relative border rounded-lg p-4 bg-gradient-to-br from-primary/5 to-primary/10">
                          <div className="flex items-start justify-between mb-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <TrendingUp className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <SlidingNumber
                              number={assetStats.perBrand.length}
                              className="text-2xl font-bold text-primary tabular-nums"
                              inView={true}
                              transition={{ stiffness: 200, damping: 20, mass: 0.4 }}
                            />
                            <p className="text-xs font-medium text-muted-foreground">Brands with Assets</p>
                          </div>
                        </div>

                        <div className="relative border rounded-lg p-4 bg-gradient-to-br from-primary/5 to-primary/10">
                          <div className="flex items-start justify-between mb-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Target className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <SlidingNumber
                              number={assetStats.uniqueAssets}
                              className="text-2xl font-bold text-primary tabular-nums"
                              inView={true}
                              transition={{ stiffness: 200, damping: 20, mass: 0.4 }}
                            />
                            <p className="text-xs font-medium text-muted-foreground">Unique Assets</p>
                          </div>
                        </div>
                      </div>

                      {assetStats.perBrand.length > 5 && (
                        <div className="space-y-3 pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Assets per Brand
                            </h5>
                            <Badge variant="outline" className="text-[10px]">
                              {assetStats.perBrand.filter((b) => b.assets.some((a) => a.count >= 5)).length} brands
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {assetStats.perBrand
                              .map((brandData) => {
                                // Filter assets to only show those with 5+ detections
                                const filteredAssets = brandData.assets.filter((asset) => asset.count >= 5);
                                
                                // Skip this brand if no assets meet the threshold
                                if (filteredAssets.length === 0) return null;
                                
                                const isExpanded = expandedBrandAssets.has(brandData.brand);
                                const assetsToShow = isExpanded ? filteredAssets : filteredAssets.slice(0, 3);
                                const hasMore = filteredAssets.length > 3;
                                const totalFilteredAssets = filteredAssets.reduce((sum, a) => sum + a.count, 0);

                              return (
                                <div
                                  key={brandData.brand}
                                  className="relative border rounded-lg p-3 bg-card/50 hover:bg-card transition-colors"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h6 className="text-xs font-semibold truncate flex-1" title={brandData.brand}>
                                      {brandData.brand}
                                    </h6>
                                    <Badge variant="secondary" className="text-[10px] font-bold shrink-0 ml-2">
                                      {totalFilteredAssets}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1">
                                    {assetsToShow.map((asset) => (
                                      <div
                                        key={asset.assetName}
                                        className="flex items-center justify-between p-1.5 rounded bg-muted/30"
                                      >
                                        <span className="text-[10px] font-medium truncate flex-1" title={asset.assetName}>
                                          {asset.assetName}
                                        </span>
                                        <Badge variant="outline" className="text-[9px] shrink-0 ml-2 px-1 py-0">
                                          {asset.count}
                                        </Badge>
                                      </div>
                                    ))}
                                    {hasMore && (
                                      <button
                                        onClick={() => {
                                          setExpandedBrandAssets((prev) => {
                                            const next = new Set(prev);
                                            if (isExpanded) {
                                              next.delete(brandData.brand);
                                            } else {
                                              next.add(brandData.brand);
                                            }
                                            return next;
                                          });
                                        }}
                                        className="w-full text-[10px] text-primary hover:text-primary/80 font-medium text-center pt-0.5 transition-colors cursor-pointer"
                                      >
                                        {isExpanded ? (
                                          <span>Show less</span>
                                        ) : (
                                          <span>+{filteredAssets.length - 3} more</span>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                            .filter(Boolean)}
                          </div>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </TabsContent>

              <TabsContent value="charts" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Chart Based</p>
                    <p className="text-sm text-muted-foreground">Visual breakdowns powered by shadcn charts</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                    Charts
                  </Badge>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {brandDistributionData.length > 0 && (
                    <div className="border rounded-lg p-4 bg-card/80">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold">Brand Share</p>
                          <p className="text-xs text-muted-foreground">Pie · detections distribution</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">Pie</Badge>
                      </div>
                      <ChartContainer config={pieChartConfig} className="w-full h-[220px] aspect-auto">
                        <PieChart>
                          <Pie
                            data={brandDistributionData}
                            dataKey="value"
                            nameKey="key"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            strokeWidth={2}
                          >
                            {brandDistributionData.map((item) => (
                              <Cell key={item.key} fill={`var(--color-${item.key})`} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent labelKey="key" nameKey="key" />} />
                        </PieChart>
                      </ChartContainer>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {brandDistributionData.map((item) => (
                          <div key={item.key} className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: `var(--color-${item.key})` }}
                            />
                            <span className="font-medium">{item.brand}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {brandContrastData.length > 0 && APP_CONFIG.showConfidence && (
                    <div className="border rounded-lg p-4 bg-card/80">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold">Detection vs Confidence</p>
                          <p className="text-xs text-muted-foreground">Composed · counts vs avg confidence</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">Contrast</Badge>
                      </div>
                      <ChartContainer config={brandContrastChartConfig} className="w-full h-[260px] aspect-auto">
                        <ComposedChart data={brandContrastData}>
                          <CartesianGrid strokeDasharray="4 4" />
                          <XAxis dataKey="brand" tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <ChartTooltip content={<ChartTooltipContent labelKey="fullBrand" />} />
                          <Bar
                            yAxisId="left"
                            dataKey="detections"
                            fill="var(--color-detections)"
                            radius={[4, 4, 0, 0]}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="confidence"
                            stroke="var(--color-confidence)"
                            strokeWidth={2}
                            dot={false}
                          />
                        </ComposedChart>
                      </ChartContainer>
                    </div>
                  )}

                  {brandFrequencyRadialData.length > 0 && (
                    <div className="border rounded-lg p-4 bg-card/80">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold">Brand Frequency</p>
                          <p className="text-xs text-muted-foreground">Radial · normalized brand presence</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">Radial</Badge>
                      </div>
                      <ChartContainer config={brandFrequencyRadialConfig} className="w-full h-[260px] aspect-auto">
                        <RadialBarChart
                          data={brandFrequencyRadialData}
                          innerRadius={20}
                          outerRadius={100}
                          barCategoryGap="8%"
                          startAngle={90}
                          endAngle={-270}
                        >
                          <RadialBar dataKey="value" background cornerRadius={6}>
                            {brandFrequencyRadialData.map((item) => (
                              <Cell key={item.key} fill={`var(--color-${item.key})`} />
                            ))}
                            <LabelList
                              dataKey="brand"
                              position="insideStart"
                              fill="#fff"
                              fontSize={10}
                              fontWeight="semibold"
                              offset={10}
                            />
                          </RadialBar>
                          <ChartTooltip
                            content={<ChartTooltipContent labelKey="fullBrand" />}
                            formatter={(value: number, name: string, props: any) => [
                              `${props.payload.count} detections`,
                              props.payload.fullBrand,
                            ]}
                          />
                        </RadialBarChart>
                      </ChartContainer>
                    </div>
                  )}

                  {combinedFrameData.length > 0 && (
                    <div className="border rounded-lg p-4 bg-card/80">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {APP_CONFIG.showConfidence ? "Detections & Confidence Over Time" : "Detections Over Time"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {APP_CONFIG.showConfidence ? "Line · combined timeline view" : "Line · detections per frame"}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">Line</Badge>
                      </div>
                      <ChartContainer config={combinedFrameConfig} className="w-full h-[260px] aspect-auto">
                        <LineChart data={combinedFrameData}>
                          <CartesianGrid strokeDasharray="4 4" />
                          <XAxis dataKey="time" tick={{ fontSize: 10 }} minTickGap={24} />
                          <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 10 }} />
                          {APP_CONFIG.showConfidence && (
                            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} />
                          )}
                          <ChartTooltip content={<ChartTooltipContent labelKey="time" />} />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="detections"
                            stroke="var(--color-detections)"
                            strokeWidth={2}
                            dot={false}
                            name="Detections"
                          />
                          {APP_CONFIG.showConfidence && (
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="confidence"
                              stroke="var(--color-confidence)"
                              strokeWidth={2}
                              dot={false}
                              name="Confidence %"
                            />
                          )}
                        </LineChart>
                      </ChartContainer>
                    </div>
                  )}

                  {brandCountBarData.length > 0 && (
                    <div className="border rounded-lg p-4 bg-card/80">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold">Detection Count by Brand</p>
                          <p className="text-xs text-muted-foreground">Bar · total detections per brand</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">Bar</Badge>
                      </div>
                      <ChartContainer config={brandCountBarConfig} className="w-full h-[260px] aspect-auto">
                        <BarChart data={brandCountBarData}>
                          <CartesianGrid strokeDasharray="4 4" />
                          <XAxis dataKey="brand" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {brandCountBarData.map((item) => (
                              <Cell key={item.key} fill={`var(--color-${item.key})`} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </div>
                  )}

                  {/* Asset Charts - Stacked Bar Chart */}
                  {stackedAssetBrandData.length > 0 ? (
                    <div className="border rounded-lg p-4 bg-card/80">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold">Assets by Brand</p>
                          <p className="text-xs text-muted-foreground">Stacked · brands per asset</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">Stacked</Badge>
                      </div>
                      <ChartContainer config={stackedAssetBrandConfig} className="w-full h-[350px] aspect-auto">
                        <BarChart
                          data={stackedAssetBrandData}
                          margin={{ left: 100, right: 20, top: 20, bottom: 100 }}
                        >
                          <CartesianGrid strokeDasharray="4 4" vertical={false} />
                          <XAxis
                            type="category"
                            dataKey="asset"
                            tick={{ fontSize: 9 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                          <ChartTooltip
                            content={<ChartTooltipContent labelKey="fullAsset" />}
                            formatter={(value: number, name: string) => [value, name]}
                          />
                          <ChartLegend content={<ChartLegendContent />} />
                          {Object.keys(stackedAssetBrandConfig).map((brand, idx, arr) => (
                            <Bar
                              key={brand}
                              dataKey={brand}
                              stackId="assets"
                              fill={`var(--color-${brand})`}
                              radius={idx === arr.length - 1 ? [0, 0, 4, 4] : undefined}
                            />
                          ))}
                        </BarChart>
                      </ChartContainer>
                    </div>
                  ) : assetStats.perBrand.length > 0 ? (
                    <div className="border rounded-lg p-4 bg-card/80">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold">Assets by Brand</p>
                          <p className="text-xs text-muted-foreground">No classifications available</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">Info</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground text-center py-8">
                        Enable classification in video settings to see asset data
                      </div>
                    </div>
                  ) : null}

                  {assetDistributionData.length > 0 && (
                    <div className="border rounded-lg p-4 bg-card/80">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold">Asset Distribution</p>
                          <p className="text-xs text-muted-foreground">Pie · top assets across all brands</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">Pie</Badge>
                      </div>
                      <ChartContainer config={assetDistributionChartConfig} className="w-full h-[220px] aspect-auto">
                        <PieChart>
                          <Pie
                            data={assetDistributionData}
                            dataKey="count"
                            nameKey="asset"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={3}
                            strokeWidth={2}
                          >
                            {assetDistributionData.map((item) => (
                              <Cell key={item.key} fill={`var(--color-${item.key})`} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent labelKey="asset" nameKey="asset" />} />
                        </PieChart>
                      </ChartContainer>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {assetDistributionData.map((item) => (
                          <div key={item.key} className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: `var(--color-${item.key})` }}
                            />
                            <span className="font-medium">{item.asset}</span>
                            <span className="text-muted-foreground">({item.count})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* CSV Download Section */}
      {frames.length > 0 && (
        <div className="border rounded-lg p-3 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Detection Report</div>
                <div className="text-xs text-muted-foreground">
                  {realtimeCsvFiles && Object.keys(realtimeCsvFiles).length > 0
                    ? "Real-time CSV available"
                    : "Export detection data"}
                </div>
              </div>
            </div>
            {realtimeCsvFiles && Object.keys(realtimeCsvFiles).length > 0 ? (
              <Button
                onClick={() => {
                  const csvPath = realtimeCsvFiles.main;
                  if (csvPath) {
                    // Extract filename from path
                    const filename = csvPath.split("/").pop() || "";
                    if (filename) {
                      apiClient.downloadCSVFile(filename);
                    }
                  }
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
            ) : (
              <Button
                onClick={handleDownloadCSV}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={!effectiveSessionId}
              >
                <Download className="h-3 w-3" />
                Export
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Detection Progress */}
      {frames.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CardTitle>Detection Results</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{frames.length} frames</Badge>
                  {progressPercentage > 0 && (
                    <Badge variant="outline">{Math.round(progressPercentage)}% complete</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            {(isProcessing || progressPercentage > 0) && (
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-300 flex items-center justify-center text-xs text-primary-foreground font-medium"
                  style={{ width: `${Math.max(progressPercentage, 2)}%` }}
                >
                  {progressPercentage > 10 && <span>{Math.round(progressPercentage)}%</span>}
                </div>
              </div>
            )}

            {/* Frames Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <h4 className="text-sm font-semibold">Processed Frames</h4>
                <Badge variant="outline" className="text-xs">
                  {frames.length} total
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto p-1">
                {visibleFrames.map((frame) => {
                  const frameNumber = frame.frame_number;
                  if (frameNumber === undefined || frameNumber === null) return null;

                  return (
                    <div
                      key={frameNumber}
                      className="relative group cursor-pointer"
                      onClick={() => previewFrame(frame)}
                    >
                      <div className="relative aspect-video rounded-md border bg-muted/30 overflow-hidden hover:border-primary/50 transition-all hover:shadow-md">
                        {!frame.frame_url ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-[10px] text-muted-foreground">Loading...</div>
                          </div>
                        ) : (
                          <img
                            src={getFrameImageUrl(frame)}
                            alt={`Frame ${frameNumber}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        )}
                        {/* Frame number - corner ribbon */}
                        <div className="absolute bottom-0 left-0 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-tr-md">
                          <div className="text-[10px] text-white font-semibold">
                            #{frameNumber}
                          </div>
                        </div>
                        {/* Detection counter - only show popover on badge hover */}
                        {frame.total_detections && frame.total_detections > 0 && (
                          <div className="absolute top-1 right-1">
                            <Popover
                              open={hoveredFrame === frameNumber}
                              onOpenChange={(open) => {
                                if (!open) setHoveredFrame(null);
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Badge
                                  variant="default"
                                  className="text-[10px] px-1.5 py-0.5 cursor-pointer font-semibold shadow-sm"
                                  onMouseEnter={() => setHoveredFrame(frameNumber)}
                                  onMouseLeave={() => {
                                    // Only hide if not hovering over popover content
                                    setTimeout(() => {
                                      if (hoveredFrame === frameNumber) {
                                        setHoveredFrame(null);
                                      }
                                    }, 100);
                                  }}
                                >
                                  {frame.total_detections}
                                </Badge>
                              </PopoverTrigger>
                              {(() => {
                                const frameData = getCurrentFrameData(frameNumber);
                                if (frameData?.detections && frameData.detections.length > 0) {
                                  return (
                                    <PopoverContent
                                      className="w-64 p-3"
                                      side="left"
                                      align="end"
                                      onMouseEnter={() => setHoveredFrame(frameNumber)}
                                      onMouseLeave={() => setHoveredFrame(null)}
                                    >
                                      <div className="text-xs font-semibold mb-2.5">Detected Brands</div>
                                      <div className="space-y-2">
                                        {frameData.detections.map((detection, idx) => (
                                          <div key={idx} className="space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                              <Badge
                                                variant={getConfidenceVariant(detection.confidence)}
                                                className="text-xs"
                                              >
                                                {detection.class_name}
                                              </Badge>
                                              {APP_CONFIG.showConfidence && (
                                                <span className="text-xs text-muted-foreground font-medium">
                                                  {(detection.confidence * 100).toFixed(0)}%
                                                </span>
                                              )}
                                            </div>
                                            {detection.classification &&
                                              detection.classification.length > 0 &&
                                              detection.classification[0] && (
                                                <div className="text-xs text-muted-foreground pl-1">
                                                  <span className="font-medium">Classified:</span>
                                                  <span className="ml-1">
                                                    {detection.classification[0].class_name}
                                                    {APP_CONFIG.showConfidence && (
                                                      <> ({(
                                                        detection.classification[0].confidence * 100
                                                      ).toFixed(0)}%)</>
                                                    )}
                                                  </span>
                                                </div>
                                              )}
                                          </div>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  );
                                } else {
                                  return null;
                                }
                              })()}
                            </Popover>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Button */}
              {hasMoreFrames && (
                <div className="flex justify-center pt-2">
                  <Button
                    onClick={loadMoreFrames}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Load More ({reversedFrames.length - visibleFrames.length} remaining)
                  </Button>
                </div>
              )}

              {/* Pagination Info */}
              {reversedFrames.length > framesPerPage && (
                <div className="text-center text-xs text-muted-foreground pt-2 border-t">
                  Showing {visibleFrames.length} of {reversedFrames.length} frames
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="!max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Frame {previewedFrame?.frame_number}</DialogTitle>
            <DialogDescription>
              {previewedFrame?.total_detections} detections found
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col gap-4 min-h-0">
            {/* Image Section - Top */}
            {previewedFrame?.frame_url && (
              <div className="shrink-0 bg-muted/50 rounded-lg p-4 flex items-center justify-center">
                <div className="relative max-h-[60vh]">
                  <img
                    ref={frameImageRef}
                    src={`${getBaseUrl()}${previewedFrame.frame_url}`}
                    alt={`Frame ${previewedFrame?.frame_number}`}
                    className="max-w-full max-h-[60vh] rounded border object-contain"
                  />
                  {/* Bounding box overlay */}
                  {hoveredDetectionIndex !== null &&
                    previewedFrame.detections &&
                    previewedFrame.detections[hoveredDetectionIndex] && (
                      <div
                        className="absolute border-2 border-primary bg-primary/20 pointer-events-none transition-all"
                        style={(() => {
                          const bbox = previewedFrame.detections[hoveredDetectionIndex].bbox;
                          const position = calculateBboxPosition(bbox, frameImageRef.current);
                          return position
                            ? {
                                left: `${position.left}px`,
                                top: `${position.top}px`,
                                width: `${position.width}px`,
                                height: `${position.height}px`,
                                boxShadow: "0 0 0 2px hsl(var(--primary) / 0.5), 0 0 10px hsl(var(--primary) / 0.3)",
                                animation: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                              }
                            : {};
                        })()}
                      />
                    )}
                </div>
              </div>
            )}

            {/* Detections List Section - Bottom, Compact */}
            {previewedFrame?.detections && previewedFrame.detections.length > 0 && (
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                <div className="flex items-center justify-between pb-2 border-b sticky top-0 bg-background z-10">
                  <h4 className="text-sm font-semibold">Detections</h4>
                  <Badge variant="outline" className="text-xs">
                    {previewedFrame.detections.length} found
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {previewedFrame.detections.map((detection, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-1 p-2 rounded-md border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                      onMouseEnter={() => setHoveredDetectionIndex(idx)}
                      onMouseLeave={() => setHoveredDetectionIndex(null)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant={getConfidenceVariant(detection.confidence)}
                          className="text-xs"
                        >
                          {detection.class_name}
                        </Badge>
                        {APP_CONFIG.showConfidence && (
                          <span className="text-xs text-muted-foreground">
                            {(detection.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      {detection.classification &&
                        detection.classification.length > 0 &&
                        detection.classification[0] && (
                          <div className="text-[10px] text-muted-foreground truncate">
                            {detection.classification[0].class_name}
                            {APP_CONFIG.showConfidence && (
                              <> ({(detection.classification[0].confidence * 100).toFixed(0)}%)</>
                            )}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
