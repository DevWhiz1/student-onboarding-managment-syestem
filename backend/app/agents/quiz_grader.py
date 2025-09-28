from crewai import Agent, Task, Crew
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings
from app.models.schemas import QuizResult, QuizResponse, Question
from typing import Dict, List
import uuid
from datetime import datetime

class QuizGraderAgent:
    def __init__(self):
        # Initialize OpenAI LLM
        self.llm = ChatOpenAI(
            model="gpt-4",
            temperature=0.1,  # Low temperature for consistent grading
            openai_api_key=settings.openai_api_key
        )
        
        # Initialize Gemini LLM as fallback
        self.gemini_llm = ChatGoogleGenerativeAI(
            model="google/gemini-2.5-flash",
            temperature=0.1,  # Low temperature for consistent grading
            google_api_key=settings.google_api_key
        )
        
        # Create the Quiz Grader Agent
        self.agent = Agent(
            role="Quiz Grader",
            goal="Accurately grade student quiz responses and provide detailed feedback",
            backstory="""You are an experienced educator and assessment specialist with expertise 
            in fair and consistent grading. You evaluate student responses objectively, 
            provide constructive feedback, and ensure accurate score calculation.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
    
    def grade_quiz(self, quiz_response: QuizResponse, quiz_questions: List[Question]) -> QuizResult:
        """Grade a student's quiz response"""
        
        # Calculate score
        score = 0
        total_points = sum(question.points for question in quiz_questions)
        
        # Grade each answer
        for question in quiz_questions:
            student_answer = quiz_response.answers.get(question.id)
            if student_answer == question.correct_answer_id:
                score += question.points
        
        # Calculate percentage
        percentage = (score / total_points * 100) if total_points > 0 else 0
        
        # Create detailed grading task for feedback
        grading_task = Task(
            description=f"""
            Grade the following quiz response and provide detailed feedback:
            
            Student Answers: {quiz_response.answers}
            Quiz Questions: {[{"id": q.id, "question": q.question_text, "correct_answer": q.correct_answer_id} for q in quiz_questions]}
            Score: {score}/{total_points} ({percentage:.1f}%)
            
            Provide:
            1. Overall performance assessment
            2. Areas of strength
            3. Areas for improvement
            4. Specific feedback on incorrect answers
            5. Encouragement and next steps
            
            Keep feedback constructive and educational.
            """,
            expected_output="Detailed grading feedback and analysis",
            agent=self.agent
        )
        
        # Create crew and execute task
        crew = Crew(
            agents=[self.agent],
            tasks=[grading_task],
            verbose=True
        )
        
        try:
            # Execute the task
            result = crew.kickoff()
            feedback = str(result)
        except Exception as e:
            print(f"Error generating feedback: {e}")
            feedback = f"Quiz completed with a score of {score}/{total_points} ({percentage:.1f}%). Keep studying and practicing!"
        
        # Create quiz result
        quiz_result = QuizResult(
            id=str(uuid.uuid4()),
            quiz_id=quiz_response.quiz_id,
            student_id=quiz_response.student_id,
            student_name="",  # Will be filled by the calling function
            answers=quiz_response.answers,
            score=score,
            total_points=total_points,
            percentage=percentage,
            submitted_at=quiz_response.submitted_at or datetime.now(),
            graded_at=datetime.now()
        )
        
        return quiz_result, feedback
    
    def grade_multiple_quizzes(self, quiz_responses: List[QuizResponse], quiz_questions: List[Question]) -> List[QuizResult]:
        """Grade multiple quiz responses efficiently"""
        results = []
        
        for response in quiz_responses:
            result, _ = self.grade_quiz(response, quiz_questions)
            results.append(result)
        
        return results
    
    def generate_class_statistics(self, quiz_results: List[QuizResult]) -> Dict:
        """Generate statistics for a class quiz"""
        if not quiz_results:
            return {}
        
        scores = [result.percentage for result in quiz_results]
        
        statistics = {
            "total_students": len(quiz_results),
            "average_score": sum(scores) / len(scores),
            "highest_score": max(scores),
            "lowest_score": min(scores),
            "pass_rate": len([s for s in scores if s >= 60]) / len(scores) * 100,
            "grade_distribution": {
                "A (90-100)": len([s for s in scores if 90 <= s <= 100]),
                "B (80-89)": len([s for s in scores if 80 <= s <= 89]),
                "C (70-79)": len([s for s in scores if 70 <= s <= 79]),
                "D (60-69)": len([s for s in scores if 60 <= s <= 69]),
                "F (0-59)": len([s for s in scores if 0 <= s <= 59])
            }
        }
        
        return statistics
