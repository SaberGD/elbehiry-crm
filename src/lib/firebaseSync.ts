import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export async function syncCollectionToFirestore<T extends { id: string }>(
  collectionName: string,
  items: T[]
) {
  try {
    for (const item of items) {
      if (item.id) {
        await setDoc(doc(db, collectionName, item.id), item, { merge: true });
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, collectionName);
  }
}

export async function saveDocumentToFirestore<T extends { id: string }>(
  collectionName: string,
  item: T
) {
  try {
    await setDoc(doc(db, collectionName, item.id), item, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${item.id}`);
  }
}

export async function updateDocumentInFirestore(
  collectionName: string,
  id: string,
  updates: Record<string, any>
) {
  try {
    await updateDoc(doc(db, collectionName, id), updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${collectionName}/${id}`);
  }
}

export async function deleteDocumentFromFirestore(
  collectionName: string,
  id: string
) {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
  }
}

export function subscribeToCollection<T>(
  collectionName: string,
  onData: (data: T[]) => void
) {
  try {
    return onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as T);
        });
        if (items.length > 0) {
          onData(items);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collectionName);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, collectionName);
    return () => {};
  }
}
