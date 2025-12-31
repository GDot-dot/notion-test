
import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { Project } from '../types.ts';
import { INITIAL_PROJECTS } from '../constants.tsx';
// Fix: Import auth utilities from local firebase lib to resolve missing member errors
import { auth, db, onAuthStateChanged } from '../lib/firebase.ts';
import type { User } from '../lib/firebase.ts';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface State {
  projects: Project[];
  workspaceLogo: string;
  workspaceName: string;
  user: User | null;
  lastSyncedAt: string | null;
  isLoading: boolean;
  isSyncing: boolean;
}

type Action =
  | { type: 'SET_USER'; user: User | null }
  | { type: 'SET_DATA'; projects: Project[]; workspaceLogo: string; workspaceName: string; lastSyncedAt: string | null }
  | { type: 'UPDATE_PROJECTS'; projects: Project[] }
  | { type: 'UPDATE_WORKSPACE'; logo: string; name: string }
  | { type: 'SET_SYNCING'; isSyncing: boolean }
  | { type: 'SET_LOADING'; isLoading: boolean };

const initialState: State = {
  projects: [],
  workspaceLogo: '🍓',
  workspaceName: 'Melody',
  user: null,
  lastSyncedAt: null,
  isLoading: true,
  isSyncing: false,
};

const projectReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user };
    case 'SET_DATA':
      return { 
        ...state, 
        projects: action.projects, 
        workspaceLogo: action.workspaceLogo, 
        workspaceName: action.workspaceName,
        lastSyncedAt: action.lastSyncedAt
      };
    case 'UPDATE_PROJECTS':
      return { ...state, projects: action.projects };
    case 'UPDATE_WORKSPACE':
      return { ...state, workspaceLogo: action.logo, workspaceName: action.name };
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.isSyncing };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    default:
      return state;
  }
};

const ProjectContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
  syncToCloud: (projects: Project[], logo?: string, name?: string) => Promise<void>;
} | null>(null);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, {
    ...initialState,
    projects: JSON.parse(localStorage.getItem('melody_local_data') || JSON.stringify(INITIAL_PROJECTS))
  });

  // 用於防抖動 (Debounce) 的 Timer Ref
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🍓 核心修正：監聽登入狀態與處理載入標記
  useEffect(() => {
    // 情況 A: 如果根本沒有設定 Firebase API Key
    if (!auth) {
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      dispatch({ type: 'SET_USER', user: u });
      
      // 情況 B: 如果使用者沒有登入，停止載入狀態，讓應用程式顯示本地緩存資料
      if (!u) {
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    });
    return () => unsubAuth();
  }, []);

  // 情況 C: 如果使用者已登入，開始監聽 Firestore 雲端資料
  useEffect(() => {
    if (!state.user || !db) return;
    
    dispatch({ type: 'SET_LOADING', isLoading: true });
    const unsubDoc = onSnapshot(doc(db, 'users', state.user.uid), (snapshot) => {
      // 只有當不是本地正在同步時，才接收遠端更新，避免打字衝突
      if (!timeoutRef.current && snapshot.exists()) {
        const data = snapshot.data();
        dispatch({ 
          type: 'SET_DATA', 
          projects: data.projects || INITIAL_PROJECTS,
          workspaceLogo: data.workspaceLogo || '🍓',
          workspaceName: data.workspaceName || 'Melody',
          lastSyncedAt: data.lastUpdated || null
        });
      }
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }, (error) => {
      console.error("Firestore error:", error);
      dispatch({ type: 'SET_LOADING', isLoading: false });
    });
    return () => unsubDoc();
  }, [state.user]);

  // 同步邏輯 (加入 2 秒防抖動)
  const syncToCloud = useCallback(async (newProjects: Project[], newLogo?: string, newName?: string) => {
    // 1. 始終先更新本地快取 (保持介面反應快速)
    localStorage.setItem('melody_local_data', JSON.stringify(newProjects));

    if (!state.user || !db) return;

    // 2. 設定同步狀態為 true (顯示 loading spinner)
    dispatch({ type: 'SET_SYNCING', isSyncing: true });

    // 3. 如果有正在等待的寫入排程，先清除它
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 4. 設定新的延遲寫入排程 (2秒後執行)
    timeoutRef.current = setTimeout(async () => {
      try {
        const now = new Date().toISOString();
        await setDoc(doc(db, 'users', state.user.uid), { 
          projects: newProjects,
          workspaceLogo: newLogo || state.workspaceLogo,
          workspaceName: newName || state.workspaceName,
          lastUpdated: now
        }, { merge: true });
      } catch (e) {
        console.error("Sync Error:", e);
      } finally {
        dispatch({ type: 'SET_SYNCING', isSyncing: false });
        timeoutRef.current = null;
      }
    }, 2000); // 延遲 2000 毫秒
  }, [state.user, state.workspaceLogo, state.workspaceName]);

  return (
    <ProjectContext.Provider value={{ state, dispatch, syncToCloud }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProjects must be used within ProjectProvider");
  return context;
};
