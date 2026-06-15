"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { insforge } from "@/lib/insforge";

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  syncUserToDatabase: (authUser: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data, error } = await insforge.auth.getCurrentUser();
      if (error) {
        setUser(null);
      } else {
        setUser(data?.user || null);
        if (data?.user) {
          await syncUserToDatabase(data.user);
        }
      }
    } catch (err) {
      console.error("Failed to fetch current user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const syncUserToDatabase = async (authUser: any) => {
    if (!authUser) return;
    try {
      // Check if user already exists in DB
      const { data: dbUser, error } = await insforge.database
        .from("users")
        .select("id")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) {
        console.error("Error reading from users table:", error);
        return;
      }

      if (!dbUser) {
        // Insert user row
        const { error: insertError } = await insforge.database
          .from("users")
          .insert({
            id: authUser.id,
            email: authUser.email,
            name: authUser.profile?.name || authUser.email.split("@")[0],
            avatar_url: authUser.profile?.avatar_url || null,
          });

        if (insertError) {
          console.error("Error inserting user into DB table:", insertError);
        } else {
          console.log("User successfully synced/created in database users table");
        }
      }
    } catch (err) {
      console.error("Failed to sync user to database:", err);
    }
  };

  const signOut = async () => {
    try {
      await insforge.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser, syncUserToDatabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
