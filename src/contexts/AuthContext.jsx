import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/apiService";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is logged in on app start
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Check if user is authenticated by calling /me endpoint
            const response = await authAPI.checkAuth();
            if (response) {
                setUser(response);
            }
        } catch (error) {
            // If we get a 401 or 404, the user is not authenticated - this is normal
            if (error.message.includes("401") || error.message.includes("404")) {
                console.log("User not authenticated");
            } else {
                console.error("Auth check failed:", error);
            }
            // Clear any stored auth data
            localStorage.removeItem("username");
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            setError(null);

            console.log('Attempting login with:', username);
            // Use real API for authentication
            const response = await authAPI.login(username, password);
            console.log('Login response:', response);
            
            if (response && response.member) {
                setUser(response.member);
                localStorage.setItem("username", response.member.username);
                return { user: response.member };
            } else {
                setError("Invalid credentials");
                throw new Error("Invalid credentials");
            }
        } catch (error) {
            if (error.message.includes("Failed authentication") || error.message.includes("401")) {
                setError("Invalid username or password");
            } else {
                setError(error.message);
            }
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.removeItem("username");
            setUser(null);
        }
    };

    const register = async (userData) => {
        try {
            setError(null);
            // Mock registration - just simulate success
            await new Promise((resolve) => setTimeout(resolve, 500));
            return { success: true, message: "Registration successful" };
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        register,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
