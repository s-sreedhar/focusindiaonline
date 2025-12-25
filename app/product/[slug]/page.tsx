import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { ProductDetails } from '@/components/product-details';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Metadata } from 'next';
import { Book } from '@/lib/types';
import { notFound } from 'next/navigation';

async function getProduct(slug: string): Promise<Book | null> {
  // Check for Test Series (prefixed with 'ts-')
  if (slug.startsWith('ts-')) {
    const id = slug.replace('ts-', '');
    try {
      const docRef = doc(db, 'test_series', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title,
        description: data.description,
        price: data.price,
        image: data.imageUrl,
        slug: `ts-${id}`,
        author: 'Focus India', // Default author
        publisher: 'Focus India',
        language: 'English', // Default
        stockQuantity: 999, // Always in stock (digital)
        inStock: true,
        weight: 0, // Digital item
        primaryCategory: 'Test Series',
        subCategories: [],
        subjects: [],
        isTestSeries: true,
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      } as Book;
    } catch (e) {
      //console.error("Error fetching test series:", e);
      return null;
    }
  }

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
    stockQuantity: data.stockQuantity ?? data.stock ?? 0,
    createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt,
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
