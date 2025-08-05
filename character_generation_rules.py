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
import character_generation_tables as tables

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
    # Roll 2d6 for first name (1-6 for each die, convert to 0-5 indices)
    first_die = random_generator.randint(1, 6) - 1
    second_die = random_generator.randint(1, 6) - 1
    first_name = tables.FIRST_NAMES_TABLE[first_die][second_die]
    
    # Roll 2d6 for last name
    first_die = random_generator.randint(1, 6) - 1
    second_die = random_generator.randint(1, 6) - 1
    last_name = tables.LAST_NAMES_TABLE[first_die][second_die]
    
    return f"{first_name} {last_name}"

def create_character_record() -> dict[str, Any]:
    """
    Create an empty data structure to hold character generation data
    """
    return {
        "name": "",
        "age": 18,
        "terms_served": 0,  # 0 = in first term, 1 = in second term, etc.
        "current_term": 1,  # Current term number (1-based) - always terms_served + 1
        "characteristics": {},
        "skills": {},
        "career_history": [],  # Track career progression and generation events
        "skill_roll_eligibility": 0,  # Track available skill points
        "survival_outcome": None,  # "survived" or "injured" (historical record, not "pending")  
        "seed": 77,
        "random_state": None,  # Store random generator state for consistent sequences
        # Character arc progression tracking
        "current_phase": "1.1",  # Text-based decimal notation for term.phase (e.g., "4.6")
        "phase_history": [],  # Track completed phases with their IDs
        # New simplified readiness flags per state-control-rules.md
        "rdy_for_survival_check": True,  # New characters start ready for survival after enlistment
        "rdy_for_commission_check": False,
        "rdy_for_promotion_check": False,
        "rdy_for_ageing_check": False,
        "rdy_for_reenlistment": False
    }

# =============================================================================
# CHARACTER ARC PROGRESSION SYSTEM
# =============================================================================

PHASE_NAMES = {
    # Phase 0 - Pre-enlistment
    0: {
        1: "character_created",
        2: "characteristics_generated", 
        3: "service_choice",
        4: "enlistment_result"
    },
    # Phase 1+ - Career terms
    1: "survival",
    2: "commission", 
    3: "promotion",
    4: "skills",
    5: "ageing",
    6: "reenlistment",
    7: "mustering_out",
    8: "character_complete"
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

def get_current_phase_info(character_record: dict[str, Any]) -> Tuple[int, int, str]:
    """
    Parse the current phase and return term, phase number, and phase name
    
    Args:
        character_record: The character's record
        
    Returns:
        Tuple of (term_number, phase_number, phase_name)
    """
    current_phase = character_record.get("current_phase", "1.1")
    try:
        term_str, phase_str = current_phase.split(".")
        term_num = int(term_str)
        phase_num = int(phase_str)
        
        # Handle phase 0 (pre-enlistment) differently
        if term_num == 0:
            phase_name = PHASE_NAMES[0].get(phase_num, f"unknown_phase_0.{phase_num}")
        else:
            phase_name = PHASE_NAMES.get(phase_num, f"unknown_phase_{phase_num}")
        
        return term_num, phase_num, phase_name
    except (ValueError, AttributeError):
        # Fallback to character creation phase
        return 0, 1, "character_created"

def advance_to_next_phase(character_record: dict[str, Any], completed_phase_data: dict = None) -> str:
    """
    Advance character to the next phase in the progression
    
    Args:
        character_record: The character's record
        completed_phase_data: Optional data about the completed phase
        
    Returns:
        New phase ID as string (e.g., "2.4")
    """
    term_num, phase_num, phase_name = get_current_phase_info(character_record)
    
    # Record the completed phase
    phase_entry = {
        "phase_id": character_record.get("current_phase", "1.1"),
        "term": term_num,
        "phase_number": phase_num,
        "phase_name": phase_name,
        "completed": True
    }
    
    # Add any additional data about this phase
    if completed_phase_data:
        phase_entry.update(completed_phase_data)
    
    character_record.setdefault("phase_history", []).append(phase_entry)
    
    # Determine next phase
    if term_num == 0:
        # Phase 0 (pre-enlistment) progression
        if phase_num < 4:
            next_phase_num = phase_num + 1
            next_term_num = 0
        else:
            # After phase 0.4 (enlistment), move to term 1 phase 1 (survival)
            next_phase_num = 1
            next_term_num = 1
    elif phase_num < 6:
        # Move to next phase in same term
        next_phase_num = phase_num + 1
        next_term_num = term_num
    elif phase_num == 6:
        # After reenlistment, either continue to next term or end career
        continue_career = completed_phase_data and completed_phase_data.get("continue_career", False)
        if continue_career:
            next_phase_num = 1
            next_term_num = term_num + 1
        else:
            # End career, move to mustering out
            next_phase_num = 7
            next_term_num = term_num
    elif phase_num == 7:
        # After mustering out, character is complete
        next_phase_num = 8
        next_term_num = term_num
    else:
        # Character is complete, no further progression
        next_phase_num = phase_num
        next_term_num = term_num
    
    # Update current phase
    new_phase_id = f"{next_term_num}.{next_phase_num}"
    character_record["current_phase"] = new_phase_id
    
    return new_phase_id

# =============================================================================
# PHASE 0 (PRE-ENLISTMENT) FUNCTIONS
# =============================================================================

def advance_to_characteristics_generation(character_record: dict[str, Any]) -> dict[str, Any]:
    """
    Advance from phase 0.1 (character_created) to phase 0.2 (characteristics_generated)
    """
    advance_to_next_phase(character_record, {
        "action": "character_creation_complete",
        "name": character_record.get("name", "Unknown"),
        "character_id": character_record.get("character_id", "unknown")
    })
    return character_record

def advance_to_service_choice(character_record: dict[str, Any]) -> dict[str, Any]:
    """
    Advance from phase 0.2 (characteristics_generated) to phase 0.3 (service_choice)
    """
    advance_to_next_phase(character_record, {
        "action": "characteristics_generated",
        "method": "rolled",  # Could be "rolled", "assigned", etc.
        "upp_string": get_upp_string(character_record)
    })
    return character_record

def set_service_choice(character_record: dict[str, Any], chosen_service: str) -> dict[str, Any]:
    """
    Record service choice and advance from phase 0.3 to phase 0.4 (enlistment_result)
    """
    character_record["service_choice"] = chosen_service
    advance_to_next_phase(character_record, {
        "action": "service_selection",
        "chosen_service": chosen_service,
        "reason": "player_preference"
    })
    return character_record

def reset_to_phase(character_record: dict[str, Any], term: int, phase: int) -> str:
    """
    Reset character to a specific phase (useful for testing or corrections)
    
    Args:
        character_record: The character's record
        term: Term number (1-based)
        phase: Phase number (1-6)
        
    Returns:
        New phase ID as string
    """
    if not (1 <= phase <= 6):
        raise ValueError(f"Invalid phase number: {phase}. Must be 1-6.")
    
    if term < 1:
        raise ValueError(f"Invalid term number: {term}. Must be >= 1.")
    
    new_phase_id = f"{term}.{phase}"
    character_record["current_phase"] = new_phase_id
    
    return new_phase_id

def get_phase_sequence_for_service(service: str) -> List[dict]:
    """
    Get the complete phase sequence for a service, showing which phases apply
    
    Args:
        service: The service name ('Navy', 'Marines', etc.)
        
    Returns:
        List of phase information dictionaries
    """
    has_commission = service in tables.COMMISSION_TARGETS
    
    phases = []
    for phase_num in range(1, 7):
        phase_name = PHASE_NAMES[phase_num]
        phase_info = {
            "phase_number": phase_num,
            "phase_name": phase_name,
            "applies_to_service": True
        }
        
        # Mark phases that don't apply to certain services
        if phase_name in ["commission", "promotion"] and not has_commission:
            phase_info["applies_to_service"] = False
            phase_info["note"] = f"{service} does not have {phase_name} system"
        
        phases.append(phase_info)
    
    return phases


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
    return tables.ENLISTMENT_TARGETS[service]

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
    
    # Apply modifiers based on characteristics
    for char, req, bonus in tables.ENLISTMENT_BONUSES[service]:
        if characteristics.get(char, 0) >= req:
            total_modifier += bonus
            modifiers.append(f"{char.capitalize()} {characteristics.get(char, 0)}≥{req} (+{bonus})")
    
    return total_modifier, modifiers

def get_enlistment_bonus_requirements() -> dict[str, list[dict[str, Any]]]:
    """
    Get all enlistment bonus requirements for UI highlighting purposes.
    Returns ALL potential bonuses, not just those the character qualifies for.
    
    Returns:
        Dictionary mapping service names to lists of bonus requirements
        Each bonus requirement has: char, req, bonus
    """
    bonus_requirements = {}
    
    for service, bonuses in tables.ENLISTMENT_BONUSES.items():
        bonus_requirements[service.lower()] = []
        for char, req, bonus in bonuses:
            bonus_requirements[service.lower()].append({
                'char': char,
                'req': req,
                'bonus': bonus
            })
    
    return bonus_requirements

def get_reenlistment_options(character_record: dict[str, Any]) -> dict[str, Any]:
    """
    Get available reenlistment options for a character
    
    Args:
        character_record: The character's record
        
    Returns:
        Dictionary with available options and UI text
    """
    current_term = get_current_term_number(character_record)
    
    # Determine available departure option
    departure_option = "retire" if current_term >= 5 else "discharge"
    departure_text = "Retire" if current_term >= 5 else "Leave"
    
    return {
        "reenlist": {
            "preference": "reenlist",
            "text": "Reenlist",
            "available": True
        },
        "departure": {
            "preference": departure_option,
            "text": departure_text,
            "available": True
        }
    }

def get_available_services() -> List[str]:
    """
    Get list of available services for enlistment
    
    Returns:
        List of service names
    """
    return tables.get_service_list()

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
    # Check if character has already completed their career
    if character_record.get("mustering_out_benefits"):
        raise ValueError("Character has already completed their career and cannot enlist in a new service")
    
    # Check if character already has a career
    if character_record.get("career"):
        raise ValueError("Character already has a career and cannot enlist in a different service")
    
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
        enlistment_result["outcome"] = f"{service_choice} enlisted"
        enlistment_result["assigned_service"] = service_choice
    else:
        # Failed enlistment, drafted into random service
        drafted_service = get_draft_service(random_generator)
        character_record["career"] = drafted_service
        character_record["drafted"] = True
        enlistment_result["outcome"] = f"{drafted_service} drafted"
        enlistment_result["assigned_service"] = drafted_service
    
    # Per state-control-rules.md: After Enlistment/Draft, ready for survival
    character_record["rdy_for_survival_check"] = True
    
    # Reset commission and promotion flags based on new service assignment
    assigned_service = character_record["career"]
    if assigned_service in ['Scouts', 'Others']:
        # Scouts and Others never have commission or promotion opportunities
        character_record["rdy_for_commission_check"] = False
        character_record["rdy_for_promotion_check"] = False
    else:
        # Army, Navy, Marines, Merchants can potentially get commissions later
        character_record["rdy_for_commission_check"] = False  # Will be set after survival
        character_record["rdy_for_promotion_check"] = False

    # Add the enlistment attempt to the character's history
    character_record["career_history"].append(enlistment_result)
    
    # Phase progression: From 0.4 (enlistment_result) to 1.1 (survival)
    advance_to_next_phase(character_record, {
        "action": "enlistment_attempt",
        "chosen_service": service_choice,
        "assigned_service": enlistment_result["assigned_service"],
        "outcome": enlistment_result["outcome"],
        "roll": roll,
        "target": target,
        "success": success
    })
    
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
    target = tables.SURVIVAL_TARGETS[career]
    
    # Get characteristic bonuses for this career
    career_bonuses = tables.SURVIVAL_BONUSES[career]
    
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
    
    # Per state-control-rules.md: After Survival Check
    character_record["rdy_for_survival_check"] = False
    
    if survived:
        outcome = "survived"
        character_record["survival_outcome"] = "survived"
        # Grant skill eligibilities for survival (proper amount based on term/career)
        increment_skill_eligibility_for_term(character_record)
        
        # Determine next readiness state based on service and eligibility
        career = character_record.get("career", "")
        if career in ['Scouts', 'Others']:
            # Skip commission/promotion for Scouts/Others - proceed to skills phase
            pass  # skill_roll_eligibility will be consumed in skills phase
        elif not character_record.get("commissioned", False):
            # Check actual commission eligibility before enabling button
            target, modifiers, modifier_details = get_commission_requirements(character_record)
            if target is not None:
                character_record["rdy_for_commission_check"] = True
        elif character_record.get("commissioned", False):
            # Already commissioned, check promotion eligibility
            character_record["rdy_for_promotion_check"] = True
            
    else:
        outcome = "injured" 
        character_record["survival_outcome"] = "injured"
        # Injured characters skip commission/promotion/skills - go straight to ageing
        character_record["rdy_for_ageing_check"] = True
    
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
    
    # Phase progression: Survival (1.1) leads to commission (1.2)
    advance_to_next_phase(character_record, {
        "action": "survival",
        "result": "survived" if survived else "injured",
        "roll": roll,
        "target": target
    })
    
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
        
        # Phase progression: Commission (1.2) leads to promotion (1.3)
        advance_to_next_phase(character_record, {
            "action": "commission",
            "result": commission_result.get("outcome", "unknown"),
            "applicable": commission_result.get("applicable", True),
            "success": commission_result.get("success", False)
        })
        
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
        
        # Phase progression: Commission (1.2) leads to promotion (1.3)
        advance_to_next_phase(character_record, {
            "action": "commission",
            "result": commission_result.get("outcome", "unknown"),
            "applicable": commission_result.get("applicable", True),
            "success": commission_result.get("success", False)
        })
        
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
        
        # Phase progression: Commission (1.2) leads to promotion (1.3)
        advance_to_next_phase(character_record, {
            "action": "commission",
            "result": commission_result.get("outcome", "unknown"),
            "applicable": commission_result.get("applicable", True),
            "success": commission_result.get("success", False)
        })
        
        return character_record
    
    # Character is eligible for commission
    commission_result["applicable"] = True
    
    # Get commission target number
    target = tables.COMMISSION_TARGETS[career]
    commission_result["target"] = target
    
    # Get characteristic bonuses for this career
    career_bonuses = tables.COMMISSION_BONUSES[career]
    
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
    
    # Per state-control-rules.md: After Commission Attempt
    character_record["rdy_for_commission_check"] = False
    
    if commissioned:
        # Set commissioned flag in the main character record (permanent status)
        character_record["commissioned"] = True
        character_record["rank"] = 1
        commission_result["rank"] = 1
        commission_result["career"] = career
        commission_result["outcome"] = "commissioned as officer"
        # Grant +1 skill eligibility for successful commission
        character_record["skill_roll_eligibility"] = character_record.get("skill_roll_eligibility", 0) + 1
        commission_result["skill_eligibilities_granted"] = 1
        
        # Determine next state: if now commissioned and eligible for promotion
        # (Additional promotion eligibility rules will be checked when promotion is attempted)
        character_record["rdy_for_promotion_check"] = True
        
    else:
        commission_result["rank"] = 0  # No rank if not commissioned
        commission_result["career"] = career
        commission_result["outcome"] = "not commissioned"
        commission_result["skill_eligibilities_granted"] = 0
        # If commission failed, proceed to skills phase (no promotion possible)
    
    # Add the commission check to the character's career history
    character_record["career_history"].append(commission_result)
    
    # Phase progression: Commission (1.2) leads to promotion (1.3)
    advance_to_next_phase(character_record, {
        "action": "commission",
        "result": commission_result.get("outcome", "unknown"),
        "applicable": commission_result.get("applicable", True),
        "success": commission_result.get("success", False)
    })
    
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
    # Book 1 Rule: Only commissioned officers can be promoted
    # Non-commissioned characters (Rank 0) have no enlisted ranks to promote to
    
    # First check: Must be commissioned to be eligible for promotion
    if not character_record.get("commissioned", False):
        promotion_result["applicable"] = False
        promotion_result["reason"] = "Non-commissioned characters cannot be promoted (must obtain commission first)"
        promotion_result["success"] = False
        promotion_result["outcome"] = "not applicable"
        
        # Add the promotion check to the character's career history
        character_record["career_history"].append(promotion_result)
        
        # Phase progression: Promotion (1.3) leads to skills (1.4)
        advance_to_next_phase(character_record, {
            "action": "promotion",
            "result": promotion_result.get("outcome", "unknown"),
            "applicable": promotion_result.get("applicable", True),
            "success": promotion_result.get("success", False)
        })
        
        return character_record
    
    if career in ['Scouts', 'Others']:
        # These careers don't have rank structure
        promotion_result["applicable"] = False
        promotion_result["reason"] = f"{career} does not have promotions"
        promotion_result["success"] = False
        promotion_result["outcome"] = "not applicable"
        
        # Add the promotion check to the character's career history
        character_record["career_history"].append(promotion_result)
        
        # Phase progression: Promotion (1.3) leads to skills (1.4)
        advance_to_next_phase(character_record, {
            "action": "promotion",
            "result": promotion_result.get("outcome", "unknown"),
            "applicable": promotion_result.get("applicable", True),
            "success": promotion_result.get("success", False)
        })
        
        return character_record
    
    # Check for maximum rank limits
    max_rank = tables.MAX_RANKS[career]
    
    if current_rank >= max_rank:
        # Character has reached maximum rank for their career
        promotion_result["applicable"] = False
        promotion_result["reason"] = f"Character has reached maximum rank ({max_rank}) for {career}"
        promotion_result["success"] = False
        promotion_result["outcome"] = "not applicable"
        
        # Add the promotion check to the character's career history
        character_record["career_history"].append(promotion_result)
        
        # Phase progression: Promotion (1.3) leads to skills (1.4)
        advance_to_next_phase(character_record, {
            "action": "promotion",
            "result": promotion_result.get("outcome", "unknown"),
            "applicable": promotion_result.get("applicable", True),
            "success": promotion_result.get("success", False)
        })
        
        return character_record
    
    # Character is eligible for promotion (one promotion per term is handled by call sequencing)
    promotion_result["applicable"] = True
    
    # Get promotion target number
    target = tables.PROMOTION_TARGETS[career]
    promotion_result["target"] = target
    
    # Get characteristic bonuses for this career
    career_bonuses = tables.PROMOTION_BONUSES[career]
    
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
        
        # All promotions are for commissioned officers (since commission is required)
        promotion_result["outcome"] = f"promoted to rank {new_rank}"
        
        # Grant +1 skill eligibility for successful promotion
        character_record["skill_roll_eligibility"] = character_record.get("skill_roll_eligibility", 0) + 1
        promotion_result["skill_eligibilities_granted"] = 1
    else:
        promotion_result["rank"] = current_rank  # Keep current rank if not promoted
        promotion_result["career"] = career
        promotion_result["outcome"] = "not promoted"
        promotion_result["skill_eligibilities_granted"] = 0
    
    # Per state-control-rules.md: After Promotion Attempt
    character_record["rdy_for_promotion_check"] = False
    
    # Add the promotion check to the character's career history
    character_record["career_history"].append(promotion_result)
    
    return character_record

def get_survival_requirements(character_record: dict[str, Any]) -> tuple[int, int, list[str]]:
    """
    Get survival requirements for a character without rolling dice.
    
    Args:
        character_record: The character's record
        
    Returns:
        Tuple of (target, modifiers, modifier_details)
    """
    # Get career and characteristics
    career = character_record["career"]
    characteristics = character_record.get("characteristics", {})
    
    # Get survival target number
    target = tables.SURVIVAL_TARGETS[career]
    
    # Get characteristic bonuses for this career
    career_bonuses = tables.SURVIVAL_BONUSES[career]
    
    # Calculate modifiers based on characteristics
    modifier = 0
    modifier_details = []
    
    # Apply modifiers based on characteristics
    for char, req, bonus in career_bonuses:
        if characteristics.get(char, 0) >= req:
            modifier += bonus
            modifier_details.append(f"{char.capitalize()} {characteristics.get(char, 0)}≥{req} (+{bonus})")
    
    return target, modifier, modifier_details

def get_commission_requirements(character_record: dict[str, Any]) -> tuple[int, int, list[str]]:
    """
    Get commission requirements for a character without rolling dice.
    
    Args:
        character_record: The character's record
        
    Returns:
        Tuple of (target, modifiers, modifier_details)
        Returns (None, None, []) if character is not eligible for commission
    """
    # Get career and characteristics
    career = character_record["career"]
    characteristics = character_record.get("characteristics", {})
    
    # Check if character is already commissioned (can only happen once in a career)
    if character_record.get("commissioned", False):
        return None, None, ["Already commissioned"]
    
    # Check if character is eligible for commission
    if career in ['Scouts', 'Others']:
        return None, None, [f"{career} does not have commissions"]
    
    current_term_number = get_current_term_number(character_record)
    if character_record.get("drafted", False) and current_term_number == 1:
        return None, None, ["Drafted characters cannot be commissioned in first term"]
    
    # Get commission target number
    target = tables.COMMISSION_TARGETS[career]
    
    # Get characteristic bonuses for this career
    career_bonuses = tables.COMMISSION_BONUSES[career]
    
    # Calculate modifiers based on characteristics
    modifier = 0
    modifier_details = []
    
    # Apply modifiers based on characteristics
    for char, req, bonus in career_bonuses:
        if characteristics.get(char, 0) >= req:
            modifier += bonus
            modifier_details.append(f"{char.capitalize()} {characteristics.get(char, 0)}≥{req} (+{bonus})")
    
    return target, modifier, modifier_details

def get_promotion_requirements(character_record: dict[str, Any]) -> tuple[int, int, list[str]]:
    """
    Get promotion requirements for a character without rolling dice.
    
    Args:
        character_record: The character's record
        
    Returns:
        Tuple of (target, modifiers, modifier_details)
        Returns (None, None, []) if character is not eligible for promotion
    """
    # Get career and characteristics
    career = character_record["career"]
    characteristics = character_record.get("characteristics", {})
    current_rank = character_record.get("rank", 0)
    
    # Check if character is eligible for promotion
    # Book 1 Rule: Only commissioned officers can be promoted
    # Non-commissioned characters (Rank 0) have no enlisted ranks to promote to
    
    # First check: Must be commissioned to be eligible for promotion
    if not character_record.get("commissioned", False):
        return None, None, ["Non-commissioned characters cannot be promoted (must obtain commission first)"]
    
    if career in ['Scouts', 'Others']:
        return None, None, [f"{career} does not have promotions"]
    
    # Check for maximum rank limits
    max_rank = tables.MAX_RANKS[career]
    
    if current_rank >= max_rank:
        return None, None, [f"Character has reached maximum rank ({max_rank}) for {career}"]
    
    # Get promotion target number
    target = tables.PROMOTION_TARGETS[career]
    
    # Get characteristic bonuses for this career
    career_bonuses = tables.PROMOTION_BONUSES[career]
    
    # Calculate modifiers based on characteristics
    modifier = 0
    modifier_details = []
    
    # Apply modifiers based on characteristics
    for char, req, bonus in career_bonuses:
        if characteristics.get(char, 0) >= req:
            modifier += bonus
            modifier_details.append(f"{char.capitalize()} {characteristics.get(char, 0)}≥{req} (+{bonus})")
    
    return target, modifier, modifier_details

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
    
    # Note: Injured characters now bypass reenlistment entirely and go straight to muster out after aging
    
    # Get reenlistment target from tables
    target = tables.REENLISTMENT_TARGETS[career]
    
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
    
    # Reset reenlistment readiness flag
    character_record["rdy_for_reenlistment"] = False
    
    # Per state-control-rules.md: After Reenlistment
    if continue_career:
        # Reset all readiness flags and start new term
        character_record["rdy_for_survival_check"] = True
        character_record["rdy_for_commission_check"] = False  # Will be set by survival check
        character_record["rdy_for_promotion_check"] = False   # Will be set by survival check  
        character_record["rdy_for_ageing_check"] = False
        character_record["rdy_for_reenlistment"] = False
        character_record["skill_roll_eligibility"] = 0
        character_record["survival_outcome"] = None
        
        # Add indication that a new term has started
        reenlistment_result["new_term_started"] = True
    else:
        # Character is discharged - set ready for muster out
        character_record["rdy_for_muster_out"] = True
        # Clear all other readiness flags
        character_record["rdy_for_survival_check"] = False
        character_record["rdy_for_commission_check"] = False
        character_record["rdy_for_promotion_check"] = False
        character_record["rdy_for_ageing_check"] = False
        character_record["skill_roll_eligibility"] = 0
    
    # Phase progression: Reenlistment (1.6) either advances to next term (2.1) or ends career
    if continue_career:
        # Start new term, phase 2.1 (survival)
        advance_to_next_phase(character_record, {
            "action": "reenlistment",
            "result": "continued career",
            "outcome": outcome,
            "terms_served": character_record.get("terms_served", 0)
        })
    else:
        # Career ended, advance to mustering out phase (could be considered final phase)
        advance_to_next_phase(character_record, {
            "action": "reenlistment",
            "result": "career ended",
            "outcome": outcome,
            "final_terms_served": character_record.get("terms_served", 0)
        })

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
    
    # Phase progression: Ageing (1.5) leads to reenlistment (1.6)
    advance_to_next_phase(character_record, {
        "action": "ageing",
        "result": "ageing check complete",
        "age": character_record.get("age", 18),
        "checks_performed": len(ageing_event.get("checks_performed", []))
    })
    
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
    
    ageing_thresholds = tables.AGING_THRESHOLDS
    advanced_ageing_start = tables.ADVANCED_AGING_START
    
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
    
    # Per state-control-rules.md: After Ageing
    character_record["rdy_for_ageing_check"] = False
    
    # Check if character was injured - if so, skip reenlistment and go to muster out
    if character_record.get("survival_outcome") == "injured":
        character_record["rdy_for_muster_out"] = True
        # Also add the automatic medical discharge to career history
        career = character_record.get("career", "")
        medical_discharge_event = {
            "event_type": "reenlistment_attempt",
            "career": career,
            "age": character_record["age"],
            "preference": "medical",
            "roll": None,
            "target": None,
            "outcome": "medical_discharge",
            "status_text": "medical discharge",
            "continue_career": False,
            "skill_eligibilities_granted": 0,
            "reason": "injured during survival check"
        }
        character_record["career_history"].append(medical_discharge_event)
    else:
        character_record["rdy_for_reenlistment"] = True
    
    return character_record

def apply_ageing_effects(random_generator: random.Random, character_record: dict[str, Any], age: int) -> List[str]:
    """Apply ageing effects at a specific age"""
    effects = []
    characteristics = character_record.get("characteristics", {})
    
    if age in tables.PHASE_1_AGING['ages']:
        # Phase 1: Early ageing
        checks = tables.PHASE_1_AGING['checks']
    elif age in tables.PHASE_2_AGING['ages']:
        # Phase 2: Advanced ageing  
        checks = tables.PHASE_2_AGING['checks']
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
    checks = tables.ADVANCED_AGING['checks']
    
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
    skill_roll_eligibility = character_record.get("skill_roll_eligibility", 0)
    if skill_roll_eligibility <= 0:
        raise ValueError("No skill rolls remaining this term - complete ageing to continue")
    
    # Get career
    career = character_record["career"]
    
    # Get skill tables from centralized table module
    
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
            raise ValueError(f"'{table_choice}' table does not exist for {career}")
        if not available_tables[table_choice]:
            raise ValueError(f"'{table_choice}' table not available - check your rank/commission status")
        skill_event["table_choice_method"] = "player"
    
    skill_event["table_choice"] = table_choice
    
    # Get the skill table for the career
    career_tables = tables.SKILL_TABLES[career]
    
    # Ensure the table exists for this career
    if table_choice not in career_tables:
        raise ValueError(f"'{table_choice}' table not found for {career} career")
    
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
    if '+1' in skill_name or '+2' in skill_name:
        # This is a characteristic increase - handle different formats
        char_short = None
        
        if skill_name.startswith('+1 ') or skill_name.startswith('+2 '):
            # Format: "+1 STR" or "+2 INT"
            char_short = skill_name.split()[1]
        elif ' +1' in skill_name or ' +2' in skill_name:
            # Format: "STR +1" or "INT +2"
            char_short = skill_name.split()[0]
        
        # Map the short form to the full characteristic name
        char_map = {
            'STR': 'strength',
            'DEX': 'dexterity', 
            'END': 'endurance',
            'INT': 'intelligence',
            'EDU': 'education',
            'SOC': 'social'
        }
        
        characteristic = char_map.get(char_short, '').lower() if char_short else None
        
        # Extract the bonus amount
        bonus = 1  # default
        if '+2' in skill_name:
            bonus = 2
        
        # Update the characteristic
        if characteristic and characteristic in character_record.get("characteristics", {}):
            old_value = character_record["characteristics"][characteristic]
            character_record["characteristics"][characteristic] += bonus
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
    character_record["skill_roll_eligibility"] = character_record.get("skill_roll_eligibility", 0) - 1
    skill_event["skill_eligibilities_consumed"] = 1
    skill_event["skill_eligibilities_remaining"] = character_record["skill_roll_eligibility"]
    
    # Check if skills are now completed
    if character_record["skill_roll_eligibility"] <= 0:
        # Skills phase complete - move to ageing
        character_record["rdy_for_ageing_check"] = True
    
    # Add the skill resolution event to the character's career history
    character_record["career_history"].append(skill_event)
    
    # Phase progression: Skills (1.4) leads to ageing (1.5) when all skills are resolved
    if character_record["skill_roll_eligibility"] <= 0:
        advance_to_next_phase(character_record, {
            "action": "skills_complete",
            "result": "all skills resolved",
            "final_skill": skill_event.get("skill_gained", "unknown")
        })
    
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
    
    # Get mustering out tables from centralized table module
    
    # Get appropriate tables
    career_cash_table = tables.CASH_TABLES[current_career]
    career_benefit_table = tables.BENEFIT_TABLES[current_career]
    
    # Calculate bonuses
    # For benefits: +1 only if rank == 5 or rank == 6
    benefit_rank_bonus = 1 if rank in (5, 6) else 0
    
    # Track results
    cash_total = 0
    items = []
    benefit_counts = {}  # Track counts of each benefit
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
            # Track benefit counts for aggregation
            benefit_counts[benefit] = benefit_counts.get(benefit, 0) + 1
            
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
    
    # Convert benefit counts to items list with count notation
    for benefit, count in benefit_counts.items():
        if count > 1:
            items.append(f"{benefit} x {count}")
        else:
            items.append(benefit)
    
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
    
    # Clear muster out readiness flag - character has completed mustering out
    character_record["rdy_for_muster_out"] = False
    
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
    
    character_record["skill_roll_eligibility"] = character_record.get("skill_roll_eligibility", 0) + skill_eligibilities_granted

def get_available_reenlistment_options(character_record):
    options = []
    
    # Check if character is ready for reenlistment using new state control model
    if not character_record.get('rdy_for_reenlistment', False):
        return options  # Empty list - character not ready for reenlistment
    
    # Note: Injured characters no longer reach reenlistment phase - they go directly to muster out after aging
    terms_served = character_record.get('terms_served', 0)
    if terms_served >= 4:
        options.append('retire')  # 5th term or later
    else:
        options.append('leave')   # Before 5th term
    options.append('reenlist')    # Always allow reenlist
    return options

# SERVICE_RANK_TITLES moved to centralized table module

def get_rank_title(service: str, rank_number: int) -> str:
    """
    Get the rank title for a given service and rank number.

    Args:
        service: The service branch (e.g., 'Navy', 'Army', etc.)
        rank_number: The rank number (int)

    Returns:
        The rank title as a string, or an empty string if not found.
    """
    titles = tables.RANK_TITLES.get(service, [""])
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
    
    # Step 3: Clear ageing readiness flag
    character_record["rdy_for_ageing_check"] = False
    
    # Step 4: Check if character was injured - if so, skip reenlistment and go to muster out
    if character_record.get("survival_outcome") == "injured":
        character_record["rdy_for_muster_out"] = True
        character_record["rdy_for_reenlistment"] = False
        
        # Add medical discharge event to career history
        medical_discharge_event = {
            "event_type": "reenlistment_attempt",
            "career": character_record.get("career"),
            "roll": None,
            "target": None,
            "outcome": "medical_discharge",
            "status_text": "medical discharge",
            "continue_career": False,
            "skill_eligibilities_granted": 0,
            "reason": "injured during survival check"
        }
        character_record["career_history"].append(medical_discharge_event)
    else:
        # Per state-control-rules.md: After Ageing
        character_record["rdy_for_reenlistment"] = True
    
    return character_record

def calculate_success_probability(target, modifiers=0):
    """
    Calculate probability of success for Classic Traveller 2D6 roll.
    
    Rule: Roll 2D6, add modifiers, must equal or exceed target.
    
    Args:
        target (int): Target number to meet or exceed
        modifiers (int): Modifiers to add to roll (can be negative)
    
    Returns:
        dict: Contains percentage and simple description
    """
    # 2D6 probability table - number of ways to roll each sum
    roll_counts = {
        2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6,
        8: 5, 9: 4, 10: 3, 11: 2, 12: 1
    }
    
    # Calculate effective target (what we need to roll on dice)
    effective_target = target - modifiers
    
    # Edge cases
    if effective_target <= 2:
        return {"percentage": 100, "description": "Automatic"}
    elif effective_target > 12:
        return {"percentage": 0, "description": "Impossible"}
    
    # Count successful outcomes
    successful = sum(count for roll, count in roll_counts.items() if roll >= effective_target)
    percentage = round((successful / 36) * 100)
    
    return {"percentage": percentage, "description": f"{percentage}%"}

def career_survival(service: str, characteristics: dict[str, int], num_terms: int) -> dict[str, Any]:
    """
    Calculate probability of completing a full career (survival + re-enlistment).
    
    Args:
        service: The service name (Navy, Marines, Army, Scouts, Merchants, Others)
        characteristics: Character characteristics dict (e.g., {'intelligence': 8, 'endurance': 9})
        num_terms: Number of terms to complete
    
    Returns:
        dict: Contains career completion probability and breakdown
    """
    # Get survival target and bonuses for this service
    survival_target = tables.SURVIVAL_TARGETS[service]
    career_bonuses = tables.SURVIVAL_BONUSES[service]
    
    # Calculate survival modifiers based on characteristics
    survival_modifier = 0
    modifier_details = []
    
    for char, req, bonus in career_bonuses:
        if characteristics.get(char, 0) >= req:
            survival_modifier += bonus
            char_name = char.capitalize()
            modifier_details.append(f"{char_name} {characteristics[char]}≥{req} (+{bonus})")
    
    # Calculate single-term survival probability
    survival_prob_data = calculate_success_probability(survival_target, survival_modifier)
    survival_percentage = survival_prob_data["percentage"] / 100
    
    # Get re-enlistment target (no modifiers in Classic Traveller)
    reenlist_target = tables.REENLISTMENT_TARGETS[service]
    reenlist_prob_data = calculate_success_probability(reenlist_target, 0)
    reenlist_percentage = reenlist_prob_data["percentage"] / 100
    
    # For N terms: N survival rolls + (N-1) re-enlistment rolls
    # Each term requires: survival AND re-enlistment (except the last term)
    if num_terms == 1:
        # Only need to survive 1 term, no re-enlistment needed
        career_probability = survival_percentage
    else:
        # Terms 1 through N-1: must survive AND re-enlist
        # Term N: must survive only
        terms_with_reenlist = survival_percentage * reenlist_percentage
        final_term = survival_percentage
        
        career_probability = (terms_with_reenlist ** (num_terms - 1)) * final_term
    
    career_percentage = round(career_probability * 100, 2)
    
    return {
        "service": service,
        "num_terms": num_terms,
        "survival_probability": round(survival_percentage * 100, 1),
        "reenlist_probability": round(reenlist_percentage * 100, 1),
        "career_probability": career_percentage,
        "description": f"{career_percentage}% chance to complete {num_terms} terms"
    }

def get_enlistment_requirements(service: str, character_record: dict[str, Any]) -> Tuple[int, int, List[str]]:
    """
    Get enlistment requirements for a service without rolling dice.
    
    Args:
        service: The service to check requirements for
        character_record: The character's record with characteristics
        
    Returns:
        Tuple of (target, total_modifier, modifier_details)
    """
    target = get_enlistment_target(service)
    modifier, modifier_details = get_enlistment_modifiers(character_record["characteristics"], service)
    
    return target, modifier, modifier_details

def calculate_enlistment_metrics(character_record: dict[str, Any]) -> dict[str, Any]:
    """
    Calculate enlistment probabilities for all services
    
    Args:
        character_record: The character's record with characteristics
        
    Returns:
        Dictionary containing enlistment metrics for each service
    """
    if "characteristics" not in character_record:
        raise ValueError("Character record missing characteristics")
    
    characteristics = character_record["characteristics"]
    services = get_available_services()
    metrics = {}
    
    for service in services:
        service_key = service.lower()
        
        # Calculate enlistment probability using existing functions
        enlist_target, enlist_modifier, enlist_details = get_enlistment_requirements(service, character_record)
        enlist_prob = calculate_success_probability(enlist_target, enlist_modifier)
        
        metrics[service_key] = {
            "service_name": service,
            "enlist_probability": enlist_prob,
            "target": enlist_target,
            "modifier": enlist_modifier,
            "modifier_details": enlist_details
        }
    
    return {
        "success": True,
        "metrics": metrics
    }

def get_game_defaults() -> dict[str, Any]:
    """
    Get default game constants from Classic Traveller rules
    
    Returns:
        Dictionary with game default values
    """
    return {
        "starting_age": 18,
        "starting_credits": 0,
        "starting_terms": 0
    }

def get_characteristic_quality_thresholds() -> dict[str, Any]:
    """
    Get characteristic quality thresholds and corresponding CSS classes
    
    Returns:
        Dictionary with thresholds and CSS class mappings
    """
    return {
        "thresholds": [
            {"min": 11, "max": 15, "class": "char-excellent", "label": "Excellent"},
            {"min": 9, "max": 10, "class": "char-good", "label": "Good"},
            {"min": 6, "max": 8, "class": "char-average", "label": "Average"},
            {"min": 3, "max": 5, "class": "char-poor", "label": "Poor"},
            {"min": 0, "max": 2, "class": "char-bad", "label": "Bad"}
        ],
        "default_class": "char-average",
        "all_classes": ["char-bad", "char-poor", "char-average", "char-good", "char-excellent"]
    }

def get_characteristic_quality_class(value: int) -> str:
    """
    Get the CSS class for a characteristic value
    
    Args:
        value: The characteristic value (0-15)
        
    Returns:
        CSS class name for the value
    """
    thresholds = get_characteristic_quality_thresholds()["thresholds"]
    
    for threshold in thresholds:
        if threshold["min"] <= value <= threshold["max"]:
            return threshold["class"]
    
    # Fallback for values outside normal range
    if value >= 15:
        return "char-excellent"
    else:
        return "char-bad"

if __name__ == "__main__":
    """
    Module guard - this code only runs when the module is executed directly
    """
    print("Classic Traveller Character Generation API - Fixed Version")
    print("This module is designed to be imported, not run directly.")
    print("See traveller_term_demo.py for example usage.")