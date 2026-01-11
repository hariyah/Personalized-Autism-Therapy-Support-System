"""Script to generate 'what it does' and 'how to do it' descriptions for activities using LLM."""
import sys
import os
import json
import asyncio
from typing import List, Dict, Any

# Add parent directory to path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.llm_providers import get_llm_provider
from app.vector_store import ActivityVectorStore
from app.config import settings


def format_activities_for_prompt(activities: List[Dict[str, Any]]) -> str:
    """Format activities as JSON for the prompt."""
    formatted = []
    for act in activities:
        formatted.append({
            "activity_id": str(act.get('id', act.get('_id', ''))),
            "activity_name": act.get('activity_name', 'Unknown'),
            "domain": act.get('domain', ''),
            "goal": act.get('goal', ''),
            "skills_targeted": act.get('skills_targeted', []),
            "materials": act.get('materials', []),
            "step_instructions": act.get('step_instructions', ''),
            "age_range": act.get('age_range', ''),
            "difficulty": act.get('difficulty', ''),
        })
    return json.dumps(formatted, indent=2)


async def generate_descriptions(activities: List[Dict[str, Any]], batch_size: int = 10) -> List[Dict[str, Any]]:
    """Generate descriptions for activities using LLM in batches."""
    llm_provider = get_llm_provider()
    results = []
    
    # Process in batches to avoid overwhelming the LLM
    for i in range(0, len(activities), batch_size):
        batch = activities[i:i + batch_size]
        print(f"Processing batch {i//batch_size + 1}/{(len(activities) + batch_size - 1)//batch_size} ({len(batch)} activities)...")
        
        activities_json = format_activities_for_prompt(batch)
        
        system_prompt = """You are an assistant helping caregivers follow autism-friendly activities.

For EACH activity below, write:
1) What it does: 1–2 simple sentences explaining the purpose/benefit.
2) How to do it: 3–5 short, step-by-step instructions.

Keep language simple and practical.
Do NOT add new activities or extra materials beyond what is listed.
Return JSON only."""

        user_prompt = f"""ACTIVITIES:
{activities_json}

OUTPUT JSON FORMAT:
{{
  "activities": [
    {{
      "activity_id": "0",
      "what_it_does": "",
      "how_to_do_it": ["", "", ""]
    }}
  ]
}}"""

        try:
            response = await llm_provider.generate_text(system_prompt, user_prompt)
            
            # Parse JSON response
            response_text = response.strip()
            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            parsed = json.loads(response_text)
            batch_results = parsed.get('activities', [])
            results.extend(batch_results)
            print(f"  ✓ Generated descriptions for {len(batch_results)} activities")
            
        except Exception as e:
            print(f"  ✗ Error processing batch: {e}")
            # Add placeholder entries for failed batch
            for act in batch:
                results.append({
                    "activity_id": str(act.get('id', act.get('_id', ''))),
                    "what_it_does": f"This activity helps with {act.get('goal', 'development')}.",
                    "how_to_do_it": ["Follow the activity instructions provided."]
                })
    
    return results


async def main():
    """Main function to generate activity descriptions."""
    print("Loading activities from vector store...")
    
    # Load vector store
    vector_store = ActivityVectorStore()
    if not vector_store.load():
        print("Error: Vector store not found. Please run: python app/load_activities.py first.")
        return
    
    activities = vector_store.metadata
    print(f"Loaded {len(activities)} activities")
    
    # Ask user how many to process
    print(f"\nTotal activities: {len(activities)}")
    try:
        num_to_process = input("How many activities to process? (Enter number or 'all' for all): ").strip()
        if num_to_process.lower() == 'all':
            num_to_process = len(activities)
        else:
            num_to_process = int(num_to_process)
            if num_to_process > len(activities):
                num_to_process = len(activities)
    except ValueError:
        print("Invalid input. Processing all activities.")
        num_to_process = len(activities)
    
    activities_to_process = activities[:num_to_process]
    print(f"\nProcessing {len(activities_to_process)} activities...")
    
    # Generate descriptions
    results = await generate_descriptions(activities_to_process, batch_size=10)
    
    # Save results
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_file = os.path.join(backend_dir, "activity_descriptions.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({"activities": results}, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Generated descriptions for {len(results)} activities")
    print(f"✓ Saved to {output_file}")
    
    # Show sample
    if results:
        print("\nSample result:")
        print(json.dumps(results[0], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())

