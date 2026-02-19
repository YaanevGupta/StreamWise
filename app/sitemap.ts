import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://streamwise-rho.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // Adding common search routes helps Google index your search capabilities
    {
      url: 'https://streamwise-rho.vercel.app/?query=trending',
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
  ]
}