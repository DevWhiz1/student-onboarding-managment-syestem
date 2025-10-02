import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';
import { Card, Button, Badge } from '../../components/ui';
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Clock, 
  BarChart3, 
  ArrowLeft,
  Download,
  Share2,
  Target,
  Award,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const QuizResults = () => {
  const { quizId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!result);
  const [quiz, setQuiz] = useState(null);

  useEffect(() => {
    if (!result) {
      fetchResult();
    } else {
      fetchQuizDetails();
    }
  }, [quizId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/quizzes/${quizId}/result`);
      setResult(response.data);
      fetchQuizDetails();
    } catch (error) {
      console.error('Error fetching result:', error);
      toast.error('Failed to load quiz results');
      navigate('/student/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizDetails = async () => {
    try {
      const response = await api.get(`/api/quizzes/${quizId}`);
      setQuiz(response.data);
    } catch (error) {
      console.error('Error fetching quiz details:', error);
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      const response = await api.get(`/api/quizzes/${quizId}/certificate`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${quiz?.title || 'Quiz'}_Certificate.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Certificate downloaded successfully');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to download certificate');
    }
  };

  const handleShareResult = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Quiz Results: ${quiz?.title}`,
          text: `I scored ${result.score}% on "${quiz?.title}" quiz!`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Result link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing result:', error);
      toast.error('Failed to share result');
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

  const getGrade = (score) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const getPerformanceMessage = (score) => {
    if (score >= 90) return 'Outstanding performance! 🎉';
    if (score >= 80) return 'Excellent work! 👏';
    if (score >= 70) return 'Good job! 👍';
    if (score >= 60) return 'Well done! Keep improving! 📈';
    if (score >= 50) return 'You passed! Consider reviewing the material. 📚';
    return 'Keep studying and try again! 💪';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Results Not Found</h2>
        <p className="text-gray-600">Unable to load quiz results.</p>
        <Button
          onClick={() => navigate('/student/quizzes')}
          className="mt-4"
          icon={ArrowLeft}
        >
          Back to Quizzes
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/student/quizzes')}
          icon={ArrowLeft}
        >
          Back to Quizzes
        </Button>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleShareResult}
            icon={Share2}
          >
            Share
          </Button>
          {result.score >= 70 && (
            <Button
              variant="outline"
              onClick={handleDownloadCertificate}
              icon={Download}
            >
              Certificate
            </Button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <Card className="p-8 text-center">
        <div className="mb-6">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${getScoreBgColor(result.score)}`}>
            <Trophy className={`h-10 w-10 ${getScoreColor(result.score)}`} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h1>
          <h2 className="text-xl text-gray-600 mb-4">{quiz?.title}</h2>
          <p className="text-lg text-gray-700">{getPerformanceMessage(result.score)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(result.score)}`}>
              {result.score}%
            </div>
            <div className="text-sm text-gray-600">Your Score</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {getGrade(result.score)}
            </div>
            <div className="text-sm text-gray-600">Grade</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {result.correct_answers}/{result.total_questions}
            </div>
            <div className="text-sm text-gray-600">Correct Answers</div>
          </div>
        </div>
      </Card>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Time Taken</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(result.time_taken / 60)}:{(result.time_taken % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Correct</p>
              <p className="text-2xl font-bold text-gray-900">{result.correct_answers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Incorrect</p>
              <p className="text-2xl font-bold text-gray-900">{result.incorrect_answers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((result.correct_answers / result.total_questions) * 100)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Analysis */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Performance Analysis
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-6">
            {/* Score Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Score Breakdown</span>
                <span className={`text-sm font-bold ${getScoreColor(result.score)}`}>
                  {result.score}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    result.score >= 80 ? 'bg-green-500' :
                    result.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${result.score}%` }}
                ></div>
              </div>
            </div>

            {/* Category Performance */}
            {result.category_scores && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Performance by Category</h4>
                <div className="space-y-3">
                  {Object.entries(result.category_scores).map(([category, score]) => (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">{category}</span>
                        <span className={`text-sm font-medium ${getScoreColor(score)}`}>
                          {score}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            score >= 80 ? 'bg-green-500' :
                            score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recommendations</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="text-sm text-blue-800 space-y-2">
                  {result.score >= 90 && (
                    <li className="flex items-center">
                      <Award className="h-4 w-4 mr-2" />
                      Excellent performance! You've mastered this topic.
                    </li>
                  )}
                  {result.score >= 70 && result.score < 90 && (
                    <li className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Great job! Review the questions you missed to achieve mastery.
                    </li>
                  )}
                  {result.score >= 50 && result.score < 70 && (
                    <li className="flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      Good effort! Focus on reviewing the material and practice more.
                    </li>
                  )}
                  {result.score < 50 && (
                    <li className="flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      Consider reviewing the study materials and retaking the quiz.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Question Review */}
      {result.question_results && (
        <Card>
          <Card.Header>
            <Card.Title>Question Review</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-6">
              {result.question_results.map((questionResult, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      Question {index + 1}
                    </h4>
                    {questionResult.correct ? (
                      <Badge variant="success">Correct</Badge>
                    ) : (
                      <Badge variant="danger">Incorrect</Badge>
                    )}
                  </div>
                  <p className="text-gray-700 mb-3">{questionResult.question}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">Your answer:</span>
                      <span className={questionResult.correct ? 'text-green-600' : 'text-red-600'}>
                        {questionResult.user_answer}
                      </span>
                    </div>
                    {!questionResult.correct && (
                      <div className="flex items-center">
                        <span className="text-gray-600 mr-2">Correct answer:</span>
                        <span className="text-green-600">{questionResult.correct_answer}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={() => navigate('/student/quizzes')}
          variant="outline"
        >
          View All Quizzes
        </Button>
        {result.score < 70 && (
          <Button
            onClick={() => navigate(`/quiz/${quizId}`)}
            icon={Trophy}
          >
            Retake Quiz
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizResults;
