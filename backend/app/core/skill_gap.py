from typing import List, Dict, Any, Optional

def classify_severity(gap: int) -> str:
    if gap <= 0:
        return "No Gap"
    elif 1 <= gap <= 15:
        return "Low"
    elif 16 <= gap <= 30:
        return "Moderate"
    elif 31 <= gap <= 50:
        return "High"
    else:
        return "Critical"

def generate_explanation(current_level: int, required_level: int, gap: int) -> str:
    if gap > 0:
        return f"Your current level is {current_level} while your target role requires {required_level}, resulting in a gap of {gap}."
    return f"Your current level of {current_level} meets or exceeds the target role requirement of {required_level} (No Gap)."

def calculate_skill_gaps(
    target_role_id: Optional[str],
    role_competencies: List[Dict[str, Any]],
    user_competencies: List[Dict[str, Any]],
    competencies_map: Dict[str, Dict[str, Any]]
) -> List[Dict[str, Any]]:
    if not target_role_id:
        return []

    user_levels: Dict[str, int] = {
        uc["competency_id"]: int(uc.get("current_level", 0))
        for uc in user_competencies
    }

    gaps = []
    for rc in role_competencies:
        comp_id = rc.get("competency_id")
        required_level = int(rc.get("required_level", 0))
        current_level = user_levels.get(comp_id, 0)
        gap = max(0, required_level - current_level)
        severity = classify_severity(gap)
        explanation = generate_explanation(current_level, required_level, gap)

        comp_meta = competencies_map.get(comp_id, {})
        comp_name = comp_meta.get("name", comp_id)
        comp_category = comp_meta.get("category", "General")

        gaps.append({
            "competency_id": comp_id,
            "competency": comp_name,
            "category": comp_category,
            "current_level": current_level,
            "required_level": required_level,
            "gap": gap,
            "severity": severity,
            "explanation": explanation
        })

    # Sort gaps descending by gap size, then by required_level
    gaps.sort(key=lambda x: (x["gap"], x["required_level"]), reverse=True)
    return gaps
