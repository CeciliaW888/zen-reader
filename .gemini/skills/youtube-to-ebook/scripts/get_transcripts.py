"""
Part 2: Extract Transcripts from YouTube Videos
This script takes video IDs and extracts the full transcript (captions).
"""

import time
from youtube_transcript_api import YouTubeTranscriptApi


def get_transcript(video_id):
    """
    Get the transcript for a YouTube video.
    Returns the full text of everything said in the video.
    """
    try:
        # Create an instance of the API (newer version syntax)
        ytt_api = YouTubeTranscriptApi()

        # Fetch the transcript
        transcript_list = ytt_api.fetch(video_id)

        # The transcript comes as a list of segments with timestamps
        # We combine them into one clean text
        full_text = ""
        for segment in transcript_list:
            full_text += segment.text + " "

        return full_text.strip()

    except Exception as e:
        print(f"  ⚠ Error getting transcript: {e}")
        return None


def get_transcripts_for_videos(videos):
    """
    Get transcripts for a list of videos.
    Takes the video list from get_videos.py and adds transcripts.
    """
    print("\nExtracting transcripts...\n")
    print("=" * 60)

    for i, video in enumerate(videos):
        print(f"Getting transcript: {video['title'][:50]}...")

        transcript = get_transcript(video["video_id"])

        if transcript:
            video["transcript"] = transcript
            word_count = len(transcript.split())
            print(f"  ✓ Got {word_count} words\n")
        else:
            video["transcript"] = None
            print(f"  ✗ No transcript available\n")

        # Small delay between requests to avoid rate limiting
        if i < len(videos) - 1:
            time.sleep(2)

    # Filter out videos without transcripts
    videos_with_transcripts = [v for v in videos if v.get("transcript")]

    print("=" * 60)
    print(f"Got transcripts for {len(videos_with_transcripts)} of {len(videos)} videos")

    return videos_with_transcripts


# Test it standalone
if __name__ == "__main__":
    # Test with a sample video
    test_video_id = "dQw4w9WgXcQ"  # Rick Astley - Never Gonna Give You Up
    print("Testing transcript extraction...")
    transcript = get_transcript(test_video_id)
    if transcript:
        print(f"Got transcript! First 200 chars:\n{transcript[:200]}...")
