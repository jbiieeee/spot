import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db, hasFirebaseConfig } from './firebase';

const noop = () => {};

export function subscribeCollection(name, cb) {
  if (!hasFirebaseConfig) {
    cb([]);
    return noop;
  }

  return onSnapshot(collection(db, name), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function addItem(name, data) {
  const ref = await addDoc(collection(db, name), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function setItem(name, id, data) {
  await setDoc(doc(db, name, id), { ...data, createdAt: serverTimestamp() }, { merge: true });
  return id;
}

export async function updateItem(name, id, patch) {
  await updateDoc(doc(db, name, id), patch);
}

export async function removeItem(name, id) {
  await deleteDoc(doc(db, name, id));
}
