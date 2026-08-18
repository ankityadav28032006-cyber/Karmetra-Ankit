import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CandidateProfile, EmployerProfile, UserRole } from '../types';
import { api } from '../services/apiClient';
import { getCurrentSubdomain, SubdomainType } from '../utils/domainConfig';

export type PortalType = 'main' | 'candidate' | 'employer' | 'admin';

interface AuthContextType {
  user: User | null;
  candidateProfile: CandidateProfile | null;
  employerProfile: EmployerProfile | null;
  activePortal: PortalType;
  setActivePortal: (portal: PortalType) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginSuccess: (token: string, user: User, profile?: any) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateCandidateState: (profile: CandidateProfile) => void;
  updateEmployerState: (profile: EmployerProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [activePortal, setActivePortalState] = useState<PortalType>(() => {
    const subdomain = getCurrentSubdomain();
    if (subdomain === 'candidate') return 'candidate';
    if (subdomain === 'employer') return 'employer';
    if (subdomain === 'admin') return 'admin';
    if (subdomain === 'main') return 'main';

    const saved = localStorage.getItem('karmetra_active_portal') as PortalType;
    return saved || 'candidate';
  });
  const [isLoading, setIsLoading] = useState(true);

  const setActivePortal = (portal: PortalType) => {
    setActivePortalState(portal);
    localStorage.setItem('karmetra_active_portal', portal);
  };

  const refreshProfile = async () => {
    const token = localStorage.getItem('karmetra_auth_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res && res.user) {
        setUser(res.user);
        if (res.user.role === 'candidate' && res.profile) {
          setCandidateProfile(res.profile);
        } else if (res.user.role === 'employer' && res.profile) {
          setEmployerProfile(res.profile);
        }
      } else {
        localStorage.removeItem('karmetra_auth_token');
        setUser(null);
        setCandidateProfile(null);
        setEmployerProfile(null);
      }
    } catch {
      // Session expired or invalid cached token - cleanly reset session
      localStorage.removeItem('karmetra_auth_token');
      setUser(null);
      setCandidateProfile(null);
      setEmployerProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();

    const handleAuthExpired = () => {
      localStorage.removeItem('karmetra_auth_token');
      setUser(null);
      setCandidateProfile(null);
      setEmployerProfile(null);
    };

    window.addEventListener('karmetra_auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('karmetra_auth_expired', handleAuthExpired);
    };
  }, []);

  const loginSuccess = (token: string, newUser: User, newProfile?: any) => {
    localStorage.setItem('karmetra_auth_token', token);
    setUser(newUser);
    if (newUser.role === 'candidate') {
      setCandidateProfile(newProfile || null);
      setActivePortal('candidate');
    } else if (newUser.role === 'employer') {
      setEmployerProfile(newProfile || null);
      setActivePortal('employer');
    } else if (newUser.role === 'admin') {
      setActivePortal('admin');
    }
  };

  const logout = () => {
    api.logout().catch(() => {});
    localStorage.removeItem('karmetra_auth_token');
    setUser(null);
    setCandidateProfile(null);
    setEmployerProfile(null);
  };

  const updateCandidateState = (profile: CandidateProfile) => {
    setCandidateProfile(profile);
  };

  const updateEmployerState = (profile: EmployerProfile) => {
    setEmployerProfile(profile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        candidateProfile,
        employerProfile,
        activePortal,
        setActivePortal,
        isAuthenticated: !!user,
        isLoading,
        loginSuccess,
        logout,
        refreshProfile,
        updateCandidateState,
        updateEmployerState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
