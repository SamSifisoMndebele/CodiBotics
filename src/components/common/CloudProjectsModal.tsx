// ============================================================================
// PulseMaker Simulator - Cloud Projects & Firebase Auth Modal
// Zero-friction student sign-in + Facilitator controls + Cloud project management
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Save,
  FolderOpen,
  Share2,
  Trash2,
  UserCheck,
  GraduationCap,
  Sparkles,
  KeyRound,
  Check,
  Copy,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { PulseMakerProjectFile, GradePhase } from '../../types/simulator';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import {
  saveProjectToCloud,
  fetchUserProjects,
  loadUserProject,
  deleteUserProject,
  shareProjectToClassroom,
  loadSharedProject,
  CloudProjectSummary,
} from '../../services/cloudProjects';

interface CloudProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: PulseMakerProjectFile;
  onLoadProject: (project: PulseMakerProjectFile) => void;
}

export const CloudProjectsModal: React.FC<CloudProjectsModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onLoadProject,
}) => {
  const {
    user,
    loading: authLoading,
    authError,
    setAuthError,
    loginAsStudentAnonymous,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
  } = useFirebaseAuth();

  // Project state
  const [projectName, setProjectName] = useState<string>(
    currentProject.projectName || 'My PulseMaker Project'
  );
  const [userProjects, setUserProjects] = useState<CloudProjectSummary[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Classroom Code share/import state
  const [shareCodeInput, setShareCodeInput] = useState<string>('');
  const [lastGeneratedCode, setLastGeneratedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Auth form state for Facilitators
  const [authMode, setAuthMode] = useState<'student' | 'login' | 'register'>('student');
  const [studentNickname, setStudentNickname] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [facilitatorName, setFacilitatorName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load user projects whenever user changes
  useEffect(() => {
    if (user) {
      loadProjects();
    } else {
      setUserProjects([]);
    }
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;
    setLoadingProjects(true);
    try {
      const list = await fetchUserProjects(user.uid);
      setUserProjects(list);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  if (!isOpen) return null;

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await loginAsStudentAnonymous(studentNickname || 'Learner');
    } catch {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFacilitatorAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, facilitatorName);
      }
    } catch {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveToCloud = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setActionMessage(null);
    try {
      const projectToSave: PulseMakerProjectFile = {
        ...currentProject,
        projectName: projectName.trim() || 'PulseMaker Project',
      };
      await saveProjectToCloud(
        user.uid,
        user.displayName || 'Learner',
        user.isAnonymous,
        projectToSave
      );
      setActionMessage('Project saved to cloud successfully!');
      await loadProjects();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save project';
      setActionMessage(`Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadProject = async (projectId: string) => {
    if (!user) return;
    try {
      const loaded = await loadUserProject(user.uid, projectId);
      if (loaded) {
        onLoadProject(loaded);
        onClose();
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteUserProject(user.uid, projectId);
      setUserProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleShareProject = async (projectId: string) => {
    if (!user) return;
    try {
      const code = await shareProjectToClassroom(
        user.uid,
        user.displayName || 'Learner',
        currentProject,
        projectId
      );
      setLastGeneratedCode(code);
    } catch (err) {
      console.error('Failed to share project:', err);
    }
  };

  const handleLoadByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareCodeInput.trim()) return;
    setIsSubmitting(true);
    setActionMessage(null);
    try {
      const shared = await loadSharedProject(shareCodeInput);
      if (shared) {
        onLoadProject(shared);
        onClose();
      } else {
        setActionMessage('Code not found. Please verify the 6-character code.');
      }
    } catch (err) {
      setActionMessage('Failed to load shared project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (!lastGeneratedCode) return;
    navigator.clipboard.writeText(lastGeneratedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getPhaseBadge = (phase: GradePhase) => {
    switch (phase) {
      case 'foundation':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Foundation (R-3)</span>;
      case 'intermediate':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Intermediate (4-6)</span>;
      case 'senior':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">Senior (7)</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                PulseMaker Cloud Workspace
              </h2>
              <p className="text-xs text-slate-400">
                Save projects, access across devices, and share with classroom
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {authError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
              <button
                onClick={() => setAuthError(null)}
                className="ml-auto underline hover:text-rose-300"
              >
                Dismiss
              </button>
            </div>
          )}

          {actionMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              <Check className="w-4 h-4 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* Section 1: User / Account State */}
          {!user ? (
            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setAuthMode('student')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      authMode === 'student'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Learner Quick Connect (Grades R–7)
                  </button>
                  <button
                    onClick={() => setAuthMode('login')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      authMode !== 'student'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Teacher / Facilitator
                  </button>
                </div>
              </div>

              {authMode === 'student' ? (
                <form onSubmit={handleStudentLogin} className="space-y-3">
                  <p className="text-xs text-slate-300">
                    No email or password needed! Enter your nickname or school desk number to save your work.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Sipho, Zola, Desk 12"
                      value={studentNickname}
                      onChange={(e) => setStudentNickname(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || authLoading}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs flex items-center gap-2 hover:brightness-110 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Start Cloud Session
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleFacilitatorAuth} className="space-y-3">
                  {authMode === 'register' && (
                    <input
                      type="text"
                      placeholder="Full Name / Educator Title"
                      value={facilitatorName}
                      onChange={(e) => setFacilitatorName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                      required
                    />
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="email"
                      placeholder="educator@school.gov.za"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                      required
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || authLoading}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                      {authMode === 'login' ? 'Sign In as Facilitator' : 'Create Facilitator Account'}
                    </button>
                    <button
                      type="button"
                      onClick={() => loginWithGoogle()}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700"
                    >
                      Sign In with Google
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      {authMode === 'login' ? 'Need an account? Register' : 'Have an account? Log In'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">
                      {user.displayName || (user.isAnonymous ? 'Learner (Anonymous)' : user.email)}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {user.isAnonymous ? 'Learner Mode' : 'Facilitator Verified'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {user.isAnonymous
                      ? 'Local offline cache + cloud backup active'
                      : user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Section 2: Save Current Workspace */}
          {user && (
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Save Current Workspace to Cloud
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project Name..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
                />
                <button
                  onClick={handleSaveToCloud}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Save Project
                </button>
              </div>
            </div>
          )}

          {/* Section 3: Join / Load with 6-character Classroom Code */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Load Shared Classroom Project via Code
            </h3>
            <form onSubmit={handleLoadByCode} className="flex gap-2">
              <input
                type="text"
                maxLength={8}
                value={shareCodeInput}
                onChange={(e) => setShareCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit Code (e.g. AB12CD)"
                className="flex-1 uppercase font-mono tracking-wider bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400"
              />
              <button
                type="submit"
                disabled={isSubmitting || !shareCodeInput.trim()}
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <FolderOpen className="w-4 h-4" />
                Load Code
              </button>
            </form>
            {lastGeneratedCode && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs">
                <span>
                  Share this code with your class: <strong className="font-mono text-white text-sm">{lastGeneratedCode}</strong>
                </span>
                <button
                  onClick={copyCodeToClipboard}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-200"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          {/* Section 4: My Saved Cloud Projects */}
          {user && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  My Cloud Projects ({userProjects.length})
                </h3>
                {loadingProjects && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
              </div>

              {userProjects.length === 0 && !loadingProjects ? (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                  No projects saved in the cloud yet. Click &quot;Save Project&quot; above to store your first project!
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {userProjects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">{p.name}</span>
                          {getPhaseBadge(p.phase)}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Updated: {new Date(p.updatedAt).toLocaleDateString()} {new Date(p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleShareProject(p.id)}
                          title="Generate Classroom Share Code"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-400 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleLoadProject(p.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-medium border border-slate-700 transition-colors"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
