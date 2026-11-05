import type { MetadataRoute } from "next";
import { isLive } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return isLive() ? { rules: { userAgent: "*", allow: "/", disallow: "/api/" } } : { rules: { userAgent: "*", disallow: "/" } };
}
