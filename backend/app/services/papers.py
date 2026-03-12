import json
from typing import List, Dict, Any, Optional
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field

from ..ai import build_structured_chat_model

# Ensure we use structured outputs for reliable API response parsing
class GeneratedMCQ(BaseModel):
    question: str = Field(description="The multiple choice question text")
    options: List[str] = Field(description="Exactly 4 options for the MCQ")
    correct_index: int = Field(description="The index (0-3) of the correct option")
    explanation: str = Field(description="Brief explanation of why the answer is correct")

class GeneratedTrueFalse(BaseModel):
    statement: str = Field(description="A factual statement that is either definitively true or false")
    answer: str = Field(description="Either 'True' or 'False'")
    explanation: str = Field(description="Explanation of why the statement is true or false")

class GeneratedFillInTheBlank(BaseModel):
    sentence: str = Field(description="A sentence with a specific key term replaced by '____'")
    blank_word: str = Field(description="The exact word or short phrase that belongs in the blank")
    context: str = Field(description="Brief explanation of the context")

class GeneratedShortAnswer(BaseModel):
    question: str = Field(description="A focused concept question requiring a 1-3 sentence response")
    ideal_answer: str = Field(description="The ideal, complete short answer")
    keywords: List[str] = Field(description="Key concepts or terms that must be present in a correct answer")

class GeneratedLongAnswer(BaseModel):
    question: str = Field(description="A broad analytical question requiring a multi-paragraph response")
    marking_scheme: str = Field(description="Rubric or breakdown of how marks should be awarded")
    ideal_answer: str = Field(description="A comprehensive example answer")

class GeneratedCaseStudy(BaseModel):
    passage: str = Field(description="A synthesized scenario or detailed passage based on the content. Must be at least 3 paragraphs.")
    sub_questions: List[str] = Field(description="3-5 specific questions based directly on the passage")
    answers: List[str] = Field(description="The detailed answers for each corresponding sub_question")


class PaperService:
    def __init__(self, api_key: str | None = None, model_name: str | None = None):
        self.api_key = api_key
        self.model_name = model_name

    def _get_structured_llm(self, output_schema):
        """Helper to bind structured output to the shared LLM chain."""
        return build_structured_chat_model(
            output_schema,
            temperature=0.7,
            model_name=self.model_name,
            gemini_api_key=self.api_key,
        )

    def generate_mcq(self, text_chunk: str, difficulty: str) -> GeneratedMCQ:
        prompt = PromptTemplate.from_template(
            "Based on the following text, generate a {difficulty} difficulty Multiple Choice Question.\n\n"
            "Text: {text}\n"
        )
        chain = prompt | self._get_structured_llm(GeneratedMCQ)
        return chain.invoke({"text": text_chunk, "difficulty": difficulty})

    def generate_true_false(self, text_chunk: str, difficulty: str) -> GeneratedTrueFalse:
        prompt = PromptTemplate.from_template(
            "Based on the following text, generate a {difficulty} difficulty True/False statement.\n"
            "Make sure the statement is definitively true or definitively false based ONLY on the text.\n\n"
            "Text: {text}\n"
        )
        chain = prompt | self._get_structured_llm(GeneratedTrueFalse)
        return chain.invoke({"text": text_chunk, "difficulty": difficulty})

    def generate_fill_in_the_blank(self, text_chunk: str, difficulty: str) -> GeneratedFillInTheBlank:
        prompt = PromptTemplate.from_template(
            "Based on the following text, extract a critical sentence and replace a key '{difficulty}' concept/word with '____' for a fill-in-the-blank question.\n\n"
            "Text: {text}\n"
        )
        chain = prompt | self._get_structured_llm(GeneratedFillInTheBlank)
        return chain.invoke({"text": text_chunk, "difficulty": difficulty})

    def generate_short_answer(self, text_chunk: str, difficulty: str) -> GeneratedShortAnswer:
        prompt = PromptTemplate.from_template(
            "Based on the following text, generate a {difficulty} difficulty short answer question that tests conceptual understanding.\n\n"
            "Text: {text}\n"
        )
        chain = prompt | self._get_structured_llm(GeneratedShortAnswer)
        return chain.invoke({"text": text_chunk, "difficulty": difficulty})

    def generate_long_answer(self, text_chunks: List[str], difficulty: str) -> GeneratedLongAnswer:
        combined_text = "\\n\\n".join(text_chunks)
        prompt = PromptTemplate.from_template(
            "Based on the following synthesized text chunks, generate a {difficulty} difficulty comprehensive long-answer question that requires critical analysis or synthesis.\n\n"
            "Text:\n{text}\n"
        )
        chain = prompt | self._get_structured_llm(GeneratedLongAnswer)
        return chain.invoke({"text": combined_text, "difficulty": difficulty})

    def generate_case_study(self, text_chunks: List[str], difficulty: str) -> GeneratedCaseStudy:
        combined_text = "\\n\\n".join(text_chunks)
        prompt = PromptTemplate.from_template(
            "Using the concepts in the following text, synthesize a {difficulty} realistic scenario / case study passage.\n"
            "Then, generate analytical questions based on that passage.\n\n"
            "Source Text Concepts:\n{text}\n"
        )
        chain = prompt | self._get_structured_llm(GeneratedCaseStudy)
        return chain.invoke({"text": combined_text, "difficulty": difficulty})

    def _distribute_difficulty(self, difficulty: str, count: int) -> List[str]:
        if difficulty != "mixed":
            return [difficulty] * count
        
        easy_count = max(1, int(count * 0.3))
        hard_count = max(1, int(count * 0.2))
        medium_count = count - easy_count - hard_count
        
        # If count is too small, fallback
        if medium_count < 0:
            return ["medium"] * count
            
        distribution = (["easy"] * easy_count) + (["medium"] * medium_count) + (["hard"] * hard_count)
        import random
        random.shuffle(distribution)
        return distribution
