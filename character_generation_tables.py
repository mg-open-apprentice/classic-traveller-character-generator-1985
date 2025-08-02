#!/usr/bin/env python3
"""
Classic Traveller Book 1 (1977) Game Tables

This module contains all the official game tables from Classic Traveller Book 1,
organized in a centralized data structure for easy reference and maintenance.

All table values are taken directly from the original 1977 Book 1 rules.
"""

__version__ = "1.0.0"

# =============================================================================
# ENLISTMENT TABLES
# =============================================================================

ENLISTMENT_TARGETS = {
    'Navy': 8,
    'Marines': 9,
    'Army': 5,
    'Scouts': 7,
    'Merchants': 7,
    'Others': 3
}

ENLISTMENT_BONUSES = {
    'Navy': [('intelligence', 8, 1), ('education', 9, 2)],
    'Marines': [('intelligence', 8, 1), ('strength', 8, 2)],
    'Army': [('dexterity', 6, 1), ('endurance', 5, 2)],
    'Scouts': [('intelligence', 6, 1), ('strength', 8, 2)],
    'Merchants': [('strength', 7, 1), ('intelligence', 6, 2)],
    'Others': []
}

# =============================================================================
# SURVIVAL TABLES
# =============================================================================

SURVIVAL_TARGETS = {
    'Navy': 5,
    'Marines': 6,
    'Army': 5,
    'Scouts': 7,
    'Merchants': 5,
    'Others': 5
}

SURVIVAL_BONUSES = {
    'Navy': [('intelligence', 7, 2)],
    'Marines': [('endurance', 8, 2)],
    'Army': [('education', 6, 2)],
    'Scouts': [('endurance', 9, 2)],
    'Merchants': [('intelligence', 7, 2)],
    'Others': [('intelligence', 9, 2)]
}

# =============================================================================
# COMMISSION TABLES
# =============================================================================

COMMISSION_TARGETS = {
    'Navy': 10,
    'Marines': 9,
    'Army': 5,
    'Merchants': 4
    # Note: Scouts and Others do not have commissions
}

COMMISSION_BONUSES = {
    'Navy': [('social', 9, 1)],
    'Marines': [('education', 7, 1)],
    'Army': [('endurance', 7, 1)],
    'Merchants': [('intelligence', 9, 1)]
}

# =============================================================================
# PROMOTION TABLES
# =============================================================================

PROMOTION_TARGETS = {
    'Navy': 8,
    'Marines': 9,
    'Army': 6,
    'Merchants': 10
    # Note: Scouts and Others do not have promotions
}

PROMOTION_BONUSES = {
    'Navy': [('education', 8, 1)],
    'Marines': [('social', 8, 1)],
    'Army': [('education', 7, 1)],
    'Merchants': [('intelligence', 9, 1)]
}

MAX_RANKS = {
    'Navy': 6,
    'Marines': 6,
    'Army': 6,
    'Merchants': 5
    # Note: Scouts and Others do not have ranks
}

# =============================================================================
# REENLISTMENT TABLES
# =============================================================================

REENLISTMENT_TARGETS = {
    'Navy': 6,
    'Marines': 6,
    'Army': 7,
    'Scouts': 3,
    'Merchants': 4,
    'Others': 5
}

# =============================================================================
# AGING TABLES
# =============================================================================

# Ages at which aging checks are required
AGING_THRESHOLDS = [34, 38, 42, 46, 50, 54, 58, 62]
ADVANCED_AGING_START = 66

# Phase 1 aging (34-46): Target numbers and characteristics affected
PHASE_1_AGING = {
    'ages': [34, 38, 42, 46],
    'checks': [
        ('strength', 8, 1),
        ('dexterity', 7, 1), 
        ('endurance', 8, 1)
    ]
}

# Phase 2 aging (50-62): Target numbers and characteristics affected  
PHASE_2_AGING = {
    'ages': [50, 54, 58, 62],
    'checks': [
        ('strength', 9, 1),
        ('dexterity', 8, 1),
        ('endurance', 9, 1)
    ]
}

# Advanced aging (66+): Target numbers and characteristics affected
ADVANCED_AGING = {
    'checks': [
        ('strength', 9, 2),
        ('dexterity', 9, 2),
        ('endurance', 9, 2),
        ('intelligence', 9, 1)
    ]
}

# =============================================================================
# SKILL TABLES
# =============================================================================

SKILL_TABLES = {
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

# =============================================================================
# MUSTERING OUT TABLES
# =============================================================================

CASH_TABLES = {
    'Navy':     {1: 1000, 2: 5000, 3: 5000, 4: 10000, 5: 20000, 6: 50000, 7: 50000},
    'Marines':  {1: 2000, 2: 5000, 3: 5000, 4: 10000, 5: 20000, 6: 30000, 7: 40000},
    'Army':     {1: 2000, 2: 5000, 3: 10000, 4: 10000, 5: 10000, 6: 20000, 7: 30000},
    'Scouts':   {1: 20000, 2: 20000, 3: 30000, 4: 30000, 5: 50000, 6: 50000, 7: 50000},
    'Merchants': {1: 1000, 2: 5000, 3: 10000, 4: 20000, 5: 20000, 6: 40000, 7: 40000},
    'Others':    {1: 1000, 2: 5000, 3: 10000, 4: 10000, 5: 10000, 6: 50000, 7: 100000},
}

BENEFIT_TABLES = {
    'Navy':     {1: 'Low Psg', 2: 'INT +1', 3: 'EDU +2', 4: 'Blade', 5: 'Travellers', 6: 'High Psg', 7: 'SOC +2'},
    'Marines':  {1: 'Low Psg', 2: 'INT +2', 3: 'EDU +1', 4: 'Blade', 5: 'Traveller', 6: 'High Psg', 7: 'SOC +2'},
    'Army':     {1: 'Low Psg', 2: 'INT +1', 3: 'EDU +2', 4: 'Gun', 5: 'High Psg', 6: 'Mid Psg', 7: 'SOC +1'},
    'Scouts':   {1: 'Low Psg', 2: 'INT +2', 3: 'EDU +2', 4: 'Blade', 5: 'Gun', 6: 'Scout Ship'},
    'Merchants': {1: 'Low Psg', 2: 'INT +1', 3: 'EDU +1', 4: 'Gun', 5: 'Blade', 6: 'Low Psg', 7: 'Free Trader'},
    'Others':    {1: 'Low Psg', 2: 'INT +1', 3: 'EDU +1', 4: 'Gun', 5: 'High Psg', 6: '-'},
}

# =============================================================================
# RANK TITLES
# =============================================================================

RANK_TITLES = {
    "Navy":       ["", "Ensign", "Lieutenant", "Lt Cmdr", "Commander", "Captain", "Admiral"],
    "Army":       ["", "Lieutenant", "Captain", "Major", "Lt Colonel", "Colonel", "General"],
    "Marines":    ["", "Lieutenant", "Captain", "Force Commander", "Lt Colonel", "Colonel", "Brigadier"],
    "Merchants":  ["", "4th Officer", "3rd Officer", "2nd Officer", "1st Officer", "Captain"],
    "Scouts":     ["", ""],  # Scouts have no rank structure
    "Others":     ["", ""]   # Others have no rank structure
}

# =============================================================================
# MISC TABLES
# =============================================================================

# Services that have no commission/promotion system
NO_COMMISSION_SERVICES = ['Scouts', 'Others']

# Characteristic abbreviations mapping
CHARACTERISTIC_ABBREVIATIONS = {
    'STR': 'strength',
    'DEX': 'dexterity', 
    'END': 'endurance',
    'INT': 'intelligence',
    'EDU': 'education',
    'SOC': 'social'
}

# 2D6 probability distribution (number of ways to roll each sum)
DICE_2D6_DISTRIBUTION = {
    2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6,
    8: 5, 9: 4, 10: 3, 11: 2, 12: 1
}

# Character name tables (2d6 each)
FIRST_NAMES_TABLE = [
    ["Zara", "Orion", "Nova", "Elexis", "Jaxon", "Lyra"],
    ["Nyx", "Ryker", "Elara", "Caelum", "Vega", "Draco"],
    ["Aurora", "Cassius", "Astra", "Kaius", "Seren", "Altair"],
    ["Selene", "Maximus", "Zephyr", "Cosmo", "Astrid", "Pheonix"],
    ["Nebula", "Kira", "Axel", "Vesper", "Cyrus", "Luna"],
    ["Atlas", "Iris", "Dex", "Stella", "Kai", "Cora"]
]

LAST_NAMES_TABLE = [
    ["Xylo", "Pax", "Kin", "Vortex", "Starfire", "Nebulae"],
    ["Solaris", "Quantum", "Galaxy", "Void", "Stardust", "Cosmos"],
    ["Hyperdrive", "Meteor", "Comet", "Eclipse", "Andromeda", "Nebular"],
    ["Astraeus", "Ion", "Pulsar", "Zenith", "Flux", "Prism"],
    ["Nexus", "Titan", "Astro", "Helix", "Vector", "Cipher"],
    ["Apex", "Binary", "Nova", "Quark", "Sigma", "Vertex"]
]

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_service_list():
    """Get the list of all available services"""
    return ['Navy', 'Marines', 'Army', 'Scouts', 'Merchants', 'Others']

def has_commission_system(service):
    """Check if a service has commission/promotion system"""
    return service not in NO_COMMISSION_SERVICES

def get_available_skill_tables(education_score):
    """Get which skill tables are available based on education"""
    return {
        'personal': True,
        'service': True, 
        'advanced': True,
        'education': education_score >= 8
    }

def validate_tables():
    """Validate that all tables are consistent and complete"""
    services = get_service_list()
    
    # Check that all services have required tables
    for service in services:
        assert service in ENLISTMENT_TARGETS, f"Missing enlistment target for {service}"
        assert service in SURVIVAL_TARGETS, f"Missing survival target for {service}"
        assert service in REENLISTMENT_TARGETS, f"Missing reenlistment target for {service}"
        assert service in SKILL_TABLES, f"Missing skill tables for {service}"
        assert service in CASH_TABLES, f"Missing cash table for {service}"
        assert service in BENEFIT_TABLES, f"Missing benefit table for {service}"
        assert service in RANK_TITLES, f"Missing rank titles for {service}"
        
        # Services with commission systems need commission/promotion tables
        if has_commission_system(service):
            assert service in COMMISSION_TARGETS, f"Missing commission target for {service}"
            assert service in PROMOTION_TARGETS, f"Missing promotion target for {service}"
            assert service in MAX_RANKS, f"Missing max rank for {service}"
    
    return True

if __name__ == "__main__":
    # Validate all tables when run directly
    if validate_tables():
        print("All Classic Traveller tables validated successfully!")
        print(f"Services: {get_service_list()}")
        print(f"Commission services: {[s for s in get_service_list() if has_commission_system(s)]}")