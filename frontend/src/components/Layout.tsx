import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import { useUser } from "../context/UserContext";
import { LogOut } from "lucide-react";

export default function Layout() {
  const { currentUser, switchUser } = useUser();

  const initials = currentUser
    ? currentUser.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-8">
          <div>
            <h2 className="text-sm text-gray-500 dark:text-gray-400">
              Welcome back, <span className="font-medium text-gray-900 dark:text-white">{currentUser?.name ?? "User"}</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={switchUser}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Switch user"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Switch</span>
            </button>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: currentUser?.avatar_color ?? "#22c55e" }}
            >
              {initials}
            </div>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
