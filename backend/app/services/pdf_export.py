import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_LEFT

from ..schemas import QuizQuestion


def generate_quiz_pdf(questions: list[QuizQuestion], title: str, difficulty: str) -> bytes:
    """Generate a formatted PDF revision sheet with all questions and answers."""
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    # ── Styles ────────────────────────────────────────────────────────────────
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'QuizTitle',
        parent=styles['Title'],
        fontSize=22,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#1a3a5c'),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        'QuizSubtitle',
        parent=styles['Normal'],
        fontSize=11,
        fontName='Helvetica',
        textColor=colors.HexColor('#555555'),
        spaceAfter=20,
    )
    question_style = ParagraphStyle(
        'QuizQuestion',
        parent=styles['Normal'],
        fontSize=12,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#1a3a5c'),
        spaceBefore=18,
        spaceAfter=6,
    )
    concept_style = ParagraphStyle(
        'QuizConcept',
        parent=styles['Normal'],
        fontSize=9,
        fontName='Helvetica',
        textColor=colors.HexColor('#2E75B6'),
        spaceAfter=6,
    )
    option_style = ParagraphStyle(
        'QuizOption',
        parent=styles['Normal'],
        fontSize=11,
        fontName='Helvetica',
        textColor=colors.HexColor('#333333'),
        leftIndent=16,
        spaceAfter=3,
    )
    correct_option_style = ParagraphStyle(
        'QuizCorrectOption',
        parent=styles['Normal'],
        fontSize=11,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#2E7D32'),
        leftIndent=16,
        spaceAfter=3,
    )
    explanation_style = ParagraphStyle(
        'QuizExplanation',
        parent=styles['Normal'],
        fontSize=10,
        fontName='Helvetica-Oblique',
        textColor=colors.HexColor('#444444'),
        leftIndent=16,
        spaceBefore=4,
        spaceAfter=4,
        backColor=colors.HexColor('#F1F8F1'),
    )

    # ── Build content ─────────────────────────────────────────────────────────
    story = []

    # Header
    story.append(Paragraph(f"Quiz Revision Sheet — {title}", title_style))

    diff_colors = {"easy": "#2E7D32", "medium": "#E65100", "hard": "#C62828"}
    diff_color = diff_colors.get(difficulty, "#1a3a5c")
    story.append(Paragraph(
        f'Difficulty: <font color="{diff_color}"><b>{difficulty.capitalize()}</b></font>'
        f'&nbsp;&nbsp;|&nbsp;&nbsp;Total Questions: <b>{len(questions)}</b>',
        subtitle_style,
    ))
    story.append(HRFlowable(
        width="100%", thickness=2,
        color=colors.HexColor('#2E75B6'),
        spaceAfter=16,
    ))

    # Questions
    for i, q in enumerate(questions):
        story.append(Paragraph(f"Q{i + 1}. {q.question}", question_style))
        story.append(Paragraph(f"Concept: {q.concept}", concept_style))

        for opt in q.options:
            is_correct = opt.label == q.correct_label
            if is_correct:
                story.append(Paragraph(f"✓  {opt.label}.  {opt.text}", correct_option_style))
            else:
                story.append(Paragraph(f"     {opt.label}.  {opt.text}", option_style))

        story.append(Spacer(1, 4))
        story.append(Paragraph(f"💡 {q.explanation}", explanation_style))

        if i < len(questions) - 1:
            story.append(HRFlowable(
                width="100%", thickness=0.5,
                color=colors.HexColor('#DDDDDD'),
                spaceBefore=14,
                spaceAfter=2,
            ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()