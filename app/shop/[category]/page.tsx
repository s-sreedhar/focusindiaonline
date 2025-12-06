import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { CategoryContent } from '@/components/category-content';
import { PRIMARY_CATEGORIES } from '@/lib/constants';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  return PRIMARY_CATEGORIES.map((category) => ({
    category: category,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;

  return {
    title: `${category} Books`,
    description: `Browse our collection of ${category} competitive exam preparation books. Find the best study materials for ${category} exams at Focus India Online.`,
    openGraph: {
      title: `${category} Books - Focus India Online`,
      description: `Browse our collection of ${category} competitive exam preparation books.`,
      url: `https://focusindiaonline.com/shop/${category}`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categoryName } = await params;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="pt-24 flex-1">
        <CategoryContent categoryName={categoryName} />
      </div>
      <Footer />
    </div>
  );
}
