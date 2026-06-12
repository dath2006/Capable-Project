"""YouTube transcript extraction for educational indexing."""

import re
from urllib.parse import parse_qs, urlparse

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
)


def extract_video_id(url: str) -> str:
    parsed = urlparse(url.strip())
    if parsed.hostname in ("youtu.be",):
        return parsed.path.lstrip("/").split("/")[0]
    if parsed.hostname and "youtube" in parsed.hostname:
        if parsed.path == "/watch":
            qs = parse_qs(parsed.query)
            if "v" in qs:
                return qs["v"][0]
        match = re.match(r"^/(embed|v|shorts)/([^/?]+)", parsed.path)
        if match:
            return match.group(2)
    raise ValueError("Invalid YouTube URL")


def fetch_transcript(url: str) -> dict:
    video_id = extract_video_id(url)
    api = YouTubeTranscriptApi()
    try:
        fetched = api.fetch(
            video_id,
            languages=("en", "en-US", "en-GB", "en-IN"),
        )
    except TranscriptsDisabled as exc:
        raise ValueError("Captions are disabled for this video.") from exc
    except NoTranscriptFound as exc:
        raise ValueError("No transcript available for this video.") from exc
    except VideoUnavailable as exc:
        raise ValueError("Video is unavailable.") from exc
    except Exception as exc:
        raise ValueError(f"Could not fetch transcript: {exc}") from exc

    text = " ".join(snippet.text for snippet in fetched.snippets)
    return {
        "video_id": video_id,
        "title": f"YouTube video {video_id}",
        "transcript": text,
        "word_count": len(text.split()),
        "source_url": url,
    }
