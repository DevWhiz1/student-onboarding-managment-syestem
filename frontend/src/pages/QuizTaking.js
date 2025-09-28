import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import { 
  Clock, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  Flag,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

const QuizTaking = () => {
  const { quizId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    fetchQuiz();
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [quizId]);

  useEffect(() => {
    if (quiz && quiz.time_limit) {
      setTimeLeft(quiz.time_limit * 60); // Convert minutes to seconds
      
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setTimer(interval);
      return () => clearInterval(interval);
    }
  }, [quiz]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/quizzes/${quizId}`);
      setQuiz(response.data);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Failed to load quiz');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await api.post(`/api/quizzes/${quizId}/submit`, {
        answers: answers,
        time_taken: (quiz.time_limit * 60) - timeLeft
      });
      
      toast.success('Quiz submitted successfully!');
      navigate(`/quiz/${quizId}/results`, { 
        state: { result: response.data } 
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const isQuestionAnswered = (questionId) => {
    return answers[questionId] !== undefined;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz Not Found</h2>
        <p className="text-gray-600">The quiz you're looking for doesn't exist.</p>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <BookOpen className="h-4 w-4 mr-1" />
              {getAnsweredCount()}/{quiz.questions.length} answered
            </div>
            
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              timeLeft < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
            }`}>
              <Clock className="h-4 w-4 mr-1" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
        <p className="text-gray-600 mb-4">{quiz.description}</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </p>
      </div>

      {/* Question Navigation */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {quiz.questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                index === currentQuestionIndex
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : isQuestionAnswered(question.id)
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {isQuestionAnswered(question.id) ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                index + 1
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {currentQuestion.question_text || currentQuestion.question}
          </h2>
          
          {currentQuestion.question_type === 'multiple_choice' && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <label
                  key={option.id || index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    answers[currentQuestion.id] === option.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.id}
                    checked={answers[currentQuestion.id] === option.id}
                    onChange={() => handleAnswerSelect(currentQuestion.id, option.id)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    answers[currentQuestion.id] === option.id
                      ? 'border-primary-600 bg-primary-600'
                      : 'border-gray-300'
                  }`}>
                    {answers[currentQuestion.id] === option.id && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="text-gray-900">{option.text}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </button>

        <div className="flex items-center space-x-3">
          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          )}
        </div>
      </div>

      {/* Time Warning */}
      {timeLeft < 300 && timeLeft > 0 && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Time Warning!</span>
          </div>
          <p className="text-sm mt-1">
            {formatTime(timeLeft)} remaining
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizTaking;

