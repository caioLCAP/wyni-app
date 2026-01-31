import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, isConfigured } from '@/services/supabaseClient';
import { router, useSegments, useRootNavigation } from 'expo-router';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signOut: () => void;
  user: any;
  forceLogout: () => void;
  nuclearLogout: () => void;
  deleteAccount: () => Promise<void>;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  signOut: () => { },
  user: null,
  forceLogout: () => { },
  nuclearLogout: () => { },
  deleteAccount: async () => { },
  isGuest: true, // Default to guest initially safe
});

// This hook can be used to access the user info.
export function useAuth() {
  return useContext(AuthContext);
}

// This hook will protect the route access based on user authentication.
function useProtectedRoute(session: Session | null, loading: boolean) {
  const segments = useSegments();
  const rootNavigation = useRootNavigation();

  useEffect(() => {
    // Don't navigate if still loading or navigation isn't ready
    if (loading || !rootNavigation?.isReady()) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isResetPassword = segments.includes('reset-password');

    if (session && inAuthGroup && !isResetPassword) {
      // Redirect authenticated users to home page if they're on an auth page,
      // EXCEPT if they are resetting their password.
      router.replace('/(tabs)');
    }
    // REMOVIDO: Redirecionamento forçado para login.
    // Agora permitimos que o usuário fique sem sessão (modo visitante)
    // else if (!session && !inAuthGroup) {
    //   router.replace('/login');
    // }
  }, [session, segments, rootNavigation?.isReady(), loading]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const isMountedRef = useRef(true);

  // Derivado: se não tem sessão mas carregou, é visitante
  const isGuest = !loading && !session;

  useProtectedRoute(session, loading);

  // 🔥 MÉTODO 1: LOGOUT NORMAL (mais simples possível)
  const signOut = () => {
    // Limpar TUDO imediatamente
    setSession(null);
    setUser(null);
    setLoading(false);

    // Navegar IMEDIATAMENTE
    router.replace('/login');

    // Tentar Supabase logout em background (sem esperar)
    if (isConfigured) {
      supabase.auth.signOut().catch(() => {
        // Supabase logout falhou, mas já estamos na tela de login
      });
    }
  };

  // 🚨 MÉTODO 2: LOGOUT FORÇADO (ignora tudo)
  const forceLogout = () => {
    // Limpar estado local
    setSession(null);
    setUser(null);
    setLoading(false);

    // Forçar navegação múltiplas vezes
    router.replace('/login');
    setTimeout(() => router.replace('/login'), 100);
    setTimeout(() => router.replace('/login'), 500);

    // Limpar localStorage se existir
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.clear();
      } catch (e) {
        // Erro ao limpar localStorage
      }
    }
  };

  // ☢️ MÉTODO 3: LOGOUT NUCLEAR (recarrega tudo)
  const nuclearLogout = () => {
    // Limpar estado
    setSession(null);
    setUser(null);
    setLoading(false);

    // Se estamos na web, recarregar a página
    if (typeof window !== 'undefined') {
      try {
        // Limpar tudo
        window.localStorage?.clear();
        window.sessionStorage?.clear();

        // Recarregar a página forçadamente
        window.location.href = '/login';
        window.location.reload();
      } catch (e) {
        router.replace('/login');
      }
    } else {
      // Mobile - forçar navegação
      router.replace('/login');
    }
  };

  // 🔥 MÉTODO 4: EXCLUIR CONTA
  const deleteAccount = async () => {
    try {
      setLoading(true);
      // 1. Deletar dados do usuário (storage service)
      const { wineStorageService } = require('@/services/wineStorageService');
      await wineStorageService.deleteAllUserData();

      // 2. Fazer logout
      signOut();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      setLoading(false);
      throw error;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const initializeAuth = async () => {
      try {
        if (!isConfigured) {
          setLoading(false);
          return;
        }

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          // Error getting initial session
        }

        if (isMountedRef.current) {
          setSession(session);
          setUser(session?.user || null);
          setLoading(false);
        }
      } catch (error) {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Only set up auth listener if Supabase is configured
    let subscription: any = null;

    if (isConfigured) {
      // Listen for auth state changes
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (isMountedRef.current) {
          setSession(session);
          setUser(session?.user || null);

          // Handle specific events
          if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            router.replace('/login');
          }
          // REMOVED to prevent conflict with password reset flow. 
          // useProtectedRoute handles the redirect to Home.
          /* else if (event === 'SIGNED_IN' && session) {
             router.replace('/(tabs)');
          } */
          else if (event === 'PASSWORD_RECOVERY') {
            // Handle password recovery event explicitly if needed, but for now we just want to ensure we don't redirect away
          }
        }
      });

      subscription = data.subscription;
    }

    return () => {
      isMountedRef.current = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const value = {
    session,
    loading,
    signOut,
    user,
    forceLogout,
    nuclearLogout,
    deleteAccount,
    isGuest,
  };

  // Show loading state while determining auth status
  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}