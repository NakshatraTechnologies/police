import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedEmail = localStorage.getItem('userEmail');
        if (token) {
            setUser({ isAuthenticated: true, email: storedEmail });
        } else {
            setUser(null);
        }
    }, [token]);

    const login = (newToken, email) => {
        localStorage.setItem('token', newToken);
        if (email) localStorage.setItem('userEmail', email);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
