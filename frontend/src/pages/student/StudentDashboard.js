import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock, 
  Trophy, 
  Video, 
  FileText,
  BarChart3,
  Calendar,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    totalVideos: 0
  });
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch student statistics
      const statsResponse = await api.get('/api/students/me/stats');
      setStats(statsResponse.data);
      
      // Fetch recent quizzes
      const quizzesResponse = await api.get('/api/quizzes/student/recent');
      setRecentQuizzes(quizzesResponse.data);
      
      // Fetch recent videos
      const videosResponse = await api.get('/api/videos/student/recent');
      setRecentVideos(videosResponse.data);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
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
          Welcome back, {user?.name}!
        </h1>
        <p className="text-primary-100">
          Ready to continue your learning journey? Check out your progress and new assignments below.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Quizzes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedQuizzes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Trophy className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Video className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Videos Submitted</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVideos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quizzes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Quizzes
            </h2>
          </div>
          <div className="p-6">
            {recentQuizzes.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No quizzes available yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {quiz.time_limit} minutes
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {quiz.status === 'completed' ? (
                          <div className="flex items-center">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(quiz.score)} ${getScoreColor(quiz.score)}`}>
                              {quiz.score}%
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate(`/quiz/${quiz.id}`)}
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Quiz
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Videos */}
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
                <button
                  onClick={() => navigate('/student/videos/submit')}
                  className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Submit Video
                </button>
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
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(video.submitted_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          video.status === 'analyzed' ? 'bg-green-100 text-green-800' :
                          video.status === 'analyzing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {video.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            onClick={() => navigate('/student/quizzes')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BookOpen className="h-8 w-8 text-primary-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Take Quiz</p>
              <p className="text-sm text-gray-600">Start a new quiz</p>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/student/videos/submit')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Video className="h-8 w-8 text-primary-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Submit Video</p>
              <p className="text-sm text-gray-600">Upload video assignment</p>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/student/quizzes')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Award className="h-8 w-8 text-primary-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">View Results</p>
              <p className="text-sm text-gray-600">Check your scores</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;



