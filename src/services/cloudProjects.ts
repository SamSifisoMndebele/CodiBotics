// ============================================================================
// PulseMaker Simulator - Cloud Projects Firestore Service
// ============================================================================

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { PulseMakerProjectFile, GradePhase } from '../types/simulator';

export interface CloudProjectSummary {
  id: string;
  name: string;
  phase: GradePhase;
  updatedAt: string;
  sharedId?: string;
}

export interface CloudProjectRecord extends PulseMakerProjectFile {
  id: string;
  authorId: string;
  authorName: string;
  isAnonymous: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  sharedId?: string;
}

/**
 * Saves a project under the user's private collection.
 * Works seamlessly offline via Firestore's persistent local cache.
 */
export async function saveProjectToCloud(
  userId: string,
  userDisplayName: string,
  isAnonymous: boolean,
  project: PulseMakerProjectFile,
  existingProjectId?: string
): Promise<string> {
  const projectId = existingProjectId || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const projectRef = doc(db, 'users', userId, 'projects', projectId);

  const payload = {
    ...project,
    id: projectId,
    authorId: userId,
    authorName: userDisplayName || (isAnonymous ? 'Learner (Anonymous)' : 'Facilitator'),
    isAnonymous,
    updatedAt: serverTimestamp(),
    timestamp: new Date().toISOString(),
  };

  await setDoc(projectRef, payload, { merge: true });
  return projectId;
}

/**
 * Fetches all saved projects for the authenticated user,
 * and cleans up any orphaned shared_projects owned by this user.
 */
export async function fetchUserProjects(userId: string): Promise<CloudProjectSummary[]> {
  const userProjectsRef = collection(db, 'users', userId, 'projects');
  const q = query(userProjectsRef, orderBy('timestamp', 'desc'));

  const snapshot = await getDocs(q);
  const projects: CloudProjectSummary[] = [];
  const activeProjectIds = new Set<string>();

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    activeProjectIds.add(docSnap.id);
    projects.push({
      id: docSnap.id,
      name: data.projectName || 'Untitled Project',
      phase: data.activePhase || 'foundation',
      updatedAt: data.timestamp || new Date().toISOString(),
      sharedId: data.sharedId,
    });
  });

  // Clean up any orphaned shared_projects from previously deleted projects
  try {
    const sharedRef = collection(db, 'shared_projects');
    const sharedQuery = query(sharedRef, where('authorId', '==', userId));
    const sharedSnap = await getDocs(sharedQuery);
    const cleanupPromises: Promise<void>[] = [];

    sharedSnap.forEach((sDoc) => {
      const sData = sDoc.data();
      if (!sData.id || !activeProjectIds.has(sData.id)) {
        cleanupPromises.push(deleteDoc(sDoc.ref));
      }
    });

    if (cleanupPromises.length > 0) {
      await Promise.all(cleanupPromises);
    }
  } catch {
    // Ignore cleanup errors if offline
  }

  return projects;
}

/**
 * Retrieves a single project by ID for a user.
 */
export async function loadUserProject(
  userId: string,
  projectId: string
): Promise<PulseMakerProjectFile | null> {
  const projectRef = doc(db, 'users', userId, 'projects', projectId);
  const snap = await getDoc(projectRef);

  if (!snap.exists()) {
    return null;
  }

  return snap.data() as PulseMakerProjectFile;
}

/**
 * Deletes a project from the user's cloud storage AND removes its shared classroom code(s).
 */
export async function deleteUserProject(userId: string, projectId: string): Promise<void> {
  const projectRef = doc(db, 'users', userId, 'projects', projectId);

  // 1. Check if the project has a linked sharedId and delete it directly
  try {
    const projectSnap = await getDoc(projectRef);
    if (projectSnap.exists()) {
      const sharedId = projectSnap.data()?.sharedId;
      if (sharedId) {
        const shareDocRef = doc(db, 'shared_projects', String(sharedId));
        await deleteDoc(shareDocRef);
      }
    }
  } catch {
    // Continue even if reading sharedId fails
  }

  // 2. Also remove any shared_projects matching this userId and projectId
  try {
    const sharedRef = collection(db, 'shared_projects');
    const sharedQuery = query(sharedRef, where('authorId', '==', userId));
    const sharedSnap = await getDocs(sharedQuery);
    const deletePromises: Promise<void>[] = [];

    sharedSnap.forEach((sDoc) => {
      if (sDoc.data().id === projectId) {
        deletePromises.push(deleteDoc(sDoc.ref));
      }
    });

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }
  } catch {
    // Ignore if query fails while offline
  }

  // 3. Delete the user's project document
  await deleteDoc(projectRef);
}

/**
 * Publishes a project to the shared classroom registry with a 6-digit classroom code.
 * Reuses existing share code if the project was already shared.
 */
export async function shareProjectToClassroom(
  userId: string,
  authorName: string,
  fallbackProject: PulseMakerProjectFile,
  projectId: string
): Promise<string> {
  const userProjectRef = doc(db, 'users', userId, 'projects', projectId);
  const userProjectSnap = await getDoc(userProjectRef);
  const storedData = userProjectSnap.exists()
    ? (userProjectSnap.data() as PulseMakerProjectFile & { sharedId?: string })
    : fallbackProject;

  // Reuse existing share code if already shared, otherwise generate a 6-character code
  const existingCode =
    userProjectSnap.exists() && userProjectSnap.data()?.sharedId
      ? String(userProjectSnap.data()?.sharedId)
      : null;
  const shareCode =
    existingCode || Math.random().toString(36).substring(2, 8).toUpperCase();

  const shareDocRef = doc(db, 'shared_projects', shareCode);

  await setDoc(shareDocRef, {
    ...storedData,
    id: projectId,
    authorId: userId,
    authorName,
    shareCode,
    createdAt: serverTimestamp(),
  });

  // Link sharedId back to user project
  await setDoc(userProjectRef, { sharedId: shareCode }, { merge: true });

  return shareCode;
}

/**
 * Loads a shared project using its 6-character code.
 */
export async function loadSharedProject(shareCode: string): Promise<PulseMakerProjectFile | null> {
  const code = shareCode.trim().toUpperCase();
  const shareDocRef = doc(db, 'shared_projects', code);
  const snap = await getDoc(shareDocRef);

  if (!snap.exists()) {
    return null;
  }

  return snap.data() as PulseMakerProjectFile;
}
