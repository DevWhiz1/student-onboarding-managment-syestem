import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/shared/Login';
import Signup from './pages/shared/Signup';
import Dashboard from './pages/shared/Dashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import QuizTaking from './pages/student/QuizTaking';
import VideoSubmission from './pages/student/VideoSubmission';
import MyQuizzes from './pages/student/MyQuizzes';
import MyVideos from './pages/student/MyVideos';
import QuizResults from './pages/student/QuizResults';
import CreateQuiz from './pages/admin/CreateQuiz';
import QuizManagement from './pages/admin/QuizManagement';
import Students from './pages/admin/Students';
import Quizzes from './pages/shared/Quizzes';
import Videos from './pages/shared/Videos';
import Notifications from './pages/shared/Notifications';
import Profile from './pages/shared/Profile';
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
              
              {/* Quiz Routes */}
              <Route path="quiz/:quizId" element={<QuizTaking />} />
              <Route path="quiz/:quizId/results" element={<QuizResults />} />
              <Route path="quizzes" element={<Quizzes />} />
              
              {/* Student Routes */}
              <Route path="student/quizzes" element={<MyQuizzes />} />
              <Route path="student/videos" element={<MyVideos />} />
              <Route path="student/videos/submit" element={<VideoSubmission />} />
              
              {/* Admin Routes */}
              <Route path="admin/quizzes" element={<QuizManagement />} />
              <Route path="admin/quizzes/create" element={<CreateQuiz />} />
              <Route path="admin/students" element={<Students />} />
              <Route path="admin/videos" element={<Videos />} />
              
              {/* Legacy Routes */}
              <Route path="videos/submit" element={<VideoSubmission />} />
              <Route path="students" element={<Students />} />
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
