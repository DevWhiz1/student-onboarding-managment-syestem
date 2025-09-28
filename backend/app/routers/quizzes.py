from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from app.models.schemas import (
    QuizCreate, QuizUpdate, Quiz, QuizResponse, QuizResult, 
    QuizGenerationTask, UserRole
)
from app.agents.quiz_generator import QuizGeneratorAgent
from app.agents.quiz_grader import QuizGraderAgent
from app.agents.email_notifier import EmailNotifierAgent
from app.core.firebase import get_firestore_db
from app.routers.auth import verify_token
from datetime import datetime
from typing import List, Dict
from pydantic import BaseModel
import uuid

router = APIRouter()

class QuizGenerationRequest(BaseModel):
    topic: str
    difficulty: str
    num_questions: int
    time_limit: int

def get_current_user_role(current_user_email: str = Depends(verify_token)) -> str:
    """Get current user role"""
    db = get_firestore_db()
    users_ref = db.collection('users')
    query = users_ref.where('email', '==', current_user_email).limit(1)
    users = query.get()
    
    if not users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return users[0].to_dict()['role']

@router.post("/generate")
async def generate_quiz(
    generation_request: QuizGenerationRequest,
    current_user_email: str = Depends(verify_token)
):
    """Generate a quiz using AI (Admin only)"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can generate quizzes"
        )
    
    try:
        # Generate quiz using AI agent
        quiz_generator = QuizGeneratorAgent()
        generation_task = QuizGenerationTask(
            subject=generation_request.topic,  # Use topic as subject
            topic=generation_request.topic,
            difficulty=generation_request.difficulty,
            num_questions=generation_request.num_questions
        )
        
        generated_quiz = quiz_generator.generate_quiz(generation_task)
        
        return {
            "title": f"{generation_request.topic} Quiz",
            "description": f"A {generation_request.difficulty} level quiz on {generation_request.topic}",
            "questions": [question.dict() for question in generated_quiz],
            "time_limit": generation_request.time_limit,
            "difficulty": generation_request.difficulty,
            "topic": generation_request.topic
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate quiz: {str(e)}"
        )

@router.post("/", response_model=Quiz)
async def create_quiz(
    quiz_data: QuizCreate,
    background_tasks: BackgroundTasks,
    current_user_email: str = Depends(verify_token)
):
    """Create a new quiz with AI-generated questions (Admin only)"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create quizzes"
        )
    
    db = get_firestore_db()
    
    # Generate quiz using AI agent
    quiz_generator = QuizGeneratorAgent()
    generation_task = QuizGenerationTask(
        subject=quiz_data.subject,
        topic=quiz_data.title,
        num_questions=quiz_data.total_questions
    )
    
    try:
        questions = quiz_generator.generate_quiz(generation_task)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate quiz: {str(e)}"
        )
    
    # Create quiz document
    quiz_id = str(uuid.uuid4())
    total_points = sum(question.points for question in questions)
    
    quiz_doc = {
        'id': quiz_id,
        'title': quiz_data.title,
        'description': quiz_data.description,
        'subject': quiz_data.subject,
        'duration_minutes': quiz_data.duration_minutes,
        'total_questions': len(questions),
        'questions': [question.dict() for question in questions],
        'status': 'published',
        'created_by': current_user_email,
        'created_at': datetime.now(),
        'updated_at': datetime.now(),
        'total_points': total_points
    }
    
    db.collection('quizzes').document(quiz_id).set(quiz_doc)
    
    # Send notifications to all students in background
    background_tasks.add_task(send_quiz_notifications, quiz_id, quiz_data.title, quiz_data.subject)
    
    return Quiz(**quiz_doc)

@router.get("/", response_model=List[Quiz])
async def get_quizzes(
    skip: int = 0,
    limit: int = 100,
    current_user_email: str = Depends(verify_token)
):
    """Get all quizzes"""
    db = get_firestore_db()
    quizzes_ref = db.collection('quizzes')
    
    # Get quizzes with pagination
    docs = quizzes_ref.offset(skip).limit(limit).order_by('created_at', direction='DESCENDING').stream()
    quizzes = []
    
    for doc in docs:
        quiz_data = doc.to_dict()
        quizzes.append(Quiz(**quiz_data))
    
    return quizzes

@router.get("/{quiz_id}", response_model=Quiz)
async def get_quiz(
    quiz_id: str,
    current_user_email: str = Depends(verify_token)
):
    """Get a specific quiz"""
    db = get_firestore_db()
    quiz_doc = db.collection('quizzes').document(quiz_id).get()
    
    if not quiz_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    return Quiz(**quiz_doc.to_dict())

@router.put("/{quiz_id}", response_model=Quiz)
async def update_quiz(
    quiz_id: str,
    quiz_update: QuizUpdate,
    current_user_email: str = Depends(verify_token)
):
    """Update a quiz (Admin only)"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update quizzes"
        )
    
    db = get_firestore_db()
    quiz_ref = db.collection('quizzes').document(quiz_id)
    quiz_doc = quiz_ref.get()
    
    if not quiz_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Update only provided fields
    update_data = quiz_update.dict(exclude_unset=True)
    update_data['updated_at'] = datetime.now()
    
    quiz_ref.update(update_data)
    
    # Get updated document
    updated_doc = quiz_ref.get()
    return Quiz(**updated_doc.to_dict())

@router.delete("/{quiz_id}")
async def delete_quiz(
    quiz_id: str,
    current_user_email: str = Depends(verify_token)
):
    """Delete a quiz (Admin only)"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete quizzes"
        )
    
    db = get_firestore_db()
    quiz_ref = db.collection('quizzes').document(quiz_id)
    quiz_doc = quiz_ref.get()
    
    if not quiz_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Delete quiz
    quiz_ref.delete()
    
    return {"message": "Quiz deleted successfully"}

@router.get("/student/recent")
async def get_student_recent_quizzes(
    current_user_email: str = Depends(verify_token)
):
    """Get recent quizzes for student"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.STUDENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint"
        )
    
    db = get_firestore_db()
    
    # Get all quizzes (in a real app, you'd filter by student's enrolled courses)
    quizzes_ref = db.collection('quizzes')
    quizzes = quizzes_ref.order_by('created_at', direction='DESCENDING').limit(10).get()
    
    quiz_list = []
    for quiz_doc in quizzes:
        quiz_data = quiz_doc.to_dict()
        quiz_data['id'] = quiz_doc.id
        
        # Add status based on student's submissions
        submissions_ref = db.collection('quiz_submissions')
        student_submissions = submissions_ref.where('student_email', '==', current_user_email).where('quiz_id', '==', quiz_doc.id).get()
        
        if student_submissions:
            quiz_data['status'] = 'completed'
            quiz_data['score'] = student_submissions[0].to_dict().get('score', 0)
        else:
            quiz_data['status'] = 'available'
            quiz_data['score'] = None
        
        quiz_list.append(quiz_data)
    
    return quiz_list

@router.post("/{quiz_id}/submit", response_model=QuizResult)
async def submit_quiz(
    quiz_id: str,
    quiz_response: QuizResponse,
    background_tasks: BackgroundTasks,
    current_user_email: str = Depends(verify_token)
):
    """Submit a quiz response"""
    db = get_firestore_db()
    
    # Get quiz
    quiz_doc = db.collection('quizzes').document(quiz_id).get()
    if not quiz_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    quiz_data = quiz_doc.to_dict()
    
    # Get student information
    students_ref = db.collection('students')
    query = students_ref.where('email', '==', current_user_email).limit(1)
    student_docs = query.get()
    
    if not student_docs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    student_data = student_docs[0].to_dict()
    
    # Set student information in response
    quiz_response.student_id = student_data['id']
    quiz_response.submitted_at = datetime.now()
    
    # Grade quiz using AI agent
    quiz_grader = QuizGraderAgent()
    
    # Convert questions from dict to Question objects
    from app.models.schemas import Question, QuestionOption
    questions = []
    for q_data in quiz_data['questions']:
        options = [QuestionOption(**opt) for opt in q_data['options']]
        question = Question(
            id=q_data['id'],
            question_text=q_data['question_text'],
            options=options,
            correct_answer_id=q_data['correct_answer_id'],
            points=q_data['points']
        )
        questions.append(question)
    
    try:
        quiz_result, feedback = quiz_grader.grade_quiz(quiz_response, questions)
        quiz_result.student_name = student_data['name']
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to grade quiz: {str(e)}"
        )
    
    # Save quiz result
    db.collection('quiz_results').document(quiz_result.id).set(quiz_result.dict())
    
    # Update student statistics
    update_student_stats(student_data['id'], quiz_result.percentage)
    
    # Send result notification in background
    background_tasks.add_task(send_quiz_result_notification, quiz_result, feedback)
    
    return quiz_result

@router.get("/{quiz_id}/results")
async def get_quiz_results(
    quiz_id: str,
    current_user_email: str = Depends(verify_token)
):
    """Get results for a specific quiz (Admin only)"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view quiz results"
        )
    
    db = get_firestore_db()
    results_ref = db.collection('quiz_results')
    query = results_ref.where('quiz_id', '==', quiz_id).order_by('submitted_at', direction='DESCENDING')
    results = query.stream()
    
    quiz_results = []
    for result in results:
        quiz_results.append(result.to_dict())
    
    return quiz_results

@router.get("/{quiz_id}/statistics")
async def get_quiz_statistics(
    quiz_id: str,
    current_user_email: str = Depends(verify_token)
):
    """Get statistics for a specific quiz (Admin only)"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view quiz statistics"
        )
    
    db = get_firestore_db()
    results_ref = db.collection('quiz_results')
    query = results_ref.where('quiz_id', '==', quiz_id)
    results = query.stream()
    
    quiz_results = []
    for result in results:
        quiz_results.append(result.to_dict())
    
    # Generate statistics using quiz grader agent
    quiz_grader = QuizGraderAgent()
    from app.models.schemas import QuizResult
    result_objects = [QuizResult(**result) for result in quiz_results]
    statistics = quiz_grader.generate_class_statistics(result_objects)
    
    return statistics

# Helper functions
async def send_quiz_notifications(quiz_id: str, quiz_title: str, quiz_subject: str):
    """Send quiz creation notifications to all students"""
    db = get_firestore_db()
    email_notifier = EmailNotifierAgent()
    
    # Get all students
    students_ref = db.collection('students')
    students = students_ref.stream()
    
    for student_doc in students:
        student_data = student_doc.to_dict()
        email_notifier.send_quiz_created_notification(
            student_data['email'],
            student_data['name'],
            quiz_title,
            quiz_subject
        )

async def send_quiz_result_notification(quiz_result: QuizResult, feedback: str):
    """Send quiz result notification to student"""
    email_notifier = EmailNotifierAgent()
    email_notifier.send_quiz_result_notification(quiz_result, feedback)

def update_student_stats(student_id: str, score: float):
    """Update student statistics"""
    db = get_firestore_db()
    student_ref = db.collection('students').document(student_id)
    student_doc = student_ref.get()
    
    if student_doc.exists:
        student_data = student_doc.to_dict()
        total_quizzes = student_data['total_quizzes'] + 1
        current_avg = student_data['average_score']
        new_avg = ((current_avg * (total_quizzes - 1)) + score) / total_quizzes
        
        student_ref.update({
            'total_quizzes': total_quizzes,
            'average_score': new_avg,
            'updated_at': datetime.now()
        })
