import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { usePostHog } from 'posthog-react-native';

interface Profile {
  user_id: string;
  username: string;
  displayname: string;
  bio?: string;
  avatar_url?: string;
  onboarding_completed?: boolean;
}

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  profileLoading: boolean;
  needsOnboarding: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  profile: null,
  profileLoading: true,
  needsOnboarding: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const posthog = usePostHog();

  const fetchProfile = async (userId: string) => {
    try {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist, user needs onboarding
        setNeedsOnboarding(true);
        setProfile(null);
      } else {
        setProfile(data);
        // Check if user needs onboarding (incomplete profile)
        const needsSetup = !data.username || data.username.length < 3 || !data.onboarding_completed;
        setNeedsOnboarding(needsSetup);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setNeedsOnboarding(true);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfileLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);
      
      if (session?.user) {
        // Track user sign in
        if (event === 'SIGNED_IN') {
          const userProperties = {
            email: session.user.email || '',
            created_at: session.user.created_at || '',
          };
          posthog.identify(session.user.id, userProperties);
          console.log(`📊 USER IDENTIFIED:`, session.user.id);
          console.log(`📊 User Properties:`, JSON.stringify(userProperties, null, 2));
          
          const signInData = {
            method: 'email', // You can determine this from the auth method
            platform: 'mobile',
          };
          posthog.capture('user_signed_in', signInData);
          console.log(`📊 USER SIGNED IN:`, JSON.stringify(signInData, null, 2));
        }
        
        fetchProfile(session.user.id);
      } else {
        // Track user sign out
        if (event === 'SIGNED_OUT') {
          const signOutData = {
            platform: 'mobile',
          };
          posthog.capture('user_signed_out', signOutData);
          console.log(`📊 USER SIGNED OUT:`, JSON.stringify(signOutData, null, 2));
          posthog.reset();
          console.log(`📊 USER SESSION RESET`);
        }
        
        setProfile(null);
        setProfileLoading(false);
        setNeedsOnboarding(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setNeedsOnboarding(false);
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      loading, 
      profile, 
      profileLoading, 
      needsOnboarding, 
      signOut, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

