#!/usr/bin/env python3
"""
Happy Path Career Testing for Classic Traveller Character Generator

This module tests all 6 career paths using monkey-patched dice rolls (all 11s)
to ensure characters progress through their careers successfully.

Usage: python test_character_careers.py
"""

import character_generation_rules as chargen

def test_career_happy_path(service_name, expected_commission=True, low_education=False):
    """
    Test a complete career progression with favorable dice rolls
    
    Args:
        service_name: Name of the service to test
        expected_commission: Whether this service has commissions
        low_education: Whether to test with EDU < 8 (can't use Education table)
    """
    edu_suffix = " (LOW EDU)" if low_education else ""
    print(f"\n{'='*60}")
    print(f"TESTING {service_name.upper()} CAREER - HAPPY PATH{edu_suffix}")
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
        
        # Set characteristics based on test type
        education_value = 6 if low_education else 8
        for char_name in ["strength", "dexterity", "endurance", "intelligence", "social"]:
            character["characteristics"][char_name] = 8
        character["characteristics"]["education"] = education_value
        
        print(f"Created character: {character['name']}")
        print(f"Characteristics: STR=8, DEX=8, END=8, INT=8, EDU={education_value}, SOC=8")
        if low_education:
            print("NOTE: Low education (EDU<8) - cannot use Education skill table")
        
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
            # Test different skill tables based on education
            if low_education:
                # Cannot use education table, use service table
                character = chargen.resolve_skill(rng, character, "service")
            else:
                # Can use education table, test it
                character = chargen.resolve_skill(rng, character, "education")
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
        
        # Continue career for up to 7 terms
        max_terms = 7
        current_term = 2
        
        while current_term <= max_terms:
            terms_served = character.get("terms_served", 0)
            if terms_served < current_term - 1:
                break  # Career ended (discharged or injured)
            
            print(f"\n--- TERM {current_term} ---")
            
            # Survival check
            print(f"Survival check (Term {current_term})...")
            character = chargen.check_survival(rng, character)
            survival = character.get("survival_outcome")
            print(f"Survival result: {survival}")
            
            if survival == "injured":
                print("Character injured - career ended")
                break
            
            # Commission/Promotion (if applicable)
            if expected_commission and character.get("commissioned", False):
                print(f"Checking promotion (Term {current_term})...")
                character = chargen.check_promotion(rng, character)
                rank = character.get("rank", 0)
                print(f"Rank after promotion attempt: {rank}")
            
            # Skills
            skill_rolls = character.get("skill_roll_eligibility", 0)
            print(f"Skill rolls available (Term {current_term}): {skill_rolls}")
            while character.get("skill_roll_eligibility", 0) > 0:
                if low_education:
                    character = chargen.resolve_skill(rng, character, "service")
                else:
                    character = chargen.resolve_skill(rng, character, "education")
            
            # Aging
            old_age = character.get("age", 18)
            character = chargen.check_ageing(rng, character)
            new_age = character.get("age", 18)
            print(f"Age: {old_age} -> {new_age}")
            
            # Reenlistment decision
            terms_completed = character.get("terms_served", 0)
            if current_term >= max_terms:
                print(f"Reached maximum terms ({max_terms}) - must leave")
                character = chargen.attempt_reenlistment(rng, character, "discharge")
                break
            elif terms_completed >= 5:
                # From term 5+, can choose retirement
                print(f"Reenlistment attempt (Term {current_term}) - choosing retirement...")
                character = chargen.attempt_reenlistment(rng, character, "retire")
            else:
                # Before term 5, must choose reenlist or discharge
                if current_term < 4:
                    print(f"Reenlistment attempt (Term {current_term}) - choosing to continue...")
                    character = chargen.attempt_reenlistment(rng, character, "reenlist")
                else:
                    print(f"Reenlistment attempt (Term {current_term}) - choosing to leave...")
                    character = chargen.attempt_reenlistment(rng, character, "discharge")
            
            # Check if career continues
            latest_reenlistment = None
            for event in reversed(character.get("career_history", [])):
                if event.get("event_type") == "reenlistment_attempt":
                    latest_reenlistment = event
                    break
            
            if latest_reenlistment and not latest_reenlistment.get("continue_career", False):
                print(f"Career ended after term {current_term}")
                break
            
            current_term += 1
        
        # Mustering out phase
        print(f"\n--- MUSTERING OUT ---")
        final_terms = character.get("terms_served", 0)
        print(f"Career completed with {final_terms} terms of service")
        
        # Test mustering out benefits
        if hasattr(chargen, 'muster_out_character'):
            print("Processing mustering out benefits...")
            character = chargen.muster_out_character(rng, character)
            benefits = character.get("mustering_out_benefits", {})
            print(f"Mustering out complete - benefits received: {len(benefits.get('rolls', []))} rolls")
        else:
            print("Mustering out function not found - skipping benefits")
        
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
    
    # Show mustering out results if available
    benefits = character.get("mustering_out_benefits")
    if benefits:
        rolls = benefits.get("rolls", [])
        print(f"Mustering out rolls: {len(rolls)}")
        cash = benefits.get("cash", 0)
        items = benefits.get("items", [])
        print(f"Final cash: {cash} credits")
        print(f"Final items: {len(items)} items")
    else:
        print("Mustering out: Not completed")

def main():
    """Run all career tests"""
    print("CLASSIC TRAVELLER CAREER TESTING")
    print("Using dice override: all 2d6 rolls = 11")
    print("Testing 7-term career progression with mustering out for all services")
    print("Testing both normal education (EDU=8) and low education (EDU=6) characters")
    
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
        # Test normal education first
        character = test_career_happy_path(service_name, has_commission, low_education=False)
        results[f"{service_name} (Normal EDU)"] = character
        print_final_character_summary(character, f"{service_name} (Normal EDU)")
        
        # Test low education
        character_low_edu = test_career_happy_path(service_name, has_commission, low_education=True)
        results[f"{service_name} (Low EDU)"] = character_low_edu
        print_final_character_summary(character_low_edu, f"{service_name} (Low EDU)")
    
    # Final summary
    print(f"\n{'='*60}")
    print("TESTING SUMMARY")
    print(f"{'='*60}")
    
    for service_name, character in results.items():
        status = "✅ PASSED" if character else "❌ FAILED"
        print(f"{service_name:20} {status}")

if __name__ == "__main__":
    main()