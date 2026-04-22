"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  ArrowLeft,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function AdminProductsList() {
  const firestore = useFirestore();
  const productsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'produtos'), orderBy('dataCriacao', 'desc'));
  }, [firestore]);

  const { data: products, isLoading } = useCollection(productsQuery);

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      deleteDocumentNonBlocking(doc(firestore, 'produtos', id));
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Button asChild variant="ghost" className="mb-4 -ml-4">
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" /> Painel
            </Link>
          </Button>
          <h1 className="text-4xl font-headline font-bold">Gestão de Produtos</h1>
          <p className="text-muted-foreground">Adicione, edite ou remova itens do seu catálogo.</p>
        </div>
        <Button asChild className="rounded-full bg-primary hover:bg-primary/90">
          <Link href="/admin/products/new">
            <Plus className="w-4 h-4 mr-2" /> Novo Produto
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-10 rounded-full" placeholder="Buscar produtos..." />
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">Imagem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Carregando produtos...
                </TableCell>
              </TableRow>
            ) : products?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Nenhum produto cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="w-12 h-12 rounded border bg-muted overflow-hidden">
                      <img src={product.imagens?.[0] || 'https://placehold.co/100'} alt={product.nome} className="w-full h-full object-cover" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.nome}</TableCell>
                  <TableCell className="capitalize">{product.categoriaId}</TableCell>
                  <TableCell>R$ {product.preco?.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={product.estoque < 5 ? "destructive" : "outline"}>
                      {product.estoque} un
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.isFeatured ? (
                      <Badge className="bg-accent text-accent-foreground">Destaque</Badge>
                    ) : (
                      <Badge variant="secondary">Normal</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/products/${product.id}`} target="_blank">
                          <ExternalLink className="w-4 h-4 text-blue-500" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/admin/products/${product.id}`}>
                          <Edit className="w-4 h-4 text-primary" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
