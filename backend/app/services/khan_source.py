"""Khan Academy topic discovery via public search pages."""

import re
from urllib.parse import quote_plus

import httpx

KHAN_SEARCH = "https://www.khanacademy.org/search"
KHAN_TOPIC_API = "https://www.khanacademy.org/api/v1/topic"


def search_khan_topics(query: str, limit: int = 8) -> list[dict]:
    """Return Khan Academy topic links and titles for a search query."""
    results: list[dict] = []
    encoded = quote_plus(query.strip())

    try:
        with httpx.Client(timeout=15.0, follow_redirects=True) as client:
            response = client.get(
                KHAN_SEARCH,
                params={"page_search_query": query.strip()},
                headers={"User-Agent": "Capable-Project-EduBot/1.0"},
            )
            if response.status_code == 200:
                # Titles and relative links from search HTML
                titles = re.findall(
                    r'data-testid="search-result-title"[^>]*>([^<]+)<',
                    response.text,
                )
                links = re.findall(r'href="(/[^"]+)"[^>]*data-testid="search-result"', response.text)
                if not links:
                    links = re.findall(
                        r'href="(/math/[^"]+|/science/[^"]+|/humanities/[^"]+)"',
                        response.text,
                    )
                for title, path in zip(titles, links):
                    if len(results) >= limit:
                        break
                    results.append(
                        {
                            "title": title.strip(),
                            "url": f"https://www.khanacademy.org{path}",
                            "platform": "khan_academy",
                        }
                    )
    except httpx.HTTPError:
        pass

    if not results:
        results.append(
            {
                "title": f"Search Khan Academy: {query}",
                "url": f"{KHAN_SEARCH}?page_search_query={encoded}",
                "platform": "khan_academy",
            }
        )

    return results[:limit]


def get_topic_children(slug: str) -> list[dict]:
    """Fetch child topics from Khan's public topic API when available."""
    try:
        with httpx.Client(timeout=12.0) as client:
            response = client.get(f"{KHAN_TOPIC_API}/{slug}")
            if response.status_code != 200:
                return []
            data = response.json()
            children = data.get("childTopics") or data.get("children") or []
            return [
                {
                    "title": c.get("title", c.get("slug", "Topic")),
                    "slug": c.get("slug"),
                    "url": f"https://www.khanacademy.org/{c.get('relative_url', c.get('slug', ''))}",
                    "platform": "khan_academy",
                }
                for c in children[:10]
                if isinstance(c, dict)
            ]
    except (httpx.HTTPError, ValueError):
        return []
