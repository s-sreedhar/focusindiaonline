import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { ProductDetails } from '@/components/product-details';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Metadata } from 'next';
import { Book } from '@/lib/types';
import { notFound } from 'next/navigation';

async function getProduct(slug: string): Promise<Book | null> {
  const q = query(collection(db, 'books'), where('slug', '==', slug));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const docData = querySnapshot.docs[0];
  const data = docData.data();
  return {
    id: docData.id,
    ...data,
    stockQuantity: data.stockQuantity ?? data.stock ?? 0
  } as Book;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: 'Product Not Found - Focus India Online',
      description: 'The requested product could not be found.',
    };
  }

  return {
    title: `${product.title} - Focus India Online`,
    description: `${product.description.slice(0, 160)}... - By ${product.author}. Price: ₹${product.price}.`,
    openGraph: {
      title: `${product.title} - Focus India Online`,
      description: product.description.slice(0, 200),
      url: `https://focusindiaonline.com/product/${product.slug}`,
      images: [
        {
          url: `https://focusindiaonline.com${product.image}`,
          width: 800,
          height: 600,
          alt: product.title,
        },
      ],
      type: 'book',
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <ProductDetails product={product} />
      </main>
      <Footer />
    </div>
  );
}
