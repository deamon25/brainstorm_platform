"""
AI Idea Clustering using Groq API (Llama 3.3 70B)

Groups brainstorming ideas into thematic clusters and generates
session-level insights and recommendations.
"""
import json
import logging
import re

from groq import Groq
from core.config import settings

logger = logging.getLogger(__name__)

# Color palette for clusters (frontend will use these)
CLUSTER_COLORS = [
    {"bg": "bg-amber-50", "border": "border-amber-200", "text": "text-amber-700", "icon": "text-amber-500", "badge": "bg-amber-100"},
    {"bg": "bg-green-50", "border": "border-green-200", "text": "text-green-700", "icon": "text-green-500", "badge": "bg-green-100"},
    {"bg": "bg-slate-50", "border": "border-slate-200", "text": "text-slate-700", "icon": "text-slate-500", "badge": "bg-slate-100"},
    {"bg": "bg-indigo-50", "border": "border-indigo-200", "text": "text-indigo-700", "icon": "text-indigo-500", "badge": "bg-indigo-100"},
    {"bg": "bg-blue-50", "border": "border-blue-200", "text": "text-blue-700", "icon": "text-blue-500", "badge": "bg-blue-100"},
    {"bg": "bg-rose-50", "border": "border-rose-200", "text": "text-rose-700", "icon": "text-rose-500", "badge": "bg-rose-100"},
    {"bg": "bg-teal-50", "border": "border-teal-200", "text": "text-teal-700", "icon": "text-teal-500", "badge": "bg-teal-100"},
]

# Icon names the frontend can map to lucide-react icons
CLUSTER_ICONS = ["Lightbulb", "Users", "Settings", "Star", "Zap", "TrendingUp", "Shield"]


class IdeaClusterer:
    """Cluster brainstorming ideas into thematic groups using Groq LLM"""

    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            if not settings.GROQ_API_KEY:
                raise RuntimeError("GROQ_API_KEY is not set")
            self._client = Groq(api_key=settings.GROQ_API_KEY)
        return self._client

    def cluster_ideas(self, ideas: list[dict]) -> dict:
        """
        Cluster a list of ideas into thematic groups.

        Args:
            ideas: List of idea dicts, each with at least:
                   _id, original_text, rephrased_text, entities, tags,
                   participant_id, created_at

        Returns:
            dict with keys: clusters, summary
        """
        if not ideas:
            return {
                "clusters": [],
                "summary": {
                    "overview": "No ideas to cluster.",
                    "insights": [],
                    "recommendations": ["Start adding ideas to your brainstorming session."],
                },
            }

        if not settings.GROQ_API_KEY:
            logger.warning("GROQ_API_KEY not set, returning single-cluster fallback")
            return self._fallback_single_cluster(ideas)

        try:
            client = self._get_client()

            # Build the idea list for the prompt
            idea_lines = []
            for idx, idea in enumerate(ideas):
                text = idea.get("rephrased_text") or idea.get("original_text", "")
                entities = idea.get("entities", [])
                tags = idea.get("tags", [])
                entity_str = ", ".join(e.get("text", "") for e in entities if e.get("text"))
                tag_str = ", ".join(tags) if tags else ""
                meta_parts = []
                if entity_str:
                    meta_parts.append(f"entities: {entity_str}")
                if tag_str:
                    meta_parts.append(f"tags: {tag_str}")
                meta = f" ({'; '.join(meta_parts)})" if meta_parts else ""
                idea_lines.append(f"  {idx + 1}. [ID:{idea.get('_id', idx)}] {text}{meta}")

            ideas_block = "\n".join(idea_lines)
            num_ideas = len(ideas)

            prompt = f"""You are an AI brainstorming analyst. You will receive {num_ideas} ideas from a collaborative brainstorming session. Your job is to:

1. Group the ideas into 2-7 thematic clusters based on semantic similarity.
2. Name each cluster with a short theme title (2-5 words).
3. Write a one-sentence summary for each cluster.
4. Write a brief overall session overview (1-2 sentences).
5. Generate exactly 3 key insights about the session themes.
6. Generate exactly 3 actionable recommendations.

IDEAS:
{ideas_block}

Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{{
  "clusters": [
    {{
      "name": "Cluster Theme Name",
      "summary": "One sentence describing this cluster.",
      "idea_ids": ["id1", "id2"]
    }}
  ],
  "summary": {{
    "overview": "Overall session overview sentence.",
    "insights": [
      {{"icon": "📊", "text": "Insight 1"}},
      {{"icon": "💡", "text": "Insight 2"}},
      {{"icon": "⚖️", "text": "Insight 3"}}
    ],
    "recommendations": [
      "Recommendation 1",
      "Recommendation 2",
      "Recommendation 3"
    ]
  }}
}}

Rules:
- Every idea MUST appear in exactly one cluster.
- Use the original idea IDs (the values after "ID:") in idea_ids arrays.
- Do NOT invent ideas. Only use the ones provided.
- Use emoji icons for insights (📊 💡 ⚖️ 🔥 🎯 📈 🚀 etc.).
- Output ONLY the JSON object, nothing else."""

            result = self._generate_cluster_json_with_retry(client, prompt)
            return self._enrich_clusters(result, ideas)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Groq clustering response: {e}")
            return self._fallback_single_cluster(ideas)
        except Exception as e:
            logger.error(f"Idea clustering failed: {e}")
            return self._fallback_single_cluster(ideas)

    def _generate_cluster_json_with_retry(self, client: Groq, prompt: str) -> dict:
        """Call Groq and parse JSON robustly, retrying once if needed."""
        last_error = None

        for attempt in range(2):
            try:
                temperature = 0.2 if attempt == 0 else 0.0
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a brainstorming analyst. Return only valid JSON with double quotes.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=temperature,
                    max_tokens=4096,
                )

                raw = (response.choices[0].message.content or "").strip()
                parsed = self._parse_llm_json(raw)

                if isinstance(parsed, dict) and isinstance(parsed.get("clusters"), list):
                    return parsed

                raise ValueError("Parsed response missing 'clusters' list")
            except Exception as e:
                last_error = e
                logger.warning(f"Cluster JSON parse attempt {attempt + 1} failed: {e}")

        raise RuntimeError(f"Groq clustering parse failed after retries: {last_error}")

    @staticmethod
    def _parse_llm_json(raw: str) -> dict:
        """
        Parse LLM output into JSON.

        Handles common wrappers:
        - markdown code fences
        - extra prose before/after JSON
        """
        text = raw.strip()

        # Remove fenced code block markers while preserving body
        if text.startswith("```"):
            lines = text.splitlines()
            # Drop first fence line and trailing fence line if present
            if lines:
                lines = lines[1:]
            if lines and lines[-1].strip().startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()

        # First try direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Fallback: extract the outermost JSON object from surrounding text
        first = text.find("{")
        last = text.rfind("}")
        if first != -1 and last != -1 and last > first:
            candidate = text[first:last + 1]
            return json.loads(candidate)

        # Last fallback: regex to find a likely JSON object chunk
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            return json.loads(match.group(0))

        raise ValueError("No valid JSON object found in LLM output")

    def _enrich_clusters(self, llm_result: dict, ideas: list[dict]) -> dict:
        """
        Enrich LLM output with full idea data, colors, and icons.
        Maps idea IDs back to original idea objects.
        """
        # Build a lookup by ID (string)
        idea_map = {}
        for idea in ideas:
            idea_id = str(idea.get("_id", ""))
            idea_map[idea_id] = idea

        clusters = []
        assigned_ids = set()

        for idx, cluster in enumerate(llm_result.get("clusters", [])):
            cluster_id = cluster.get("name", f"cluster_{idx}").lower().replace(" ", "_")
            color = CLUSTER_COLORS[idx % len(CLUSTER_COLORS)]
            icon = CLUSTER_ICONS[idx % len(CLUSTER_ICONS)]

            cluster_ideas = []
            for idea_id in cluster.get("idea_ids", []):
                idea_id_str = str(idea_id)
                idea_obj = idea_map.get(idea_id_str)
                if idea_obj:
                    assigned_ids.add(idea_id_str)
                    cluster_ideas.append(self._format_idea(idea_obj))

            clusters.append({
                "id": cluster_id,
                "name": cluster.get("name", f"Cluster {idx + 1}"),
                "icon": icon,
                "color": color,
                "summary": cluster.get("summary", ""),
                "ideas": cluster_ideas,
            })

        # Catch any unassigned ideas into an "Other" cluster
        unassigned = [idea for idea in ideas if str(idea.get("_id", "")) not in assigned_ids]
        if unassigned:
            idx = len(clusters)
            clusters.append({
                "id": "other",
                "name": "Other Ideas",
                "icon": "Layers",
                "color": CLUSTER_COLORS[idx % len(CLUSTER_COLORS)],
                "summary": "Ideas that didn't fit neatly into other themes.",
                "ideas": [self._format_idea(i) for i in unassigned],
            })

        return {
            "clusters": clusters,
            "summary": llm_result.get("summary", {
                "overview": "Clustering complete.",
                "insights": [],
                "recommendations": [],
            }),
        }

    @staticmethod
    def _format_idea(idea: dict) -> dict:
        """Format a single idea for the frontend."""
        return {
            "id": str(idea.get("_id", "")),
            "text": idea.get("rephrased_text") or idea.get("original_text", ""),
            "original_text": idea.get("original_text", ""),
            "author": idea.get("participant_id") or "Anonymous",
            "time": idea.get("created_at", ""),
            "tags": idea.get("tags", []),
            "entities": idea.get("entities", []),
            "is_hesitant": idea.get("is_hesitant", False),
        }

    def _fallback_single_cluster(self, ideas: list[dict]) -> dict:
        """Fallback when LLM is unavailable — put all ideas in one cluster."""
        return {
            "clusters": [
                {
                    "id": "all_ideas",
                    "name": "All Ideas",
                    "icon": "Layers",
                    "color": CLUSTER_COLORS[0],
                    "summary": "All brainstorming ideas from this session.",
                    "ideas": [self._format_idea(i) for i in ideas],
                }
            ],
            "summary": {
                "overview": f"Session contains {len(ideas)} idea(s). AI clustering is unavailable.",
                "insights": [],
                "recommendations": ["Try again later when the AI service is available."],
            },
        }


# Module-level singleton
idea_clusterer = IdeaClusterer()
