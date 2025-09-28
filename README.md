# Student Management System with AI Agents

A comprehensive student management system built with **FastAPI**, **CrewAI**, **LangChain**, and **React**. The system features automated workflows with AI agents for quiz generation, grading, video analysis, and email notifications.

## 🚀 Features

### Multi-Agent AI Workflow
- **Quiz Generator Agent**: Creates MCQ-based quizzes using LLMs (OpenAI GPT/Gemini)
- **Quiz Grader Agent**: Automatically grades student responses with detailed feedback
- **Video Analysis Agent**: Transcribes and analyzes video submissions with AI
- **Email Notification Agent**: Sends automated notifications for various events

### Admin Dashboard
- Student management (CRUD operations)
- AI-powered quiz creation
- Video submission review and analysis
- Automated email notifications
- Analytics and reporting

### Student Portal
- Take AI-generated quizzes
- Submit videos for analysis
- View results and feedback
- Track learning progress

## 🏗️ Architecture

### Backend (FastAPI)
```
backend/
├── app/
│   ├── agents/           # CrewAI agents
│   │   ├── quiz_generator.py
│   │   ├── quiz_grader.py
│   │   ├── video_analyzer.py
│   │   └── email_notifier.py
│   ├── core/            # Configuration and Firebase setup
│   ├── models/          # Pydantic schemas
│   └── routers/         # API endpoints
├── main.py              # FastAPI application
└── requirements.txt     # Python dependencies
```

### Frontend (React)
```
frontend/
├── src/
│   ├── components/      # Reusable components
│   ├── contexts/        # React contexts (Auth)
│   ├── pages/          # Page components
│   ├── config/         # API and Firebase config
│   └── App.js          # Main application
├── package.json        # Node dependencies
└── tailwind.config.js  # TailwindCSS configuration
```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **CrewAI**: Multi-agent AI framework
- **LangChain**: LLM integration and orchestration
- **Firebase**: Database and authentication
- **SendGrid**: Email service
- **OpenAI/Gemini**: Large Language Models

### Frontend
- **React 19**: Modern React with hooks
- **TailwindCSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **React Hook Form**: Form management
- **Axios**: HTTP client
- **Firebase SDK**: Frontend Firebase integration

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- Firebase project
- OpenAI API key
- Google Gemini API key (optional)
- SendGrid API key

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd crew-ai
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp env.example .env
# Edit .env with your API keys and Firebase configuration

# Run the backend
python main.py
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your Firebase configuration

# Start development server
npm start
```

### 4. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Authentication
4. Download service account key
5. Update environment variables

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# API Keys
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
SENDGRID_API_KEY=your_sendgrid_api_key

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id

# Email Configuration
FROM_EMAIL=your_from_email@example.com

# JWT Configuration
JWT_SECRET_KEY=your_jwt_secret_key
```

#### Frontend (.env)
```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# API Configuration
REACT_APP_API_URL=http://localhost:8000
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

#### Students
- `GET /api/students` - Get all students (Admin)
- `POST /api/students` - Create student (Admin)
- `GET /api/students/{id}` - Get student details
- `PUT /api/students/{id}` - Update student (Admin)

#### Quizzes
- `GET /api/quizzes` - Get all quizzes
- `POST /api/quizzes` - Create quiz with AI (Admin)
- `POST /api/quizzes/{id}/submit` - Submit quiz response
- `GET /api/quizzes/{id}/results` - Get quiz results (Admin)

#### Videos
- `GET /api/videos` - Get video submissions
- `POST /api/videos` - Submit video for analysis
- `GET /api/videos/{id}/analysis` - Get video analysis

#### Notifications
- `POST /api/notifications/send` - Send notification (Admin)
- `POST /api/notifications/broadcast` - Broadcast to all students (Admin)

## 🤖 AI Agents Workflow

### 1. Quiz Generation
```
Admin creates quiz → Quiz Generator Agent → AI generates questions → Store in Firebase → Notify students
```

### 2. Quiz Grading
```
Student submits quiz → Quiz Grader Agent → AI grades responses → Store results → Send feedback email
```

### 3. Video Analysis
```
Student submits video → Video Analysis Agent → AI transcribes & analyzes → Generate feedback → Send email
```

### 4. Email Notifications
```
Event triggered → Email Notification Agent → AI generates content → Send via SendGrid → Log notification
```

## 🎨 Frontend Features

### Admin Dashboard
- Student management interface
- Quiz creation with AI
- Video review and analysis
- Notification management
- Analytics and reporting

### Student Portal
- Quiz taking interface
- Video submission
- Progress tracking
- Results and feedback viewing

## 🚀 Deployment

### Backend Deployment
```bash
# Using Docker
docker build -t student-management-backend .
docker run -p 8000:8000 student-management-backend

# Using cloud platforms
# Deploy to Heroku, Railway, or similar platforms
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel, Netlify, or Firebase Hosting
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📝 Usage Examples

### Creating a Quiz (Admin)
```python
# The system automatically generates questions using AI
quiz_data = {
    "title": "Mathematics Basics",
    "subject": "Mathematics",
    "description": "Basic math concepts quiz",
    "total_questions": 10,
    "duration_minutes": 30
}
```

### Submitting a Video
```python
# Students can submit videos for AI analysis
video_data = {
    "video_url": "https://example.com/video.mp4",
    "title": "Science Project Presentation",
    "description": "My science project explanation"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API documentation at `/docs`

## 🔮 Future Enhancements

- [ ] Real-time notifications with WebSockets
- [ ] Advanced analytics dashboard
- [ ] Mobile app with React Native
- [ ] Integration with LMS platforms
- [ ] Advanced AI features (speech recognition, image analysis)
- [ ] Multi-language support
- [ ] Advanced reporting and insights

## Made with Love ❤️ by Ahmad Bajwa
