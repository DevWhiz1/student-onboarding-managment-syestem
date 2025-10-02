import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';
import { Card, Button, Input } from '../../components/ui';
import { 
  Video, 
  Upload, 
  Link, 
  FileText, 
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  ArrowLeft,
  HelpCircle,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const VideoSubmission = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [recentSubmissions, setRecentSubmissions] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm();

  const videoUrl = watch('video_url');

  useEffect(() => {
    fetchRecentSubmissions();
  }, []);

  const fetchRecentSubmissions = async () => {
    try {
      const response = await api.get('/api/student/videos/recent?limit=3');
      setRecentSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching recent submissions:', error);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      const response = await api.post('/api/videos/', {
        video_url: data.video_url,
        title: data.title,
        description: data.description
      });
      
      toast.success('Video submitted successfully! Analysis will begin shortly.');
      reset();
      setPreviewUrl('');
      fetchRecentSubmissions();
      // Optionally navigate to the videos page
      // navigate('/student/videos');
    } catch (error) {
      console.error('Error submitting video:', error);
      const message = error.response?.data?.detail || 'Failed to submit video';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUrlChange = (url) => {
    setPreviewUrl(url);
  };

  const getVideoId = (url) => {
    const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const vimeoRegex = /vimeo\.com\/(\d+)/;
    
    const youtubeMatch = url.match(youtubeRegex);
    const vimeoMatch = url.match(vimeoRegex);
    
    if (youtubeMatch) {
      return { platform: 'youtube', id: youtubeMatch[1] };
    } else if (vimeoMatch) {
      return { platform: 'vimeo', id: vimeoMatch[1] };
    }
    
    return null;
  };

  const renderVideoPreview = () => {
    if (!previewUrl) return null;
    
    const videoInfo = getVideoId(previewUrl);
    
    if (!videoInfo) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">Please enter a valid YouTube or Vimeo URL</span>
          </div>
        </div>
      );
    }
    
    const embedUrl = videoInfo.platform === 'youtube' 
      ? `https://www.youtube.com/embed/${videoInfo.id}`
      : `https://player.vimeo.com/video/${videoInfo.id}`;
    
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Video Preview</h3>
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={embedUrl}
            title="Video Preview"
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/student/videos')}
          icon={ArrowLeft}
        >
          Back to My Videos
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/student/videos/guidelines')}
          icon={HelpCircle}
        >
          Guidelines
        </Button>
      </div>

      <Card className="p-8">
        <Card.Header>
          <div className="flex items-center mb-4">
            <div className="p-3 bg-primary-100 rounded-lg mr-4">
              <Video className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Submit Video Assignment</h1>
              <p className="text-gray-600 mt-2">Upload your video assignment for AI analysis and personalized feedback</p>
            </div>
          </div>
        </Card.Header>

        <Card.Content>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Video URL */}
          <div>
            <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-2">
              Video URL *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Link className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('video_url', {
                  required: 'Video URL is required',
                  pattern: {
                    value: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/.+/,
                    message: 'Please enter a valid YouTube or Vimeo URL'
                  }
                })}
                type="url"
                placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                onChange={(e) => handleUrlChange(e.target.value)}
              />
            </div>
            {errors.video_url && (
              <p className="mt-1 text-sm text-red-600">{errors.video_url.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Supported platforms: YouTube, Vimeo
            </p>
          </div>

          {/* Video Preview */}
          {renderVideoPreview()}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Title *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('title', {
                  required: 'Title is required',
                  minLength: {
                    value: 3,
                    message: 'Title must be at least 3 characters'
                  }
                })}
                type="text"
                placeholder="Enter assignment title"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Describe your video content, what you learned, or any specific points you want to highlight..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Submission Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Submission Guidelines</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Video should be publicly accessible (not private)
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                AI will analyze content, speech, and provide feedback
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Analysis typically takes 2-5 minutes
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                You'll receive email notification when complete
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Submitting as: <span className="font-medium text-gray-900">{user?.name}</span>
            </div>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              icon={Send}
              size="lg"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Video'}
            </Button>
          </div>
        </form>
        </Card.Content>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Submissions
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {recentSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent submissions</p>
              <p className="text-sm text-gray-400 mt-1">Your video submissions will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSubmissions.map((video) => (
                <div key={video.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <Video className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{video.title}</h3>
                      <p className="text-sm text-gray-600">{video.description}</p>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <span>{new Date(video.submitted_at).toLocaleDateString()}</span>
                        <span className="mx-2">•</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          video.status === 'analyzed' ? 'bg-green-100 text-green-800' :
                          video.status === 'analyzing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {video.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(video.video_url, '_blank')}
                      icon={Play}
                    >
                      Watch
                    </Button>
                    {video.status === 'analyzed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/student/videos/${video.id}/analysis`)}
                        icon={Eye}
                      >
                        Analysis
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Tips and Guidelines */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <HelpCircle className="h-5 w-5 mr-2" />
            Tips for Better Analysis
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Video Quality</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use good lighting and clear audio</li>
                <li>• Ensure stable camera positioning</li>
                <li>• Speak clearly and at moderate pace</li>
                <li>• Keep video length between 2-10 minutes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Content Guidelines</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Stay focused on the assignment topic</li>
                <li>• Include key points and examples</li>
                <li>• Demonstrate understanding clearly</li>
                <li>• End with a brief summary</li>
              </ul>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default VideoSubmission;



