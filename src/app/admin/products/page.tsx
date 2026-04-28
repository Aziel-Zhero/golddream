
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  ArrowLeft,
  Loader2
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
import { collection, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Product } from '@/types';

export default function AdminProductsList() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Consulta sem orderBy para garantir que todos os produtos apareçam
  const productsQuery = useMemoFirebase(() => collection(firestore, 'produtos'), [firestore]);
  const { data: rawProducts, isLoading } = useCollection<Product>(productsQuery);

  // Ordenação e Filtro no lado do cliente
  const filteredProducts = useMemo(() => {
    if (!rawProducts) return [];
    
    let result = [...rawProducts];
    
    // Filtro de busca
    if (searchTerm) {
      result = result.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Ordenação (Mais recentes primeiro)
    result.sort((a, b) => {
      const dateA = a.dataCriacao ? new Date(a.dataCriacao).getTime() : 0;
      const dateB = b.dataCriacao ? new Date(b.dataCriacao).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [rawProducts, searchTerm]);

  const handleDelete = () => {
    if (deleteId) {
      deleteDocumentNonBlocking(doc(firestore, 'produtos', deleteId));
      toast({ title: "Produto Removido", description: "O item foi excluído do catálogo com sucesso." });
      setDeleteId(null);
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
          <p className="text-muted-foreground">Gerencie o seu inventário Gold Dream.</p>
        </div>
        <Button asChild className="rounded-full bg-primary hover:bg-primary/90 h-12 px-6">
          <Link href="/admin/products/new">
            <Plus className="w-4 h-4 mr-2" /> Novo Produto
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            className="pl-10 rounded-full h-11" 
            placeholder="Buscar no estoque..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
          <p className="text-[10px] font-black text-primary uppercase tracking-tighter">Total no Inventário: {filteredProducts.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 border-none">
              <TableHead className="w-[100px] pl-6">Imagem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead className="text-right pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/5">
                  <TableCell className="pl-6 py-4">
                    <div className="w-12 h-12 rounded-xl border bg-muted overflow-hidden">
                      <img src={product.variacoes?.[0]?.imagens?.[0] || 'https://placehold.co/100'} alt={product.nome} className="w-full h-full object-cover" />
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">{product.nome}</TableCell>
                  <TableCell className="capitalize text-xs font-medium">{product.categoriaId}</TableCell>
                  <TableCell className="font-bold">R$ {product.preco?.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={product.estoque < 5 ? "destructive" : "outline"} className="rounded-lg">
                      {product.estoque} un
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5">
                        <Link href={`/admin/products/${product.id}`}>
                          <Edit className="w-4 h-4 text-primary" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-destructive/5" onClick={() => setDeleteId(product.id)}>
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-headline font-bold">Excluir Produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o item permanentemente do catálogo e do estoque.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-4">
            <AlertDialogCancel className="rounded-xl border-2">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold">
              Sim, Excluir Produto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
