from flask import Flask, render_template, jsonify, request
import character_generation_rules as chargen
import json
import os
import re
import argparse
import csv

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
    return f'characters/{safe_name}.json'

def add_calculated_fields(character_record):
    """Add calculated fields to character record for API responses"""
    if character_record:
        # Check if career is complete (has mustered out)
        has_mustered_out = bool(character_record.get("mustering_out_benefits"))
        print(f"DEBUG: Character has mustered out: {has_mustered_out}")  # Debug line
        
        if has_mustered_out:
            # Career is complete - no current term
            character_record["current_term"] = None
            character_record["career_status"] = "complete"
            print(f"DEBUG: Set career status to complete")  # Debug line
        else:
            # Career is ongoing - calculate current term
            character_record["current_term"] = chargen.get_current_term_number(character_record)
            character_record["career_status"] = "active"
            print(f"DEBUG: Set career status to active, term {character_record['current_term']}")  # Debug line
    return character_record

def save_character_to_file():
    global current_character
    if current_character is not None and "name" in current_character:
        # Ensure characters directory exists
        os.makedirs('characters', exist_ok=True)
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

# NOTE: Frontend business logic functions removed per state-control-rules.md
# Frontend now uses rdy_for_* flags directly from backend responses

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/create_character', methods=['POST'])
def api_create_character():
    global current_character
    
    # Only create new character if no current character exists
    if current_character is not None:
        return jsonify({
            "success": False, 
            "error": "Character already exists. Archive current character first.",
            "current_character_name": current_character.get("name", "Unknown")
        }), 400
    
    # Create completely fresh character with unique seed for each character
    import time
    import random
    
    # Generate a unique seed for this character based on time
    unique_seed = GLOBAL_SEED + int(time.time() * 1000) % 1000000
    
    # Use unique seed for both name generation and character generation
    temp_rng = random.Random(unique_seed)
    
    current_character = chargen.create_character_record()
    current_character["name"] = chargen.generate_character_name(temp_rng)
    current_character["upp"] = "______"  # Reset UPP for new character
    current_character["seed"] = unique_seed  # Store the unique seed used for this character
    
    # Set up RNG with unique seed for character generation
    rng = chargen.set_seed(unique_seed)
    chargen.save_random_state(current_character, rng)  # Initialize RNG state with unique seed
    save_character_to_file()
    print(f"DEBUG: Created new character: {current_character['name']} with seed: {unique_seed}")
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
    rng = chargen.get_random_generator(current_character)
    value = chargen.generate_characteristic(rng, characteristic)
    chargen.save_random_state(current_character, rng)
    current_character["characteristics"][characteristic] = value
    hex_char = str(value) if value < 10 else chr(65 + value - 10)
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
    rng = chargen.get_random_generator(current_character)
    current_character = chargen.attempt_enlistment(rng, current_character, service)
    chargen.save_random_state(current_character, rng)
    save_character_to_file()
    enlistment_result = current_character["career_history"][-1]
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
        "character": add_calculated_fields(current_character.copy())
    }
    return jsonify(response_data)

@app.route('/api/survival', methods=['POST'])
def api_survival():
    global current_character
    print(f"DEBUG: Survival API called. Current character exists: {current_character is not None}")
    if current_character:
        print(f"DEBUG: Character name: {current_character.get('name', 'Unknown')}")
        print(f"DEBUG: Character has career_history: {'career_history' in current_character}")
        if 'career_history' in current_character:
            print(f"DEBUG: Career history length: {len(current_character['career_history'])}")
    
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    
    try:
        rng = chargen.get_random_generator(current_character)
        current_character = chargen.check_survival(rng, current_character)
        chargen.save_random_state(current_character, rng)
        save_character_to_file()
        survival_result = current_character["career_history"][-1]
    except Exception as e:
        print(f"DEBUG: Error in survival check: {str(e)}")
        return jsonify({"success": False, "error": f"Survival check failed: {str(e)}"}), 400
    response_data = {
        "success": True,
        "survival_result": {
            "outcome": survival_result["outcome"],
            "roll": survival_result["roll"],
            "target": survival_result["target"],
            "modifier": survival_result["modifier"],
            "modifier_details": survival_result["modifier_details"]
        },
        "character": add_calculated_fields(current_character.copy())
    }
    return jsonify(response_data)

@app.route('/api/commission', methods=['POST'])
def api_commission():
    global current_character
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    rng = chargen.get_random_generator(current_character)
    current_character = chargen.check_commission(rng, current_character)
    chargen.save_random_state(current_character, rng)
    save_character_to_file()
    commission_result = current_character["career_history"][-1]
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
        "character": add_calculated_fields(current_character.copy())
    }
    return jsonify(response_data)

@app.route('/api/promotion', methods=['POST'])
def api_promotion():
    global current_character
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    rng = chargen.get_random_generator(current_character)
    current_character = chargen.check_promotion(rng, current_character)
    chargen.save_random_state(current_character, rng)
    save_character_to_file()
    promotion_result = current_character["career_history"][-1]
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
        "character": add_calculated_fields(current_character.copy())
    }
    return jsonify(response_data)

@app.route('/api/resolve_skill', methods=['POST'])
def api_resolve_skill():
    global current_character
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    data = request.get_json() or {}
    table_choice = data.get('table_choice')
    rng = chargen.get_random_generator(current_character)
    try:
        current_character = chargen.resolve_skill(rng, current_character, table_choice)
        chargen.save_random_state(current_character, rng)
        save_character_to_file()
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400
    skill_event = None
    for event in reversed(current_character.get("career_history", [])):
        if event.get("event_type") == "skill_resolution":
            skill_event = event
            break
    
    available_options = chargen.get_available_reenlistment_options(current_character)
    
    return jsonify({
        "success": True,
        "skill_event": skill_event,
        "character": add_calculated_fields(current_character.copy()),
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
    rng = chargen.get_random_generator(current_character)
    current_character = chargen.check_ageing(rng, current_character)
    chargen.save_random_state(current_character, rng)
    save_character_to_file()
    ageing_events = [e for e in current_character.get('career_history', []) if e.get('event_type') == 'ageing_check']
    latest_ageing = ageing_events[-1] if ageing_events else {}
    available_options = chargen.get_available_reenlistment_options(current_character)
    
    return jsonify({
        "success": True,
        "age": current_character.get("age"),
        "ageing_report": latest_ageing,
        "character": add_calculated_fields(current_character.copy()),
        "available_options": available_options
    })

@app.route('/api/reenlist', methods=['POST'])
def api_reenlist():
    global current_character
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    data = request.get_json() or {}
    preference = data.get('preference', 'reenlist')
    rng = chargen.get_random_generator(current_character)
    try:
        current_character = chargen.attempt_reenlistment(rng, current_character, preference)
        chargen.save_random_state(current_character, rng)
        # Get the last reenlistment event for feedback
        reenlistment_result = None
        for event in reversed(current_character.get("career_history", [])):
            if event.get("event_type") == "reenlistment_attempt":
                reenlistment_result = event
                break
        save_character_to_file()
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400
    available_options = chargen.get_available_reenlistment_options(current_character)
    route = "continue"
    if reenlistment_result is not None:
        outcome = reenlistment_result.get("outcome")
        if outcome in ["discharged", "retired", "medical_discharge"]:
            route = "mustering_out"
    
    return jsonify({
        "success": True,
        "reenlistment_result": reenlistment_result,
        "character": add_calculated_fields(current_character.copy()),
        "available_options": available_options,
        "new_term": reenlistment_result and reenlistment_result.get("continue_career", False),
        "term_number": current_character.get("terms_served", 0) + 1,  # Current term being played
        "route": route
    })

@app.route('/api/muster_out_info', methods=['GET'])
def api_muster_out_info():
    global current_character
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    
    # Calculate total rolls available
    terms_served = current_character.get('terms_served', 0)
    rank = current_character.get('rank', 0)
    
    total_rolls = int(terms_served)
    if 1 <= rank <= 2:
        total_rolls += 1
    elif 3 <= rank <= 4:
        total_rolls += 2
    elif 5 <= rank <= 6:
        total_rolls += 3
    
    # Maximum cash rolls is the minimum of 3 and total_rolls
    max_cash_rolls = min(3, total_rolls)
    
    return jsonify({
        "success": True,
        "total_rolls": total_rolls,
        "max_cash_rolls": max_cash_rolls,
        "terms_served": terms_served,
        "rank": rank
    })

@app.route('/api/muster_out', methods=['POST'])
def api_muster_out():
    global current_character
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    data = request.get_json() or {}
    cash_rolls = int(data.get('cash_rolls', 0))
    rng = chargen.get_random_generator(current_character)
    try:
        current_character = chargen.perform_mustering_out(rng, current_character, cash_rolls)
        chargen.save_random_state(current_character, rng)
        save_character_to_file()
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400
    return jsonify({
        "success": True,
        "character": add_calculated_fields(current_character.copy()),
        "mustering_out": current_character.get("mustering_out_benefits", {}),
        "career_complete": True  # Signal to frontend that career is finished (but not auto-archived)
    })

@app.route('/api/archive_character', methods=['POST'])
def api_archive_character():
    global current_character
    if not current_character:
        return jsonify({"success": False, "error": "No character to archive"}), 400
    
    if not current_character.get("name"):
        return jsonify({"success": False, "error": "Character has no name to archive"}), 400
    
    try:
        character_name = current_character.get("name")
        save_character_to_file()  # Save current character to archive
        print(f"DEBUG: Manually archived character: {character_name}")
        
        # Clear current character state after successful archive (Option B behavior)
        current_character = None
        
        return jsonify({
            "success": True,
            "message": f"Character '{character_name}' archived successfully",
            "character_name": character_name
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Archive failed: {str(e)}"}), 500

@app.route('/api/get_available_actions', methods=['GET'])
def api_get_available_actions():
    """
    Backend-driven UI: Returns list of actions available to the current character.
    Frontend displays buttons based solely on this response.
    """
    global current_character
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    
    available_actions = []
    
    # Check characteristics generation phase
    if current_character.get('upp') == '______':
        available_actions = ['generate_characteristics']
    
    # Check enlistment phase
    elif not current_character.get('career'):
        available_actions = ['enlist']
    
    # Check service phase actions based on readiness flags
    else:
        if current_character.get('rdy_for_survival_check', False):
            available_actions.append('survival')
        
        if current_character.get('rdy_for_commission_check', False):
            available_actions.append('commission')
        
        if current_character.get('rdy_for_promotion_check', False):
            available_actions.append('promotion')
        
        if current_character.get('skill_roll_eligibility', 0) > 0:
            available_actions.append('skills')
        
        if current_character.get('rdy_for_ageing_check', False):
            available_actions.append('ageing')
        
        if current_character.get('rdy_for_reenlistment', False):
            available_actions.append('reenlistment')
        
        if current_character.get('rdy_for_muster_out', False):
            available_actions.append('muster_out')
    
    return jsonify({
        "success": True,
        "available_actions": available_actions,
        "character": add_calculated_fields(current_character.copy())
    })

@app.route('/api/get_rank_title', methods=['POST'])
def api_get_rank_title():
    global current_character
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    
    service = current_character.get('career', '')
    rank = current_character.get('rank', 0)
    
    rank_title = chargen.get_rank_title(service, rank)
    
    return jsonify({
        "success": True,
        "rank_title": rank_title,
        "service": service,
        "rank": rank
    })

@app.route('/api/calculate_probability', methods=['POST'])
def api_calculate_probability():
    data = request.get_json() or {}
    target = data.get('target')
    modifiers = data.get('modifiers', 0)
    
    if target is None:
        return jsonify({"success": False, "error": "Target number required"}), 400
    
    try:
        target = int(target)
        modifiers = int(modifiers)
        probability_data = chargen.calculate_success_probability(target, modifiers)
        
        return jsonify({
            "success": True,
            "probability": probability_data
        })
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Invalid target or modifiers"}), 400

@app.route('/api/career_survival', methods=['POST'])
def api_career_survival():
    data = request.get_json() or {}
    service = data.get('service')
    characteristics = data.get('characteristics', {})
    num_terms = data.get('num_terms', 1)
    
    if not service:
        return jsonify({"success": False, "error": "Service required"}), 400
    
    if service not in ['Navy', 'Marines', 'Army', 'Scouts', 'Merchants', 'Others']:
        return jsonify({"success": False, "error": "Invalid service"}), 400
    
    try:
        num_terms = int(num_terms)
        if num_terms < 1:
            return jsonify({"success": False, "error": "Number of terms must be at least 1"}), 400
        
        survival_data = chargen.career_survival(service, characteristics, num_terms)
        
        return jsonify({
            "success": True,
            "survival_data": survival_data
        })
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Invalid parameters"}), 400

@app.route('/api/reenlistment_options', methods=['GET'])
def api_reenlistment_options():
    """
    Get available reenlistment options for the current character
    """
    global current_character
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    
    try:
        options = chargen.get_reenlistment_options(current_character)
        return jsonify({
            "success": True,
            "options": options
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/enlistment_bonus_requirements', methods=['GET'])
def api_enlistment_bonus_requirements():
    """
    Get all enlistment bonus requirements for UI highlighting purposes.
    Returns ALL potential bonuses, not just those the character qualifies for.
    """
    try:
        bonus_requirements = chargen.get_enlistment_bonus_requirements()
        return jsonify({
            "success": True,
            "bonus_requirements": bonus_requirements
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/career_probabilities', methods=['GET'])
def api_career_probabilities():
    """
    Unified API for all career action probabilities
    Returns pre-calculated, pre-sorted, pre-formatted probabilities for all applicable career actions
    """
    global current_character
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    
    try:
        result = {
            "success": True,
            "enlistment": [],
            "survival": None,
            "commission": None,
            "promotion": None,
            "reenlistment": None
        }
        
        # 1. ENLISTMENT PROBABILITIES (only if no career yet)
        if not current_character.get("career") and current_character.get("characteristics"):
            services = ['Navy', 'Marines', 'Army', 'Scouts', 'Merchants', 'Others']
            enlistment_data = []
            
            for service in services:
                try:
                    target, modifiers, modifier_details = chargen.get_enlistment_requirements(service, current_character)
                    prob_data = chargen.calculate_success_probability(target, modifiers)
                    
                    enlistment_data.append({
                        "service": service,
                        "percentage": f"{prob_data['percentage']:.0f}%",
                        "raw_percentage": prob_data["percentage"],
                        "target": target,
                        "modifiers": modifiers,
                        "description": prob_data["description"]
                    })
                except Exception as e:
                    enlistment_data.append({
                        "service": service,
                        "percentage": "0%",
                        "raw_percentage": 0,
                        "error": str(e)
                    })
            
            # Sort by probability (highest first) - backend does the sorting
            result["enlistment"] = sorted(enlistment_data, key=lambda x: x["raw_percentage"], reverse=True)
        
        # 2. SURVIVAL PROBABILITY (if character has career)
        if current_character.get("career") and current_character.get("rdy_for_survival_check"):
            try:
                target, modifiers, modifier_details = chargen.get_survival_requirements(current_character)
                prob_data = chargen.calculate_success_probability(target, modifiers)
                
                result["survival"] = {
                    "service": current_character["career"],
                    "percentage": f"{prob_data['percentage']:.0f}%",
                    "raw_percentage": prob_data["percentage"],
                    "target": target,
                    "modifiers": modifiers,
                    "description": prob_data["description"],
                    "applicable": True
                }
            except Exception as e:
                result["survival"] = {"applicable": False, "error": str(e)}
        
        # 3. COMMISSION PROBABILITY (if eligible)
        if current_character.get("career") and current_character.get("rdy_for_commission_check"):
            try:
                target, modifiers, modifier_details = chargen.get_commission_requirements(current_character)
                if target is not None:  # Commission is possible
                    prob_data = chargen.calculate_success_probability(target, modifiers)
                    
                    result["commission"] = {
                        "service": current_character["career"],
                        "percentage": f"{prob_data['percentage']:.0f}%",
                        "raw_percentage": prob_data["percentage"],
                        "target": target,
                        "modifiers": modifiers,
                        "description": prob_data["description"],
                        "applicable": True
                    }
                else:
                    result["commission"] = {
                        "applicable": False,
                        "reason": modifier_details[0] if modifier_details else "Not eligible"
                    }
            except Exception as e:
                result["commission"] = {"applicable": False, "error": str(e)}
        
        # 4. PROMOTION PROBABILITY (if eligible)
        if current_character.get("career") and current_character.get("rdy_for_promotion_check"):
            try:
                target, modifiers, modifier_details = chargen.get_promotion_requirements(current_character)
                if target is not None:  # Promotion is possible
                    prob_data = chargen.calculate_success_probability(target, modifiers)
                    
                    result["promotion"] = {
                        "service": current_character["career"],
                        "percentage": f"{prob_data['percentage']:.0f}%",
                        "raw_percentage": prob_data["percentage"],
                        "target": target,
                        "modifiers": modifiers,
                        "description": prob_data["description"],
                        "applicable": True
                    }
                else:
                    result["promotion"] = {
                        "applicable": False,
                        "reason": modifier_details[0] if modifier_details else "Not eligible"
                    }
            except Exception as e:
                result["promotion"] = {"applicable": False, "error": str(e)}
        
        # 5. REENLISTMENT PROBABILITY (if eligible)
        if current_character.get("career") and current_character.get("rdy_for_reenlistment"):
            try:
                career = current_character.get("career")
                target = chargen.tables.REENLISTMENT_TARGETS[career]
                modifiers = 0  # Classic Traveller has no reenlistment modifiers
                prob_data = chargen.calculate_success_probability(target, modifiers)
                
                result["reenlistment"] = {
                    "service": career,
                    "percentage": f"{prob_data['percentage']:.0f}%",
                    "raw_percentage": prob_data["percentage"],
                    "target": target,
                    "modifiers": modifiers,
                    "description": prob_data["description"],
                    "applicable": True
                }
            except Exception as e:
                result["reenlistment"] = {"applicable": False, "error": str(e)}
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"success": False, "error": f"Career probabilities calculation failed: {str(e)}"}), 500

# Keep the old endpoint for backward compatibility
@app.route('/api/enlistment_probabilities', methods=['POST'])
def api_enlistment_probabilities():
    """Legacy endpoint - redirects to new unified API"""
    response = api_career_probabilities()
    data = response.get_json()
    
    if data and data.get("success"):
        # Convert new format to old format for compatibility
        old_format = {}
        for item in data.get("enlistment", []):
            service_key = item["service"].lower()
            old_format[service_key] = {
                "percentage": item["raw_percentage"],
                "target": item.get("target", 0),
                "modifiers": item.get("modifiers", 0),
                "description": item.get("description", "")
            }
        
        return jsonify({
            "success": True,
            "probabilities": old_format
        })
    
    return response

@app.route('/api/dice_roll_report', methods=['POST'])
def api_dice_roll_report():
    global current_character
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    
    try:
        # Generate CSV file path
        character_name = current_character.get('name', 'Unknown')
        safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', character_name)
        csv_filename = f'{safe_name}_dice_rolls.csv'
        csv_path = f'characters/{csv_filename}'
        
        # Ensure characters directory exists
        os.makedirs('characters', exist_ok=True)
        
        # Generate and save CSV report
        generate_dice_roll_csv(current_character, csv_path)
        
        return jsonify({
            "success": True,
            "filename": csv_filename,
            "path": csv_path,
            "message": f"Dice roll report saved to {csv_path}"
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/current_character', methods=['GET'])
def api_current_character():
    global current_character
    print(f"DEBUG: Current character check - exists: {current_character is not None}")
    if current_character:
        print(f"DEBUG: Character name: {current_character.get('name', 'Unknown')}")
        print(f"DEBUG: Terms served: {current_character.get('terms_served', 0)}")
        print(f"DEBUG: Career history length: {len(current_character.get('career_history', []))}")
        if current_character.get('career_history'):
            print(f"DEBUG: Latest career entry: {current_character['career_history'][-1]}")
    
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    
    return jsonify({
        "success": True,
        "character": add_calculated_fields(current_character.copy())
    })

@app.route('/api/phase_info', methods=['GET'])
def api_phase_info():
    """
    Get current phase information for the character
    """
    global current_character
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    
    try:
        term_num, phase_num, phase_name = chargen.get_current_phase_info(current_character)
        current_phase = current_character.get("current_phase", "1.1")
        phase_history = current_character.get("phase_history", [])
        
        # Get service-specific phase information
        service = current_character.get("career", "Unknown")
        phase_sequence = chargen.get_phase_sequence_for_service(service) if service != "Unknown" else []
        
        return jsonify({
            "success": True,
            "current_phase": current_phase,
            "term_number": term_num,
            "phase_number": phase_num,
            "phase_name": phase_name,
            "phase_history": phase_history,
            "phase_sequence": phase_sequence,
            "service": service
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/action_probability', methods=['POST'])
def api_action_probability():
    global current_character
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    
    data = request.get_json() or {}
    action_type = data.get('action_type')
    
    if not action_type:
        return jsonify({"success": False, "error": "Action type not specified"}), 400
    
    # DEBUG: Log character state
    print(f"[DEBUG] Action: {action_type}")
    print(f"[DEBUG] Character commissioned: {current_character.get('commissioned')}")
    print(f"[DEBUG] Character career: {current_character.get('career')}")
    print(f"[DEBUG] Character rank: {current_character.get('rank')}")
    
    try:
        if action_type == 'commission':
            # Use Python rules to get commission requirements
            target, modifiers, modifier_details = chargen.get_commission_requirements(current_character)
            # Debug commission eligibility
            print(f"[COMMISSION DEBUG] target={target}, details={modifier_details}")
            print(f"[COMMISSION DEBUG] drafted={current_character.get('drafted')}, terms_served={current_character.get('terms_served')}")
            print(f"[COMMISSION DEBUG] commissioned={current_character.get('commissioned')}, career={current_character.get('career')}")
        elif action_type == 'promotion':
            # Use Python rules to get promotion requirements  
            target, modifiers, modifier_details = chargen.get_promotion_requirements(current_character)
        elif action_type == 'survival':
            # Use Python rules to get survival requirements
            target, modifiers, modifier_details = chargen.get_survival_requirements(current_character)
        elif action_type == 'reenlist':
            # Use Python rules to get reenlistment requirements
            career = current_character.get('career')
            if not career:
                return jsonify({"success": False, "error": "Character has no career"}), 400
            target = chargen.tables.REENLISTMENT_TARGETS[career]
            modifiers = 0  # No modifiers for reenlistment in Classic Traveller
            modifier_details = [f"Reenlistment target for {career}"]
        else:
            return jsonify({"success": False, "error": "Invalid action type"}), 400
        
        # Check if action is eligible (target is not None)
        if target is None:
            return jsonify({
                "success": False,
                "error": "Action not available",
                "reason": modifier_details[0] if modifier_details else "Not eligible"
            })
        
        # Calculate probability using Python backend
        probability_data = chargen.calculate_success_probability(target, modifiers)
        
        return jsonify({
            "success": True,
            "target": target,
            "modifiers": modifiers,
            "total_modifier": modifiers,
            "modifier_details": modifier_details,
            "probability": probability_data
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

def generate_dice_roll_csv(character_record, csv_path):
    """
    Generate a CSV file containing all dice rolls made during character generation
    """
    career_history = character_record.get('career_history', [])
    
    # Track term-by-term progression
    current_term = 0
    roll_number = 0
    
    # Open CSV file for writing
    with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = [
            'Roll_Number',
            'Character_Name', 
            'Character_Seed',
            'Term',
            'Event_Type',
            'Action_Description',
            'Roll_Result',
            'Target_Number',
            'Modifier',
            'Modifier_Details',
            'Total_Roll',
            'Success',
            'Outcome',
            'Career_At_Time'
        ]
        
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        # Write character summary row
        writer.writerow({
            'Roll_Number': 'SUMMARY',
            'Character_Name': character_record.get('name', 'Unknown'),
            'Character_Seed': character_record.get('seed', 77),
            'Term': f"Final Age: {character_record.get('age', 18)}",
            'Event_Type': f"Career: {character_record.get('career', 'Unknown')}",
            'Action_Description': f"Terms Served: {character_record.get('terms_served', 0)}",
            'Roll_Result': f"UPP: {character_record.get('upp', '______')}",
            'Target_Number': '',
            'Modifier': '',
            'Modifier_Details': '',
            'Total_Roll': '',
            'Success': '',
            'Outcome': '',
            'Career_At_Time': ''
        })
        
        for event in career_history:
            event_type = event.get('event_type', '')
            
            # Track term progression
            if event_type == 'enlistment_attempt':
                current_term = 1
            elif event_type == 'reenlistment_attempt' and event.get('continue_career', False):
                current_term += 1
            
            # Process events that involve dice rolls
            if 'roll' in event and event.get('roll') is not None:
                roll_number += 1
                roll_info = extract_roll_info_for_csv(event, current_term, character_record)
                if roll_info:
                    roll_info['Roll_Number'] = roll_number
                    roll_info['Character_Name'] = character_record.get('name', 'Unknown')
                    roll_info['Character_Seed'] = character_record.get('seed', 77)
                    writer.writerow(roll_info)

def extract_roll_info_for_csv(event, term_number, character_record):
    """Extract dice roll information from a career history event for CSV format"""
    event_type = event.get('event_type', '')
    roll = event.get('roll')
    target = event.get('target')
    modifier = event.get('modifier', 0)
    success = event.get('success', False)
    
    # Map event types to readable descriptions
    event_descriptions = {
        'enlistment_attempt': f"Enlistment ({event.get('service', 'Unknown')})",
        'survival_check': f"Survival",
        'commission_check': f"Commission",
        'promotion_check': f"Promotion",
        'reenlistment_attempt': f"Reenlistment",
        'skill_resolution': f"Skill Roll",
        'mustering_out_cash_roll': "Mustering Out (Cash)",
        'mustering_out_benefit_roll': "Mustering Out (Benefit)",
        'ageing_check_detail': f"Ageing Check ({event.get('stat', 'Unknown')})"
    }
    
    description = event_descriptions.get(event_type, event_type.replace('_', ' ').title())
    
    # Build result description
    if event_type == 'enlistment_attempt':
        if success:
            result = f"Enlisted in {event.get('assigned_service', 'Unknown')}"
        else:
            result = f"Drafted into {event.get('assigned_service', 'Unknown')}"
    elif event_type == 'survival_check':
        result = "Survived" if success else "Injured"
    elif event_type == 'commission_check':
        result = f"Commissioned (Rank {event.get('rank', 1)})" if success else "Commission denied"
    elif event_type == 'promotion_check':
        result = f"Promoted to Rank {event.get('rank', 0)}" if success else "Promotion denied"
    elif event_type == 'reenlistment_attempt':
        result = event.get('status_text', 'Unknown outcome')
    elif event_type == 'skill_resolution':
        result = f"Gained: {event.get('skill_gained', 'Unknown skill')}"
    elif event_type == 'mustering_out_cash_roll':
        result = f"Received Cr{event.get('amount', 0):,}"
    elif event_type == 'mustering_out_benefit_roll':
        result = f"Received: {event.get('benefit', 'Unknown benefit')}"
    elif event_type == 'ageing_check_detail':
        if event.get('loss', 0) > 0:
            result = f"Lost {event.get('loss')} {event.get('stat', 'stat')} ({event.get('old_value')} → {event.get('new_value')})"
        else:
            result = f"No {event.get('stat', 'stat')} loss"
    else:
        result = event.get('outcome', 'Unknown outcome')
    
    # Format modifier details as a single string
    modifier_details_str = '; '.join(event.get('modifier_details', []))
    
    return {
        'Term': term_number if term_number > 0 else '',
        'Event_Type': event_type,
        'Action_Description': description,
        'Roll_Result': roll,
        'Target_Number': target if target is not None else '',
        'Modifier': modifier,
        'Modifier_Details': modifier_details_str,
        'Total_Roll': roll + modifier if roll is not None and modifier is not None else '',
        'Success': 'Yes' if success else 'No',
        'Outcome': result,
        'Career_At_Time': event.get('career', character_record.get('career', ''))
    }

@app.route('/api/set_seed', methods=['POST'])
def api_set_seed():
    global GLOBAL_SEED
    data = request.get_json()
    new_seed = data.get('seed')
    if new_seed is None:
        return jsonify({"success": False, "error": "Seed not provided"}), 400
    try:
        GLOBAL_SEED = int(new_seed)
        print(f"DEBUG: Seed changed to {GLOBAL_SEED}")
        return jsonify({"success": True, "seed": GLOBAL_SEED})
    except ValueError:
        return jsonify({"success": False, "error": "Seed must be a number"}), 400

@app.route('/api/get_seed', methods=['GET'])
def api_get_seed():
    global GLOBAL_SEED
    return jsonify({"success": True, "seed": GLOBAL_SEED})

@app.route('/api/ui_config', methods=['GET'])
def api_ui_config():
    """
    Get UI configuration including characteristic quality thresholds
    """
    try:
        config = {
            "characteristic_quality": chargen.get_characteristic_quality_thresholds(),
            "defaults": chargen.get_game_defaults()
        }
        return jsonify({"success": True, "config": config})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    print(f"Classic Traveller Character Generator starting with seed: {GLOBAL_SEED}")
    print("To use a different seed, run: python app.py --seed <number>")
    print("Example: python app.py --seed 42")
    print("Example: python app.py --seed 12345")
    print("Default seed is 77 if not specified")
    print("-" * 50)
    # No character is loaded at startup, as we don't know the name
    app.run(host ="0.0.0.0", port=5000, debug=False)
