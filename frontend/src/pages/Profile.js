import React from 'react';
import { User, Mail, Calendar, Award, BookOpen, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        <p className="mt-2 text-sm text-gray-700">
          Your account information and learning progress
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Information */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <div className="mx-auto h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-600">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {user?.name}
                </h3>
                <p className="text-sm text-gray-500 capitalize">
                  {user?.role}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Quick Stats
              </h4>
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 text-gray-400 mr-2" />
                    <dt className="text-sm font-medium text-gray-500">
                      Quizzes Taken
                    </dt>
                  </div>
                  <dd className="text-sm font-medium text-gray-900">12</dd>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Video className="h-5 w-5 text-gray-400 mr-2" />
                    <dt className="text-sm font-medium text-gray-500">
                      Videos Submitted
                    </dt>
                  </div>
                  <dd className="text-sm font-medium text-gray-900">5</dd>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Award className="h-5 w-5 text-gray-400 mr-2" />
                    <dt className="text-sm font-medium text-gray-500">
                      Average Score
                    </dt>
                  </div>
                  <dd className="text-sm font-medium text-gray-900">85%</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Profile Information
              </h4>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Full Name
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{user?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Address
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Member Since
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Award className="h-4 w-4 mr-2" />
                    Role
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{user?.role}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Recent Activity
              </h4>
              <div className="flow-root">
                <ul className="-mb-8">
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                            <BookOpen className="h-4 w-4 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Completed quiz "Mathematics Basics" with 85% score
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            2 hours ago
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
                            <Video className="h-4 w-4 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Submitted video "Science Project Presentation"
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            1 day ago
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="relative">
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                            <Award className="h-4 w-4 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Achieved 90% score on "History Quiz"
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            3 days ago
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
