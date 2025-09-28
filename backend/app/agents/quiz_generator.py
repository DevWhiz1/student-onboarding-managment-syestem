import json
import uuid
from typing import List

from crewai import Agent, Task, Crew, LLM
from langchain_openai import ChatOpenAI
from litellm import completion
from app.core.config import settings
from app.models.schemas import QuizGenerationTask, Question, QuestionOption


# -----------------------------
# Gemini LLM wrapper for CrewAI
# -----------------------------
class GeminiLLMWrapper(LLM):
    def __init__(self):
        super().__init__(model="gemini-2.5-flash")
    
    def __call__(self, prompt: str, **kwargs):
        """Call Google Gemini using LiteLLM completion API"""
        try:
            response = completion(
                model="google/gemini-2.5-flash",
                messages=[{"role": "user", "content": prompt}],
                temperature=kwargs.get("temperature", 0.7),
                api_key=settings.google_api_key
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error calling Gemini: {e}")
            return ""


# -----------------------------
# Quiz Generator Agent
# -----------------------------
class QuizGeneratorAgent:
    def __init__(self):
        # OpenAI GPT-4 LLM
        self.llm = ChatOpenAI(
            model="gpt-4",
            temperature=0.7,
            openai_api_key=settings.openai_api_key
        )

        # Gemini LLM (fallback)
        self.gemini_llm = GeminiLLMWrapper()

        # CrewAI Agent for quiz generation (using OpenAI by default)
        self.agent = Agent(
            role="Quiz Generator",
            goal="Generate high-quality multiple choice questions for educational quizzes",
            backstory="""You are an expert educational content creator with years of experience 
                         in designing assessments. You create engaging, fair, and educationally valuable 
                         multiple choice questions that test understanding rather than memorization.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    # -----------------------------
    # Main quiz generation
    # -----------------------------
    def generate_quiz(self, task_data: QuizGenerationTask) -> List[Question]:
        """Generate a quiz with multiple choice questions"""

        # Task prompt for the agent
        task_prompt = f"""
        Generate {task_data.num_questions} multiple choice questions for the subject: {task_data.subject}
        Topic: {task_data.topic}
        Difficulty: {task_data.difficulty}

        Each question should have:
        - A clear, well-formulated question
        - 4 answer options (A, B, C, D)
        - Only one correct answer
        - Distractors that are plausible but incorrect
        - Educational value that tests understanding

        Format your response as a JSON array where each question has:
        {{
            "question_text": "The question text",
            "options": [
                {{"id": "A", "text": "Option A text", "is_correct": true/false}},
                {{"id": "B", "text": "Option B text", "is_correct": true/false}},
                {{"id": "C", "text": "Option C text", "is_correct": true/false}},
                {{"id": "D", "text": "Option D text", "is_correct": true/false}}
            ],
            "correct_answer_id": "A/B/C/D",
            "points": 1
        }}
        """

        # Create CrewAI Task
        task = Task(
            description=task_prompt,
            expected_output="A JSON array of well-structured multiple choice questions",
            agent=self.agent
        )

        # Execute Crew
        crew = Crew(agents=[self.agent], tasks=[task], verbose=True)

        try:
            # Run the agent
            result = crew.kickoff()
            questions_data = json.loads(str(result))
            return self._parse_questions(questions_data)
        except Exception as e:
            print(f"Error generating quiz with OpenAI: {e}")
            # Fallback to Gemini
            return self._generate_with_gemini(task_data)

    # -----------------------------
    # Fallback using Gemini
    # -----------------------------
    def _generate_with_gemini(self, task_data: QuizGenerationTask) -> List[Question]:
        """Fallback method using Google Gemini"""

        gemini_agent = Agent(
            role="Quiz Generator",
            goal="Generate high-quality multiple choice questions for educational quizzes",
            backstory="""You are an expert educational content creator with years of experience 
                         in designing assessments. You create engaging, fair, and educationally valuable 
                         multiple choice questions that test understanding rather than memorization.""",
            verbose=True,
            allow_delegation=False,
            llm=self.gemini_llm
        )

        task_prompt = f"""
        Generate {task_data.num_questions} multiple choice questions for the subject: {task_data.subject}
        Topic: {task_data.topic}
        Difficulty: {task_data.difficulty}

        Each question should have:
        - A clear, well-formulated question
        - 4 answer options (A, B, C, D)
        - Only one correct answer
        - Distractors that are plausible but incorrect
        - Educational value that tests understanding

        Format your response as a JSON array where each question has:
        {{
            "question_text": "The question text",
            "options": [
                {{"id": "A", "text": "Option A text", "is_correct": true/false}},
                {{"id": "B", "text": "Option B text", "is_correct": true/false}},
                {{"id": "C", "text": "Option C text", "is_correct": true/false}},
                {{"id": "D", "text": "Option D text", "is_correct": true/false}}
            ],
            "correct_answer_id": "A/B/C/D",
            "points": 1
        }}
        """

        task = Task(
            description=task_prompt,
            expected_output="A JSON array of well-structured multiple choice questions",
            agent=gemini_agent
        )

        crew = Crew(agents=[gemini_agent], tasks=[task], verbose=True)

        try:
            result = crew.kickoff()
            questions_data = json.loads(str(result))
            return self._parse_questions(questions_data)
        except Exception as e:
            print(f"Error generating quiz with Gemini: {e}")
            return self._get_default_questions(task_data.num_questions)

    # -----------------------------
    # Parse JSON into Question objects
    # -----------------------------
    def _parse_questions(self, questions_data: List[dict]) -> List[Question]:
        questions = []
        for q_data in questions_data:
            question = Question(
                id=str(uuid.uuid4()),
                question_text=q_data["question_text"],
                options=[
                    QuestionOption(
                        id=opt["id"],
                        text=opt["text"],
                        is_correct=opt["is_correct"]
                    ) for opt in q_data["options"]
                ],
                correct_answer_id=q_data["correct_answer_id"],
                points=q_data.get("points", 1)
            )
            questions.append(question)
        return questions

    # -----------------------------
    # Default questions if AI fails
    # -----------------------------
    def _get_default_questions(self, num_questions: int) -> List[Question]:
        default_questions = []
        for i in range(num_questions):
            question = Question(
                id=str(uuid.uuid4()),
                question_text=f"Sample question {i+1}: What is the correct answer?",
                options=[
                    QuestionOption(id="A", text="Option A", is_correct=True),
                    QuestionOption(id="B", text="Option B", is_correct=False),
                    QuestionOption(id="C", text="Option C", is_correct=False),
                    QuestionOption(id="D", text="Option D", is_correct=False)
                ],
                correct_answer_id="A",
                points=1
            )
            default_questions.append(question)
        return default_questions
