from crewai import Agent, Task, Crew
from langchain_openai import ChatOpenAI
from app.core.config import settings
from app.models.schemas import EmailNotification, QuizResult, VideoSubmission
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from typing import Dict, Any
import uuid
from datetime import datetime

class EmailNotifierAgent:
    def __init__(self):
        # Initialize OpenAI LLM
        self.llm = ChatOpenAI(
            model="gpt-4",
            temperature=0.7,
            openai_api_key=settings.openai_api_key
        )
        
        # Initialize SendGrid
        self.sendgrid_client = SendGridAPIClient(api_key=settings.sendgrid_api_key)
        
        # Create the Email Notification Agent
        self.agent = Agent(
            role="Email Communication Specialist",
            goal="Create engaging, professional, and personalized email notifications for students",
            backstory="""You are an expert in educational communication with years of experience 
            in crafting engaging emails that motivate students and provide clear, actionable 
            information. You understand how to balance professionalism with warmth and 
            encouragement.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
    
    def send_quiz_created_notification(self, student_email: str, student_name: str, quiz_title: str, quiz_subject: str) -> bool:
        """Send notification when a new quiz is created"""
        
        # Generate email content
        email_content = self._generate_quiz_created_email(student_name, quiz_title, quiz_subject)
        
        # Create email
        message = Mail(
            from_email=settings.from_email,
            to_emails=student_email,
            subject=f"New Quiz Available: {quiz_title}",
            html_content=email_content["html"],
            plain_text_content=email_content["text"]
        )
        
        try:
            response = self.sendgrid_client.send(message)
            print(f"Quiz created notification sent to {student_email}: {response.status_code}")
            return response.status_code in [200, 201, 202]
        except Exception as e:
            print(f"Error sending quiz created notification: {e}")
            return False
    
    def send_quiz_result_notification(self, quiz_result: QuizResult, feedback: str) -> bool:
        """Send quiz result notification to student"""
        
        # Generate email content
        email_content = self._generate_quiz_result_email(quiz_result, feedback)
        
        # Create email
        message = Mail(
            from_email=settings.from_email,
            to_emails=quiz_result.student_id,  # Assuming student_id is email
            subject=f"Quiz Results: {quiz_result.percentage:.1f}% Score",
            html_content=email_content["html"],
            plain_text_content=email_content["text"]
        )
        
        try:
            response = self.sendgrid_client.send(message)
            print(f"Quiz result notification sent to {quiz_result.student_id}: {response.status_code}")
            return response.status_code in [200, 201, 202]
        except Exception as e:
            print(f"Error sending quiz result notification: {e}")
            return False
    
    def send_video_feedback_notification(self, video_submission: VideoSubmission) -> bool:
        """Send video analysis feedback to student"""
        
        # Generate email content
        email_content = self._generate_video_feedback_email(video_submission)
        
        # Create email
        message = Mail(
            from_email=settings.from_email,
            to_emails=video_submission.student_id,  # Assuming student_id is email
            subject=f"Video Analysis Feedback: {video_submission.title}",
            html_content=email_content["html"],
            plain_text_content=email_content["text"]
        )
        
        try:
            response = self.sendgrid_client.send(message)
            print(f"Video feedback notification sent to {video_submission.student_id}: {response.status_code}")
            return response.status_code in [200, 201, 202]
        except Exception as e:
            print(f"Error sending video feedback notification: {e}")
            return False
    
    def _generate_quiz_created_email(self, student_name: str, quiz_title: str, quiz_subject: str) -> Dict[str, str]:
        """Generate email content for quiz creation notification"""
        
        task = Task(
            description=f"""
            Create an engaging email notification for a student about a new quiz:
            
            Student Name: {student_name}
            Quiz Title: {quiz_title}
            Subject: {quiz_subject}
            
            The email should:
            1. Be warm and encouraging
            2. Clearly explain what the quiz is about
            3. Provide motivation to complete it
            4. Include any relevant instructions
            5. Be professional but friendly
            
            Create both HTML and plain text versions.
            """,
            expected_output="Email content with HTML and text versions",
            agent=self.agent
        )
        
        crew = Crew(
            agents=[self.agent],
            tasks=[task],
            verbose=True
        )
        
        try:
            result = crew.kickoff()
            content = str(result)
            
            # For now, return a simple template
            # In production, you might want to parse the AI-generated content
            html_content = f"""
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
            
            text_content = f"""
            New Quiz Available!
            
            Hello {student_name},
            
            A new quiz has been created for you:
            - Quiz: {quiz_title}
            - Subject: {quiz_subject}
            
            Please log in to your student portal to complete the quiz. Good luck!
            
            Best regards,
            Your Education Team
            """
            
            return {"html": html_content, "text": text_content}
            
        except Exception as e:
            print(f"Error generating quiz created email: {e}")
            return self._get_default_quiz_created_email(student_name, quiz_title, quiz_subject)
    
    def _generate_quiz_result_email(self, quiz_result: QuizResult, feedback: str) -> Dict[str, str]:
        """Generate email content for quiz result notification"""
        
        # Determine performance level
        if quiz_result.percentage >= 90:
            performance = "Excellent"
            color = "#28a745"
        elif quiz_result.percentage >= 80:
            performance = "Good"
            color = "#17a2b8"
        elif quiz_result.percentage >= 70:
            performance = "Satisfactory"
            color = "#ffc107"
        else:
            performance = "Needs Improvement"
            color = "#dc3545"
        
        html_content = f"""
        <html>
        <body>
            <h2>Quiz Results</h2>
            <p>Hello {quiz_result.student_name},</p>
            <p>Your quiz has been graded. Here are your results:</p>
            <div style="background-color: {color}; color: white; padding: 10px; border-radius: 5px; margin: 10px 0;">
                <h3>Score: {quiz_result.score}/{quiz_result.total_points} ({quiz_result.percentage:.1f}%)</h3>
                <p>Performance: {performance}</p>
            </div>
            <h3>Feedback:</h3>
            <p>{feedback}</p>
            <p>Keep up the great work and continue learning!</p>
            <p>Best regards,<br>Your Education Team</p>
        </body>
        </html>
        """
        
        text_content = f"""
        Quiz Results
        
        Hello {quiz_result.student_name},
        
        Your quiz has been graded. Here are your results:
        
        Score: {quiz_result.score}/{quiz_result.total_points} ({quiz_result.percentage:.1f}%)
        Performance: {performance}
        
        Feedback:
        {feedback}
        
        Keep up the great work and continue learning!
        
        Best regards,
        Your Education Team
        """
        
        return {"html": html_content, "text": text_content}
    
    def _generate_video_feedback_email(self, video_submission: VideoSubmission) -> Dict[str, str]:
        """Generate email content for video feedback notification"""
        
        html_content = f"""
        <html>
        <body>
            <h2>Video Analysis Feedback</h2>
            <p>Hello {video_submission.student_name},</p>
            <p>Your video submission "{video_submission.title}" has been analyzed. Here's your feedback:</p>
            <h3>Analysis Summary:</h3>
            <p>{video_submission.analysis_summary}</p>
            <h3>Feedback:</h3>
            <p>{video_submission.feedback}</p>
            <p>Great job on your submission! Keep practicing and improving.</p>
            <p>Best regards,<br>Your Education Team</p>
        </body>
        </html>
        """
        
        text_content = f"""
        Video Analysis Feedback
        
        Hello {video_submission.student_name},
        
        Your video submission "{video_submission.title}" has been analyzed. Here's your feedback:
        
        Analysis Summary:
        {video_submission.analysis_summary}
        
        Feedback:
        {video_submission.feedback}
        
        Great job on your submission! Keep practicing and improving.
        
        Best regards,
        Your Education Team
        """
        
        return {"html": html_content, "text": text_content}
    
    def _get_default_quiz_created_email(self, student_name: str, quiz_title: str, quiz_subject: str) -> Dict[str, str]:
        """Default email template if AI generation fails"""
        html_content = f"""
        <html>
        <body>
            <h2>New Quiz Available!</h2>
            <p>Hello {student_name},</p>
            <p>A new quiz "{quiz_title}" in {quiz_subject} is now available for you to complete.</p>
            <p>Please log in to complete it at your earliest convenience.</p>
            <p>Best regards,<br>Your Education Team</p>
        </body>
        </html>
        """
        
        text_content = f"""
        New Quiz Available!
        
        Hello {student_name},
        
        A new quiz "{quiz_title}" in {quiz_subject} is now available for you to complete.
        Please log in to complete it at your earliest convenience.
        
        Best regards,
        Your Education Team
        """
        
        return {"html": html_content, "text": text_content}
