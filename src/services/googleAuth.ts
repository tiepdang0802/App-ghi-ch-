import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { GoogleUserInfo } from '../types';

// Initialize Firebase App safely (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const TASKS_SCOPE = 'https://www.googleapis.com/auth/tasks';

const provider = new GoogleAuthProvider();
provider.addScope(TASKS_SCOPE);
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onSuccess?: (user: User, token: string | null) => void,
  onSignedOut?: () => void,
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onSuccess) {
        onSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onSignedOut) {
        onSignedOut();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      console.warn('Could not extract credential access token directly, user is signed in');
      cachedAccessToken = null;
      return { user: result.user, accessToken: '' };
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// ================= Google Tasks API Helpers =================
export interface GoogleTaskPayload {
  title: string;
  notes?: string;
  due?: string; // RFC 3339 format, e.g., '2026-09-15T00:00:00.000Z'
}

export async function createGoogleTask(
  accessToken: string,
  task: GoogleTaskPayload,
  tasklistId: string = '@default',
) {
  const body: any = {
    title: task.title,
  };
  if (task.notes) body.notes = task.notes;
  if (task.due) {
    // Google Tasks requires ISO string formatted at midnight or full ISO timestamp
    const dateObj = new Date(task.due);
    if (!isNaN(dateObj.getTime())) {
      body.due = dateObj.toISOString();
    }
  }

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Tasks API error (${res.status}): ${errorText}`);
  }

  return await res.json();
}

export async function fetchGoogleTasks(accessToken: string, tasklistId: string = '@default') {
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks?showCompleted=true&showHidden=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Tasks fetch error (${res.status}): ${errorText}`);
  }

  return await res.json();
}
