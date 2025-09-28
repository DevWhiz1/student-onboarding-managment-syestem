import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import { 
  Users, 
  BookOpen, 
  Video, 
  BarChart3, 
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalQuizzes: 0,
    totalVideos: 0,
    averageScore: 0
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch admin statistics
      const statsResponse = await api.get('/api/admin/stats');
      setStats(statsResponse.data);
      
      // Fetch recent students
      const studentsResponse = await api.get('/api/students?limit=5');
      setRecentStudents(studentsResponse.data);
      
      // Fetch recent quizzes
      const quizzesResponse = await api.get('/api/quizzes?limit=5');
      setRecentQuizzes(quizzesResponse.data);
      
      // Fetch recent videos
      const videosResponse = await api.get('/api/videos?limit=5');
      setRecentVideos(videosResponse.data);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    
    try {
      await api.delete(`/api/quizzes/${quizId}`);
      toast.success('Quiz deleted successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    }
  };

  const handleSendNotification = async (studentId) => {
    try {
      await api.post('/api/notifications/', {
        student_id: studentId,
        title: 'Reminder',
        message: 'Please complete your pending assignments.',
        type: 'reminder'
      });
      toast.success('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome, {user?.name}!
        </h1>
        <p className="text-primary-100">
          Manage your students, quizzes, and video submissions from your admin dashboard.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Quizzes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Video className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Video Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVideos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/admin/students'}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-8 w-8 text-primary-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Manage Students</p>
              <p className="text-sm text-gray-600">View and manage student accounts</p>
            </div>
          </button>
          
          <button
            onClick={() => window.location.href = '/admin/quizzes/create'}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-8 w-8 text-primary-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Create Quiz</p>
              <p className="text-sm text-gray-600">Generate new quiz with AI</p>
            </div>
          </button>
          
          <button
            onClick={() => window.location.href = '/admin/videos'}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Video className="h-8 w-8 text-primary-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Review Videos</p>
              <p className="text-sm text-gray-600">View video submissions and analysis</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Recent Students
            </h2>
          </div>
          <div className="p-6">
            {recentStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No students registered yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSendNotification(student.id)}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        title="Send notification"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => window.location.href = `/admin/students/${student.id}`}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Quizzes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Recent Quizzes
            </h2>
          </div>
          <div className="p-6">
            {recentQuizzes.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No quizzes created yet</p>
                <button
                  onClick={() => window.location.href = '/admin/quizzes/create'}
                  className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Create First Quiz
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {quiz.time_limit} minutes • {quiz.questions.length} questions
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.location.href = `/admin/quizzes/${quiz.id}`}
                          className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                          title="View quiz"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => window.location.href = `/admin/quizzes/${quiz.id}/edit`}
                          className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                          title="Edit quiz"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete quiz"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Video Submissions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Video className="h-5 w-5 mr-2" />
            Recent Video Submissions
          </h2>
        </div>
        <div className="p-6">
          {recentVideos.length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No video submissions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentVideos.map((video) => (
                <div key={video.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{video.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <span>By: {video.student_name}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(video.submitted_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        video.status === 'analyzed' ? 'bg-green-100 text-green-800' :
                        video.status === 'analyzing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {video.status}
                      </span>
                      <button
                        onClick={() => window.location.href = `/admin/videos/${video.id}`}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        title="View analysis"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

