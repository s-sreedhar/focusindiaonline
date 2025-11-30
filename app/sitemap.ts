import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://focusindiaonline.com';

    // Static pages
    const staticPages = [
        '',
        '/shop',
        '/about',
        '/contact',
        '/faq',
        '/privacy-policy',
        '/terms',
        '/shipping',
        '/returns',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Category pages
    const categories = ['UPSC', 'SSC', 'RRB', 'BANKING', 'APPSC', 'TGPSC'];
    const categoryPages = categories.map((category) => ({
        url: `${baseUrl}/shop/${category}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
    }));

    // TODO: Add dynamic product pages when fetching from database
    // For now, we'll add placeholder product pages
    const productPages = [
        'biology-bits',
        'polity-constitution',
        'telangana-movement',
        'emrs-economics',
        'road-telangana',
        'lab-mcqs',
        'bank-po-clerk',
        'reasoning-comprehensive',
    ].map((slug) => ({
        url: `${baseUrl}/product/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }));

    return [...staticPages, ...categoryPages, ...productPages];
}
