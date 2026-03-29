"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import CreatorDashboard from "../components/CreatorDashboard";
import UserDashboard from "../components/UserDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      {user?.role === "CREATOR" ? <CreatorDashboard /> : <UserDashboard />}
    </ProtectedRoute>
  );
}
