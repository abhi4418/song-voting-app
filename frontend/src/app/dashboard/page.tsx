"use client";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserDashboard from "@/app/components/UserDashboard";
import CreatorDashboard from "../components/CreatorDashboard";

export default function Dashboard() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return <ProtectedRoute><div></div></ProtectedRoute>;
    }

    if(user.role === "USER"){
        return <ProtectedRoute requiredRole="USER">
            <UserDashboard />
        </ProtectedRoute>
    }

    else if(user.role === "CREATOR"){
        return <ProtectedRoute requiredRole="CREATOR">
            <CreatorDashboard />
        </ProtectedRoute>
    }

    return <ProtectedRoute><div></div></ProtectedRoute>;
}