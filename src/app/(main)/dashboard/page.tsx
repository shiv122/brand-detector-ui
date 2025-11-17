import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, Video, Tags } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const features = [
    {
      title: "Image Detection",
      description: "Upload single or multiple images to detect logos",
      icon: Image,
      href: "/dashboard/images",
      details: "Perfect for batch processing images or analyzing individual photos. Supports multiple image formats and provides detailed detection results.",
    },
    {
      title: "Video Detection",
      description: "Upload videos to detect logos in real-time",
      icon: Video,
      href: "/dashboard/video",
      details: "Process video files with real-time streaming results. View frame-by-frame detections and analyze logo screen time.",
    },
    {
      title: "Image Classification",
      description: "Classify images using YOLO classification models",
      icon: Tags,
      href: "/dashboard/classification",
      details: "Upload images to classify them into categories. Get top-k predictions with confidence scores for each image.",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Welcome to Logo Detection</h1>
        <p className="text-muted-foreground">Choose your detection method to get started</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.href} href={feature.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.details}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
