from flask import Flask, render_template, jsonify, request
import character_generation_rules as chargen

app = Flask(__name__)

# Temporary storage for the current character (in a real app, this would be persistent)
current_character = None
current_upp = "______"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/create_character', methods=['POST'])
def api_create_character():
    global current_character, current_upp
    current_upp = "______"  # Reset UPP for new character
    
    rng = chargen.set_seed(77)  # Or use a random seed if desired
    current_character = chargen.create_character_record()
    current_character["name"] = chargen.generate_character_name(rng)
    
    return jsonify({
        "success": True,
        "name": current_character["name"],
        "age": current_character["age"],
        "terms_served": current_character["terms_served"],
        "upp": current_upp
    })

@app.route('/api/generate_characteristic', methods=['POST'])
def api_generate_characteristic():
    global current_character, current_upp
    
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
    rng = chargen.set_seed(77)
    
    # Generate the characteristic value
    value = chargen.generate_characteristic(rng, characteristic)
    
    # Store in character record
    current_character["characteristics"][characteristic] = value
    
    # Convert to hex (10=A, 11=B, 12=C)
    hex_char = str(value) if value < 10 else chr(65 + value - 10)
    
    # Update the UPP string
    upp_list = list(current_upp)
    upp_list[char_to_upp_index[characteristic]] = hex_char
    current_upp = ''.join(upp_list)
    
    return jsonify({
        "success": True,
        "characteristic": characteristic,
        "value": value,
        "hex": hex_char,
        "upp": current_upp
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
    rng = chargen.set_seed(77)
    
    # Attempt enlistment
    current_character = chargen.attempt_enlistment(rng, current_character, service)
    
    # Get the enlistment result from the character's career history
    enlistment_result = current_character["career_history"][-1]  # Last entry
    
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
        }
    }
    
    return jsonify(response_data)

@app.route('/api/survival', methods=['POST'])
def api_survival():
    global current_character
    
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    
    # For now, create a fresh RNG (we'll need persistence for proper state management)
    rng = chargen.set_seed(77)
    
    # Check survival
    current_character = chargen.check_survival(rng, current_character)
    
    # Get the survival result from the character's career history
    survival_result = current_character["career_history"][-1]  # Last entry
    
    # Get skill eligibility count
    skill_eligibility = current_character.get("skill_eligibility", 0)
    ready_for_skills = current_character.get("ready_for_skills", False)
    
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
        "ready_for_skills": ready_for_skills
    }
    
    return jsonify(response_data)

@app.route('/api/commission', methods=['POST'])
def api_commission():
    global current_character
    
    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400
    
    # For now, create a fresh RNG (we'll need persistence for proper state management)
    rng = chargen.set_seed(77)
    
    # Check commission
    current_character = chargen.check_commission(rng, current_character)
    
    # Get the commission result from the character's career history
    commission_result = current_character["career_history"][-1]  # Last entry
    
    # Get skill eligibility count
    skill_eligibility = current_character.get("skill_eligibility", 0)
    
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
        "skill_eligibility": skill_eligibility
    }
    
    return jsonify(response_data)

@app.route('/api/promotion', methods=['POST'])
def api_promotion():
    global current_character

    if not current_character:
        return jsonify({"success": False, "error": "No character created yet"}), 400

    # For now, create a fresh RNG (we'll need persistence for proper state management)
    rng = chargen.set_seed(77)

    # Check promotion
    current_character = chargen.check_promotion(rng, current_character)

    # Get the promotion result from the character's career history
    promotion_result = current_character["career_history"][-1]  # Last entry

    # Get skill eligibility count
    skill_eligibility = current_character.get("skill_eligibility", 0)

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
        "skill_eligibility": skill_eligibility
    }

    return jsonify(response_data)

if __name__ == '__main__':
    app.run(debug=True) 