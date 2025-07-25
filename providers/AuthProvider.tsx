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
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  signOut: () => {},
  user: null,
  forceLogout: () => {},
  nuclearLogout: () => {},
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

    if (session && inAuthGroup) {
      // Redirect authenticated users to home page if they're on an auth page
      router.replace('/(tabs)');
    } else if (!session && !inAuthGroup) {
      // Redirect unauthenticated users to login page if they're not on an auth page
      router.replace('/login');
    }
  }, [session, segments, rootNavigation?.isReady(), loading]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const isMountedRef = useRef(true);

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
          } else if (event === 'SIGNED_IN' && session) {
            router.replace('/(tabs)');
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