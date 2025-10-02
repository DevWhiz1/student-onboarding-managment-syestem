from fastapi import APIRouter, HTTPException, Depends, status
from app.models.schemas import UserRole
from app.core.firebase import get_firestore_db
from app.routers.auth import verify_token
from typing import List

router = APIRouter()

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

@router.get("/stats")
async def get_admin_stats(
    current_user_email: str = Depends(verify_token)
):
    """Get admin statistics"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint"
        )
    
    db = get_firestore_db()
    
    # Get student count
    students_ref = db.collection('users')
    students_query = students_ref.where('role', '==', 'student').get()
    total_students = len(students_query)
    
    # Get quiz count
    quizzes_ref = db.collection('quizzes')
    quizzes = quizzes_ref.get()
    total_quizzes = len(quizzes)
    
    # Get video count
    videos_ref = db.collection('video_submissions')
    videos = videos_ref.get()
    total_videos = len(videos)
    
    # Calculate average score from all quiz submissions
    submissions_ref = db.collection('quiz_submissions')
    submissions = submissions_ref.get()
    scores = [s.to_dict().get('score', 0) for s in submissions if s.to_dict().get('score') is not None]
    average_score = sum(scores) / len(scores) if scores else 0
    
    return {
        "totalStudents": total_students,
        "totalQuizzes": total_quizzes,
        "totalVideos": total_videos,
        "averageScore": round(average_score, 1)
    }

@router.get("/quizzes")
async def get_admin_quizzes(
    current_user_email: str = Depends(verify_token)
):
    """Get all quizzes for admin"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint"
        )
    
    db = get_firestore_db()
    
    # Get all quizzes
    quizzes_ref = db.collection('quizzes')
    quizzes_query = quizzes_ref.order_by('created_at', direction='DESCENDING')
    quizzes_docs = quizzes_query.stream()
    
    quizzes = []
    for quiz_doc in quizzes_docs:
        quiz_data = quiz_doc.to_dict()
        quiz_data['id'] = quiz_doc.id
        
        # Get submission count for this quiz
        submissions_ref = db.collection('quiz_submissions')
        submissions_query = submissions_ref.where('quiz_id', '==', quiz_doc.id).get()
        quiz_data['attempts_count'] = len(submissions_query)
        
        # Calculate average score for this quiz
        scores = [s.to_dict().get('score', 0) for s in submissions_query if s.to_dict().get('score') is not None]
        quiz_data['average_score'] = round(sum(scores) / len(scores), 1) if scores else 0
        
        quizzes.append(quiz_data)
    
    return quizzes

@router.get("/quiz-stats")
async def get_admin_quiz_stats(
    current_user_email: str = Depends(verify_token)
):
    """Get admin quiz statistics"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint"
        )
    
    db = get_firestore_db()
    
    # Get all quizzes
    quizzes_ref = db.collection('quizzes')
    all_quizzes = quizzes_ref.get()
    total_quizzes = len(all_quizzes)
    
    # Count active quizzes
    active_quizzes = len([q for q in all_quizzes if q.to_dict().get('status') == 'active'])
    
    # Get all quiz submissions
    submissions_ref = db.collection('quiz_submissions')
    all_submissions = submissions_ref.get()
    total_attempts = len(all_submissions)
    
    # Calculate average score
    scores = [s.to_dict().get('score', 0) for s in all_submissions if s.to_dict().get('score') is not None]
    average_score = sum(scores) / len(scores) if scores else 0
    
    return {
        "totalQuizzes": total_quizzes,
        "activeQuizzes": active_quizzes,
        "totalAttempts": total_attempts,
        "averageScore": round(average_score, 1)
    }

@router.get("/students")
async def get_admin_students(
    skip: int = 0,
    limit: int = 100,
    current_user_email: str = Depends(verify_token)
):
    """Get all students for admin"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint"
        )
    
    db = get_firestore_db()
    
    # Get all student users
    users_ref = db.collection('users')
    students_query = users_ref.where('role', '==', 'student').offset(skip).limit(limit)
    students_docs = students_query.stream()
    
    students = []
    for student_doc in students_docs:
        student_data = student_doc.to_dict()
        student_data['id'] = student_doc.id
        
        # Get quiz statistics for this student
        submissions_ref = db.collection('quiz_submissions')
        submissions_query = submissions_ref.where('student_email', '==', student_data['email']).get()
        
        total_quizzes = len(submissions_query)
        scores = [s.to_dict().get('score', 0) for s in submissions_query if s.to_dict().get('score') is not None]
        average_score = sum(scores) / len(scores) if scores else 0
        
        student_data['total_quizzes'] = total_quizzes
        student_data['average_score'] = round(average_score, 1)
        
        students.append(student_data)
    
    return students

@router.get("/videos")
async def get_admin_videos(
    current_user_email: str = Depends(verify_token)
):
    """Get all video submissions for admin"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint"
        )
    
    db = get_firestore_db()
    
    # Get all video submissions
    videos_ref = db.collection('video_submissions')
    query = videos_ref.order_by('submitted_at', direction='DESCENDING')
    submissions = query.stream()
    
    video_submissions = []
    for submission in submissions:
        video_data = submission.to_dict()
        video_data['id'] = submission.id
        
        # Get student name
        if 'student_email' in video_data:
            users_ref = db.collection('users')
            user_query = users_ref.where('email', '==', video_data['student_email']).limit(1).get()
            if user_query:
                video_data['student_name'] = user_query[0].to_dict().get('name', 'Unknown')
        
        video_submissions.append(video_data)
    
    return video_submissions
