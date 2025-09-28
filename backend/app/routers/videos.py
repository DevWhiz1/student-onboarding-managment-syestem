from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from app.models.schemas import VideoSubmission, VideoAnalysisTask, VideoStatus
from app.agents.video_analyzer import VideoAnalyzerAgent
from app.agents.email_notifier import EmailNotifierAgent
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

@router.post("/", response_model=VideoSubmission)
async def submit_video(
    video_url: str,
    title: str,
    description: str = None,
    background_tasks: BackgroundTasks = None,
    current_user_email: str = Depends(verify_token)
):
    """Submit a video for analysis"""
    db = get_firestore_db()
    
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
    
    # Create video submission
    submission_id = str(uuid.uuid4())
    video_submission = VideoSubmission(
        id=submission_id,
        student_id=student_data['id'],
        student_name=student_data['name'],
        video_url=video_url,
        title=title,
        description=description,
        status=VideoStatus.UPLOADED,
        submitted_at=datetime.now()
    )
    
    # Save to database
    db.collection('video_submissions').document(submission_id).set(video_submission.dict())
    
    # Start video analysis in background
    if background_tasks:
        background_tasks.add_task(analyze_video_submission, submission_id)
    
    return video_submission

@router.get("/", response_model=List[VideoSubmission])
async def get_video_submissions(
    skip: int = 0,
    limit: int = 100,
    current_user_email: str = Depends(verify_token)
):
    """Get video submissions"""
    db = get_firestore_db()
    user_role = get_current_user_role(current_user_email)
    
    submissions_ref = db.collection('video_submissions')
    
    if user_role == "admin":
        # Admins can see all submissions
        query = submissions_ref.offset(skip).limit(limit).order_by('submitted_at', direction='DESCENDING')
    else:
        # Students can only see their own submissions
        students_ref = db.collection('students')
        student_query = students_ref.where('email', '==', current_user_email).limit(1)
        student_docs = student_query.get()
        
        if not student_docs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        student_id = student_docs[0].id
        query = submissions_ref.where('student_id', '==', student_id).offset(skip).limit(limit).order_by('submitted_at', direction='DESCENDING')
    
    submissions = []
    for doc in query.stream():
        submission_data = doc.to_dict()
        submissions.append(VideoSubmission(**submission_data))
    
    return submissions

@router.get("/{submission_id}", response_model=VideoSubmission)
async def get_video_submission(
    submission_id: str,
    current_user_email: str = Depends(verify_token)
):
    """Get a specific video submission"""
    db = get_firestore_db()
    user_role = get_current_user_role(current_user_email)
    
    submission_doc = db.collection('video_submissions').document(submission_id).get()
    
    if not submission_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video submission not found"
        )
    
    submission_data = submission_doc.to_dict()
    
    # Check permissions
    if user_role != "admin":
        # Students can only view their own submissions
        students_ref = db.collection('students')
        student_query = students_ref.where('email', '==', current_user_email).limit(1)
        student_docs = student_query.get()
        
        if not student_docs or student_docs[0].id != submission_data['student_id']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own video submissions"
            )
    
    return VideoSubmission(**submission_data)

@router.post("/{submission_id}/analyze")
async def analyze_video(
    submission_id: str,
    current_user_email: str = Depends(verify_token)
):
    """Manually trigger video analysis (Admin only)"""
    user_role = get_current_user_role(current_user_email)
    if user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can trigger video analysis"
        )
    
    # Start analysis in background
    from fastapi import BackgroundTasks
    background_tasks = BackgroundTasks()
    background_tasks.add_task(analyze_video_submission, submission_id)
    
    return {"message": "Video analysis started"}

@router.delete("/{submission_id}")
async def delete_video_submission(
    submission_id: str,
    current_user_email: str = Depends(verify_token)
):
    """Delete a video submission"""
    db = get_firestore_db()
    user_role = get_current_user_role(current_user_email)
    
    submission_doc = db.collection('video_submissions').document(submission_id).get()
    
    if not submission_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video submission not found"
        )
    
    submission_data = submission_doc.to_dict()
    
    # Check permissions
    if user_role != "admin":
        # Students can only delete their own submissions
        students_ref = db.collection('students')
        student_query = students_ref.where('email', '==', current_user_email).limit(1)
        student_docs = student_query.get()
        
        if not student_docs or student_docs[0].id != submission_data['student_id']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own video submissions"
            )
    
    # Delete submission
    db.collection('video_submissions').document(submission_id).delete()
    
    return {"message": "Video submission deleted successfully"}

@router.get("/{submission_id}/analysis")
async def get_video_analysis(
    submission_id: str,
    current_user_email: str = Depends(verify_token)
):
    """Get detailed video analysis"""
    db = get_firestore_db()
    user_role = get_current_user_role(current_user_email)
    
    submission_doc = db.collection('video_submissions').document(submission_id).get()
    
    if not submission_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video submission not found"
        )
    
    submission_data = submission_doc.to_dict()
    
    # Check permissions
    if user_role != "admin":
        # Students can only view their own analysis
        students_ref = db.collection('students')
        student_query = students_ref.where('email', '==', current_user_email).limit(1)
        student_docs = student_query.get()
        
        if not student_docs or student_docs[0].id != submission_data['student_id']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own video analysis"
            )
    
    # Return analysis data
    analysis_data = {
        "transcription": submission_data.get('transcription'),
        "analysis_summary": submission_data.get('analysis_summary'),
        "feedback": submission_data.get('feedback'),
        "status": submission_data.get('status'),
        "analyzed_at": submission_data.get('analyzed_at')
    }
    
    return analysis_data

# Helper functions
async def analyze_video_submission(submission_id: str):
    """Analyze a video submission using AI agents"""
    db = get_firestore_db()
    
    # Get submission
    submission_doc = db.collection('video_submissions').document(submission_id).get()
    
    if not submission_doc.exists:
        print(f"Video submission {submission_id} not found")
        return
    
    submission_data = submission_doc.to_dict()
    
    # Update status to processing
    db.collection('video_submissions').document(submission_id).update({
        'status': VideoStatus.PROCESSING.value,
        'updated_at': datetime.now()
    })
    
    try:
        # Create analysis task
        analysis_task = VideoAnalysisTask(
            video_url=submission_data['video_url'],
            student_id=submission_data['student_id'],
            analysis_type="content_summary"
        )
        
        # Analyze video using AI agent
        video_analyzer = VideoAnalyzerAgent()
        analysis_result = video_analyzer.analyze_video(analysis_task)
        
        # Update submission with analysis results
        db.collection('video_submissions').document(submission_id).update({
            'transcription': analysis_result['transcription'],
            'analysis_summary': analysis_result['analysis_summary'],
            'feedback': analysis_result['feedback'],
            'status': VideoStatus.ANALYZED.value,
            'analyzed_at': analysis_result['analyzed_at'],
            'updated_at': datetime.now()
        })
        
        # Send feedback notification
        email_notifier = EmailNotifierAgent()
        updated_submission = VideoSubmission(**submission_data)
        updated_submission.transcription = analysis_result['transcription']
        updated_submission.analysis_summary = analysis_result['analysis_summary']
        updated_submission.feedback = analysis_result['feedback']
        updated_submission.status = VideoStatus.ANALYZED
        updated_submission.analyzed_at = analysis_result['analyzed_at']
        
        email_notifier.send_video_feedback_notification(updated_submission)
        
        print(f"Video analysis completed for submission {submission_id}")
        
    except Exception as e:
        print(f"Error analyzing video submission {submission_id}: {e}")
        
        # Update status to indicate error
        db.collection('video_submissions').document(submission_id).update({
            'status': VideoStatus.UPLOADED.value,  # Reset to uploaded for retry
            'updated_at': datetime.now()
        })

@router.get("/student/recent")
async def get_student_recent_videos(
    current_user_email: str = Depends(verify_token)
):
    """Get student's recent video submissions"""
    user_role = get_current_user_role(current_user_email)
    if user_role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint"
        )
    
    db = get_firestore_db()
    
    # Get student's recent video submissions
    submissions_ref = db.collection('video_submissions')
    query = submissions_ref.where('student_email', '==', current_user_email).order_by('submitted_at', direction='DESCENDING').limit(5)
    submissions = query.stream()
    
    video_submissions = []
    for submission in submissions:
        video_data = submission.to_dict()
        video_data['id'] = submission.id
        video_submissions.append(video_data)
    
    return video_submissions
