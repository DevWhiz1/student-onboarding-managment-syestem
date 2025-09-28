from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    STUDENT = "student"

class QuizStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    COMPLETED = "completed"

class VideoStatus(str, Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    ANALYZED = "analyzed"

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class User(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Student Models
class StudentBase(BaseModel):
    name: str
    email: EmailStr
    student_id: str
    class_name: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    class_name: Optional[str] = None

class Student(StudentBase):
    id: str
    created_at: datetime
    updated_at: datetime
    total_quizzes: int = 0
    average_score: float = 0.0
    
    class Config:
        from_attributes = True

# Quiz Models
class QuestionOption(BaseModel):
    id: str
    text: str
    is_correct: bool

class Question(BaseModel):
    id: str
    question_text: str
    options: List[QuestionOption]
    correct_answer_id: str
    points: int = 1

class QuizBase(BaseModel):
    title: str
    description: str
    subject: str
    duration_minutes: int = 30
    total_questions: int = 10

class QuizCreate(QuizBase):
    pass

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None

class Quiz(QuizBase):
    id: str
    questions: List[Question]
    status: QuizStatus
    created_by: str
    created_at: datetime
    updated_at: datetime
    total_points: int
    
    class Config:
        from_attributes = True

# Quiz Response Models
class QuizResponse(BaseModel):
    quiz_id: str
    student_id: str
    answers: Dict[str, str]  # question_id: selected_option_id
    submitted_at: Optional[datetime] = None

class QuizResult(BaseModel):
    id: str
    quiz_id: str
    student_id: str
    student_name: str
    answers: Dict[str, str]
    score: int
    total_points: int
    percentage: float
    submitted_at: datetime
    graded_at: datetime

# Video Models
class VideoSubmission(BaseModel):
    id: str
    student_id: str
    student_name: str
    video_url: str
    title: str
    description: Optional[str] = None
    status: VideoStatus
    transcription: Optional[str] = None
    analysis_summary: Optional[str] = None
    feedback: Optional[str] = None
    submitted_at: datetime
    analyzed_at: Optional[datetime] = None

# Email Models
class EmailNotification(BaseModel):
    to_email: EmailStr
    subject: str
    body: str
    notification_type: str  # quiz_created, quiz_result, video_feedback

# Authentication Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Agent Task Models
class QuizGenerationTask(BaseModel):
    subject: str
    topic: str
    difficulty: str = "medium"
    num_questions: int = 10

class VideoAnalysisTask(BaseModel):
    video_url: str
    student_id: str
    analysis_type: str = "content_summary"

# Response Models
class MessageResponse(BaseModel):
    message: str
    success: bool = True

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
