import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { UserProvider, useUser } from "./context/UserContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Activities from "./pages/Activities";
import Goals from "./pages/Goals";
import Reports from "./pages/Reports";
import DataSources from "./pages/DataSources";
import Settings from "./pages/Settings";
import UserSelect from "./pages/UserSelect";

function AppRoutes() {
  const { currentUser, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-eco-500" />
      </div>
    );
  }

  if (!currentUser) {
    return <UserSelect />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="activities" element={<Activities />} />
          <Route path="goals" element={<Goals />} />
          <Route path="reports" element={<Reports />} />
          <Route path="data-sources" element={<DataSources />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </ThemeProvider>
  );
}
