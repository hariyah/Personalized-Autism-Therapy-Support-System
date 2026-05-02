"""Seed script to populate the database with sample activities."""
from app.database import get_database


SAMPLE_ACTIVITIES = [
    {
        "name": "Color Sorting Game",
        "category": "attention",
        "skill_targets": ["attention", "categorization", "fine motor"],
        "materials": ["colored blocks", "sorting containers"],
        "steps": [
            "Place colored blocks in a mixed pile",
            "Show child one color at a time",
            "Ask child to find all blocks of that color",
            "Place matching blocks in designated container",
            "Repeat for each color"
        ],
        "duration_minutes": 15,
        "difficulty": "easy",
        "sensory_load": {"sound": "low", "light": "low", "touch": "med"},
        "safety_notes": "Ensure blocks are large enough to avoid choking hazard. Supervise closely.",
        "suitable_ages": [3, 4, 5, 6, 7]
    },
    {
        "name": "Memory Card Matching",
        "category": "memory",
        "skill_targets": ["memory", "visual processing", "attention"],
        "materials": ["picture cards", "matching pairs"],
        "steps": [
            "Place cards face down in grid",
            "Child flips two cards",
            "If match, keep cards and go again",
            "If no match, flip back and next turn",
            "Continue until all pairs found"
        ],
        "duration_minutes": 20,
        "difficulty": "medium",
        "sensory_load": {"sound": "low", "light": "low", "touch": "low"},
        "safety_notes": "Use cards with clear, simple images. Start with fewer pairs for beginners.",
        "suitable_ages": [4, 5, 6, 7, 8, 9]
    },
    {
        "name": "Emotion Faces Drawing",
        "category": "emotion",
        "skill_targets": ["emotion recognition", "expression", "fine motor"],
        "materials": ["paper", "crayons", "emotion cards"],
        "steps": [
            "Show child emotion card (happy, sad, angry)",
            "Discuss what the emotion looks like",
            "Child draws a face showing that emotion",
            "Talk about when they might feel that way",
            "Repeat with different emotions"
        ],
        "duration_minutes": 25,
        "difficulty": "medium",
        "sensory_load": {"sound": "low", "light": "med", "touch": "low"},
        "safety_notes": "Provide comfortable seating. Allow child to express emotions safely.",
        "suitable_ages": [5, 6, 7, 8, 9, 10]
    },
    {
        "name": "Obstacle Course",
        "category": "motor",
        "skill_targets": ["gross motor", "coordination", "body awareness"],
        "materials": ["cushions", "cones", "tunnel", "balance beam"],
        "steps": [
            "Set up safe obstacle course",
            "Demonstrate each obstacle",
            "Child navigates course step by step",
            "Provide encouragement and support",
            "Repeat course 2-3 times"
        ],
        "duration_minutes": 30,
        "difficulty": "medium",
        "sensory_load": {"sound": "med", "light": "med", "touch": "high"},
        "safety_notes": "Ensure all obstacles are stable and safe. Clear space of hazards. Supervise closely.",
        "suitable_ages": [4, 5, 6, 7, 8, 9, 10]
    },
    {
        "name": "Social Story Reading",
        "category": "social",
        "skill_targets": ["social understanding", "communication", "attention"],
        "materials": ["social story book", "quiet space"],
        "steps": [
            "Find quiet, comfortable space",
            "Read social story together",
            "Pause to discuss pictures and actions",
            "Ask simple questions about the story",
            "Relate story to child's experiences"
        ],
        "duration_minutes": 15,
        "difficulty": "easy",
        "sensory_load": {"sound": "low", "light": "low", "touch": "low"},
        "safety_notes": "Choose stories appropriate to child's communication level. Keep sessions short if needed.",
        "suitable_ages": [3, 4, 5, 6, 7, 8, 9, 10]
    },
    {
        "name": "Puzzle Assembly",
        "category": "attention",
        "skill_targets": ["attention", "problem-solving", "visual-spatial"],
        "materials": ["age-appropriate puzzle"],
        "steps": [
            "Show completed puzzle picture",
            "Dump pieces on table",
            "Start with edge pieces",
            "Work inward section by section",
            "Celebrate completion"
        ],
        "duration_minutes": 20,
        "difficulty": "medium",
        "sensory_load": {"sound": "low", "light": "med", "touch": "low"},
        "safety_notes": "Choose puzzle with appropriate piece count. Ensure pieces are not too small.",
        "suitable_ages": [4, 5, 6, 7, 8, 9, 10, 11]
    },
    {
        "name": "Simon Says Game",
        "category": "attention",
        "skill_targets": ["attention", "following directions", "body awareness"],
        "materials": ["none"],
        "steps": [
            "Explain 'Simon says' rules",
            "Give simple commands (touch nose, clap hands)",
            "Child follows if command starts with 'Simon says'",
            "If no 'Simon says', child should not follow",
            "Gradually increase complexity"
        ],
        "duration_minutes": 15,
        "difficulty": "medium",
        "sensory_load": {"sound": "med", "light": "low", "touch": "low"},
        "safety_notes": "Keep commands simple and safe. Adjust for child's attention span.",
        "suitable_ages": [5, 6, 7, 8, 9, 10]
    },
    {
        "name": "Sequencing Story Cards",
        "category": "memory",
        "skill_targets": ["memory", "sequencing", "narrative skills"],
        "materials": ["story sequence cards"],
        "steps": [
            "Show cards in mixed order",
            "Child arranges cards in correct sequence",
            "Child tells story using cards",
            "Discuss beginning, middle, end",
            "Mix and repeat"
        ],
        "duration_minutes": 20,
        "difficulty": "medium",
        "sensory_load": {"sound": "low", "light": "med", "touch": "low"},
        "safety_notes": "Start with 3-card sequences, increase gradually. Use clear, simple images.",
        "suitable_ages": [5, 6, 7, 8, 9, 10, 11]
    },
    {
        "name": "Calm Down Sensory Bottle",
        "category": "emotion",
        "skill_targets": ["emotion regulation", "self-calming", "attention"],
        "materials": ["clear bottle", "water", "glitter", "food coloring"],
        "steps": [
            "Fill bottle with water",
            "Add glitter and food coloring",
            "Seal bottle securely",
            "Demonstrate shaking and watching",
            "Child uses when feeling overwhelmed"
        ],
        "duration_minutes": 15,
        "difficulty": "easy",
        "sensory_load": {"sound": "low", "light": "med", "touch": "low"},
        "safety_notes": "Ensure bottle is securely sealed. Supervise use. Not for children who might open bottle.",
        "suitable_ages": [4, 5, 6, 7, 8, 9, 10]
    },
    {
        "name": "Balloon Volleyball",
        "category": "social",
        "skill_targets": ["social interaction", "turn-taking", "gross motor"],
        "materials": ["balloon", "string or net"],
        "steps": [
            "Set up string/net at appropriate height",
            "Demonstrate hitting balloon over",
            "Take turns hitting balloon",
            "Count hits together",
            "Celebrate cooperation"
        ],
        "duration_minutes": 20,
        "difficulty": "easy",
        "sensory_load": {"sound": "low", "light": "med", "touch": "low"},
        "safety_notes": "Use balloon (not ball) for safety. Clear space. Watch for overstimulation.",
        "suitable_ages": [4, 5, 6, 7, 8, 9, 10]
    },
    {
        "name": "Pattern Block Building",
        "category": "attention",
        "skill_targets": ["attention", "pattern recognition", "fine motor"],
        "materials": ["pattern blocks", "pattern cards"],
        "steps": [
            "Show pattern card",
            "Child selects matching blocks",
            "Child arranges blocks to match pattern",
            "Check accuracy together",
            "Try new pattern"
        ],
        "duration_minutes": 20,
        "difficulty": "medium",
        "sensory_load": {"sound": "low", "light": "med", "touch": "med"},
        "safety_notes": "Ensure blocks are age-appropriate size. Start with simple patterns.",
        "suitable_ages": [4, 5, 6, 7, 8, 9]
    },
    {
        "name": "Name That Sound",
        "category": "memory",
        "skill_targets": ["auditory memory", "sound recognition", "attention"],
        "materials": ["sound clips or objects that make sounds"],
        "steps": [
            "Play or make a sound",
            "Child identifies the sound",
            "Discuss where sound comes from",
            "Repeat with different sounds",
            "Create sound memory game"
        ],
        "duration_minutes": 15,
        "difficulty": "medium",
        "sensory_load": {"sound": "high", "light": "low", "touch": "low"},
        "safety_notes": "Keep volume moderate. Watch for sound sensitivity. Allow breaks if needed.",
        "suitable_ages": [4, 5, 6, 7, 8, 9, 10]
    },
    {
        "name": "Yoga Poses for Kids",
        "category": "motor",
        "skill_targets": ["body awareness", "balance", "calming"],
        "materials": ["yoga mat", "pose cards"],
        "steps": [
            "Show pose card",
            "Demonstrate pose",
            "Child tries pose with support",
            "Hold pose for 10-15 seconds",
            "Try 3-5 different poses"
        ],
        "duration_minutes": 20,
        "difficulty": "easy",
        "sensory_load": {"sound": "low", "light": "low", "touch": "med"},
        "safety_notes": "Use simple, safe poses. Support child as needed. Stop if any discomfort.",
        "suitable_ages": [5, 6, 7, 8, 9, 10, 11]
    },
    {
        "name": "Turn-Taking Board Game",
        "category": "social",
        "skill_targets": ["social interaction", "turn-taking", "following rules"],
        "materials": ["simple board game"],
        "steps": [
            "Explain game rules simply",
            "Demonstrate taking turns",
            "Play game together",
            "Praise turn-taking",
            "Celebrate playing together"
        ],
        "duration_minutes": 25,
        "difficulty": "medium",
        "sensory_load": {"sound": "low", "light": "med", "touch": "low"},
        "safety_notes": "Choose age-appropriate game. Keep rules simple. Allow breaks if needed.",
        "suitable_ages": [5, 6, 7, 8, 9, 10, 11]
    },
    {
        "name": "Texture Exploration Box",
        "category": "emotion",
        "skill_targets": ["sensory processing", "calming", "exploration"],
        "materials": ["box", "various textured items (fabric, sandpaper, soft items)"],
        "steps": [
            "Present texture box",
            "Child explores items one at a time",
            "Describe textures together",
            "Child chooses favorite textures",
            "Discuss how textures feel"
        ],
        "duration_minutes": 15,
        "difficulty": "easy",
        "sensory_load": {"sound": "low", "light": "low", "touch": "high"},
        "safety_notes": "Ensure all items are safe and clean. Watch for overstimulation. Allow child to stop anytime.",
        "suitable_ages": [3, 4, 5, 6, 7, 8]
    },
    {
        "name": "Following Directions Scavenger Hunt",
        "category": "attention",
        "skill_targets": ["following directions", "attention", "problem-solving"],
        "materials": ["picture cards", "items to find"],
        "steps": [
            "Give child picture card",
            "Child finds matching item in room",
            "Bring item back",
            "Give next card",
            "Complete 3-5 items"
        ],
        "duration_minutes": 20,
        "difficulty": "medium",
        "sensory_load": {"sound": "med", "light": "med", "touch": "low"},
        "safety_notes": "Ensure safe environment. Use clear, simple pictures. Supervise closely.",
        "suitable_ages": [4, 5, 6, 7, 8, 9]
    },
    {
        "name": "Rhythm Clapping Game",
        "category": "memory",
        "skill_targets": ["auditory memory", "rhythm", "attention"],
        "materials": ["none"],
        "steps": [
            "Demonstrate simple clap pattern",
            "Child repeats pattern",
            "Increase pattern complexity gradually",
            "Take turns creating patterns",
            "Celebrate success"
        ],
        "duration_minutes": 15,
        "difficulty": "medium",
        "sensory_load": {"sound": "high", "light": "low", "touch": "low"},
        "safety_notes": "Keep volume moderate. Watch for sound sensitivity. Start with very simple patterns.",
        "suitable_ages": [5, 6, 7, 8, 9, 10]
    }
]


async def seed_activities():
    """Seed the database with sample activities."""
    db = get_database()
    
    # Check if activities already exist
    existing_count = await db.activities.count_documents({})
    if existing_count > 0:
        print(f"Database already has {existing_count} activities. Skipping seed.")
        return
    
    # Insert activities
    result = await db.activities.insert_many(SAMPLE_ACTIVITIES)
    print(f"Seeded {len(result.inserted_ids)} activities into database.")


if __name__ == "__main__":
    import asyncio
    from app.database import connect_to_mongo, close_mongo_connection
    
    async def main():
        await connect_to_mongo()
        await seed_activities()
        await close_mongo_connection()
    
    asyncio.run(main())

