import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  Video, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalQuizzes: 0,
    totalVideos: 0,
    averageScore: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Route users based on their role
    if (user?.role === 'admin') {
      navigate('/admin-dashboard', { replace: true });
    } else if (user?.role === 'student') {
      navigate('/student-dashboard', { replace: true });
    } else {
      fetchDashboardData();
    }
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      if (isAdmin()) {
        // Fetch admin dashboard data
        const [studentsRes, quizzesRes, videosRes] = await Promise.all([
          api.get('/api/students'),
          api.get('/api/quizzes'),
          api.get('/api/videos')
        ]);

        setStats({
          totalStudents: studentsRes.data.length,
          totalQuizzes: quizzesRes.data.length,
          totalVideos: videosRes.data.length,
          averageScore: 85.5, // This would come from quiz results API
          recentActivity: [
            { type: 'quiz', message: 'New quiz "Mathematics Basics" created', time: '2 hours ago' },
            { type: 'student', message: 'John Doe submitted a video', time: '4 hours ago' },
            { type: 'quiz', message: 'Quiz "Science Quiz" completed by 15 students', time: '6 hours ago' },
          ]
        });
      } else {
        // Fetch student dashboard data
        const [quizzesRes, videosRes] = await Promise.all([
          api.get('/api/quizzes'),
          api.get('/api/videos')
        ]);

        setStats({
          totalStudents: 0,
          totalQuizzes: quizzesRes.data.length,
          totalVideos: videosRes.data.length,
          averageScore: 78.5, // This would come from student's quiz results
          recentActivity: [
            { type: 'quiz', message: 'You completed "Mathematics Basics" with 85%', time: '2 hours ago' },
            { type: 'video', message: 'Your video submission was analyzed', time: '4 hours ago' },
            { type: 'quiz', message: 'New quiz "Science Quiz" is available', time: '6 hours ago' },
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: isAdmin() ? 'Total Students' : 'Available Quizzes',
      value: isAdmin() ? stats.totalStudents : stats.totalQuizzes,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: isAdmin() ? 'Total Quizzes' : 'My Videos',
      value: isAdmin() ? stats.totalQuizzes : stats.totalVideos,
      icon: BookOpen,
      color: 'bg-green-500',
    },
    {
      name: isAdmin() ? 'Video Submissions' : 'Average Score',
      value: isAdmin() ? stats.totalVideos : `${stats.averageScore}%`,
      icon: isAdmin() ? Video : TrendingUp,
      color: isAdmin() ? 'bg-purple-500' : 'bg-yellow-500',
    },
    {
      name: isAdmin() ? 'Average Score' : 'Completed Quizzes',
      value: isAdmin() ? `${stats.averageScore}%` : '12',
      icon: isAdmin() ? TrendingUp : CheckCircle,
      color: isAdmin() ? 'bg-yellow-500' : 'bg-indigo-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isAdmin() 
            ? 'Here\'s what\'s happening with your students today.' 
            : 'Here\'s your learning progress and recent activity.'
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
          >
            <dt>
              <div className={`absolute rounded-md p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </dd>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {stats.recentActivity.map((activity, activityIdx) => (
                <li key={activityIdx}>
                  <div className="relative pb-8">
                    {activityIdx !== stats.recentActivity.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          activity.type === 'quiz' ? 'bg-green-500' :
                          activity.type === 'student' ? 'bg-blue-500' :
                          activity.type === 'video' ? 'bg-purple-500' : 'bg-gray-500'
                        }`}>
                          {activity.type === 'quiz' ? (
                            <BookOpen className="h-4 w-4 text-white" />
                          ) : activity.type === 'student' ? (
                            <Users className="h-4 w-4 text-white" />
                          ) : activity.type === 'video' ? (
                            <Video className="h-4 w-4 text-white" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-white" />
                          )}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">{activity.message}</p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {activity.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isAdmin() ? (
              <>
                <a
                  href="/quizzes"
                  className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <BookOpen className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Create New Quiz
                  </span>
                </a>
                <a
                  href="/students"
                  className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <Users className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Manage Students
                  </span>
                </a>
                <a
                  href="/videos"
                  className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <Video className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Review Videos
                  </span>
                </a>
              </>
            ) : (
              <>
                <a
                  href="/quizzes"
                  className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <BookOpen className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Take Quiz
                  </span>
                </a>
                <a
                  href="/videos"
                  className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <Video className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Submit Video
                  </span>
                </a>
                <a
                  href="/profile"
                  className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <CheckCircle className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    View Progress
                  </span>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
