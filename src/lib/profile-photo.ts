const DATABASE_NAME = "advdiary-local-profile";
const STORE_NAME = "photos";

interface ProfilePhotoRecord {
  uid: string;
  image: Blob;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "uid" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local photo storage"));
    request.onblocked = () => reject(new Error("Local photo storage is blocked by another tab"));
  });
}

export async function getLocalProfilePhoto(uid: string): Promise<Blob | null> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(uid) as IDBRequest<ProfilePhotoRecord | undefined>;
    request.onsuccess = () => resolve(request.result?.image ?? null);
    request.onerror = () => reject(request.error ?? new Error("Could not read the local profile photo"));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Could not read the local profile photo"));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Reading the local profile photo was interrupted"));
    };
  });
}

export async function saveLocalProfilePhoto(uid: string, image: Blob): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ uid, image } satisfies ProfilePhotoRecord);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Could not save the local profile photo"));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Saving the local profile photo was interrupted"));
    };
  });
}

export async function removeLocalProfilePhoto(uid: string): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(uid);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Could not remove the local profile photo"));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Removing the local profile photo was interrupted"));
    };
  });
}

export function subscribeToLocalProfilePhotoChanges(
  uid: string,
  onChange: () => void
): () => void {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel("advdiary-local-profile-photo");
  channel.onmessage = event => {
    if (event.data === uid) onChange();
  };
  return () => channel.close();
}

export function notifyLocalProfilePhotoChanged(uid: string): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel("advdiary-local-profile-photo");
  channel.postMessage(uid);
  channel.close();
}
