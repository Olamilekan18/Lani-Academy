import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

type UserRole = "learner" | "facilitator" | "admin" | "super_admin" | "organization";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  organisation: string;
  job_title: string;
  role: UserRole;
  avatar_url: string | null;
  bio?: string;
  qualifications?: string;
  country?: string;
  state_region?: string;
  city?: string;
  gender?: string;
  date_of_birth?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ data?: any; error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: string | null }>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }
    setLoading(false);
  }

  async function signUp(email: string, password: string, fullName: string) {
    if (!supabase) return { error: "Supabase not configured" };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { data, error: error?.message ?? null };
  }

  async function signIn(email: string, password: string) {
    if (!supabase) return { error: "Supabase not configured" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  async function resetPassword(email: string) {
    if (!supabase) return { error: "Supabase not configured" };
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message ?? null };
  }

  async function updateProfile(data: Partial<Profile>) {
    if (!supabase) return { error: "Supabase not configured" };
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    const userId = currentSession?.user?.id || user?.id;
    if (!userId) return { error: "Not authenticated" };
    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", userId);
    if (!error) {
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (updatedProfile) {
        setProfile(updatedProfile as Profile);
      }
    }
    return { error: error?.message ?? null };
  }

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signUp, signIn, signOut, resetPassword, updateProfile, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
