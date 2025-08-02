#!/usr/bin/env python3
"""
Test script for skill acquisition functionality across all careers
"""

import character_generation_rules as chargen
import character_generation_tables as tables

def test_skill_acquisition():
    """Test skill acquisition for all services"""
    print("=== SKILL ACQUISITION TESTING ===")
    print()
    
    services = ['Navy', 'Marines', 'Army', 'Scouts', 'Merchants', 'Others']
    
    for service in services:
        print(f"Testing {service} skill acquisition...")
        
        # Create test character with this service
        character = {
            'name': f'Test {service} Character',
            'characteristics': {
                'strength': 8,
                'dexterity': 8, 
                'endurance': 8,
                'intelligence': 8,
                'education': 8,
                'social': 8
            },
            'career': service,
            'rank': 0,
            'terms_served': 1,
            'age': 22,
            'skills': {},
            'career_history': [],
            'rdy_for_skill_selection': True
        }
        
        # Test each skill table type
        skill_table_types = ['personal', 'service', 'advanced', 'education']
        
        for table_type in skill_table_types:
            # Check if this character can access this table
            available_tables = tables.get_available_skill_tables(character['characteristics']['education'])
            
            if not available_tables.get(table_type, False):
                print(f"  {table_type}: SKIPPED (education too low)")
                continue
                
            try:
                # Add skill eligibility and test skill acquisition
                character['skill_roll_eligibility'] = 1
                import random
                rng = random.Random(42)  # Fixed seed for consistent results
                
                skill_result = chargen.resolve_skill(rng, character, table_type)
                
                if skill_result['success']:
                    skill_name = skill_result['skill']
                    print(f"  {table_type}: ✅ {skill_name}")
                else:
                    print(f"  {table_type}: ❌ {skill_result.get('message', 'Failed')}")
                    
            except Exception as e:
                print(f"  {table_type}: ❌ ERROR: {str(e)}")
        
        print()

if __name__ == "__main__":
    test_skill_acquisition()