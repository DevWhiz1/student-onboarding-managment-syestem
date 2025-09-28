import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import { 
  BookOpen, 
  Plus, 
  Clock, 
  FileText, 
  Send,
  Loader,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const CreateQuiz = () => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm();

  const onSubmit = async (data) => {
    setIsGenerating(true);
    
    try {
      const response = await api.post('/api/quizzes/generate', {
        topic: data.topic,
        difficulty: data.difficulty,
        num_questions: data.num_questions,
        time_limit: data.time_limit
      });
      
      setGeneratedQuiz(response.data);
      toast.success('Quiz generated successfully!');
    } catch (error) {
      console.error('Error generating quiz:', error);
      let message = 'Failed to generate quiz';
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Handle validation errors array
          message = error.response.data.detail.map(err => err.msg || err.message || err).join(', ');
        } else {
          message = error.response.data.detail;
        }
      }
      
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!generatedQuiz) return;
    
    setIsCreating(true);
    
    try {
      const response = await api.post('/api/quizzes/', {
        title: generatedQuiz.title,
        description: generatedQuiz.description,
        subject: generatedQuiz.topic,
        duration_minutes: generatedQuiz.time_limit,
        total_questions: generatedQuiz.questions.length
      });
      
      toast.success('Quiz created successfully!');
      reset();
      setGeneratedQuiz(null);
      // Redirect to quiz management
      window.location.href = '/admin/quizzes';
    } catch (error) {
      console.error('Error creating quiz:', error);
      let message = 'Failed to create quiz';
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Handle validation errors array
          message = error.response.data.detail.map(err => err.msg || err.message || err).join(', ');
        } else {
          message = error.response.data.detail;
        }
      }
      
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedQuiz(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-primary-100 rounded-lg mr-3">
              <BookOpen className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Quiz</h1>
              <p className="text-gray-600">Generate a quiz using AI based on your specifications</p>
            </div>
          </div>
        </div>

        {!generatedQuiz ? (
          /* Quiz Generation Form */
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Topic */}
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Topic *
              </label>
              <input
                {...register('topic', {
                  required: 'Topic is required',
                  minLength: {
                    value: 3,
                    message: 'Topic must be at least 3 characters'
                  }
                })}
                type="text"
                placeholder="e.g., Python Programming, World History, Mathematics"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.topic && (
                <p className="mt-1 text-sm text-red-600">{errors.topic.message}</p>
              )}
            </div>

            {/* Difficulty */}
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level *
              </label>
              <select
                {...register('difficulty', {
                  required: 'Difficulty is required'
                })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              {errors.difficulty && (
                <p className="mt-1 text-sm text-red-600">{errors.difficulty.message}</p>
              )}
            </div>

            {/* Number of Questions */}
            <div>
              <label htmlFor="num_questions" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Questions *
              </label>
              <select
                {...register('num_questions', {
                  required: 'Number of questions is required'
                })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select number of questions</option>
                <option value="5">5 Questions</option>
                <option value="10">10 Questions</option>
                <option value="15">15 Questions</option>
                <option value="20">20 Questions</option>
              </select>
              {errors.num_questions && (
                <p className="mt-1 text-sm text-red-600">{errors.num_questions.message}</p>
              )}
            </div>

            {/* Time Limit */}
            <div>
              <label htmlFor="time_limit" className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (minutes) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('time_limit', {
                    required: 'Time limit is required',
                    min: {
                      value: 5,
                      message: 'Time limit must be at least 5 minutes'
                    },
                    max: {
                      value: 120,
                      message: 'Time limit cannot exceed 120 minutes'
                    }
                  })}
                  type="number"
                  min="5"
                  max="120"
                  placeholder="30"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              {errors.time_limit && (
                <p className="mt-1 text-sm text-red-600">{errors.time_limit.message}</p>
              )}
            </div>

            {/* AI Generation Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">AI Quiz Generation</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  AI will generate relevant questions based on your topic
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Questions will match the selected difficulty level
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Multiple choice format with 4 options each
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Generation typically takes 30-60 seconds
                </li>
              </ul>
            </div>

            {/* Generate Button */}
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={isGenerating}
                className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {isGenerating ? 'Generating Quiz...' : 'Generate Quiz'}
              </button>
            </div>
          </form>
        ) : (
          /* Generated Quiz Preview */
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Generated Quiz Preview</h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRegenerate}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleCreateQuiz}
                  disabled={isCreating}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {isCreating ? 'Creating...' : 'Create Quiz'}
                </button>
              </div>
            </div>

            {/* Quiz Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">{generatedQuiz.title}</h3>
              <p className="text-gray-600 mb-3">{generatedQuiz.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  {generatedQuiz.questions.length} questions
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {generatedQuiz.time_limit} minutes
                </span>
                <span className="capitalize">
                  Difficulty: {generatedQuiz.difficulty}
                </span>
              </div>
            </div>

            {/* Questions Preview */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Questions Preview</h3>
              {generatedQuiz.questions.slice(0, 3).map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {index + 1}. {question.question_text || question.question}
                  </h4>
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div key={option.id || optionIndex} className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          option.id === question.correct_answer_id ? 'border-green-500 bg-green-100' : 'border-gray-300'
                        }`}>
                          {option.id === question.correct_answer_id && (
                            <div className="w-2 h-2 rounded-full bg-green-500 mx-auto mt-0.5"></div>
                          )}
                        </div>
                        <span className={`text-sm ${
                          option.id === question.correct_answer_id ? 'text-green-700 font-medium' : 'text-gray-700'
                        }`}>
                          {option.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {generatedQuiz.questions.length > 3 && (
                <div className="text-center py-4 text-gray-500">
                  <p>... and {generatedQuiz.questions.length - 3} more questions</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateQuiz;

