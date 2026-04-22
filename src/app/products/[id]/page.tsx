import { productService } from '@/services/productService';
import { notFound } from 'next/navigation';
import { ProductClient } from './ProductClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await productService.getProductById(id);

  if (!product) {
    notFound();
  }

  // Related products (same category)
  const related = await productService.getProductsByCategory(product.category);

  return (
    <div className="container mx-auto px-4 py-12">
      <ProductClient product={product} relatedProducts={related.filter(p => p.id !== product.id)} />
    </div>
  );
}