import { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserRole, Permission, hasPermission } from '@/lib/permissions';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole; // Backward compatibility
  roles: UserRole[]; // New multi-role support
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

// Cache untuk session dan profile
let sessionCache: { user: User | null; profile: UserProfile | null; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit cache

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  });
  
  const fetchingRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pindahkan fetchUserProfile ke atas untuk menghindari hoisting issue
  const fetchUserProfile = useCallback(async (user: User, retryCount = 0) => {
    const maxRetries = 3;
    const timeoutMs = 5000; // Kurangi timeout ke 5 detik
    
    // Prevent multiple concurrent fetches
    if (fetchingRef.current) {
      return;
    }
    
    fetchingRef.current = true;
    
    try {
      // Hanya set loading true jika belum ada data di cache
      if (!sessionCache || Date.now() - sessionCache.timestamp >= CACHE_DURATION) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      // Buat promise dengan timeout
      const fetchPromise = supabase
        .from('user_profiles_with_roles')
        .select('*')
        .eq('id', user.id)
        .single();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      });

      // Race antara fetch dan timeout
      const result = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]);
      const { data: profileData, error } = result as { data: UserProfile | null; error: Error | null };

      if (error) {
        // Jika profile tidak ada, buat profile baru dengan role default
        if ('code' in error && (error as { code: string }).code === 'PGRST116') {
          // Create profile first
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || null
            })
            .select()
            .single();

          if (insertError) {
            setState(prev => ({ 
              ...prev, 
              error: insertError.message, 
              loading: false 
            }));
            return;
          }

          // Assign default CASHIER role
          const { error: roleError } = await supabase
            .rpc('assign_user_role', {
              target_user_id: user.id,
              new_role: 'CASHIER'
            });

          if (roleError) {
            console.error('Error assigning default role:', roleError);
          }

          // Fetch the complete profile with roles
          const { data: completeProfile, error: fetchError } = await supabase
            .from('user_profiles_with_roles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (fetchError) {
            setState(prev => ({ 
              ...prev, 
              error: fetchError.message, 
              loading: false 
            }));
            return;
          }

          // Update cache untuk profile baru
          sessionCache = {
            user,
            profile: completeProfile,
            timestamp: Date.now()
          };

          setState({
            user,
            profile: completeProfile,
            loading: false,
            error: null
          });
        } else {
          // Retry jika masih ada kesempatan dan bukan error yang fatal
          if (retryCount < maxRetries && !error.message.includes('permission denied')) {
            console.warn(`Retry ${retryCount + 1}/${maxRetries} untuk fetch profile:`, error.message);
            setTimeout(() => {
              fetchUserProfile(user, retryCount + 1);
            }, 1000 * (retryCount + 1)); // Exponential backoff
            return;
          }
          
          setState(prev => ({ 
            ...prev, 
            error: `Gagal memuat profil pengguna: ${error.message}`, 
            loading: false 
          }));
        }
      } else {
        // Update cache
        sessionCache = {
          user,
          profile: profileData,
          timestamp: Date.now()
        };
        
        setState({
          user,
          profile: profileData,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Retry untuk timeout atau network error
      if (retryCount < maxRetries && 
          (errorMessage.includes('timeout') || 
           errorMessage.includes('network') || 
           errorMessage.includes('fetch'))) {
        console.warn(`Retry ${retryCount + 1}/${maxRetries} karena ${errorMessage}`);
        setTimeout(() => {
          fetchUserProfile(user, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      setState(prev => ({ 
        ...prev, 
        error: `Gagal memuat profil: ${errorMessage}`,
        loading: false 
      }));
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const checkCacheAndGetSession = useCallback(async () => {
      try {
        // Cek apakah ada cache yang masih valid
        if (sessionCache && Date.now() - sessionCache.timestamp < CACHE_DURATION) {
          setState({
            user: sessionCache.user,
            profile: sessionCache.profile,
            loading: false,
            error: null
          });
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setState(prev => ({ ...prev, error: error.message, loading: false }));
          return;
        }

        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setState(prev => ({ ...prev, loading: false }));
          // Clear cache jika tidak ada session
          sessionCache = null;
        }
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false 
        }));
      }
    }, [fetchUserProfile]);

  useEffect(() => {
    checkCacheAndGetSession();

    // Listen for auth changes dengan debouncing
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Clear previous debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Debounce untuk mencegah multiple calls
      debounceTimeoutRef.current = setTimeout(async () => {
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setState({
            user: null,
            profile: null,
            loading: false,
            error: null
          });
          // Clear cache ketika logout
          sessionCache = null;
        }
      }, 300); // 300ms debounce
    });

    return () => {
      subscription.unsubscribe();
      // Cleanup debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [checkCacheAndGetSession, fetchUserProfile]);



  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }));
      } else {
        // Clear cache saat logout
        sessionCache = null;
        
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      }));
    }
  };

  // Permission checking functions for multiple roles
  const checkPermission = (permission: Permission): boolean => {
    // Fallback ke role utama jika roles array tidak tersedia (backward compatibility)
    if (!state.profile?.roles || state.profile.roles.length === 0) {
      if (state.profile?.role) {
        return hasPermission(state.profile.role, permission);
      }
      return false;
    }
    
    // User has permission if ANY of their roles has the permission
    return state.profile.roles.some(role => hasPermission(role, permission));
  };

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    if (!state.profile?.roles || state.profile.roles.length === 0) {
      return false;
    }
    
    // Check if user has all permissions across all their roles
    return permissions.every(permission => 
      state.profile!.roles.some(role => hasPermission(role, permission))
    );
  };

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    // Fallback ke role utama jika roles array tidak tersedia (backward compatibility)
    if (!state.profile?.roles || state.profile.roles.length === 0) {
      if (state.profile?.role) {
        return permissions.some(permission => hasPermission(state.profile!.role, permission));
      }
      return false;
    }
    
    // Check if user has any of the permissions across all their roles
    return permissions.some(permission => 
      state.profile!.roles.some(role => hasPermission(role, permission))
    );
  };

  // Helper function to get highest priority role
  const getHighestRole = (): UserRole | null => {
    if (!state.profile?.roles || state.profile.roles.length === 0) {
      return null;
    }
    
    const rolePriority: Record<UserRole, number> = {
      'ADMIN': 3,
      'MANAGER': 2,
      'CASHIER': 1
    };
    
    return state.profile.roles.reduce((highest, current) => {
      return rolePriority[current] > rolePriority[highest] ? current : highest;
    });
  };

  return {
    ...state,
    signOut,
    checkPermission,
    checkAllPermissions,
    checkAnyPermission,
    // Role checking functions
    isAdmin: state.profile?.roles?.includes('ADMIN') || false,
    isManager: state.profile?.roles?.includes('MANAGER') || false,
    isCashier: state.profile?.roles?.includes('CASHIER') || false,
    hasRole: (role: UserRole) => state.profile?.roles?.includes(role) || false,
    // Backward compatibility
    role: state.profile?.role || getHighestRole(),
    // New multi-role properties
    roles: state.profile?.roles || [],
    highestRole: getHighestRole(),
    roleCount: state.profile?.roles?.length || 0
  };
}