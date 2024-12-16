# Replace the entire content of synthesize.py with this:
import sys
import json
from ollama import Client

def create_prompt(text, synthesis_type, template_type):
    base_prompts = {
        "summary": f"""Create a chapter-by-chapter summary of the following content:

{text}

Format the summary with clear chapter breaks and key points for each section.""",

        "minutes": f"""Create detailed meeting minutes from the following transcript:

{text}

Include:
1. Date and attendees (if mentioned)
2. Main discussion points
3. Decisions made
4. Follow-up items""",

        "actions": f"""Extract all action items and deadlines from the following content:

{text}

Format as:
- Action Item
- Owner (if mentioned)
- Deadline
- Priority (if can be inferred)""",

        "title": f"""Suggest 5 clear and concise titles for the following content:

{text}

Provide titles that:
1. Capture the main topic
2. Are clear and professional
3. Are appropriate for the content type""",

        "outline": f"""Create a detailed content outline from the following text:

{text}

Format as:
I. Main Topic
   A. Subtopic
      1. Key Point
      2. Supporting Details""",

        "key-points": f"""Identify and summarize the key discussion points from:

{text}

Format as:
1. Main Point
   - Supporting details
   - Relevant quotes
   - Implications"""
    }

    template_modifiers = {
        "meeting": "Focus on business outcomes, decisions, and next steps.",
        "lecture": "Focus on educational concepts, theories, and examples.",
        "interview": "Focus on questions, responses, and key insights.",
        "general": "Provide a general-purpose analysis."
    }

    prompt = base_prompts.get(synthesis_type, base_prompts["summary"])
    prompt += f"\n\n{template_modifiers.get(template_type, template_modifiers['general'])}"

    return prompt

def synthesize_clips(text, synthesis_type="summary", template_type="general"):
    try:
        client = Client(host='http://localhost:11434')

        prompt = create_prompt(text, synthesis_type, template_type)

        response = client.generate(
            model='llama2',
            prompt=prompt,
            stream=False,
            options={
                'temperature': 0.7,
                'top_p': 0.9,
                'top_k': 40,
            }
        )

        return response['response']
    except Exception as e:
        print(f"Error occurred during synthesis: {str(e)}", file=sys.stderr)
        return None

if __name__ == "__main__":
    # Read input JSON from stdin
    try:
        input_data = json.loads(sys.stdin.read().strip())
        text = input_data.get('text', '')
        synthesis_type = input_data.get('type', 'summary')
        template_type = input_data.get('template', 'general')
    except json.JSONDecodeError:
        print("Invalid JSON input", file=sys.stderr)
        sys.exit(1)

    if not text:
        print("No input text provided", file=sys.stderr)
        sys.exit(1)

    result = synthesize_clips(text, synthesis_type, template_type)

    if result:
        print(result)
    else:
        sys.exit(1)
