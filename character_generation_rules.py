#!/usr/bin/env python3
"""
Classic Traveller Character Generation API - Fixed Version

This module provides a stateless implementation of Classic Traveller character generation rules.
It offers functions for creating and manipulating character records, generating characteristics,
and handling enlistment processes.

Fixed issues:
- Removed problematic 'current_term' structure
- Fixed terms_served semantics (0 = in first term)
- Corrected retirement eligibility logic
- Simplified term completion logic

Usage:
    import character_generation_rules as chargen
    
    # Create a seeded random generator for reproducible results
    rng = chargen.set_seed(42)
    
    # Create a new character record
    character = chargen.create_character_record()
    
    # Generate a name and characteristics
    character["name"] = chargen.generate_character_name(rng)
    character["characteristics"] = {
        "strength": chargen.generate_characteristic(rng, "strength"),
        "dexterity": chargen.generate_characteristic(rng, "dexterity"),
        # ... and so on
    }
"""

__version__ = "0.2.0"
__author__ = "System Two Digital"

import random
from typing import Any, List, Tuple, Optional

def set_seed(seed: int = 77) -> random.Random:
    """
    Create a random generator with the specified seed
    
    Args:
        seed: The seed to use
        
    Returns:
        A random generator initialized with the seed
    """
    return random.Random(seed)

def get_random_generator(character_record: dict[str, Any]) -> random.Random:
    """
    Get a random generator for the character, restoring previous state if available
    
    Args:
        character_record: The character's record
        
    Returns:
        A random generator with restored state or initialized from seed
    """
    seed = character_record.get("seed", 77)
    random_generator = random.Random(seed)
    
    # Restore previous state if available
    if character_record.get("random_state"):
        try:
            random_generator.setstate(character_record["random_state"])
        except (ValueError, TypeError):
            # If state is corrupted, start fresh from seed
            random_generator = random.Random(seed)
    
    return random_generator

def save_random_state(character_record: dict[str, Any], random_generator: random.Random) -> None:
    """
    Save the current random generator state to the character record
    
    Args:
        character_record: The character's record
        random_generator: The random generator to save state from
    """
    character_record["random_state"] = random_generator.getstate()

def generate_character_name(random_generator: random.Random) -> str:
    """
    Generate a random sci-fi character name with separate first and last name pools
    
    Args:
        random_generator: An instance of random.Random with the user's seed
        
    Returns:
        A randomly generated character name
    """
    # 6x6 grid of first names (2d6 table)
    first_names_grid = [
        ["Zara", "Orion", "Nova", "Elexis", "Jaxon", "Lyra"],
        ["Nyx", "Ryker", "Elara", "Caelum", "Vega", "Draco"],
        ["Aurora", "Cassius", "Astra", "Kaius", "Seren", "Altair"],
        ["Selene", "Maximus", "Zephyr", "Cosmo", "Astrid", "Pheonix"],
        ["Nebula", "Kira", "Axel", "Vesper", "Cyrus", "Luna"],
        ["Atlas", "Iris", "Dex", "Stella", "Kai", "Cora"]
    ]
    
    # 6x6 grid of last names (2d6 table)
    last_names_grid = [
        ["Xylo", "Pax", "Kin", "Vortex", "Starfire", "Nebulae"],
        ["Solaris", "Quantum", "Galaxy", "Void", "Stardust", "Cosmos"],
        ["Hyperdrive", "Meteor", "Comet", "Eclipse", "Andromeda", "Nebular"],
        ["Astraeus", "Ion", "Pulsar", "Zenith", "Flux", "Prism"],
        ["Nexus", "Titan", "Astro", "Helix", "Vector", "Cipher"],
        ["Apex", "Binary", "Nova", "Quark", "Sigma", "Vertex"]
    ]
    
    # Roll 2d6 for first name (1-6 for each die, convert to 0-5 indices)
    first_die = random_generator.randint(1, 6) - 1
    second_die = random_generator.randint(1, 6) - 1
    first_name = first_names_grid[first_die][second_die]
    
    # Roll 2d6 for last name
    first_die = random_generator.randint(1, 6) - 1
    second_die = random_generator.randint(1, 6) - 1
    last_name = last_names_grid[first_die][second_die]
    
    return f"{first_name} {last_name}"

def create_character_record() -> dict[str, Any]:
    """
    Create an empty data structure to hold character generation data
    """
    return {
        "name": "",
        "age": 18,
        "terms_served": 0,  # 0 = in first term, 1 = in second term, etc.
        "characteristics": {},
        "skills": {},
        "career_history": [],  # Track career progression and generation events
        "skill_eligibility": 0,  # Track available skill points
        "ready_for_skills": False,  # Flag to indicate if character is ready for skill resolution
        "ready_for_ageing": False,  # Flag to indicate if character is ready for ageing
        "survival_outcome": "pending",  # "pending", "survived", or "injured"
        "seed": 77,
        "random_state": None,  # Store random generator state for consistent sequences
        "commission_attempted_this_term": False, # Flag to track if a commission attempt was made in the current term
        "commission_failed_this_term": False, # Flag to track if a commission attempt failed in the current term
    }

def get_current_term_number(character_record: dict[str, Any]) -> int:
    """
    Get the current term number (1-based)
    
    Args:
        character_record: The character's record
        
    Returns:
        Current term number (1 for first term, 2 for second, etc.)
    """
    return character_record.get("terms_served", 0) + 1


def roll_2d6(random_generator: random.Random) -> int:
    """
    Roll 2d6 using the provided random generator
    
    Args:
        random_generator: An instance of random.Random with the user's seed
        
    Returns:
        Sum of two six-sided dice
    """
    return random_generator.randint(1, 6) + random_generator.randint(1, 6)

def generate_characteristic(random_generator: random.Random, characteristic: str) -> int:
    """
    Generate a value for a single characteristic
    
    Args:
        random_generator: The base random generator with the user's seed
        characteristic: The characteristic to generate ('strength', 'dexterity', etc.)
        
    Returns:
        Generated value for the characteristic (2-12)
    """
    # Create a characteristic-specific random generator
    original_state = random_generator.getstate()
    char_seed = f"{random_generator.random()}_{characteristic}"
    characteristic_random_generator = random.Random(char_seed)
    
    # Generate the value
    value = roll_2d6(characteristic_random_generator)
    
    # Restore the original state
    random_generator.setstate(original_state)
    
    return value

def get_enlistment_target(service: str) -> int:
    """
    Get the target number needed for enlistment in a specific service
    
    Args:
        service: The service to enlist in ('Navy', 'Marines', 'Army', etc.)
        
    Returns:
        Target number for enlistment roll
    """
    enlistment_targets = {
        'Navy': 8,
        'Marines': 9,
        'Army': 5,
        'Scouts': 7,
        'Merchants': 7,
        'Others': 3
    }
    return enlistment_targets.get(service, 5)  # Default to 5 for unknown services

def get_enlistment_modifiers(characteristics: dict[str, int], service: str) -> Tuple[int, List[str]]:
    """
    Calculate modifiers for enlistment based on characteristics
    
    Args:
        characteristics: Dictionary of character characteristics
        service: The service to enlist in
        
    Returns:
        Tuple of (total modifier, list of modifier descriptions)
    """
    modifiers = []
    total_modifier = 0
    
    # Define characteristic requirements and bonuses for each service
    service_bonuses = {
        'Navy': [('intelligence', 8, 1), ('education', 9, 2)],
        'Marines': [('intelligence', 8, 1), ('strength', 8, 2)],
        'Army': [('dexterity', 6, 1), ('endurance', 5, 2)],
        'Scouts': [('intelligence', 6, 1), ('strength', 8, 2)],
        'Merchants': [('strength', 7, 1), ('intelligence', 6, 2)],
        'Others': []
    }
    
    # Apply modifiers based on characteristics
    for char, req, bonus in service_bonuses.get(service, []):
        if characteristics.get(char, 0) >= req:
            total_modifier += bonus
            modifiers.append(f"{char.capitalize()} {characteristics.get(char, 0)}≥{req} (+{bonus})")
    
    return total_modifier, modifiers

def get_available_services() -> List[str]:
    """
    Get list of available services for enlistment
    
    Returns:
        List of service names
    """
    return ['Navy', 'Marines', 'Army', 'Scouts', 'Merchants', 'Others']

def get_draft_service(random_generator: random.Random) -> str:
    """
    Determine which service a character is drafted into
    
    Args:
        random_generator: An instance of random.Random with the user's seed
        
    Returns:
        Service name
    """
    # Roll 1d6 for draft service (uniform distribution)
    services = get_available_services()
    roll = random_generator.randint(1, 6)
    return services[roll - 1]  # Convert 1-6 to 0-5 index

def attempt_enlistment(random_generator: random.Random, character_record: dict[str, Any], service_choice: str) -> dict[str, Any]:
    """
    Attempt to enlist a character in their chosen service
    
    Args:
        random_generator: An instance of random.Random with the user's seed
        character_record: The character's record
        service_choice: The service the character is attempting to join
        
    Returns:
        Updated character record with enlistment results
    """
    # Get target number for chosen service
    target = get_enlistment_target(service_choice)
    
    # Calculate modifiers
    modifier, modifier_details = get_enlistment_modifiers(character_record["characteristics"], service_choice)
    
    # Roll for enlistment
    roll = roll_2d6(random_generator)
    total = roll + modifier
    success = total >= target
    
    # Record the enlistment attempt
    enlistment_result = {
        "event_type": "enlistment_attempt",
        "service": service_choice,
        "roll": roll,
        "modifier": modifier,
        "modifier_details": modifier_details,
        "target": target,
        "total": total,
        "success": success
    }
    
    # Update character record based on result
    if success:
        # Successfully enlisted in chosen service
        character_record["career"] = service_choice
        enlistment_result["outcome"] = "enlisted"
        enlistment_result["assigned_service"] = service_choice
    else:
        # Failed enlistment, drafted into random service
        drafted_service = get_draft_service(random_generator)
        character_record["career"] = drafted_service
        character_record["drafted"] = True
        enlistment_result["outcome"] = "drafted"
        enlistment_result["assigned_service"] = drafted_service

    # Add the enlistment attempt to the character's history
    character_record["career_history"].append(enlistment_result)
    
    return character_record


def check_survival(random_generator: random.Random, character_record: dict[str, Any], death_rule_enabled: bool = False) -> dict[str, Any]:
    """
    Check if a character survives their current term and update the character record
    
    Args:
        random_generator: An instance of random.Random with the user's seed
        character_record: The character's record
        death_rule_enabled: Whether character can die on failed survival rolls (default: False)
        
    Returns:
        Updated character record with survival results
    """
    # Get career and characteristics
    career = character_record["career"]
    characteristics = character_record.get("characteristics", {})
    
    # Get survival target number
    survival_targets = {
        'Navy': 5,
        'Marines': 6,
        'Army': 5,
        'Scouts': 7,
        'Merchants': 5,
        'Others': 5
    }
    target = survival_targets.get(career, 5)
    
    # Define characteristic bonuses for each career
    survival_bonuses = {
        'Navy': [('intelligence', 7, 2)],
        'Marines': [('endurance', 8, 2)],
        'Army': [('education', 6, 2)],
        'Scouts': [('endurance', 9, 2)],
        'Merchants': [('intelligence', 7, 2)],
        'Others': [('intelligence', 9, 2)]
    }
    career_bonuses = survival_bonuses.get(career, [])
    
    # Calculate modifiers based on characteristics
    modifier = 0
    modifier_details = []
    
    # Apply modifiers based on characteristics
    for char, req, bonus in career_bonuses:
        if characteristics.get(char, 0) >= req:
            modifier += bonus
            modifier_details.append(f"{char.capitalize()} {characteristics.get(char, 0)}≥{req} (+{bonus})")
    
    # Roll for survival
    roll = roll_2d6(random_generator)
    total = roll + modifier
    survived = total >= target
    
    # Determine outcome (age advancement handled in check_ageing function)
    if survived:
        outcome = "survived"
        # Grant skill eligibilities for new term
        increment_skill_eligibility_for_term(character_record)
        # DO NOT complete term here - terms_served increments only at term completion
        # Store survival outcome for reenlistment logic
        character_record["survival_outcome"] = "survived"
        # Set ready for skills flag for survived characters
        character_record["ready_for_skills"] = True
    else:
        outcome = "injured"
        # Injured characters do NOT get skill eligibilities - skip commission/promotion/skills
        # Store survival outcome for reenlistment logic
        character_record["survival_outcome"] = "injured"
        # Set ready for skills flag to false for injured characters
        character_record["ready_for_skills"] = False
        # Set ready for ageing flag for injured characters (they skip skills entirely)
        character_record["ready_for_ageing"] = True
    
    # Create the survival result
    survival_result = {
        "event_type": "survival_check",
        "career": career,
        "roll": roll,
        "modifier": modifier,
        "modifier_details": modifier_details,
        "target": target,
        "total": total,
        "success": survived,
        "outcome": outcome
    }
    
    # Add the survival check to the character's career history
    character_record["career_history"].append(survival_result)
    
    return character_record

def check_commission(random_generator: random.Random, character_record: dict[str, Any]) -> dict[str, Any]:
    """
    Check if a character receives a commission during their current term and update the character record
    
    Args:
        random_generator: An instance of random.Random with the user's seed
        character_record: The character's record
        
    Returns:
        Updated character record with commission results
    """
    # Get career and characteristics
    career = character_record["career"]
    characteristics = character_record.get("characteristics", {})
    
    # Create the commission result structure
    commission_result = {
        "event_type": "commission_check",
        "career": career,
    }
    
    # Check if character is already commissioned (can only happen once in a career)
    if character_record.get("commissioned", False):
        # Already commissioned
        commission_result["applicable"] = False
        commission_result["reason"] = "Already commissioned"
        commission_result["success"] = False
        commission_result["outcome"] = "not applicable"
        
        # Add the commission check to the character's career history
        character_record["career_history"].append(commission_result)
        return character_record
    
    # Check if character is eligible for commission
    if career in ['Scouts', 'Others']:
        # These careers don't have commissions
        commission_result["applicable"] = False
        commission_result["reason"] = f"{career} does not have commissions"
        commission_result["success"] = False
        commission_result["outcome"] = "not applicable"
        
        # Add the commission check to the character's career history
        character_record["career_history"].append(commission_result)
        return character_record
    
    current_term_number = get_current_term_number(character_record)
    if character_record.get("drafted", False) and current_term_number == 1:
        # Drafted characters cannot be commissioned in their first term
        commission_result["applicable"] = False
        commission_result["reason"] = "Drafted characters cannot be commissioned in first term"
        commission_result["success"] = False
        commission_result["outcome"] = "not applicable"
        
        # Add the commission check to the character's career history
        character_record["career_history"].append(commission_result)
        return character_record
    
    # Character is eligible for commission
    commission_result["applicable"] = True
    
    # Define commission target numbers
    commission_targets = {
        'Navy': 10,
        'Marines': 9,
        'Army': 5,
        'Merchants': 4
    }
    target = commission_targets.get(career, 8)
    commission_result["target"] = target
    
    # Define characteristic bonuses for each career
    commission_bonuses = {
        'Navy': [('social', 9, 1)],
        'Marines': [('education', 7, 1)],
        'Army': [('endurance', 7, 1)],
        'Merchants': [('intelligence', 9, 1)]
    }
    career_bonuses = commission_bonuses.get(career, [])
    
    # Calculate modifiers based on characteristics
    modifier = 0
    modifier_details = []
    
    # Apply modifiers based on characteristics
    for char, req, bonus in career_bonuses:
        if characteristics.get(char, 0) >= req:
            modifier += bonus
            modifier_details.append(f"{char.capitalize()} {characteristics.get(char, 0)}≥{req} (+{bonus})")
    
    commission_result["modifier"] = modifier
    commission_result["modifier_details"] = modifier_details
    
    # Roll for commission
    roll = roll_2d6(random_generator)
    total = roll + modifier
    commissioned = total >= target
    
    commission_result["roll"] = roll
    commission_result["total"] = total
    commission_result["success"] = commissioned
    
    # Update character record based on outcome
    if commissioned:
        # Set commissioned flag in the main character record (permanent status)
        character_record["commissioned"] = True
        character_record["rank"] = 1
        commission_result["rank"] = 1
        commission_result["career"] = career
        commission_result["outcome"] = "commissioned as officer"
        # Grant +1 skill eligibility for successful commission
        character_record["skill_eligibility"] = character_record.get("skill_eligibility", 0) + 1
        commission_result["skill_eligibilities_granted"] = 1
        character_record["commission_failed_this_term"] = False
    else:
        commission_result["rank"] = 0  # No rank if not commissioned
        commission_result["career"] = career
        commission_result["outcome"] = "not commissioned"
        commission_result["skill_eligibilities_granted"] = 0
        character_record["commission_failed_this_term"] = True
    
    # Add the commission check to the character's career history
    character_record["career_history"].append(commission_result)
    character_record["commission_attempted_this_term"] = True
    return character_record

def check_promotion(random_generator: random.Random, character_record: dict[str, Any]) -> dict[str, Any]:
    """
    Check if a character is promoted during their current term and update the character record
    
    Args:
        random_generator: An instance of random.Random with the user's seed
        character_record: The character's record
        
    Returns:
        Updated character record with promotion results
    """
    # Get career and characteristics
    career = character_record["career"]
    characteristics = character_record.get("characteristics", {})
    current_rank = character_record.get("rank", 0)
    
    # Create the promotion result structure
    promotion_result = {
        "event_type": "promotion_check",
        "career": career,
        "current_rank": current_rank
    }
    
    # Check if character is eligible for promotion
    # Note: Promotion is available to both commissioned and non-commissioned characters
    # Non-commissioned characters can be promoted to enlisted ranks
    
    if career in ['Scouts', 'Others']:
        # These careers don't have rank structure
        promotion_result["applicable"] = False
        promotion_result["reason"] = f"{career} does not have promotions"
        promotion_result["success"] = False
        promotion_result["outcome"] = "not applicable"
        
        # Add the promotion check to the character's career history
        character_record["career_history"].append(promotion_result)
        return character_record
    
    # Check for maximum rank limits
    max_ranks = {
        'Navy': 6,
        'Marines': 6,
        'Army': 6,
        'Merchants': 5
    }
    max_rank = max_ranks.get(career, 6)
    
    if current_rank >= max_rank:
        # Character has reached maximum rank for their career
        promotion_result["applicable"] = False
        promotion_result["reason"] = f"Character has reached maximum rank ({max_rank}) for {career}"
        promotion_result["success"] = False
        promotion_result["outcome"] = "not applicable"
        
        # Add the promotion check to the character's career history
        character_record["career_history"].append(promotion_result)
        return character_record
    
    # Character is eligible for promotion (one promotion per term is handled by call sequencing)
    promotion_result["applicable"] = True
    
    # Define promotion target numbers
    promotion_targets = {
        'Navy': 8,
        'Marines': 9,
        'Army': 6,
        'Merchants': 10
    }
    target = promotion_targets.get(career, 8)
    promotion_result["target"] = target
    
    # Define characteristic bonuses for each career
    promotion_bonuses = {
        'Navy': [('education', 8, 1)],
        'Marines': [('social', 8, 1)],
        'Army': [('education', 7, 1)],
        'Merchants': [('intelligence', 9, 1)]
    }
    career_bonuses = promotion_bonuses.get(career, [])
    
    # Calculate modifiers based on characteristics
    modifier = 0
    modifier_details = []
    
    # Apply modifiers based on characteristics
    for char, req, bonus in career_bonuses:
        if characteristics.get(char, 0) >= req:
            modifier += bonus
            modifier_details.append(f"{char.capitalize()} {characteristics.get(char, 0)}≥{req} (+{bonus})")
    
    promotion_result["modifier"] = modifier
    promotion_result["modifier_details"] = modifier_details
    
    # Roll for promotion
    roll = roll_2d6(random_generator)
    total = roll + modifier
    promoted = total >= target
    
    promotion_result["roll"] = roll
    promotion_result["total"] = total
    promotion_result["success"] = promoted
    
    # Update character record based on outcome
    if promoted:
        new_rank = current_rank + 1
        character_record["rank"] = new_rank
        promotion_result["rank"] = new_rank
        promotion_result["career"] = career
        
        # Determine promotion outcome text based on commission status
        if character_record.get("commissioned", False):
            promotion_result["outcome"] = f"promoted to rank {new_rank}"
        else:
            promotion_result["outcome"] = f"promoted to enlisted rank {new_rank}"
        
        # Grant +1 skill eligibility for successful promotion (regardless of commission status)
        character_record["skill_eligibility"] = character_record.get("skill_eligibility", 0) + 1
        promotion_result["skill_eligibilities_granted"] = 1
    else:
        promotion_result["rank"] = current_rank  # Keep current rank if not promoted
        promotion_result["career"] = career
        promotion_result["outcome"] = "not promoted"
        promotion_result["skill_eligibilities_granted"] = 0
    
    # Add the promotion check to the character's career history
    character_record["career_history"].append(promotion_result)
    
    return character_record

def attempt_reenlistment(random_generator: random.Random, character_record: dict[str, Any], preference: str = 'reenlist') -> dict[str, Any]:
    """
    Attempt to reenlist a character for another term of service
    
    Args:
        random_generator: An instance of random.Random with the user's seed
        character_record: The character's record
        preference: Character's preference ('reenlist', 'discharge', or 'retire')
        
    Returns:
        Updated character record with reenlistment results
        
    Raises:
        ValueError: If required fields are missing from the character record
    """
    # Validate required fields
    if "career" not in character_record:
        raise ValueError("Character record missing required field: 'career'")
    if "age" not in character_record:
        raise ValueError("Character record missing required field: 'age'")
    
    # Get career
    career = character_record["career"]
    age = character_record["age"]
    current_term_number = get_current_term_number(character_record)
    
    # Validate retirement eligibility (requires being in 5th term or later)
    if preference == "retire" and current_term_number < 5:
        raise ValueError(f"Character cannot retire before 5th term. Currently in term {current_term_number}.")
    
    # Check if character was injured in current term - if so, automatic medical discharge
    last_survival_outcome = None
    for event in reversed(character_record.get('career_history', [])):
        if event.get('event_type') == 'survival_check':
            last_survival_outcome = event.get('outcome')
            break
    
    if last_survival_outcome == 'injured':
        # Automatic medical discharge - no dice roll needed
        reenlistment_result = {
            "event_type": "reenlistment_attempt",
            "career": career,
            "age": character_record["age"],
            "preference": preference,
            "roll": None,  # No roll needed for medical discharge
            "target": None,  # No target needed for medical discharge
            "outcome": "medical_discharge",
            "status_text": "medical discharge",
            "continue_career": False,
            "skill_eligibilities_granted": 0,
            "reason": "injured during survival check"
        }
        
        # Add the reenlistment attempt to the character's career history
        character_record["career_history"].append(reenlistment_result)
        
        # Do NOT increment terms_served for medical discharge due to injury
        return character_record
    
    # Define reenlistment target numbers
    reenlistment_targets = {
        'Navy': 6,
        'Marines': 6,
        'Army': 7,
        'Scouts': 3,
        'Merchants': 4,
        'Others': 5
    }
    # Ensure career is one of the valid options
    assert career in reenlistment_targets, f"Invalid career: {career}"
    target = reenlistment_targets[career]
    
    # Roll for reenlistment
    roll = roll_2d6(random_generator)

    # Create the reenlistment result structure
    reenlistment_result = {
        "event_type": "reenlistment_attempt",
        "career": career,
        "age": character_record["age"],
        "preference": preference,
        "roll": roll,
        "target": target
    }

    # Special rule: In the 7th term (terms_served == 6), only a roll of 12 allows reenlistment
    if character_record.get("terms_served", 0) >= 6:
        if roll == 12:
            # Only a roll of 12 allows reenlistment (mandatory retention)
            outcome = "retained"
            status_text = "retained (mandatory, 7th term+)"
            continue_career = True
        else:
            outcome = "discharged"
            status_text = "discharged (max terms reached)"
            continue_career = False

        # Add outcome information to the result
        reenlistment_result["outcome"] = outcome
        reenlistment_result["status_text"] = status_text
        reenlistment_result["continue_career"] = continue_career

        # Add the reenlistment attempt to the character's career history
        character_record["career_history"].append(reenlistment_result)
        return character_record
    
    # Determine outcome based on preference and roll
    if roll == 12:
        # Roll of 12 is always mandatory retention
        outcome = "retained"
        status_text = "retained (mandatory)"
        continue_career = True
    elif preference == "reenlist":
        # Character wants to stay
        if roll >= target:
            outcome = "reenlisted"
            status_text = "reenlisted"
            continue_career = True
        else:
            outcome = "discharged"
            status_text = "military discharge"
            continue_career = False
    elif preference in ["discharge", "retire"]:
        # Character wants to leave - gets their wish unless roll is 12
        if roll == 12:
            outcome = "retained"
            status_text = "retained (mandatory)"
            continue_career = True
        else:
            outcome = preference + "d" if preference == "discharge" else "retired"
            status_text = outcome
            continue_career = False
    
    # Add outcome information to the result
    reenlistment_result["outcome"] = outcome
    reenlistment_result["status_text"] = status_text
    reenlistment_result["continue_career"] = continue_career
    
    # Add the reenlistment attempt to the character's career history
    character_record["career_history"].append(reenlistment_result)
    
    # If drafted and successfully reenlisted, change status to enlisted
    if character_record.get("drafted", False) and continue_career:
        character_record["drafted"] = False
        
        # Record the status change in career history
        status_change_event = {
            "event_type": "status_change",
            "career": career,
            "from": "drafted",
            "to": "enlisted",
            "reason": "successful reenlistment"
        }
        character_record["career_history"].append(status_change_event)
    
    # Increment terms_served for all outcomes except medical discharge
    if outcome != "medical_discharge":
        old_terms = character_record.get("terms_served", 0)
        character_record["terms_served"] = old_terms + 1
    
    # If continuing career, reset term progression
    if continue_career:
        # Explicitly reset term progression flags for new term
        character_record["ready_for_skills"] = False  # After reenlistment, character must perform a survival check to begin the new term
        character_record["ready_for_ageing"] = False
        character_record["ready_for_reenlistment"] = False # ADD: Reset the flag
        character_record["skill_eligibility"] = 0
        character_record["survival_outcome"] = "pending"
        # Reset commission attempt flag for new term
        character_record["commission_attempted_this_term"] = False
        character_record["commission_failed_this_term"] = False
        
        # Increment skill eligibility for the new term
        increment_skill_eligibility_for_term(character_record)
        
        # Create a new term record if you're tracking terms as objects
        if "terms" not in character_record:
            character_record["terms"] = []
        
        # Start a new term record
        character_record["terms"].append({
            "term_number": character_record["terms_served"],  # This is now the correct term number
            "start_age": character_record["age"],
            "completed": False,
            # Other term-specific data
        })
        
        # Ensure the character is ready to start the new term with survival check
        # This is critical for proper term progression

    return character_record

def increment_character_age(character_record: dict[str, Any]) -> dict[str, Any]:
    """
    Increment the character's age when they complete a term
    
    Args:
        character_record: The character's record
        
    Returns:
        Updated character record with age increment
    """
    # Determine age increase based on survival outcome
    survival_outcome = character_record.get('survival_outcome')
    if survival_outcome is None:
        # Fallback: look for last survival check in career history
        for event in reversed(character_record.get('career_history', [])):
            if event.get('event_type') == 'survival_check':
                survival_outcome = event.get('outcome')
                break
    
    if survival_outcome == 'injured':
        age_increase = 2
    else:
        age_increase = 4
    
    previous_age = character_record.get("age", 18)
    character_record["age"] = previous_age + age_increase
    current_age = character_record["age"]
    
    # Create basic ageing event record (age increment only)
    ageing_event = {
        "event_type": "ageing_check",
        "previous_age": previous_age,
        "current_age": current_age,
        "age_increase": age_increase,
        "checks_performed": [],
        "ageing_effects": []
    }
    
    # Add the ageing check to the character's career history
    character_record["career_history"].append(ageing_event)
    
    return character_record

def check_ageing_characteristics(random_generator: random.Random, character_record: dict[str, Any]) -> dict[str, Any]:
    """
    Check for ageing effects on characteristics when a character ages
    
    Args:
        random_generator: An instance of random.Random with the user's seed
        character_record: The character's record
        
    Returns:
        Updated character record with ageing characteristic effects
    """
    # Get the latest ageing event to find the age range
    ageing_events = [e for e in character_record.get('career_history', []) if e.get('event_type') == 'ageing_check']
    if not ageing_events:
        return character_record
    
    latest_ageing = ageing_events[-1]
    previous_age = latest_ageing.get('previous_age', 18)
    current_age = latest_ageing.get('current_age', 18)
    
    # Check survival outcome to determine if characteristic checks should be made
    survival_outcome = character_record.get('survival_outcome')
    if survival_outcome is None:
        # Fallback: look for last survival check in career history
        for event in reversed(character_record.get('career_history', [])):
            if event.get('event_type') == 'survival_check':
                survival_outcome = event.get('outcome')
                break
    
    ageing_thresholds = [34, 38, 42, 46, 50, 54, 58, 62]
    advanced_ageing_start = 66
    
    ageing_effects = []
    checks_performed = []
    
    # Only apply ageing effects if survived (injured characters still age but don't get aging rolls)
    if survival_outcome == 'survived' or survival_outcome is None:
        # Check standard thresholds (34 - 62)
        for threshold in ageing_thresholds:
            if previous_age < threshold <= current_age:
                checks_performed.append(threshold)
                effects = apply_ageing_effects(random_generator, character_record, threshold)
                ageing_effects.extend(effects)
    
        # Check advanced ageing (66+)
        if current_age >= advanced_ageing_start:
            for age in range(max(66, ((previous_age // 4) + 1) * 4), current_age + 1, 4):
                if age >= advanced_ageing_start:
                    checks_performed.append(age)
                    effects = apply_advanced_ageing_effects(random_generator, character_record, age)
                    ageing_effects.extend(effects)
    
    # Update the latest ageing event with characteristic check results
    latest_ageing["checks_performed"] = checks_performed
    latest_ageing["ageing_effects"] = ageing_effects
    latest_ageing["total_effects"] = len(ageing_effects)
    
    # Reset the ready_for_ageing flag after ageing is completed
    character_record["ready_for_ageing"] = False
    
    # Mark the current term as completed if we have a terms array
    if "terms" in character_record and character_record["terms"]:
        # Mark the last term as completed
        character_record["terms"][-1]["completed"] = True
    
    return character_record

def apply_ageing_effects(random_generator: random.Random, character_record: dict[str, Any], age: int) -> List[str]:
    """Apply ageing effects at a specific age"""
    effects = []
    characteristics = character_record.get("characteristics", {})
    
    if age in [34, 38, 42, 46]:
        # Phase 1: Early ageing
        checks = [
            ('strength', 8, 1), ('dexterity', 7, 1), ('endurance', 8, 1)
        ]
    elif age in [50, 54, 58, 62]:
        # Phase 2: Advanced ageing  
        checks = [
            ('strength', 9, 1), ('dexterity', 8, 1), ('endurance', 9, 1)
        ]
    else:
        return effects
    
    for stat, target, loss in checks:
        roll = roll_2d6(random_generator)
        if roll < target:
            old_value = characteristics[stat]
            characteristics[stat] = max(0, characteristics[stat] - loss)  # Prevent negative
            actual_loss = old_value - characteristics[stat]
            effects.append(f"-{actual_loss} {stat.upper()}")
            
            # Log individual ageing check
            ageing_check_event = {
                "event_type": "ageing_check_detail",
                "age": age,
                "stat": stat.upper(),
                "roll": roll,
                "target": target,
                "old_value": old_value,
                "new_value": characteristics[stat],
                "loss": actual_loss,
                "phase": "standard"
            }
            character_record["career_history"].append(ageing_check_event)
        else:
            # Log individual ageing check (no loss)
            ageing_check_event = {
                "event_type": "ageing_check_detail",
                "age": age,
                "stat": stat.upper(),
                "roll": roll,
                "target": target,
                "old_value": characteristics[stat],
                "new_value": characteristics[stat],
                "loss": 0,
                "phase": "standard"
            }
            character_record["career_history"].append(ageing_check_event)
    
    return effects

def apply_advanced_ageing_effects(random_generator: random.Random, character_record: dict[str, Any], age: int) -> List[str]:
    """Apply advanced ageing effects for ages 66+"""
    effects = []
    characteristics = character_record.get("characteristics", {})
    
    # Advanced ageing affects STR, DEX, END, and INT
    checks = [
        ('strength', 9, 2), ('dexterity', 9, 2), ('endurance', 9, 2), ('intelligence', 9, 1)
    ]
    
    for stat, target, loss in checks:
        roll = roll_2d6(random_generator)
        if roll < target:
            old_value = characteristics[stat]
            characteristics[stat] = max(0, characteristics[stat] - loss)  # Prevent negative
            actual_loss = old_value - characteristics[stat]
            effects.append(f"-{actual_loss} {stat.upper()}")
            
            # Log individual advanced ageing check
            ageing_check_event = {
                "event_type": "ageing_check_detail",
                "age": age,
                "stat": stat.upper(),
                "roll": roll,
                "target": target,
                "old_value": old_value,
                "new_value": characteristics[stat],
                "loss": actual_loss,
                "phase": "advanced"
            }
            character_record["career_history"].append(ageing_check_event)
        else:
            # Log individual advanced ageing check (no loss)
            ageing_check_event = {
                "event_type": "ageing_check_detail",
                "age": age,
                "stat": stat.upper(),
                "roll": roll,
                "target": target,
                "old_value": characteristics[stat],
                "new_value": characteristics[stat],
                "loss": 0,
                "phase": "advanced"
            }
            character_record["career_history"].append(ageing_check_event)
    
    return effects

def get_available_skill_tables(character_record: dict[str, Any]) -> dict[str, bool]:
    """
    Determine which skill tables are available to the character
    
    Args:
        character_record: The character's record
        
    Returns:
        Dictionary of available skill tables with boolean values
    """
    # All characters have access to these three tables
    available_tables = {
        'personal': True,
        'service': True,
        'advanced': True,
        'education': False  # Default to False
    }
    
    # Check if character has education 8+ for education table
    education = character_record.get("characteristics", {}).get("education", 0)
    if education >= 8:
        available_tables['education'] = True
    
    return available_tables


def resolve_skill(random_generator: random.Random, character_record: dict[str, Any], 
                  table_choice: Optional[str] = None) -> dict[str, Any]:
    """
    Resolve a skill gain for a character
    """
    # Validate required fields
    if "career" not in character_record:
        raise ValueError("Character record missing required field: 'career'")
    # Check if character has skill eligibilities available
    skill_eligibility = character_record.get("skill_eligibility", 0)
    if skill_eligibility <= 0:
        raise ValueError("Character has no skill eligibilities available")
    
    # Get career
    career = character_record["career"]
    
    # Define skill tables for each career
    skill_tables = {
        'Navy': {
            'personal': ['+1 STR', '+1 DEX', '+1 END', '+1 INT', '+1 EDU', '+1 SOC'],
            'service': ['Ship\'s Boat', 'Vacc Suit', 'Forward Observer', 'Gunnery', 'Blade Combat', 'Gun Combat'],
            'advanced': ['Vacc Suit', 'Mechanical', 'Electronic', 'Engineering', 'Gunnery', 'Jack-of-all-Trades'],
            'education': ['Medical', 'Navigation', 'Engineering', 'Computer', 'Pilot', 'Admin']
        },
        'Marines': {
            'personal': ['+1 STR', '+1 DEX', '+1 END', 'Gambling', 'Brawling', 'Blade Combat'],
            'service': ['Vehicle', 'Vacc Suit', 'Blade Combat', 'Gun Combat', 'Blade Combat', 'Gun Combat'],
            'advanced': ['Vehicle', 'Mechanical', 'Electronic', 'Tactics', 'Blade Combat', 'Gun Combat'],
            'education': ['Medical', 'Tactics', 'Tactics', 'Computer', 'Leader', 'Admin']
        },
        'Army': {
            'personal': ['+1 STR', '+1 DEX', '+1 END', 'Gambling', '+1 EDU', 'Brawling'],
            'service': ['Vehicle', 'Air/Raft', 'Gun Combat', 'Forward Observer', 'Blade Combat', 'Gun Combat'],
            'advanced': ['Vehicle', 'Mechanical', 'Electronic', 'Tactics', 'Blade Combat', 'Gun Combat'],
            'education': ['Medical', 'Tactics', 'Tactics', 'Computer', 'Leader', 'Admin']
        },
        'Scouts': {
            'personal': ['+1 STR', '+1 DEX', '+1 END', '+1 INT', '+1 EDU', 'Gun Combat'],
            'service': ['Vehicle', 'Vacc Suit', 'Mechanical', 'Navigation', 'Electronics', 'Jack-of-all-Trades'],
            'advanced': ['Vehicle', 'Mechanical', 'Electronic', 'Jack-of-all-Trades', 'Gunnery', 'Medical'],
            'education': ['Medical', 'Navigation', 'Engineering', 'Computer', 'Pilot', 'Jack-of-all-Trades']
        },
        'Merchants': {
            'personal': ['+1 STR', '+1 DEX', '+1 END', 'Blade Combat', 'Bribery', '+1 INT'],
            'service': ['Vehicle', 'Vacc Suit', 'Jack-of-all-Trades', 'Steward', 'Electronics', 'Gun Combat'],
            'advanced': ['Streetwise', 'Mechanical', 'Electronic', 'Navigation', 'Engineering', 'Computer'],
            'education': ['Medical', 'Navigation', 'Engineering', 'Computer', 'Pilot', 'Admin']
        },
        'Others': {
            'personal': ['+1 STR', '+1 DEX', '+1 END', 'Blade Combat', 'Brawling', '+1 SOC'],
            'service': ['Vehicle', 'Gambling', 'Brawling', 'Bribery', 'Blade Combat', 'Gun Combat'],
            'advanced': ['Streetwise', 'Mechanical', 'Electronic', 'Gambling', 'Brawling', 'Forgery'],
            'education': ['Medical', 'Forgery', 'Electronics', 'Computer', 'Streetwise', 'Jack-of-all-Trades']
        }
    }
    
    # Get available skill tables
    available_tables = get_available_skill_tables(character_record)
    
    # Create the skill resolution event
    skill_event = {
        "event_type": "skill_resolution",
        "career": career,
        "available_tables": available_tables,
    }
    
    # If no table choice provided, require explicit choice (random selection disabled)
    if table_choice is None:
        # DISABLED: Automatic random table selection
        # Filter to only available tables
        # valid_tables = [table for table, available in available_tables.items() if available]
        # if not valid_tables:
        #     raise ValueError("No valid skill tables available")
        # table_choice = random_generator.choice(valid_tables)
        # skill_event["table_choice_method"] = "random"
        raise ValueError("Table choice must be explicitly provided - random selection disabled")
    else:
        # Validate table choice
        if table_choice not in available_tables:
            raise ValueError(f"Invalid table choice: {table_choice}")
        if not available_tables[table_choice]:
            raise ValueError(f"Table not available: {table_choice}")
        skill_event["table_choice_method"] = "player"
    
    skill_event["table_choice"] = table_choice
    
    # Get the skill table for the career
    career_tables = skill_tables.get(career, skill_tables['Others'])
    
    # Ensure the table exists for this career
    if table_choice not in career_tables:
        raise ValueError(f"Table {table_choice} not found for career {career}")
    
    table = career_tables[table_choice]
    
    # Roll 1d6 to determine which skill is gained
    roll = random_generator.randint(1, 6)
    # Ensure index is valid
    if roll < 1 or roll > 6 or roll > len(table):
        raise ValueError(f"Invalid roll {roll} for table with {len(table)} entries")
    
    # Get the skill result (guaranteed to be a string from our defined tables)
    skill_name = table[roll - 1]
    
    skill_event["roll"] = roll
    skill_event["skill_gained"] = skill_name
    
    # Process the skill result
    if skill_name.startswith('+1'):
        # This is a characteristic increase
        char_short = skill_name.split()[1]  # Get the short form (STR, DEX, etc.)
        
        # Map the short form to the full characteristic name
        char_map = {
            'STR': 'strength',
            'DEX': 'dexterity',
            'END': 'endurance',
            'INT': 'intelligence',
            'EDU': 'education',
            'SOC': 'social'
        }
        
        characteristic = char_map.get(char_short, '').lower()
        
        # Update the characteristic
        if characteristic and characteristic in character_record.get("characteristics", {}):
            old_value = character_record["characteristics"][characteristic]
            character_record["characteristics"][characteristic] += 1
            new_value = character_record["characteristics"][characteristic]
            
            skill_event["result_type"] = "characteristic_increase"
            skill_event["characteristic"] = characteristic
            skill_event["old_value"] = old_value
            skill_event["new_value"] = new_value
        else:
            # Characteristic not found, log error
            skill_event["result_type"] = "error"
            skill_event["error"] = f"Characteristic {char_short} could not be mapped or not found in character record"
    else:
        # This is a regular skill
        skill_event["result_type"] = "skill_gain"
        
        # Initialize skills if not present
        if "skills" not in character_record:
            character_record["skills"] = {}
        
        # Add skill or increase level
        if skill_name in character_record["skills"]:
            character_record["skills"][skill_name] += 1
        else:
            character_record["skills"][skill_name] = 1
    
    # Consume one skill eligibility
    character_record["skill_eligibility"] = character_record.get("skill_eligibility", 0) - 1
    skill_event["skill_eligibilities_consumed"] = 1
    skill_event["skill_eligibilities_remaining"] = character_record["skill_eligibility"]
    
    # Check if skills are now completed and set ready_for_ageing flag
    if character_record["skill_eligibility"] <= 0:
        character_record["ready_for_ageing"] = True
        character_record["ready_for_skills"] = False
    
    # Add the skill resolution event to the character's career history
    character_record["career_history"].append(skill_event)
    
    return character_record



def perform_mustering_out(random_generator: random.Random, character_record: dict[str, Any], 
                          cash_rolls: Optional[int] = None) -> dict[str, Any]:
    """
    Perform mustering out for a character according to Classic Traveller rules
    
    Args:
        random_generator: An instance of random.Random with the user's seed
        character_record: The character's record
        cash_rolls: Optional number of cash rolls to use (max 3, remainder goes to benefits)
        
    Returns:
        Updated character record with mustering out results
        
    Raises:
        ValueError: If character has no career history or required fields missing
    """
    # Validate input
    if 'career_history' not in character_record:
        raise ValueError("Character must have career history to muster out")
    
    # Get current career and calculate terms served
    current_career = character_record.get('career')
    if not current_career:
        raise ValueError("Character must have a current career to muster out")
    
    terms_served = character_record.get('terms_served', 0)
    rank = character_record.get('rank', 0)
    
    # FIXED: Remove age increment - mustering out doesn't represent time passage
    # Age only increases during term completion, not during mustering out
    
    # Get gambling skill from character's skills
    gambling_skill = character_record.get('skills', {}).get('Gambling', 0)
    
    # Calculate total rolls (terms + rank bonus)
    total_rolls = int(terms_served)
    if 1 <= rank <= 2:
        total_rolls += 1
    elif 3 <= rank <= 4:
        total_rolls += 2
    elif 5 <= rank <= 6:
        total_rolls += 3
    
    # Determine cash vs benefit rolls
    if cash_rolls is None:
        cash_rolls = min(3, total_rolls)
    else:
        cash_rolls = max(0, min(cash_rolls, 3, total_rolls))
    
    benefit_rolls = total_rolls - cash_rolls
    
    # Mustering out tables
    cash_table = {
        'Navy':     {1: 1000, 2: 5000, 3: 5000, 4: 10000, 5: 20000, 6: 50000, 7: 50000},
        'Marines':  {1: 2000, 2: 5000, 3: 5000, 4: 10000, 5: 20000, 6: 30000, 7: 40000},
        'Army':     {1: 2000, 2: 5000, 3: 10000, 4: 10000, 5: 10000, 6: 20000, 7: 30000},
        'Scouts':   {1: 20000, 2: 20000, 3: 30000, 4: 30000, 5: 50000, 6: 50000, 7: 50000},
        'Merchant': {1: 1000, 2: 5000, 3: 10000, 4: 20000, 5: 20000, 6: 40000, 7: 40000},
        'Other':    {1: 1000, 2: 5000, 3: 10000, 4: 10000, 5: 10000, 6: 50000, 7: 100000},
    }
    
    benefit_table = {
        'Navy':     {1: 'Low Psg', 2: 'INT +1', 3: 'EDU +2', 4: 'Blade', 5: 'Travellers', 6: 'High Psg', 7: 'SOC +2'},
        'Marines':  {1: 'Low Psg', 2: 'INT +2', 3: 'EDU +1', 4: 'Blade', 5: 'Traveller', 6: 'High Psg', 7: 'SOC +2'},
        'Army':     {1: 'Low Psg', 2: 'INT +1', 3: 'EDU +2', 4: 'Gun', 5: 'High Psg', 6: 'Mid Psg', 7: 'SOC +1'},
        'Scouts':   {1: 'Low Psg', 2: 'INT +2', 3: 'EDU +2', 4: 'Blade', 5: 'Gun', 6: 'Scout Ship'},
        'Merchant': {1: 'Low Psg', 2: 'INT +1', 3: 'EDU +1', 4: 'Gun', 5: 'Blade', 6: 'Low Psg', 7: 'Free Trader'},
        'Other':    {1: 'Low Psg', 2: 'INT +1', 3: 'EDU +1', 4: 'Gun', 5: 'High Psg', 6: '-'},
    }
    
    # Get appropriate tables
    career_cash_table = cash_table.get(current_career, cash_table['Other'])
    career_benefit_table = benefit_table.get(current_career, benefit_table['Other'])
    
    # Calculate bonuses
    # For benefits: +1 only if rank == 5 or rank == 6
    benefit_rank_bonus = 1 if rank in (5, 6) else 0
    
    # Track results
    cash_total = 0
    items = []
    characteristic_boosts = {}
    cash_roll_details = []
    benefit_roll_details = []
    
    # Roll for cash
    for i in range(cash_rolls):
        base_roll = random_generator.randint(1, 6)
        total_roll = base_roll + gambling_skill  # No rank bonus for cash
        total_roll = min(7, total_roll)  # Cap at 7 for table lookup
        
        amount = career_cash_table.get(total_roll, 0)
        cash_total += amount
        
        roll_detail = {
            'roll_number': i + 1,
            'base_roll': base_roll,
            'rank_bonus': 0,  # No rank bonus for cash
            'gambling_bonus': gambling_skill,
            'total_roll': total_roll,
            'amount': amount
        }
        cash_roll_details.append(roll_detail)
        
        # Add to career history
        character_record['career_history'].append({
            'event_type': 'mustering_out_cash_roll',
            'roll': base_roll,
            'modifier': gambling_skill,  # No rank bonus for cash
            'modifier_details': _build_modifier_details(0, gambling_skill),
            'target': None,
            'result': f"Cr{amount:,}",
            'total_roll': total_roll,
            'amount': amount,
            'career': current_career
        })
    
    # Roll for benefits
    for i in range(benefit_rolls):
        base_roll = random_generator.randint(1, 6)
        total_roll = base_roll + benefit_rank_bonus
        total_roll = min(7, total_roll)  # Cap at 7 for table lookup
        
        benefit = career_benefit_table.get(total_roll, 'Low Psg')
        
        roll_detail = {
            'roll_number': i + 1,
            'base_roll': base_roll,
            'rank_bonus': benefit_rank_bonus,
            'total_roll': total_roll,
            'benefit': benefit
        }
        benefit_roll_details.append(roll_detail)
        
        # Process benefit
        if benefit.startswith('INT +'):
            boost = int(benefit.split('+')[1])
            characteristic_boosts['intelligence'] = characteristic_boosts.get('intelligence', 0) + boost
            # Apply to character record
            old_value = character_record['characteristics']['intelligence']
            character_record['characteristics']['intelligence'] += boost
            new_value = character_record['characteristics']['intelligence']
            
            # Add to career history
            character_record['career_history'].append({
                'event_type': 'mustering_out_characteristic_boost',
                'characteristic': 'intelligence',
                'boost': boost,
                'old_value': old_value,
                'new_value': new_value,
                'source': 'mustering_out_benefit'
            })
            
        elif benefit.startswith('EDU +'):
            boost = int(benefit.split('+')[1])
            characteristic_boosts['education'] = characteristic_boosts.get('education', 0) + boost
            # Apply to character record
            old_value = character_record['characteristics']['education']
            character_record['characteristics']['education'] += boost
            new_value = character_record['characteristics']['education']
            
            # Add to career history
            character_record['career_history'].append({
                'event_type': 'mustering_out_characteristic_boost',
                'characteristic': 'education',
                'boost': boost,
                'old_value': old_value,
                'new_value': new_value,
                'source': 'mustering_out_benefit'
            })
            
        elif benefit.startswith('SOC +'):
            boost = int(benefit.split('+')[1])
            characteristic_boosts['social'] = characteristic_boosts.get('social', 0) + boost
            # Apply to character record
            old_value = character_record['characteristics']['social']
            character_record['characteristics']['social'] += boost
            new_value = character_record['characteristics']['social']
            
            # Add to career history
            character_record['career_history'].append({
                'event_type': 'mustering_out_characteristic_boost',
                'characteristic': 'social',
                'boost': boost,
                'old_value': old_value,
                'new_value': new_value,
                'source': 'mustering_out_benefit'
            })
            
        elif benefit != '-':
            items.append(benefit)
            
        # Add to career history
        character_record['career_history'].append({
            'event_type': 'mustering_out_benefit_roll',
            'roll': base_roll,
            'modifier': benefit_rank_bonus,
            'modifier_details': _build_modifier_details(benefit_rank_bonus, 0),
            'target': None,
            'result': benefit,
            'total_roll': total_roll,
            'benefit': benefit,
            'career': current_career
        })
    
    # Store mustering out results
    character_record['mustering_out_benefits'] = {
        'cash': cash_total,
        'items': items,
        'characteristic_boosts': characteristic_boosts,
        'cash_roll_details': cash_roll_details,
        'benefit_roll_details': benefit_roll_details
    }
    
    # Add summary to career history
    character_record['career_history'].append({
        'event_type': 'mustering_out_summary',
        'career': current_career,
        'total_rolls': total_rolls,
        'cash_rolls': cash_rolls,
        'benefit_rolls': benefit_rolls,
        'total_cash': cash_total,
        'items': items,
        'characteristic_boosts': characteristic_boosts,
        'benefit_rank_bonus': benefit_rank_bonus,
        'gambling_skill': gambling_skill
    })
    
    return character_record

def _build_modifier_details(rank_bonus: int, gambling_bonus: int) -> List[str]:
    """Helper function to build modifier details for mustering out"""
    details = []
    if rank_bonus > 0:
        details.append(f"Rank 5/6 on benefits (+{rank_bonus})")
    if gambling_bonus > 0:
        details.append(f"Gambling skill (+{gambling_bonus})")
    return details

def increment_skill_eligibility_for_term(character_record: dict) -> None:
    """
    Increment skill eligibility at the start of a new term, before any skills are rolled.
    - First term: +2 for all
    - Subsequent terms: +2 for Scouts, +1 for others
    """
    current_term_number = get_current_term_number(character_record)
    career = character_record.get("career", "")
    
    if current_term_number == 1:
        skill_eligibilities_granted = 2
    else:
        skill_eligibilities_granted = 2 if career == "Scouts" else 1
    
    character_record["skill_eligibility"] = character_record.get("skill_eligibility", 0) + skill_eligibilities_granted

def get_available_reenlistment_options(character_record):
    options = []
    
    # Check if character is ready for reenlistment (after ageing is complete)
    # Character should be ready for reenlistment if:
    # 1. They have survived and completed their term (ready_for_ageing is False after ageing)
    # 2. They are injured and need medical discharge
    ready_for_reenlistment = (
        not character_record.get('ready_for_ageing', False) and  # Ageing is complete
        not character_record.get('ready_for_skills', False)      # Skills are complete
    )
    
    if not ready_for_reenlistment:
        return options  # Empty list - character not ready for reenlistment
    
    if character_record.get('survival_outcome') == 'injured':
        options = ['medical']
    else:
        terms_served = character_record.get('terms_served', 0)
        if terms_served >= 4:
            options.append('retire')  # 5th term or later
        else:
            options.append('leave')   # Before 5th term
        options.append('reenlist')    # Always allow reenlist
    return options

SERVICE_RANK_TITLES = {
    "Navy":       ["", "Ensign", "Lieutenant", "Lt Cmdr", "Commander", "Captain", "Admiral"],
    "Army":       ["", "Lieutenant", "Captain", "Major", "Lt Colonel", "Colonel", "General"],
    "Marines":    ["", "Lieutenant", "Captain", "Major", "Lt Colonel", "Colonel", "General"],
    "Merchants":  ["", "4th Officer", "3rd Officer", "2nd Officer", "1st Officer", "Captain"],
    "Scouts":     ["", ""],
    "Others":     ["", ""]
}

def get_rank_title(service: str, rank_number: int) -> str:
    """
    Get the rank title for a given service and rank number.

    Args:
        service: The service branch (e.g., 'Navy', 'Army', etc.)
        rank_number: The rank number (int)

    Returns:
        The rank title as a string, or an empty string if not found.
    """
    titles = SERVICE_RANK_TITLES.get(service, [""])
    if 0 <= rank_number < len(titles):
        return titles[rank_number]
    return ""

def check_ageing(random_generator: random.Random, character_record: dict[str, Any]) -> dict[str, Any]:
    """
    Check for ageing effects when a character completes a term and ages
    
    Args:
        random_generator: An instance of random.Random with the user's seed
        character_record: The character's record
        
    Returns:
        Updated character record with ageing results
    """
    # Step 1: Increment character age
    character_record = increment_character_age(character_record)
    
    # Step 2: Check for characteristic effects
    character_record = check_ageing_characteristics(random_generator, character_record)
    
    # ADD: Set ready_for_reenlistment flag when ageing is complete
    character_record["ready_for_reenlistment"] = True
    
    return character_record

if __name__ == "__main__":
    """
    Module guard - this code only runs when the module is executed directly
    """
    print("Classic Traveller Character Generation API - Fixed Version")
    print("This module is designed to be imported, not run directly.")
    print("See traveller_term_demo.py for example usage.")