"""
Matching Engine — Powers Study Group Matcher & Internship Recommendations.

Uses cosine similarity on profile embeddings to find compatible matches.
"""

from openai import AzureOpenAI
from app.config import get_settings

settings = get_settings()

openai_client = AzureOpenAI(
    azure_endpoint=settings.azure_openai_endpoint,
    api_key=settings.azure_openai_api_key,
    api_version=settings.azure_openai_api_version,
)


def get_profile_embedding(profile_text: str) -> list[float]:
    """Generate an embedding vector for a student or opportunity profile."""
    response = openai_client.embeddings.create(
        model=settings.azure_openai_embedding_deployment,
        input=[profile_text],
    )
    return response.data[0].embedding


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    mag_a = sum(a * a for a in vec_a) ** 0.5
    mag_b = sum(b * b for b in vec_b) ** 0.5
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot_product / (mag_a * mag_b)


def find_study_matches(student_profile: dict, all_profiles: list[dict], top_k: int = 5) -> list[dict]:
    """
    Match a student with compatible study partners.

    student_profile: {name, courses: [...], learning_style, availability}
    all_profiles: list of other student profiles
    """
    student_text = (
        f"Courses: {', '.join(student_profile['courses'])}. "
        f"Learning style: {student_profile.get('learning_style', 'any')}. "
        f"Available: {student_profile.get('availability', 'flexible')}."
    )
    student_embedding = get_profile_embedding(student_text)

    scored = []
    for profile in all_profiles:
        if profile.get("id") == student_profile.get("id"):
            continue
        profile_text = (
            f"Courses: {', '.join(profile['courses'])}. "
            f"Learning style: {profile.get('learning_style', 'any')}. "
            f"Available: {profile.get('availability', 'flexible')}."
        )
        profile_embedding = get_profile_embedding(profile_text)
        score = cosine_similarity(student_embedding, profile_embedding)
        scored.append({**profile, "match_score": round(score, 3)})

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return scored[:top_k]


def find_internship_matches(student_profile: dict, opportunities: list[dict], top_k: int = 10) -> list[dict]:
    """
    Match a student with relevant internships/jobs.

    student_profile: {name, major, skills: [...], interests}
    opportunities: list of {title, company, description, requirements}
    """
    student_text = (
        f"Major: {student_profile.get('major', '')}. "
        f"Skills: {', '.join(student_profile.get('skills', []))}. "
        f"Interests: {student_profile.get('interests', '')}."
    )
    student_embedding = get_profile_embedding(student_text)

    scored = []
    for opp in opportunities:
        opp_text = f"{opp['title']} at {opp.get('company', '')}. {opp.get('description', '')} Requirements: {opp.get('requirements', '')}"
        opp_embedding = get_profile_embedding(opp_text)
        score = cosine_similarity(student_embedding, opp_embedding)
        scored.append({**opp, "relevance_score": round(score, 3)})

    scored.sort(key=lambda x: x["relevance_score"], reverse=True)
    return scored[:top_k]
