from typing import List, Dict, Any, Optional
from app.core.skill_gap import classify_severity

def calculate_difficulty_score(difficulty: str, avg_user_level: float) -> float:
    diff = (difficulty or "Intermediate").capitalize()
    if avg_user_level <= 35:
        scores = {"Beginner": 10.0, "Intermediate": 7.0, "Advanced": 3.0, "Expert": 1.0}
    elif avg_user_level <= 65:
        scores = {"Intermediate": 10.0, "Beginner": 7.0, "Advanced": 7.0, "Expert": 3.0}
    else:
        scores = {"Advanced": 10.0, "Expert": 8.0, "Intermediate": 6.0, "Beginner": 2.0}
    return scores.get(diff, 5.0)

def generate_recommendation_reason(
    highest_gap_item: Optional[Dict[str, Any]],
    target_role_name: str,
    target_role_matched: bool,
    is_baseline: bool,
    priority: str
) -> str:
    if highest_gap_item:
        comp_name = highest_gap_item["competency"]
        gap = highest_gap_item["gap"]
        severity = highest_gap_item["severity"]
        
        if is_baseline:
            return (
                f"Recommended based on baseline target role requirements for {target_role_name}, "
                f"addressing benchmark threshold in {comp_name}."
            )
        if severity in ["Critical", "High"]:
            return (
                f"Recommended with {priority} priority because it directly addresses your {severity} gap "
                f"({gap} pts) in {comp_name} and supports your target role of {target_role_name}."
            )
        if gap > 0:
            return (
                f"Recommended because it addresses your {severity} gap ({gap} pts) in {comp_name} "
                f"for target role {target_role_name}."
            )
        return (
            f"Recommended to reinforce proficiency in {comp_name}, supporting your target role of {target_role_name}."
        )

    if target_role_matched:
        return f"Recommended because it directly supports curriculum for your target role of {target_role_name}."
    return "Recommended for domain competency development."

def generate_recommendations(
    target_role_id: Optional[str],
    current_role_id: Optional[str],
    user_competencies: List[Dict[str, Any]],
    role_competencies: List[Dict[str, Any]],
    competencies_map: Dict[str, Dict[str, Any]],
    roles_map: Dict[str, Dict[str, Any]],
    all_courses: List[Dict[str, Any]],
    source: Optional[str] = None,
    limit: int = 10
) -> Dict[str, Any]:
    # 1. No target role check
    if not target_role_id:
        return {
            "target_role_id": None,
            "message": "Select a target role to calculate your personalized course recommendations.",
            "count": 0,
            "recommendations": []
        }

    target_role_info = roles_map.get(target_role_id, {})
    target_role_name = target_role_info.get("role_name", target_role_id)

    # 2. Build gap map
    is_baseline = (len(user_competencies) == 0)
    user_levels: Dict[str, int] = {
        uc["competency_id"]: int(uc.get("current_level", 0))
        for uc in user_competencies
    }

    gaps_map: Dict[str, Dict[str, Any]] = {}
    for rc in role_competencies:
        comp_id = rc.get("competency_id")
        req_level = int(rc.get("required_level", 0))
        curr_level = user_levels.get(comp_id, 0)
        gap = max(0, req_level - curr_level)
        sev = classify_severity(gap)
        comp_meta = competencies_map.get(comp_id, {})
        gaps_map[comp_id] = {
            "competency_id": comp_id,
            "competency": comp_meta.get("name", comp_id),
            "category": comp_meta.get("category", "General"),
            "current_level": curr_level,
            "required_level": req_level,
            "gap": gap,
            "severity": sev
        }

    # Optional source filter
    candidate_courses = all_courses
    if source and source.strip():
        req_src = source.strip().lower()
        candidate_courses = [c for c in all_courses if c.get("source", "").lower() == req_src]

    scored_courses = []

    for course in candidate_courses:
        course_comps = course.get("competencies", [])
        course_target_roles = course.get("target_roles", [])
        course_skills = course.get("skills", [])

        # A. Competency Gap Match Score (max 50)
        gap_match_score = 0.0
        matched_gaps = []
        matched_comp_names = []

        for comp_id in course_comps:
            comp_name = competencies_map.get(comp_id, {}).get("name", comp_id)
            if comp_id in gaps_map:
                g_info = gaps_map[comp_id]
                gap_val = g_info["gap"]
                sev = g_info["severity"]

                if sev == "Critical":
                    gap_match_score += 30.0
                elif sev == "High":
                    gap_match_score += 22.0
                elif sev == "Moderate":
                    gap_match_score += 15.0
                elif sev == "Low":
                    gap_match_score += 8.0
                else:
                    gap_match_score += 4.0

                matched_gaps.append({
                    "competency_id": comp_id,
                    "competency": comp_name,
                    "gap": gap_val,
                    "severity": sev
                })
                matched_comp_names.append(comp_name)
            elif comp_id in competencies_map:
                # Competency exists in catalog but not required for this role
                gap_match_score += 2.0
                matched_comp_names.append(comp_name)

        gap_match_score = min(50.0, gap_match_score)

        # B. Target Role Match Score (max 25)
        target_role_matched = target_role_id in course_target_roles
        target_role_match_score = 25.0 if target_role_matched else 0.0

        # C. Current Role & Skill Match Score (max 15)
        skill_match_score = 0.0
        if current_role_id and current_role_id in course_target_roles:
            skill_match_score += 5.0
        # Skills coverage
        if course_skills:
            skill_match_score += min(10.0, len(course_skills) * 4.0)
        skill_match_score = min(15.0, skill_match_score)

        # D. Difficulty Relevance Score (max 10)
        matched_levels = [gaps_map[c]["current_level"] for c in course_comps if c in gaps_map]
        avg_level = (sum(matched_levels) / len(matched_levels)) if matched_levels else (sum(user_levels.values()) / len(user_levels) if user_levels else 0.0)
        diff_score = calculate_difficulty_score(course.get("difficulty", "Intermediate"), avg_level)

        # Total Calculation
        raw_score = gap_match_score + target_role_match_score + skill_match_score + diff_score
        recommendation_score = min(100.0, max(0.0, round(raw_score, 1)))

        # Course relevance filter: must match at least target role or a required competency
        if gap_match_score == 0 and not target_role_matched:
            continue

        # Priority
        if recommendation_score >= 70.0:
            priority = "High"
        elif recommendation_score >= 40.0:
            priority = "Medium"
        else:
            priority = "Low"

        # Explanation
        highest_gap_item = None
        if matched_gaps:
            highest_gap_item = max(matched_gaps, key=lambda x: x["gap"])

        reason = generate_recommendation_reason(
            highest_gap_item=highest_gap_item,
            target_role_name=target_role_name,
            target_role_matched=target_role_matched,
            is_baseline=is_baseline,
            priority=priority
        )

        scored_courses.append({
            "course_id": course.get("course_id"),
            "title": course.get("title"),
            "source": course.get("source"),
            "description": course.get("description"),
            "category": course.get("category"),
            "difficulty": course.get("difficulty"),
            "duration_hours": float(course.get("duration_hours", 0)),
            "recommendation_score": recommendation_score,
            "priority": priority,
            "matched_competencies": matched_comp_names,
            "matched_skills": course_skills,
            "matched_gaps": matched_gaps,
            "reason": reason
        })

    # Sort descending by recommendation_score, then duration
    scored_courses.sort(key=lambda x: (x["recommendation_score"], -x["duration_hours"]), reverse=True)
    top_recommendations = scored_courses[:limit]

    if not top_recommendations:
        return {
            "target_role_id": target_role_id,
            "message": "No relevant courses found matching your current competency gaps.",
            "count": 0,
            "recommendations": []
        }

    msg = (
        "Recommendations based on baseline target role requirements (no competency assessment recorded)."
        if is_baseline
        else f"Personalized recommendations generated based on your competency gaps and target role of {target_role_name}."
    )

    return {
        "target_role_id": target_role_id,
        "message": msg,
        "count": len(top_recommendations),
        "recommendations": top_recommendations
    }
