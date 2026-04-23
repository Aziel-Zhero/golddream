
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';

import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

type FirestoreTarget =
  | CollectionReference<DocumentData>
  | Query<DocumentData>
  | null
  | undefined;

export function useCollection<T = any>(
  targetRefOrQuery: FirestoreTarget
): UseCollectionResult<T> {

  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {

    if (!targetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      targetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {

        const results: WithId<T>[] = snapshot.docs.map((doc) => ({
          ...(doc.data() as T),
          id: doc.id,
        }));

        setData(results);
        setIsLoading(false);
      },
      (err: FirestoreError) => {

        let path = 'unknown';

        try {
          // Tenta extrair o caminho de forma segura para ajudar no debug
          if ((targetRefOrQuery as any).path) {
            path = (targetRefOrQuery as any).path;
          } else if ((targetRefOrQuery as any)._query?.path?.canonicalString) {
            path = (targetRefOrQuery as any)._query.path.canonicalString();
          } else if ((targetRefOrQuery as any).query?.endpoint?.path?.canonicalString) {
             path = (targetRefOrQuery as any).query.endpoint.path.canonicalString();
          }
        } catch (e) {
          path = 'collection_query';
        }

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();

  }, [targetRefOrQuery]);

  return {
    data,
    isLoading,
    error,
  };
}
