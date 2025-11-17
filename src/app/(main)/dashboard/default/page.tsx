"use client";

import { OverviewCards } from "./_components/overview-cards";
import { InsightCards } from "./_components/insight-cards";
import { ChartCards } from "./_components/chart-cards";

export default function DefaultDashboardPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <OverviewCards />
      <InsightCards />
      <ChartCards />
    </div>
  );
}

