import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/apiService";
import { mockUserAPI } from "../services/mockDataService";

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
            const username = localStorage.getItem("username");
            if (username) {
                // Use mock API to get user data
                const userData = await mockUserAPI.getUser(username);
                setUser({
                    username: username,
                    ...userData,
                });
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            localStorage.removeItem("username");
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            setError(null);

            // Simple authentication for now
            if (username === "admin" && password === "admin") {
                // Get user data from mock API
                const userData = await mockUserAPI.getUser(username);
                const mockUser = {
                    username: username,
                    ...userData,
                };

                localStorage.setItem("username", username);
                setUser(mockUser);
                return { user: mockUser };
            } else {
                setError("Invalid credentials. Use admin/admin");
                throw new Error("Invalid credentials");
            }
        } catch (error) {
            if (!error.message.includes("Invalid credentials")) {
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
