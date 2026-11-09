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
 * Fetches all saved projects for the authenticated user.
 */
export async function fetchUserProjects(userId: string): Promise<CloudProjectSummary[]> {
  const userProjectsRef = collection(db, 'users', userId, 'projects');
  const q = query(userProjectsRef, orderBy('timestamp', 'desc'));

  const snapshot = await getDocs(q);
  const projects: CloudProjectSummary[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    projects.push({
      id: docSnap.id,
      name: data.projectName || 'Untitled Project',
      phase: data.activePhase || 'foundation',
      updatedAt: data.timestamp || new Date().toISOString(),
      sharedId: data.sharedId,
    });
  });

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
 * Deletes a project from the user's cloud storage.
 */
export async function deleteUserProject(userId: string, projectId: string): Promise<void> {
  const projectRef = doc(db, 'users', userId, 'projects', projectId);
  await deleteDoc(projectRef);
}

/**
 * Publishes a project to the shared classroom registry with a 6-digit classroom code or share ID.
 */
export async function shareProjectToClassroom(
  userId: string,
  authorName: string,
  project: PulseMakerProjectFile,
  projectId: string
): Promise<string> {
  // Generate a clean 6-digit uppercase classroom code
  const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const shareDocRef = doc(db, 'shared_projects', shareCode);

  await setDoc(shareDocRef, {
    ...project,
    id: projectId,
    authorId: userId,
    authorName,
    shareCode,
    createdAt: serverTimestamp(),
  });

  // Link sharedId back to user project
  const userProjectRef = doc(db, 'users', userId, 'projects', projectId);
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
