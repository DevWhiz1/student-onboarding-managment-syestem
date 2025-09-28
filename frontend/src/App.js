import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import QuizTaking from './pages/QuizTaking';
import VideoSubmission from './pages/VideoSubmission';
import CreateQuiz from './pages/CreateQuiz';
import Students from './pages/Students';
import Quizzes from './pages/Quizzes';
import Videos from './pages/Videos';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="student-dashboard" element={<StudentDashboard />} />
              <Route path="admin-dashboard" element={<AdminDashboard />} />
              <Route path="quiz/:quizId" element={<QuizTaking />} />
              <Route path="videos/submit" element={<VideoSubmission />} />
              <Route path="admin/quizzes/create" element={<CreateQuiz />} />
              <Route path="students" element={<Students />} />
              <Route path="quizzes" element={<Quizzes />} />
              <Route path="videos" element={<Videos />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
