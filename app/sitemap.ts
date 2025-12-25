import { MetadataRoute } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

    let categoryPages: MetadataRoute.Sitemap = [];
    let productPages: MetadataRoute.Sitemap = [];

    try {
        // Fetch Categories
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        categoryPages = categoriesSnapshot.docs.map((doc) => {
            const data = doc.data();
            const categoryName = data.name || doc.id; // Use name if available, else ID
            return {
                url: `${baseUrl}/shop/${encodeURIComponent(categoryName)}`,
                lastModified: new Date(),
                changeFrequency: 'daily' as const,
                priority: 0.7,
            };
        });

        // Add Subjects as categories too if they serve as filters
        const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
        const subjectPages = subjectsSnapshot.docs.map((doc) => {
            const data = doc.data();
            const subjectName = data.name || doc.id;
            return {
                url: `${baseUrl}/shop?subject=${encodeURIComponent(subjectName)}`, // Assuming subjects are filtered via query param
                lastModified: new Date(),
                changeFrequency: 'daily' as const,
                priority: 0.6,
            };
        });
        categoryPages = [...categoryPages, ...subjectPages];


        // Fetch Products
        const booksSnapshot = await getDocs(collection(db, 'books'));
        productPages = booksSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                url: `${baseUrl}/product/${data.slug || doc.id}`,
                lastModified: data.updatedAt ? new Date(data.updatedAt.seconds * 1000) : new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.6,
            };
        });

    } catch (error) {
        //console.error('Error generating sitemap:', error);
    }

    return [...staticPages, ...categoryPages, ...productPages];
}
