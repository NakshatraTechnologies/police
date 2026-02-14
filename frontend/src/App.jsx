import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FormEditor from './pages/FormEditor';
import PublicForm from './pages/PublicForm';
import FormResponses from './pages/FormResponses';
import FormReport from './pages/FormReport';

function App() {
    return (
        <AuthProvider>
            <Navbar />
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/forms/new" element={<FormEditor />} />
                <Route path="/admin/forms/:id/edit" element={<FormEditor />} />
                <Route path="/admin/forms/:id/responses" element={<FormResponses />} />
                <Route path="/admin/forms/:id/report" element={<FormReport />} />
                <Route path="/forms/:slug" element={<PublicForm />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </AuthProvider>
    );
}

export default App;
