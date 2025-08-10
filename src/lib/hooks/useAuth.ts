import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserRole, Permission, hasPermission, hasAllPermissions, hasAnyPermission } from '@/lib/permissions';

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

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setState(prev => ({ ...prev, error: error.message, loading: false }));
          return;
        }

        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false 
        }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (user: User) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Fetch profile with roles using the new view
      const { data: profileData, error } = await supabase
        .from('user_profiles_with_roles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Jika profile tidak ada, buat profile baru dengan role default
        if (error.code === 'PGRST116') {
          // Create profile first
          const { data: newProfile, error: insertError } = await supabase
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

          setState({
            user,
            profile: completeProfile,
            loading: false,
            error: null
          });
        } else {
          setState(prev => ({ 
            ...prev, 
            error: error.message, 
            loading: false 
          }));
        }
      } else {
        setState({
          user,
          profile: profileData,
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

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }));
      } else {
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