from fastapi import APIRouter, HTTPException, Depends, status
from app.models.schemas import StudentCreate, StudentUpdate, Student, UserRole
from app.core.firebase import get_firestore_db
from app.routers.auth import verify_token
from datetime import datetime
from typing import List
import uuid

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

@router.post("/", response_model=Student)
async def create_student(
    student_data: StudentCreate,
    current_user_email: str = Depends(verify_token)
):
    """Create a new student (Admin only)"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create students"
        )
    
    db = get_firestore_db()
    
    # Check if student already exists
    students_ref = db.collection('students')
    query = students_ref.where('email', '==', student_data.email).limit(1)
    existing_students = query.get()
    
    if existing_students:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this email already exists"
        )
    
    # Create new student
    student_id = str(uuid.uuid4())
    student_doc = {
        'id': student_id,
        'name': student_data.name,
        'email': student_data.email,
        'student_id': student_data.student_id,
        'class_name': student_data.class_name,
        'created_at': datetime.now(),
        'updated_at': datetime.now(),
        'total_quizzes': 0,
        'average_score': 0.0
    }
    
    db.collection('students').document(student_id).set(student_doc)
    
    return Student(**student_doc)

@router.get("/", response_model=List[Student])
async def get_students(
    skip: int = 0,
    limit: int = 100,
    current_user_email: str = Depends(verify_token)
):
    """Get all students (Admin only)"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view all students"
        )
    
    db = get_firestore_db()
    students_ref = db.collection('students')
    
    # Get students with pagination
    docs = students_ref.offset(skip).limit(limit).stream()
    students = []
    
    for doc in docs:
        student_data = doc.to_dict()
        students.append(Student(**student_data))
    
    return students

@router.get("/{student_id}", response_model=Student)
async def get_student(
    student_id: str,
    current_user_email: str = Depends(verify_token)
):
    """Get a specific student"""
    db = get_firestore_db()
    user_role = get_current_user_role(current_user_email)
    
    # Students can only view their own data, admins can view any student
    if user_role == UserRole.STUDENT.value:
        # Check if student is viewing their own data
        students_ref = db.collection('students')
        query = students_ref.where('email', '==', current_user_email).limit(1)
        student_docs = query.get()
        
        if not student_docs or student_docs[0].id != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own student data"
            )
    
    # Get student document
    student_doc = db.collection('students').document(student_id).get()
    
    if not student_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    return Student(**student_doc.to_dict())

@router.put("/{student_id}", response_model=Student)
async def update_student(
    student_id: str,
    student_update: StudentUpdate,
    current_user_email: str = Depends(verify_token)
):
    """Update a student (Admin only)"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update students"
        )
    
    db = get_firestore_db()
    student_ref = db.collection('students').document(student_id)
    student_doc = student_ref.get()
    
    if not student_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Update only provided fields
    update_data = student_update.dict(exclude_unset=True)
    update_data['updated_at'] = datetime.now()
    
    student_ref.update(update_data)
    
    # Get updated document
    updated_doc = student_ref.get()
    return Student(**updated_doc.to_dict())

@router.delete("/{student_id}")
async def delete_student(
    student_id: str,
    current_user_email: str = Depends(verify_token)
):
    """Delete a student (Admin only)"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete students"
        )
    
    db = get_firestore_db()
    student_ref = db.collection('students').document(student_id)
    student_doc = student_ref.get()
    
    if not student_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Delete student
    student_ref.delete()
    
    return {"message": "Student deleted successfully"}

@router.get("/{student_id}/quiz-results")
async def get_student_quiz_results(
    student_id: str,
    current_user_email: str = Depends(verify_token)
):
    """Get quiz results for a specific student"""
    db = get_firestore_db()
    user_role = get_current_user_role(current_user_email)
    
    # Students can only view their own results, admins can view any student's results
    if user_role == UserRole.STUDENT.value:
        # Check if student is viewing their own data
        students_ref = db.collection('students')
        query = students_ref.where('email', '==', current_user_email).limit(1)
        student_docs = query.get()
        
        if not student_docs or student_docs[0].id != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own quiz results"
            )
    
    # Get quiz results for student
    results_ref = db.collection('quiz_results')
    query = results_ref.where('student_id', '==', student_id).order_by('submitted_at', direction='DESCENDING')
    results = query.stream()
    
    quiz_results = []
    for result in results:
        quiz_results.append(result.to_dict())
    
    return quiz_results

@router.get("/{student_id}/video-submissions")
async def get_student_video_submissions(
    student_id: str,
    current_user_email: str = Depends(verify_token)
):
    """Get video submissions for a specific student"""
    db = get_firestore_db()
    user_role = get_current_user_role(current_user_email)
    
    # Students can only view their own submissions, admins can view any student's submissions
    if user_role == UserRole.STUDENT.value:
        # Check if student is viewing their own data
        students_ref = db.collection('students')
        query = students_ref.where('email', '==', current_user_email).limit(1)
        student_docs = query.get()
        
        if not student_docs or student_docs[0].id != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own video submissions"
            )
    
    # Get video submissions for student
    submissions_ref = db.collection('video_submissions')
    query = submissions_ref.where('student_id', '==', student_id).order_by('submitted_at', direction='DESCENDING')
    submissions = query.stream()
    
    video_submissions = []
    for submission in submissions:
        video_submissions.append(submission.to_dict())
    
    return video_submissions

@router.get("/me/stats")
async def get_student_stats(
    current_user_email: str = Depends(verify_token)
):
    """Get student statistics"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.STUDENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint"
        )
    
    db = get_firestore_db()
    
    # Get quiz statistics
    submissions_ref = db.collection('quiz_submissions')
    quiz_submissions = submissions_ref.where('student_email', '==', current_user_email).get()
    
    total_quizzes = len(quiz_submissions)
    completed_quizzes = len([s for s in quiz_submissions if s.to_dict().get('status') == 'completed'])
    
    # Calculate average score
    scores = [s.to_dict().get('score', 0) for s in quiz_submissions if s.to_dict().get('score') is not None]
    average_score = sum(scores) / len(scores) if scores else 0
    
    # Get video statistics
    videos_ref = db.collection('video_submissions')
    video_submissions = videos_ref.where('student_email', '==', current_user_email).get()
    total_videos = len(video_submissions)
    
    return {
        "totalQuizzes": total_quizzes,
        "completedQuizzes": completed_quizzes,
        "averageScore": round(average_score, 1),
        "totalVideos": total_videos
    }

@router.get("/me/recent")
async def get_student_recent_videos(
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
    query = videos_ref.where('student_email', '==', current_user_email).order_by('submitted_at', direction='DESCENDING').limit(5)
    submissions = query.stream()
    
    video_submissions = []
    for submission in submissions:
        video_data = submission.to_dict()
        video_data['id'] = submission.id
        video_submissions.append(video_data)
    
    return video_submissions

@router.get("/admin/stats")
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

# Student-specific endpoints
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
async def get_student_recent_videos_alt(
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
