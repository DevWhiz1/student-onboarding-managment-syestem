import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';
import { Card, Button, Badge } from '../../components/ui';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock, 
  Trophy, 
  BarChart3,
  Search,
  Filter,
  Calendar,
  Award,
  Target
} from 'lucide-react';
import toast from 'react-hot-toast';

const MyQuizzes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    bestScore: 0
  });

  useEffect(() => {
    fetchQuizzes();
    fetchStats();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/student/quizzes');
      setQuizzes(response.data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/student/quiz-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStartQuiz = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  const handleViewResults = (quizId) => {
    navigate(`/quiz/${quizId}/results`);
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || quiz.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (quiz) => {
    if (quiz.completed) {
      return <Badge variant="success">Completed</Badge>;
    } else if (quiz.in_progress) {
      return <Badge variant="warning">In Progress</Badge>;
    } else if (quiz.available) {
      return <Badge variant="info">Available</Badge>;
    } else {
      return <Badge variant="default">Not Available</Badge>;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Quizzes</h1>
          <p className="text-gray-600">Track your progress and take available quizzes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Quizzes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedQuizzes}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Trophy className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Best Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.bestScore}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Quizzes</option>
              <option value="available">Available</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Quizzes List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredQuizzes.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No quizzes are available at the moment.'
                }
              </p>
            </Card>
          </div>
        ) : (
          filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
                    {getStatusBadge(quiz)}
                  </div>
                  <p className="text-gray-600 mb-4">{quiz.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {quiz.time_limit} minutes
                </div>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  {quiz.questions_count} questions
                </div>
                {quiz.due_date && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Due: {new Date(quiz.due_date).toLocaleDateString()}
                  </div>
                )}
              </div>

              {quiz.completed && quiz.score !== undefined && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Your Score</span>
                    <span className={`text-sm font-bold ${getScoreColor(quiz.score)}`}>
                      {quiz.score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        quiz.score >= 80 ? 'bg-green-500' :
                        quiz.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${quiz.score}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {quiz.completed && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Award className="h-4 w-4 mr-1" />
                      Completed on {new Date(quiz.completed_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {quiz.completed ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResults(quiz.id)}
                      icon={BarChart3}
                    >
                      View Results
                    </Button>
                  ) : quiz.available ? (
                    <Button
                      size="sm"
                      onClick={() => handleStartQuiz(quiz.id)}
                      icon={Play}
                    >
                      {quiz.in_progress ? 'Continue' : 'Start Quiz'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                    >
                      Not Available
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Performance Summary */}
      {stats.completedQuizzes > 0 && (
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Performance Summary
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {Math.round((stats.completedQuizzes / stats.totalQuizzes) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${getScoreColor(stats.averageScore)}`}>
                  {stats.averageScore}%
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {stats.bestScore}%
                </div>
                <div className="text-sm text-gray-600">Best Score</div>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
};

export default MyQuizzes;
