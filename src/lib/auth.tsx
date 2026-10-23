"use client";
import {
  createContext, useContext, useEffect, useState, useCallback, useRef,
  type ReactNode
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User
} from "firebase/auth";
import { deleteField, doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import {
  getLocalProfilePhoto,
  notifyLocalProfilePhotoChanged,
  removeLocalProfilePhoto,
  saveLocalProfilePhoto,
  subscribeToLocalProfilePhotoChanges,
} from "@/lib/profile-photo";

interface AuthCtx {
  user: User | null;
  displayName: string;
  photoURL: string;
  profileError: string | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  updateProfilePhoto: (file: File | null) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const photoObjectUrl = useRef<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    let unsubscribeLocalPhoto: (() => void) | undefined;
    let profileGeneration = 0;

    const loadLocalPhoto = async (uid: string, generation: number) => {
      try {
        const image = await getLocalProfilePhoto(uid);
        if (generation !== profileGeneration) return;
        if (photoObjectUrl.current) URL.revokeObjectURL(photoObjectUrl.current);
        photoObjectUrl.current = image ? URL.createObjectURL(image) : null;
        setPhotoURL(photoObjectUrl.current || "");
      } catch {
        if (generation === profileGeneration) {
          setProfileError("Could not load the profile photo saved on this device.");
        }
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      const currentGeneration = ++profileGeneration;
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;
      unsubscribeLocalPhoto?.();
      unsubscribeLocalPhoto = undefined;
      if (photoObjectUrl.current) URL.revokeObjectURL(photoObjectUrl.current);
      photoObjectUrl.current = null;
      setUser(u);
      setDisplayName(u?.displayName || "Advocate");
      setPhotoURL("");
      setProfileError(null);
      setLoading(false);

      if (u) {
        void loadLocalPhoto(u.uid, currentGeneration);
        unsubscribeLocalPhoto = subscribeToLocalProfilePhotoChanges(
          u.uid,
          () => { void loadLocalPhoto(u.uid, currentGeneration); }
        );
        unsubscribeProfile = onSnapshot(
          doc(db, "profiles", u.uid),
          (profile) => {
            const savedName = profile.data()?.displayName;
            setDisplayName(
              typeof savedName === "string" && savedName.trim()
                ? savedName
                : u.displayName || "Advocate"
            );
            setProfileError(null);
          },
          () => {
            setProfileError("Could not sync your profile. Check your connection and reload.");
          }
        );
      }
    });
    return () => {
      profileGeneration++;
      unsubscribeAuth();
      unsubscribeProfile?.();
      unsubscribeLocalPhoto?.();
      if (photoObjectUrl.current) URL.revokeObjectURL(photoObjectUrl.current);
    };
  }, []);

  const updateDisplayName = useCallback(async (name: string) => {
    if (!user) throw new Error("Not authenticated");
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 100) {
      throw new Error("Name must be between 1 and 100 characters");
    }
    if (!user.email) throw new Error("A verified account email is required");

    await setDoc(
      doc(db, "profiles", user.uid),
      {
        displayName: trimmedName,
        email: user.email,
        photoURL: deleteField(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setDisplayName(trimmedName);
    setProfileError(null);
  }, [user]);

  const updateProfilePhoto = useCallback(async (file: File | null) => {
    if (!user) throw new Error("Not authenticated");
    if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("Choose a JPG, PNG, or WebP image.");
    }
    if (file && file.size > 5 * 1024 * 1024) {
      throw new Error("Choose an image smaller than 5 MB.");
    }

    if (file) {
      await saveLocalProfilePhoto(user.uid, file);
    } else {
      await removeLocalProfilePhoto(user.uid);
    }

    if (photoObjectUrl.current) URL.revokeObjectURL(photoObjectUrl.current);
    photoObjectUrl.current = file ? URL.createObjectURL(file) : null;
    setPhotoURL(photoObjectUrl.current || "");
    setProfileError(null);
    notifyLocalProfilePhotoChanged(user.uid);
  }, [user]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // User closed the popup — not an error worth showing
        return;
      }
      if (code === "auth/invalid-api-key" || code?.includes("api-key-not-valid")) {
        setAuthError("Firebase rejected this API key. Check NEXT_PUBLIC_FIREBASE_API_KEY in .env.local against the Firebase project's Web app settings.");
        return;
      }
      if (code === "auth/operation-not-allowed") {
        setAuthError("Google sign-in is disabled for this Firebase project. Enable Google in Firebase Authentication settings.");
        return;
      }
      if (code === "auth/unauthorized-domain") {
        setAuthError("This site is not authorized for Firebase sign-in. Add localhost to the project's Authorized domains.");
        return;
      }
      if (code === "auth/popup-blocked") {
        setAuthError("Popup was blocked by your browser. Please allow popups for this site.");
        return;
      }
      setAuthError("Sign-in failed. Check your Firebase Authentication configuration and try again.");
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, displayName, photoURL, profileError, loading, authError,
      signInWithGoogle, updateDisplayName, updateProfilePhoto, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
