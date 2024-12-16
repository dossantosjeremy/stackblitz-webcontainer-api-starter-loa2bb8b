import whisper
import csv
import os
import time
import sys

def format_time(seconds):
    minutes, secs = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return f"{int(hours):02d}:{int(minutes):02d}:{int(secs):02d}"

if len(sys.argv) < 3:
    print("Please provide the path to the audio file and language code as command-line arguments.")
    sys.exit(1)

# Get the audio file path and language from command-line arguments
audio_file = sys.argv[1]
language = sys.argv[2]

# Map of supported languages
LANGUAGE_MAP = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'pt': 'Portuguese'
}

if language not in LANGUAGE_MAP:
    print(f"Unsupported language code: {language}")
    print(f"Supported languages: {', '.join(LANGUAGE_MAP.keys())}")
    sys.exit(1)

# Load the Whisper model
model = whisper.load_model("base")

# If the audio file exists, proceed with transcription
if os.path.exists(audio_file):
    # Load the audio file
    audio = whisper.load_audio(audio_file)
    # Get the total duration of the audio
    total_duration = len(audio) / model.dims.n_audio_ctx
    # Transcribe the audio in the specified language
    result = model.transcribe(audio, language=language, task="transcribe")
    # Write the transcribed text with timestamps to a CSV file
    output_file = os.path.splitext(audio_file)[0] + "_transcription.csv"
    with open(output_file, "w", newline='', encoding="utf-8") as csvfile:
        csv_writer = csv.writer(csvfile)
        csv_writer.writerow(["Start Time", "End Time", "Text"])  # Write header
        start_time = time.time()
        total_segments = len(result["segments"])
        for i, segment in enumerate(result["segments"], 1):
            start_timestamp = format_time(segment['start'])
            end_timestamp = format_time(segment['end'])
            text = segment['text'].strip()
            csv_writer.writerow([start_timestamp, end_timestamp, text])
            # Print each row as it's being written
            print(f"{start_timestamp} - {end_timestamp}: {text}")
            # Calculate and print progress
            progress = i / total_segments
            elapsed_time = time.time() - start_time
            estimated_total_time = elapsed_time / progress
            remaining_time = estimated_total_time - elapsed_time
            print(f"\nProgress: {progress:.2%}")
            print(f"Time elapsed: {format_time(elapsed_time)}")
            print(f"Estimated time remaining: {format_time(remaining_time)}")
            print(f"Processed {i}/{total_segments} segments")
            print("-" * 50)
    print("\nTranscription completed!")
    print(f"Total time taken: {format_time(time.time() - start_time)}")
    print(f"Transcription with timestamps saved to '{output_file}'.")
else:
    print("Audio file not found.")
