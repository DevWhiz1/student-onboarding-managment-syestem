import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';
import { Card, Button, Badge } from '../../components/ui';
import { 
  Video, 
  Plus, 
  Play, 
  Eye, 
  Clock, 
  Calendar,
  BarChart3,
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';

const MyVideos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalVideos: 0,
    analyzedVideos: 0,
    pendingVideos: 0,
    averageScore: 0
  });

  useEffect(() => {
    fetchVideos();
    fetchStats();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/student/videos');
      setVideos(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/student/video-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video submission?')) {
      return;
    }

    try {
      await api.delete(`/api/videos/${videoId}`);
      toast.success('Video deleted successfully');
      fetchVideos();
      fetchStats();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    }
  };

  const handleViewAnalysis = (videoId) => {
    navigate(`/student/videos/${videoId}/analysis`);
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || video.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      analyzing: 'info',
      analyzed: 'success',
      failed: 'danger'
    };
    const labels = {
      pending: 'Pending',
      analyzing: 'Analyzing',
      analyzed: 'Completed',
      failed: 'Failed'
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'analyzing':
        return <Loader className="h-4 w-4 animate-spin" />;
      case 'analyzed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Video className="h-4 w-4" />;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Videos</h1>
          <p className="text-gray-600">Track your video submissions and analysis results</p>
        </div>
        <Button
          onClick={() => navigate('/student/videos/submit')}
          icon={Plus}
        >
          Submit Video
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Video className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Videos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVideos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Analyzed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.analyzedVideos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingVideos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
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
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="analyzing">Analyzing</option>
              <option value="analyzed">Analyzed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Videos List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredVideos.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12 text-center">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by submitting your first video.'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Button onClick={() => navigate('/student/videos/submit')} icon={Plus}>
                  Submit First Video
                </Button>
              )}
            </Card>
          </div>
        ) : (
          filteredVideos.map((video) => (
            <Card key={video.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{video.title}</h3>
                    {getStatusBadge(video.status)}
                  </div>
                  <p className="text-gray-600 mb-4">{video.description}</p>
                </div>
              </div>

              {/* Video Preview */}
              {video.thumbnail_url && (
                <div className="mb-4">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(video.submitted_at).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  {getStatusIcon(video.status)}
                  <span className="ml-1">{video.status}</span>
                </div>
                {video.analysis_score && (
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Score: {video.analysis_score}%
                  </div>
                )}
              </div>

              {/* Progress Bar for Analyzing Status */}
              {video.status === 'analyzing' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Analysis Progress</span>
                    <span className="text-sm text-gray-500">{video.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${video.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Analysis Results Preview */}
              {video.status === 'analyzed' && video.analysis_summary && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-2">Analysis Summary</h4>
                  <p className="text-sm text-green-800">{video.analysis_summary}</p>
                </div>
              )}

              {/* Error Message */}
              {video.status === 'failed' && video.error_message && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-red-900 mb-2">Analysis Failed</h4>
                  <p className="text-sm text-red-800">{video.error_message}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(video.video_url, '_blank')}
                    icon={Play}
                  >
                    Watch
                  </Button>
                  {video.status === 'analyzed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAnalysis(video.id)}
                      icon={Eye}
                    >
                      View Analysis
                    </Button>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {video.status === 'analyzed' && video.report_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(video.report_url, '_blank')}
                      icon={Download}
                    >
                      Report
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteVideo(video.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Quick Actions
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/student/videos/submit')}
              className="flex items-center justify-center p-4 h-auto"
            >
              <div className="text-center">
                <Plus className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                <p className="font-medium">Submit New Video</p>
                <p className="text-sm text-gray-600">Upload your latest assignment</p>
              </div>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/student/videos/guidelines')}
              className="flex items-center justify-center p-4 h-auto"
            >
              <div className="text-center">
                <Eye className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                <p className="font-medium">Submission Guidelines</p>
                <p className="text-sm text-gray-600">Learn best practices</p>
              </div>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/student/videos/help')}
              className="flex items-center justify-center p-4 h-auto"
            >
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                <p className="font-medium">Need Help?</p>
                <p className="text-sm text-gray-600">Get support and FAQs</p>
              </div>
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default MyVideos;
