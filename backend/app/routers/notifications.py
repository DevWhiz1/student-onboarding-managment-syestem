from fastapi import APIRouter, HTTPException, Depends, status
from app.models.schemas import EmailNotification, UserRole
from app.agents.email_notifier import EmailNotifierAgent
from app.core.firebase import get_firestore_db
from app.routers.auth import verify_token
from datetime import datetime
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

@router.post("/send")
async def send_notification(
    notification: EmailNotification,
    current_user_email: str = Depends(verify_token)
):
    """Send a custom notification (Admin only)"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can send notifications"
        )
    
    email_notifier = EmailNotifierAgent()
    
    # Create email using SendGrid
    from sendgrid.helpers.mail import Mail
    from app.core.config import settings
    
    message = Mail(
        from_email=settings.from_email,
        to_emails=notification.to_email,
        subject=notification.subject,
        html_content=notification.body,
        plain_text_content=notification.body
    )
    
    try:
        response = email_notifier.sendgrid_client.send(message)
        if response.status_code in [200, 201, 202]:
            # Log notification
            db = get_firestore_db()
            notification_log = {
                'id': str(uuid.uuid4()),
                'to_email': notification.to_email,
                'subject': notification.subject,
                'notification_type': notification.notification_type,
                'sent_by': current_user_email,
                'sent_at': datetime.now(),
                'status': 'sent'
            }
            db.collection('notification_logs').add(notification_log)
            
            return {"message": "Notification sent successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send notification"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending notification: {str(e)}"
        )

@router.post("/broadcast")
async def broadcast_notification(
    subject: str,
    body: str,
    notification_type: str = "general",
    current_user_email: str = Depends(verify_token)
):
    """Send notification to all students (Admin only)"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can broadcast notifications"
        )
    
    db = get_firestore_db()
    email_notifier = EmailNotifierAgent()
    
    # Get all students
    students_ref = db.collection('students')
    students = students_ref.stream()
    
    sent_count = 0
    failed_count = 0
    
    for student_doc in students:
        student_data = student_doc.to_dict()
        
        try:
            # Create email
            from sendgrid.helpers.mail import Mail
            from app.core.config import settings
            
            message = Mail(
                from_email=settings.from_email,
                to_emails=student_data['email'],
                subject=subject,
                html_content=body,
                plain_text_content=body
            )
            
            response = email_notifier.sendgrid_client.send(message)
            if response.status_code in [200, 201, 202]:
                sent_count += 1
            else:
                failed_count += 1
                
        except Exception as e:
            print(f"Error sending notification to {student_data['email']}: {e}")
            failed_count += 1
    
    return {
        "message": f"Broadcast completed: {sent_count} sent, {failed_count} failed",
        "sent_count": sent_count,
        "failed_count": failed_count
    }

@router.get("/logs")
async def get_notification_logs(
    skip: int = 0,
    limit: int = 100,
    current_user_email: str = Depends(verify_token)
):
    """Get notification logs (Admin only)"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view notification logs"
        )
    
    db = get_firestore_db()
    logs_ref = db.collection('notification_logs')
    
    # Get logs with pagination
    docs = logs_ref.offset(skip).limit(limit).order_by('sent_at', direction='DESCENDING').stream()
    logs = []
    
    for doc in docs:
        log_data = doc.to_dict()
        logs.append(log_data)
    
    return logs

@router.get("/templates")
async def get_notification_templates():
    """Get available notification templates"""
    templates = {
        "quiz_created": {
            "subject": "New Quiz Available: {quiz_title}",
            "body": """
            <html>
            <body>
                <h2>New Quiz Available!</h2>
                <p>Hello {student_name},</p>
                <p>A new quiz has been created for you:</p>
                <ul>
                    <li><strong>Quiz:</strong> {quiz_title}</li>
                    <li><strong>Subject:</strong> {quiz_subject}</li>
                </ul>
                <p>Please log in to your student portal to complete the quiz. Good luck!</p>
                <p>Best regards,<br>Your Education Team</p>
            </body>
            </html>
            """
        },
        "quiz_result": {
            "subject": "Quiz Results: {score}% Score",
            "body": """
            <html>
            <body>
                <h2>Quiz Results</h2>
                <p>Hello {student_name},</p>
                <p>Your quiz has been graded. Here are your results:</p>
                <div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; margin: 10px 0;">
                    <h3>Score: {score}/{total_points} ({percentage}%)</h3>
                    <p>Performance: {performance}</p>
                </div>
                <h3>Feedback:</h3>
                <p>{feedback}</p>
                <p>Keep up the great work and continue learning!</p>
                <p>Best regards,<br>Your Education Team</p>
            </body>
            </html>
            """
        },
        "video_feedback": {
            "subject": "Video Analysis Feedback: {video_title}",
            "body": """
            <html>
            <body>
                <h2>Video Analysis Feedback</h2>
                <p>Hello {student_name},</p>
                <p>Your video submission "{video_title}" has been analyzed. Here's your feedback:</p>
                <h3>Analysis Summary:</h3>
                <p>{analysis_summary}</p>
                <h3>Feedback:</h3>
                <p>{feedback}</p>
                <p>Great job on your submission! Keep practicing and improving.</p>
                <p>Best regards,<br>Your Education Team</p>
            </body>
            </html>
            """
        }
    }
    
    return templates

@router.post("/test")
async def test_notification(
    test_email: str,
    current_user_email: str = Depends(verify_token)
):
    """Send a test notification (Admin only)"""
    user_role = get_current_user_role(current_user_email)
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can send test notifications"
        )
    
    email_notifier = EmailNotifierAgent()
    
    # Create test email
    from sendgrid.helpers.mail import Mail
    from app.core.config import settings
    
    message = Mail(
        from_email=settings.from_email,
        to_emails=test_email,
        subject="Test Notification - Student Management System",
        html_content="""
        <html>
        <body>
            <h2>Test Notification</h2>
            <p>This is a test notification from the Student Management System.</p>
            <p>If you received this email, the notification system is working correctly.</p>
            <p>Best regards,<br>Your Education Team</p>
        </body>
        </html>
        """,
        plain_text_content="""
        Test Notification
        
        This is a test notification from the Student Management System.
        If you received this email, the notification system is working correctly.
        
        Best regards,
        Your Education Team
        """
    )
    
    try:
        response = email_notifier.sendgrid_client.send(message)
        if response.status_code in [200, 201, 202]:
            return {"message": "Test notification sent successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send test notification"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending test notification: {str(e)}"
        )
