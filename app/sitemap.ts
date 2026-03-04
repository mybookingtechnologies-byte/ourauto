import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://ourauto.in";

  const cars = await prisma.car.findMany({
    where: {
      isActive: true,
      status: "ACTIVE",
      dealer: { role: "DEALER", status: "APPROVED" },
    },
    select: { id: true, updatedAt: true },
  });

  const carUrls = cars.map((car) => ({
    url: `${baseUrl}/dealer/cars/${car.id}`,
    lastModified: car.updatedAt,
  }));

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/dealer/marketplace`,
      lastModified: new Date(),
    },
    ...carUrls,
  ];
}
