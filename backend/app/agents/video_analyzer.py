from crewai import Agent, Task, Crew
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings
from app.models.schemas import VideoAnalysisTask, VideoSubmission
import uuid
from datetime import datetime
from typing import Dict, Any
import requests
import os

class VideoAnalyzerAgent:
    def __init__(self):
        # Initialize OpenAI LLM
        self.llm = ChatOpenAI(
            model="gpt-4",
            temperature=0.3,
            openai_api_key=settings.openai_api_key
        )
        
        # Initialize Gemini LLM as fallback
        self.gemini_llm = ChatGoogleGenerativeAI(
            model="google/gemini-2.5-flash",
            temperature=0.3,
            google_api_key=settings.google_api_key
        )
        
        # Create the Video Analysis Agent
        self.agent = Agent(
            role="Video Content Analyst",
            goal="Analyze video content, transcribe speech, and provide educational feedback",
            backstory="""You are an expert educational content analyst with expertise in 
            video analysis, speech recognition, and educational assessment. You provide 
            detailed analysis of student video submissions, including content quality, 
            presentation skills, and educational value.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
    
    def analyze_video(self, task_data: VideoAnalysisTask) -> Dict[str, Any]:
        """Analyze a video submission and provide comprehensive feedback"""
        
        # First, attempt to transcribe the video
        transcription = self._transcribe_video(task_data.video_url)
        
        # Create analysis task
        analysis_task = Task(
            description=f"""
            Analyze the following video submission:
            
            Video URL: {task_data.video_url}
            Student ID: {task_data.student_id}
            Analysis Type: {task_data.analysis_type}
            
            Transcription: {transcription}
            
            Provide a comprehensive analysis including:
            1. Content Quality Assessment
               - Accuracy of information presented
               - Depth of understanding demonstrated
               - Organization and structure
               - Use of examples and evidence
            
            2. Presentation Skills
               - Clarity of speech
               - Confidence and engagement
               - Visual aids usage (if applicable)
               - Pace and timing
            
            3. Educational Value
               - Learning objectives met
               - Knowledge demonstration
               - Critical thinking shown
               - Originality and creativity
            
            4. Areas for Improvement
               - Specific suggestions for enhancement
               - Common mistakes or misconceptions
               - Recommended next steps
            
            5. Overall Feedback
               - Strengths highlighted
               - Constructive criticism
               - Encouragement and motivation
            
            Provide detailed, constructive feedback that helps the student improve.
            """,
            expected_output="Comprehensive video analysis with detailed feedback",
            agent=self.agent
        )
        
        # Create crew and execute task
        crew = Crew(
            agents=[self.agent],
            tasks=[analysis_task],
            verbose=True
        )
        
        try:
            # Execute the task
            result = crew.kickoff()
            analysis_summary = str(result)
        except Exception as e:
            print(f"Error analyzing video with OpenAI: {e}")
            # Try with Gemini as fallback
            analysis_summary = self._analyze_with_gemini(task_data, transcription)
        
        # Generate feedback summary
        feedback = self._generate_feedback_summary(analysis_summary)
        
        return {
            "transcription": transcription,
            "analysis_summary": analysis_summary,
            "feedback": feedback,
            "analyzed_at": datetime.now()
        }
    
    def _transcribe_video(self, video_url: str) -> str:
        """Transcribe video content to text"""
        try:
            # For this implementation, we'll use a simple approach
            # In production, you might want to use services like:
            # - Google Cloud Speech-to-Text
            # - Azure Speech Services
            # - AWS Transcribe
            # - OpenAI Whisper API
            
            # For now, return a placeholder transcription
            # You can integrate with actual transcription services here
            return f"[Video transcription placeholder for: {video_url}]"
            
        except Exception as e:
            print(f"Error transcribing video: {e}")
            return f"Unable to transcribe video: {video_url}"
    
    def _analyze_with_gemini(self, task_data: VideoAnalysisTask, transcription: str) -> str:
        """Fallback analysis using Google Gemini"""
        try:
            gemini_agent = Agent(
                role="Video Content Analyst",
                goal="Analyze video content, transcribe speech, and provide educational feedback",
                backstory="""You are an expert educational content analyst with expertise in 
                video analysis, speech recognition, and educational assessment. You provide 
                detailed analysis of student video submissions, including content quality, 
                presentation skills, and educational value.""",
                verbose=True,
                allow_delegation=False,
                llm=self.gemini_llm
            )
            
            task = Task(
                description=f"""
                Analyze the following video submission:
                
                Video URL: {task_data.video_url}
                Student ID: {task_data.student_id}
                Analysis Type: {task_data.analysis_type}
                
                Transcription: {transcription}
                
                Provide a comprehensive analysis including:
                1. Content Quality Assessment
                2. Presentation Skills
                3. Educational Value
                4. Areas for Improvement
                5. Overall Feedback
                
                Provide detailed, constructive feedback that helps the student improve.
                """,
                expected_output="Comprehensive video analysis with detailed feedback",
                agent=gemini_agent
            )
            
            crew = Crew(
                agents=[gemini_agent],
                tasks=[task],
                verbose=True
            )
            
            result = crew.kickoff()
            return str(result)
            
        except Exception as e:
            print(f"Error analyzing video with Gemini: {e}")
            return "Unable to analyze video content. Please try again later."
    
    def _generate_feedback_summary(self, analysis: str) -> str:
        """Generate a concise feedback summary"""
        try:
            summary_task = Task(
                description=f"""
                Create a concise, actionable feedback summary from this detailed analysis:
                
                {analysis}
                
                The summary should:
                - Be 2-3 sentences long
                - Highlight the main strengths
                - Mention 1-2 key areas for improvement
                - Be encouraging and constructive
                """,
                expected_output="Concise feedback summary",
                agent=self.agent
            )
            
            crew = Crew(
                agents=[self.agent],
                tasks=[summary_task],
                verbose=True
            )
            
            result = crew.kickoff()
            return str(result)
            
        except Exception as e:
            print(f"Error generating feedback summary: {e}")
            return "Good work on your video submission! Keep practicing and improving your presentation skills."
    
    def batch_analyze_videos(self, video_tasks: list[VideoAnalysisTask]) -> list[Dict[str, Any]]:
        """Analyze multiple videos in batch"""
        results = []
        
        for task in video_tasks:
            result = self.analyze_video(task)
            results.append(result)
        
        return results
