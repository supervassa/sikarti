import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";

// Foto WB (wbPhotos/{uid}, base64). Mengembalikan data URL base64 atau null
// (belum ada foto / tidak berhak baca). Reaktif — ikut berubah setelah WB
// mengunggah / menghapus fotonya sendiri.
export const useWBPhoto = (uid) => {
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    if (!uid) return undefined;
    const unsub = onSnapshot(
      doc(db, "wbPhotos", uid),
      (snap) => setPhoto(snap.exists() ? snap.data().base64 || null : null),
      () => setPhoto(null),
    );
    return unsub;
  }, [uid]);

  return photo;
};
