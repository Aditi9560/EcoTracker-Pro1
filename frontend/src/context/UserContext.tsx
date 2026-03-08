import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { User } from "../types";
import { getUsers } from "../api/client";

interface UserContextType {
  currentUser: User | null;
  users: User[];
  loading: boolean;
  selectUser: (user: User) => void;
  switchUser: () => void;
  refreshUsers: () => Promise<User[]>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = "ecotracker-current-user-id";

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshUsers = useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(data);
      return data;
    } catch (err) {
      console.error("Failed to load users:", err);
      return [];
    }
  }, []);

  // Load users on mount and restore selected user
  useEffect(() => {
    async function init() {
      const data = await refreshUsers();
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId) {
        const saved = data.find((u) => u.id === savedId);
        if (saved) {
          setCurrentUser(saved);
        }
      }
      setLoading(false);
    }
    init();
  }, [refreshUsers]);

  const selectUser = useCallback((user: User) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEY, user.id);
  }, []);

  const switchUser = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, users, loading, selectUser, switchUser, refreshUsers }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
}
