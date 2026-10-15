"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  FolderKanban,
  Briefcase,
  BookOpen,
  FolderTree,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJSON } from "@/lib/request-util";
import { ResourceType, ProjectType, ExperienceType, ResourceCategoryType } from "../components/types/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const contentChartConfig = {
  projects: { label: "Projects", color: "hsl(var(--chart-1))" },
  experiences: { label: "Experiences", color: "hsl(var(--chart-2))" },
  resources: { label: "Resources", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const AdminDashboard = () => {
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const data = await fetchJSON<ProjectType[]>("/api/projects");
      return data ?? [];
    },
  });

  const { data: experiences = [], isLoading: loadingExperiences } = useQuery({
    queryKey: ["experiences"],
    queryFn: async () => {
      const data = await fetchJSON<ExperienceType[]>("/api/experiences");
      return data ?? [];
    },
  });

  const { data: resources = [], isLoading: loadingResources } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const data = await fetchJSON<ResourceType[]>("/api/resources");
      return data ?? [];
    },
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["resource-categories"],
    queryFn: async () => {
      const data = await fetchJSON<ResourceCategoryType[]>("/api/resource-categories");
      return data ?? [];
    },
  });

  const isLoading = loadingProjects || loadingExperiences || loadingResources || loadingCategories;

  const contentData = useMemo(
    () => [
      { name: "Projects", value: projects.length, fill: "var(--color-projects)" },
      { name: "Experiences", value: experiences.length, fill: "var(--color-experiences)" },
      { name: "Resources", value: resources.length, fill: "var(--color-resources)" },
    ],
    [projects, experiences, resources]
  );

  const resourceTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach((r: ResourceType) => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count], i) => ({
      name: type,
      value: count,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [resources]);

  const resourceTypeConfig = useMemo(() => {
    const config: ChartConfig = {};
    resourceTypeData.forEach((item) => {
      config[item.name] = { label: item.name, color: item.fill };
    });
    return config;
  }, [resourceTypeData]);

  const stats = [
    {
      title: "Projects",
      value: projects.length,
      description: "Portfolio projects",
      icon: FolderKanban,
      href: "/admin/projects",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Experiences",
      value: experiences.length,
      description: "Work experiences",
      icon: Briefcase,
      href: "/admin/experiences",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Resources",
      value: resources.length,
      description: "Learning resources",
      icon: BookOpen,
      href: "/admin/resources",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Categories",
      value: categories.length,
      description: "Resource categories",
      icon: FolderTree,
      href: "/admin/categories",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your portfolio content
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))
          : stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link key={stat.title} href={stat.href}>
                  <Card className="transition-shadow hover:shadow-md cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </CardTitle>
                        <div className={`rounded-lg p-2 ${stat.bg}`}>
                          <Icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Content Overview Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Content Overview
            </CardTitle>
            <CardDescription>
              Total content items across your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ChartContainer config={contentChartConfig} className="h-[250px] w-full">
                <BarChart data={contentData} accessibilityLayer>
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Resources by Type Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Resources by Type</CardTitle>
            <CardDescription>
              Distribution of resources across types
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : resourceTypeData.length > 0 ? (
              <ChartContainer config={resourceTypeConfig} className="h-[250px] w-full">
                <PieChart accessibilityLayer>
                  <ChartTooltip
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={resourceTypeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    strokeWidth={2}
                  >
                    {resourceTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                No resources yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump to a section</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.href}
                  href={stat.href}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
                >
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  <span className="text-sm font-medium">{stat.title}</span>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
