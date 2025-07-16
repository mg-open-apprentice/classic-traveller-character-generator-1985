from flask import Flask, render_template, jsonify, request
import character_generation_rules as chargen
import json
import os
import re
import argparse

app = Flask(__name__)

# Parse command line arguments
parser = argparse.ArgumentParser(description='Classic Traveller Character Generator')
parser.add_argument('--seed', type=int, default=77, help='Random seed for character generation (default: 77)')
args = parser.parse_args()

# Global seed for this run
GLOBAL_SEED = args.seed

# Temporary storage for the current character (in a real app, this would be persistent)
current_character = None

def get_character_json_path(name):
    # Sanitize name for filename (remove unsafe characters)
    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', name)
    return f'{safe_name}.json'

def save_character_to_file():
    global current_character
    if current_character is not None and "name" in current_character:
        path = get_character_json_path(current_character["name"])
        with open(path, 'w') as f:
            json.dump(current_character, f, indent=2)

def load_character_from_file(name):
    global current_character
    path = get_character_json_path(name)
    if os.path.exists(path):
        with open(path, 'r') as f:
            current_character = json.load(f)
    else:
        current_character = None

# Helper function to get RNG with global seed
def get_rng():
    return chargen.set_seed(GLOBAL_SEED)

# Helper function to determine if commission button should be shown

def can_show_commission_button(character_record):
    # 1. Injured: check last survival outcome
    last_survival_outcome = None
    for event in reversed(character_record.get('career_history', [])):
        if event.get('event_type') == 'survival_check':
            last_survival_outcome = event.get('outcome')
            break
    if last_survival_outcome == 'injured':
        return False
    # 2. Drafted
    if character_record.get('drafted', False):
        return False
    # 3. Already commissioned
    if character_record.get('commissioned', False):
        return False
    # 4. Career is Scouts or Others
    career = character_record.get('career', '').lower()
    if career in ['scouts', 'others']:
        return False
    return True

# Helper function to determine if promotion button should be shown

def can_show_promotion_button(character_record):
    # 1. Injured: check last survival outcome
    last_survival_outcome = None
    for event in reversed(character_record.get('career_history', [])):
        if event.get('event_type') == 'survival_check':
            last_survival_outcome = event.get('outcome')
            break
    if last_survival_outcome == 'injured':
        return False
    # 2. Drafted
    if character_record.get('drafted', False):
        return False
    # 3. Career is Scouts or Others
    career = character_record.get('career', '').lower()
    if career in ['scouts', 'others']:
        return False
    # 4. If commission was attempted and failed this term, cannot promote
    if character_record.get('commission_failed_this_term', False):
        return False
    # 5. Promotion is available to both commissioned and non-commissioned characters
    return True

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/create_character', methods=['POST'])
def api_create_character():
    global current_character
    
    rng = get_rng()
    current_character = chargen.create_character_record()
    current_character["name"] = chargen.generate_character_name(rng)
    current_character["upp"] = "______"  # Reset UPP for new character
    current_character["seed"] = GLOBAL_SEED  # Store the seed used for this character
    save_character_to_file()
    
    return jsonify({
        "success": True,
        "name": current_character["name"],
        "age": current_character["age"],
        "terms_served": current_character["terms_served"],
        "upp": current_character["upp"]
    })

@app.route('/api/generate_characteristic', methods=['POST'])
def api_generate_characteristic():
    global current_character
    
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    
    data = request.get_json()
    characteristic = data.get('characteristic')
    
    if not characteristic:
        return jsonify({"success": False, "error": "Characteristic not specified"}), 400
    
    # Map characteristic to UPP position
    char_to_upp_index = {
        'strength': 0,
        'dexterity': 1,
        'endurance': 2,
        'intelligence': 3,
        'education': 4,
        'social': 5
    }
    
    if characteristic not in char_to_upp_index:
        return jsonify({"success": False, "error": "Invalid characteristic"}), 400
    
    # For now, create a fresh RNG (we'll need persistence for proper state management)
    rng = get_rng()
    
    # Generate the characteristic value
    value = chargen.generate_characteristic(rng, characteristic)
    
    # Store in character record
    current_character["characteristics"][characteristic] = value
    
    # Convert to hex (10=A, 11=B, 12=C)
    hex_char = str(value) if value < 10 else chr(65 + value - 10)
    
    # Update the UPP string in current_character
    upp_list = list(current_character["upp"])
    upp_list[char_to_upp_index[characteristic]] = hex_char
    current_character["upp"] = ''.join(upp_list)
    save_character_to_file()
    
    return jsonify({
        "success": True,
        "characteristic": characteristic,
        "value": value,
        "hex": hex_char,
        "upp": current_character["upp"]
    })

@app.route('/api/enlist', methods=['POST'])
def api_enlist():
    global current_character
    
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    
    data = request.get_json()
    service = data.get('service')
    
    if not service:
        return jsonify({"success": False, "error": "Service not specified"}), 400
    
    # For now, create a fresh RNG (we'll need persistence for proper state management)
    rng = get_rng()
    
    # Attempt enlistment
    current_character = chargen.attempt_enlistment(rng, current_character, service)
    save_character_to_file()
    
    # Get the enlistment result from the character's career history
    enlistment_result = current_character["career_history"][-1]  # Last entry

    # Determine if commission/promotion buttons should be shown
    show_commission = can_show_commission_button(current_character)
    show_promotion = can_show_promotion_button(current_character)
    
    # Format response for frontend
    response_data = {
        "success": True,
        "enlistment_result": {
            "assigned_service": enlistment_result["assigned_service"],
            "outcome": enlistment_result["outcome"],
            "roll": enlistment_result["roll"],
            "target": enlistment_result["target"],
            "modifier": enlistment_result["modifier"],
            "modifier_details": enlistment_result["modifier_details"]
        },
        "show_commission": show_commission,
        "show_promotion": show_promotion
    }
    
    return jsonify(response_data)

@app.route('/api/survival', methods=['POST'])
def api_survival():
    global current_character
    
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    
    # For now, create a fresh RNG (we'll need persistence for proper state management)
    rng = get_rng()
    
    # Check survival
    current_character = chargen.check_survival(rng, current_character)
    save_character_to_file()
    
    # Get the survival result from the character's career history
    survival_result = current_character["career_history"][-1]  # Last entry
    outcome = survival_result.get("outcome", "")
    
    # Get skill eligibility count
    skill_eligibility = current_character.get("skill_eligibility", 0)
    ready_for_skills = current_character.get("ready_for_skills", False)

    # Determine if commission/promotion buttons should be shown, and if medical button should be shown
    if outcome == "injured":
        show_commission = False
        show_promotion = False
        show_medical = True
    else:
        show_commission = can_show_commission_button(current_character)
        show_promotion = can_show_promotion_button(current_character)
        show_medical = False
    
    # Format response for frontend
    response_data = {
        "success": True,
        "survival_result": {
            "outcome": survival_result["outcome"],
            "roll": survival_result["roll"],
            "target": survival_result["target"],
            "modifier": survival_result["modifier"],
            "modifier_details": survival_result["modifier_details"]
        },
        "skill_eligibility": skill_eligibility,
        "ready_for_skills": ready_for_skills,
        "show_commission": show_commission,
        "show_promotion": show_promotion,
        "show_medical": show_medical,
        "character": current_character  # Include character data for frontend updates
    }
    
    return jsonify(response_data)

@app.route('/api/commission', methods=['POST'])
def api_commission():
    global current_character
    
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    
    # For now, create a fresh RNG (we'll need persistence for proper state management)
    rng = get_rng()
    
    # Check commission
    current_character = chargen.check_commission(rng, current_character)
    save_character_to_file()
    
    # Get the commission result from the character's career history
    commission_result = current_character["career_history"][-1]  # Last entry
    
    # Get skill eligibility count
    skill_eligibility = current_character.get("skill_eligibility", 0)

    # Determine if commission button should be shown
    show_commission = can_show_commission_button(current_character)
    # Determine if promotion button should be shown
    show_promotion = can_show_promotion_button(current_character)
    
    # Format response for frontend
    response_data = {
        "success": True,
        "commission_result": {
            "success": commission_result.get("success"),
            "outcome": commission_result.get("outcome"),
            "roll": commission_result.get("roll"),
            "target": commission_result.get("target"),
            "modifier": commission_result.get("modifier"),
            "modifier_details": commission_result.get("modifier_details"),
            "rank": commission_result.get("rank"),
            "career": commission_result.get("career")
        },
        "skill_eligibility": skill_eligibility,
        "show_commission": show_commission,
        "show_promotion": show_promotion,
        "character": current_character  # Include character data for frontend updates
    }
    
    return jsonify(response_data)

@app.route('/api/promotion', methods=['POST'])
def api_promotion():
    global current_character

    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400

    # For now, create a fresh RNG (we'll need persistence for proper state management)
    rng = get_rng()

    # Check promotion
    current_character = chargen.check_promotion(rng, current_character)
    save_character_to_file()

    # Get the promotion result from the character's career history
    promotion_result = current_character["career_history"][-1]  # Last entry

    # Get skill eligibility count
    skill_eligibility = current_character.get("skill_eligibility", 0)

    # Determine if promotion button should be shown
    show_promotion = can_show_promotion_button(current_character)

    # Format response for frontend
    response_data = {
        "success": True,
        "promotion_result": {
            "success": promotion_result.get("success"),
            "outcome": promotion_result.get("outcome"),
            "roll": promotion_result.get("roll"),
            "target": promotion_result.get("target"),
            "modifier": promotion_result.get("modifier"),
            "modifier_details": promotion_result.get("modifier_details"),
            "rank": promotion_result.get("rank"),
            "career": promotion_result.get("career")
        },
        "skill_eligibility": skill_eligibility,
        "show_promotion": show_promotion,
        "character": current_character  # Include character data for frontend updates
    }

    return jsonify(response_data)

@app.route('/api/resolve_skill', methods=['POST'])
def api_resolve_skill():
    global current_character

    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400

    data = request.get_json() or {}
    table_choice = data.get('table_choice')  # Optional

    # Use the same RNG as elsewhere
    rng = get_rng()

    try:
        current_character = chargen.resolve_skill(rng, current_character, table_choice)
        save_character_to_file()
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

    # Get the last skill event for feedback
    skill_event = None
    for event in reversed(current_character.get("career_history", [])):
        if event.get("event_type") == "skill_resolution":
            skill_event = event
            break

    # Check if ready for ageing and, if so, advance to ageing automatically
    ageing_report = None
    available_options = None
    if current_character.get("ready_for_ageing", False):
        current_character = chargen.check_ageing(rng, current_character)
        save_character_to_file()
        # Find the latest ageing event for reporting
        ageing_events = [e for e in current_character.get('career_history', []) if e.get('event_type') == 'ageing_check']
        ageing_report = ageing_events[-1] if ageing_events else None
        # Get reenlistment options after ageing is complete
        available_options = chargen.get_available_reenlistment_options(current_character)

    return jsonify({
        "success": True,
        "skill_event": skill_event,
        "skill_eligibility": current_character.get("skill_eligibility", 0),
        "ready_for_skills": current_character.get("ready_for_skills", False),
        "ready_for_ageing": current_character.get("ready_for_ageing", False),
        "ageing_report": ageing_report,
        "character": current_character,
        "available_options": available_options
    })

@app.route('/api/available_skill_tables', methods=['GET'])
def api_available_skill_tables():
    global current_character
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    available_tables = chargen.get_available_skill_tables(current_character)
    return jsonify({"success": True, "available_tables": available_tables})

@app.route('/api/ageing', methods=['POST'])
def api_ageing():
    global current_character
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400

    # Use a consistent seed for now (should be improved for real randomness/persistence)
    rng = get_rng()

    # Call the ageing logic
    current_character = chargen.check_ageing(rng, current_character)
    save_character_to_file()

    # Find the latest ageing event for reporting
    ageing_events = [e for e in current_character.get('career_history', []) if e.get('event_type') == 'ageing_check']
    latest_ageing = ageing_events[-1] if ageing_events else {}

    # Get reenlistment options after ageing is complete
    available_options = chargen.get_available_reenlistment_options(current_character)

    return jsonify({
        "success": True,
        "age": current_character.get("age"),
        "ageing_report": latest_ageing,
        "character": current_character,
        "available_options": available_options
    })

@app.route('/api/reenlist', methods=['POST'])
def api_reenlist():
    global current_character
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400

    data = request.get_json() or {}
    preference = data.get('preference', 'reenlist')

    rng = get_rng()
    try:
        current_character = chargen.attempt_reenlistment(rng, current_character, preference)
        
        # Get the last reenlistment event for feedback
        reenlistment_result = None
        for event in reversed(current_character.get("career_history", [])):
            if event.get("event_type") == "reenlistment_attempt":
                reenlistment_result = event
                break
        
        # If successfully reenlisted, reset term progression flags
        if reenlistment_result and reenlistment_result.get("continue_career", False):
            # Reset term-specific flags for new term
            current_character["ready_for_skills"] = False
            current_character["ready_for_ageing"] = False
            current_character["skill_eligibility"] = 0
            current_character["survival_outcome"] = "pending"
            
            # Add clear signal for new term
            reenlistment_result["new_term_started"] = True
        
        save_character_to_file()
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

    available_options = chargen.get_available_reenlistment_options(current_character)

    # Determine routing based on outcome
    route = "continue"
    if reenlistment_result:
        outcome = reenlistment_result.get("outcome")
        if outcome in ["discharged", "retired", "medical_discharge"]:
            route = "mustering_out"

    return jsonify({
        "success": True,
        "reenlistment_result": reenlistment_result,
        "character": current_character,
        "available_options": available_options,
        "new_term": reenlistment_result and reenlistment_result.get("continue_career", False),
        "term_number": current_character.get("terms_served", 0),
        "route": route
    })

if __name__ == '__main__':
    print(f"Classic Traveller Character Generator starting with seed: {GLOBAL_SEED}")
    print("To use a different seed, run: python app.py --seed <number>")
    print("Example: python app.py --seed 42")
    print("Example: python app.py --seed 12345")
    print("Default seed is 77 if not specified")
    print("-" * 50)
    # No character is loaded at startup, as we don't know the name
    app.run(debug=True) 