import React from 'react';
import { BookOpen, Plus, Play, BarChart3 } from 'lucide-react';

const Quizzes = () => {
  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Quizzes</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage quizzes with AI-generated questions
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Quiz
          </button>
        </div>
      </div>

      {/* Quiz Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Quizzes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">12</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Play className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">8</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average Score
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">85%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quizzes List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Available Quizzes
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Take quizzes and track your progress
          </p>
        </div>
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <p className="text-gray-500 text-center py-8">
              Quiz functionality will be implemented here.
              This will include:
              <br />
              • AI-generated quiz creation (for admins)
              <br />
              • Quiz taking interface (for students)
              <br />
              • Automatic grading and feedback
              <br />
              • Progress tracking and analytics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quizzes;
