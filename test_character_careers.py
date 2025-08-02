#!/usr/bin/env python3
"""
Happy Path Career Testing for Classic Traveller Character Generator

This module tests all 6 career paths using monkey-patched dice rolls (all 11s)
to ensure characters progress through their careers successfully.

Usage: python test_character_careers.py
"""

import character_generation_rules as chargen

def test_career_happy_path(service_name, expected_commission=True):
    """
    Test a complete career progression with favorable dice rolls
    
    Args:
        service_name: Name of the service to test
        expected_commission: Whether this service has commissions
    """
    print(f"\n{'='*60}")
    print(f"TESTING {service_name.upper()} CAREER - HAPPY PATH")
    print(f"{'='*60}")
    
    # Store original dice function
    original_roll_2d6 = chargen.roll_2d6
    
    try:
        # Override dice to always roll 11 (passes most checks)
        chargen.roll_2d6 = lambda rng: 11
        
        # Create character with decent characteristics
        rng = chargen.set_seed(42)
        character = chargen.create_character_record()
        character["name"] = f"Test {service_name} Character"
        
        # Set reasonable characteristics (8 is decent for most purposes)
        for char_name in ["strength", "dexterity", "endurance", "intelligence", "education", "social"]:
            character["characteristics"][char_name] = 8
        
        print(f"Created character: {character['name']}")
        print(f"Characteristics: STR=8, DEX=8, END=8, INT=8, EDU=8, SOC=8")
        
        # Test Term 1
        print(f"\n--- TERM 1 ---")
        
        # 1. Enlistment
        print(f"Attempting enlistment in {service_name}...")
        character = chargen.attempt_enlistment(rng, character, service_name)
        assigned_service = character.get("career")
        drafted = character.get("drafted", False)
        print(f"Result: {'Drafted into' if drafted else 'Enlisted in'} {assigned_service}")
        
        # 2. Survival
        print("Checking survival...")
        character = chargen.check_survival(rng, character)
        survival = character.get("survival_outcome")
        print(f"Survival result: {survival}")
        
        if survival == "injured":
            print("Character injured - career ended early")
            return character
        
        # 3. Commission (if applicable)
        if expected_commission:
            print("Checking commission...")
            character = chargen.check_commission(rng, character)
            commissioned = character.get("commissioned", False)
            rank = character.get("rank", 0)
            print(f"Commission result: {'Commissioned' if commissioned else 'Not commissioned'} (Rank: {rank})")
        else:
            print(f"{service_name} does not have commissions - skipping")
        
        # 4. Promotion (if applicable and commissioned)
        if expected_commission and character.get("commissioned", False):
            print("Checking promotion...")
            character = chargen.check_promotion(rng, character)
            rank = character.get("rank", 0)
            print(f"Rank after promotion attempt: {rank}")
        else:
            print("Promotion not applicable - skipping")
        
        # 5. Skills
        skill_rolls = character.get("skill_roll_eligibility", 0)
        print(f"Skill rolls available: {skill_rolls}")
        while character.get("skill_roll_eligibility", 0) > 0:
            print("Rolling for skill...")
            character = chargen.resolve_skill(rng, character, "service")  # Use service table
            remaining = character.get("skill_roll_eligibility", 0)
            print(f"Skills remaining: {remaining}")
        
        print(f"Final skills: {character.get('skills', {})}")
        
        # 6. Aging
        print("Checking aging...")
        old_age = character.get("age", 18)
        character = chargen.check_ageing(rng, character)
        new_age = character.get("age", 18)
        print(f"Age: {old_age} -> {new_age}")
        
        # 7. Reenlistment
        print("Attempting reenlistment...")
        character = chargen.attempt_reenlistment(rng, character, "reenlist")
        
        # Find the latest reenlistment result
        reenlistment_result = None
        for event in reversed(character.get("career_history", [])):
            if event.get("event_type") == "reenlistment_attempt":
                reenlistment_result = event
                break
        
        if reenlistment_result:
            outcome = reenlistment_result.get("outcome", "unknown")
            continue_career = reenlistment_result.get("continue_career", False)
            print(f"Reenlistment result: {outcome} (Continue: {continue_career})")
            
            if not continue_career:
                print("Career ended - would proceed to mustering out")
                return character
        
        # Test Term 2 if career continues
        terms_served = character.get("terms_served", 0)
        print(f"\nTerms completed: {terms_served}")
        
        if terms_served >= 1:
            print(f"\n--- TERM 2 ---")
            
            # Repeat career cycle for term 2
            print("Survival check (Term 2)...")
            character = chargen.check_survival(rng, character)
            survival = character.get("survival_outcome")
            print(f"Survival result: {survival}")
            
            if survival != "injured":
                # Skip commission (already commissioned)
                if expected_commission and character.get("commissioned", False):
                    print("Checking promotion (Term 2)...")
                    character = chargen.check_promotion(rng, character)
                    rank = character.get("rank", 0)
                    print(f"Rank after promotion attempt: {rank}")
                
                # Skills for term 2
                skill_rolls = character.get("skill_roll_eligibility", 0)
                print(f"Skill rolls available (Term 2): {skill_rolls}")
                while character.get("skill_roll_eligibility", 0) > 0:
                    character = chargen.resolve_skill(rng, character, "service")
                
                # Aging for term 2
                character = chargen.check_ageing(rng, character)
                
                # Final reenlistment
                print("Final reenlistment attempt...")
                character = chargen.attempt_reenlistment(rng, character, "discharge")  # Choose to leave
        
        return character
        
    except Exception as e:
        print(f"ERROR during {service_name} career test: {e}")
        import traceback
        traceback.print_exc()
        return None
        
    finally:
        # Always restore original dice function
        chargen.roll_2d6 = original_roll_2d6

def print_final_character_summary(character, service_name):
    """Print a summary of the final character"""
    if not character:
        print(f"\n❌ {service_name} career test FAILED")
        return
    
    print(f"\n✅ {service_name.upper()} CAREER TEST COMPLETED")
    print(f"Character: {character.get('name', 'Unknown')}")
    print(f"Service: {character.get('career', 'Unknown')}")
    print(f"Age: {character.get('age', 18)}")
    print(f"Terms Served: {character.get('terms_served', 0)}")
    print(f"Rank: {character.get('rank', 0)}")
    print(f"Commissioned: {character.get('commissioned', False)}")
    print(f"Skills: {len(character.get('skills', {}))}")
    print(f"Phase: {character.get('current_phase', 'Unknown')}")
    print(f"Career events: {len(character.get('career_history', []))}")

def main():
    """Run all career tests"""
    print("CLASSIC TRAVELLER CAREER TESTING")
    print("Using dice override: all 2d6 rolls = 11")
    print("Testing happy path progression for all services")
    
    # Test all 6 services
    services_to_test = [
        ("Navy", True),      # Has commissions
        ("Marines", True),   # Has commissions  
        ("Army", True),      # Has commissions
        ("Merchants", True), # Has commissions
        ("Scouts", False),   # No commissions
        ("Others", False)    # No commissions
    ]
    
    results = {}
    
    for service_name, has_commission in services_to_test:
        character = test_career_happy_path(service_name, has_commission)
        results[service_name] = character
        print_final_character_summary(character, service_name)
    
    # Final summary
    print(f"\n{'='*60}")
    print("TESTING SUMMARY")
    print(f"{'='*60}")
    
    for service_name, character in results.items():
        status = "✅ PASSED" if character else "❌ FAILED"
        print(f"{service_name:12} {status}")

if __name__ == "__main__":
    main()