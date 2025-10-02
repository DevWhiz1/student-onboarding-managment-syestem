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

@router.get("/quizzes")
async def get_student_quizzes(
    current_user_email: str = Depends(verify_token)
):
    """Get quizzes for student"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.STUDENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint"
        )
    
    db = get_firestore_db()
    
    # Get all active quizzes
    quizzes_ref = db.collection('quizzes')
    quizzes_query = quizzes_ref.where('status', '==', 'active').get()
    
    # Get student's quiz submissions
    submissions_ref = db.collection('quiz_submissions')
    submissions_query = submissions_ref.where('student_email', '==', current_user_email).get()
    
    # Create a map of quiz submissions
    submissions_map = {}
    for submission in submissions_query:
        submission_data = submission.to_dict()
        submissions_map[submission_data['quiz_id']] = submission_data
    
    quizzes = []
    for quiz_doc in quizzes_query:
        quiz_data = quiz_doc.to_dict()
        quiz_data['id'] = quiz_doc.id
        
        # Check if student has completed this quiz
        if quiz_data['id'] in submissions_map:
            submission = submissions_map[quiz_data['id']]
            quiz_data['completed'] = True
            quiz_data['score'] = submission.get('score', 0)
            quiz_data['completed_at'] = submission.get('submitted_at')
            quiz_data['available'] = False
        else:
            quiz_data['completed'] = False
            quiz_data['available'] = True
            quiz_data['in_progress'] = False
        
        quiz_data['questions_count'] = len(quiz_data.get('questions', []))
        quizzes.append(quiz_data)
    
    return quizzes

@router.get("/quiz-stats")
async def get_student_quiz_stats(
    current_user_email: str = Depends(verify_token)
):
    """Get student quiz statistics"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.STUDENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint"
        )
    
    db = get_firestore_db()
    
    # Get all quizzes
    quizzes_ref = db.collection('quizzes')
    all_quizzes = quizzes_ref.get()
    total_quizzes = len(all_quizzes)
    
    # Get student's quiz submissions
    submissions_ref = db.collection('quiz_submissions')
    submissions_query = submissions_ref.where('student_email', '==', current_user_email).get()
    
    completed_quizzes = 0
    scores = []
    best_score = 0
    
    for submission in submissions_query:
        submission_data = submission.to_dict()
        if submission_data.get('status') == 'completed':
            completed_quizzes += 1
            score = submission_data.get('score', 0)
            scores.append(score)
            if score > best_score:
                best_score = score
    
    average_score = sum(scores) / len(scores) if scores else 0
    
    return {
        "totalQuizzes": total_quizzes,
        "completedQuizzes": completed_quizzes,
        "averageScore": round(average_score, 1),
        "bestScore": round(best_score, 1)
    }

@router.get("/videos")
async def get_student_videos(
    current_user_email: str = Depends(verify_token)
):
    """Get student's video submissions"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.STUDENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint"
        )
    
    db = get_firestore_db()
    
    # Get student's video submissions
    videos_ref = db.collection('video_submissions')
    query = videos_ref.where('student_email', '==', current_user_email).order_by('submitted_at', direction='DESCENDING')
    submissions = query.stream()
    
    video_submissions = []
    for submission in submissions:
        video_data = submission.to_dict()
        video_data['id'] = submission.id
        video_submissions.append(video_data)
    
    return video_submissions

@router.get("/video-stats")
async def get_student_video_stats(
    current_user_email: str = Depends(verify_token)
):
    """Get student video statistics"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.STUDENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint"
        )
    
    db = get_firestore_db()
    
    # Get student's video submissions
    videos_ref = db.collection('video_submissions')
    submissions = videos_ref.where('student_email', '==', current_user_email).get()
    
    total_videos = len(submissions)
    analyzed_videos = 0
    pending_videos = 0
    scores = []
    
    for submission in submissions:
        submission_data = submission.to_dict()
        status = submission_data.get('status', 'pending')
        
        if status == 'analyzed':
            analyzed_videos += 1
            score = submission_data.get('analysis_score', 0)
            if score > 0:
                scores.append(score)
        elif status in ['pending', 'analyzing']:
            pending_videos += 1
    
    average_score = sum(scores) / len(scores) if scores else 0
    
    return {
        "totalVideos": total_videos,
        "analyzedVideos": analyzed_videos,
        "pendingVideos": pending_videos,
        "averageScore": round(average_score, 1)
    }

@router.get("/videos/recent")
async def get_student_recent_videos(
    limit: int = 3,
    current_user_email: str = Depends(verify_token)
):
    """Get student's recent video submissions"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.STUDENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint"
        )
    
    db = get_firestore_db()
    
    # Get recent video submissions
    videos_ref = db.collection('video_submissions')
    query = videos_ref.where('student_email', '==', current_user_email).order_by('submitted_at', direction='DESCENDING').limit(limit)
    submissions = query.stream()
    
    video_submissions = []
    for submission in submissions:
        video_data = submission.to_dict()
        video_data['id'] = submission.id
        video_submissions.append(video_data)
    
    return video_submissions
