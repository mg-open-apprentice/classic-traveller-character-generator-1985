// Classic Traveller Character Generator - Frontend
// Clean architecture - backend handles all game logic

// Global state
let currentCharacter = null;

// DOM elements
let rollPanel = null;
let rollTitle = null;
let rollDescription = null;
let rollTarget = null;
let rollBonuses = null;
let rollDiceBtn = null;
let rollOutcome = null;

// Calculate success percentage for 2d6 rolls
function calculateSuccessPercentage(target, modifier) {
    const effectiveTarget = target - modifier; // Lower is better after applying positive modifiers
    
    // Success chances for 2d6 (need to roll >= effectiveTarget)
    const successTable = {
        2: 100.0,   // 36/36
        3: 97.2,    // 35/36
        4: 91.7,    // 33/36
        5: 83.3,    // 30/36
        6: 72.2,    // 26/36
        7: 58.3,    // 21/36
        8: 41.7,    // 15/36
        9: 27.8,    // 10/36
        10: 16.7,   // 6/36
        11: 8.3,    // 3/36
        12: 2.8,    // 1/36
    };
    
    if (effectiveTarget <= 2) return 100.0;
    if (effectiveTarget >= 12) return 2.8;
    
    return successTable[effectiveTarget] || 0.0;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    setupEventListeners();
    loadUIConfig();
    loadCurrentCharacter();
});

function initializeDOMElements() {
    rollPanel = document.getElementById('roll-panel');
    rollTitle = document.getElementById('roll-title');
    rollDescription = document.getElementById('roll-description');
    rollTarget = document.getElementById('roll-target');
    rollBonuses = document.getElementById('roll-bonuses');
    rollDiceBtn = document.getElementById('roll-dice-btn');
    rollOutcome = document.getElementById('roll-outcome');
}

function setupEventListeners() {
    // Roll dice button (only add listener if it exists)
    if (rollDiceBtn) {
        rollDiceBtn.addEventListener('click', handleRollDice);
    }
    
    // Create character button
    const createBtn = document.getElementById('create-character-btn');
    if (createBtn) {
        createBtn.addEventListener('click', createCharacter);
    }
    
    // Enlist button (left sidebar) 
    const enlistBtn = document.getElementById('enlist-btn');
    if (enlistBtn) {
        enlistBtn.addEventListener('click', showEnlistmentPanel);
    }
    
    // Survival button (left sidebar)
    const survivalBtn = document.getElementById('left-survival-btn');
    if (survivalBtn) {
        survivalBtn.addEventListener('click', showSurvivalRoll);
    }
    
    // Commission button (left sidebar)
    const commissionBtn = document.getElementById('left-commission-btn');
    if (commissionBtn) {
        commissionBtn.addEventListener('click', showCommissionRoll);
    }
    
    // Promotion button (left sidebar)
    const promotionBtn = document.getElementById('left-promotion-btn');
    if (promotionBtn) {
        promotionBtn.addEventListener('click', showPromotionRoll);
    }
    
    // Skills button (left sidebar)
    const skillsBtn = document.getElementById('left-skills-btn');
    if (skillsBtn) {
        skillsBtn.addEventListener('click', showSkillsPanel);
    }
    
    // Ageing button (left sidebar)
    const ageingBtn = document.getElementById('left-ageing-btn');
    if (ageingBtn) {
        ageingBtn.addEventListener('click', showAgeingPanel);
    }
    
    // Reenlist button (left sidebar)
    const reenlistBtn = document.getElementById('left-reenlist-btn');
    if (reenlistBtn) {
        reenlistBtn.addEventListener('click', showReenlistRoll);
    }
    
    // Muster out button (left sidebar)
    const musterOutBtn = document.getElementById('mustering-out-btn');
    if (musterOutBtn) {
        musterOutBtn.addEventListener('click', showMusterOutPanel);
    }
    
    // Archive character button
    const archiveBtn = document.getElementById('archive-character-btn');
    if (archiveBtn) {
        archiveBtn.addEventListener('click', archiveCharacter);
    }
    
    // Muster out cash roll buttons
    const cashButtons = ['cash-0-btn', 'cash-1-btn', 'cash-2-btn', 'cash-3-btn'];
    cashButtons.forEach((btnId, index) => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => performMusterOut(index));
        }
    });
    
    // Characteristic buttons
    const charButtons = ['strength', 'dexterity', 'endurance', 'intelligence', 'education', 'social'];
    charButtons.forEach(char => {
        const btn = document.getElementById(`${char}-btn`);
        if (btn) {
            btn.addEventListener('click', () => generateCharacteristic(char));
        }
    });
    
    // Service enlistment buttons
    const services = ['navy', 'marines', 'army', 'scouts', 'merchants', 'others'];
    services.forEach(service => {
        const btn = document.getElementById(`${service}-btn`);
        if (btn) {
            btn.addEventListener('click', () => attemptEnlistment(service));
        }
    });
}

async function loadCurrentCharacter() {
    try {
        const response = await fetch('/api/current_character');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                currentCharacter = data.character;
                updateCharacterDisplay();
                updateUIState();
            }
        } else if (response.status === 400) {
            // No character exists yet - this is normal on page load
            console.log('No current character - ready for character creation');
            currentCharacter = null;
            updateUIState(); // This will enable all buttons
        }
    } catch (error) {
        console.log('No current character loaded');
        currentCharacter = null;
        updateUIState();
    }
}

async function createCharacter() {
    try {
        const response = await fetch('/api/create_character', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        if (data.success) {
            // Clear UI state first, then set new character
            clearUIState();
            currentCharacter = data;
            updateRecentRollDisplay('Character Created', currentCharacter.name, 'Ready for enlistment');
            updateCharacterDisplay();
            updateUIState();
        } else {
            // Handle case where character already exists
            console.log('Create character failed:', data.error);
            
            // Show user that they need to archive first
            const charName = document.getElementById('char-name');
            if (charName && data.current_character_name) {
                charName.textContent = `Archive "${data.current_character_name}" first`;
                
                // Reset to normal after 3 seconds
                setTimeout(() => {
                    if (currentCharacter && currentCharacter.name) {
                        charName.textContent = currentCharacter.name;
                    }
                }, 3000);
            }
        }
    } catch (error) {
        console.error('Error creating character:', error);
    }
}

function clearUIState() {
    // Clear current character data
    currentCharacter = null;
    
    // Hide all panels
    hideAllPanels();
    
    // Hide characteristics display
    const charDisplay = document.getElementById('characteristics-display');
    if (charDisplay) {
        charDisplay.style.display = 'none';
    }
    
    // Clear character name display
    const charName = document.getElementById('char-name');
    if (charName) charName.textContent = 'No Character';
    
    // Clear service display
    const charService = document.getElementById('char-service');
    if (charService) charService.textContent = 'No Service';
    
    // Clear age and terms
    const charAge = document.getElementById('char-age');
    const charTerms = document.getElementById('char-terms');
    if (charAge) {
        const defaultAge = uiConfig?.defaults?.starting_age || 18;
        charAge.textContent = defaultAge.toString();
    }
    if (charTerms) {
        const defaultTerms = uiConfig?.defaults?.starting_terms || 0;
        charTerms.textContent = defaultTerms.toString();
    }
    
    // Clear UPP display
    const uppString = document.getElementById('upp-string');
    if (uppString) uppString.textContent = '______';
    
    // Clear rank display
    const charRank = document.getElementById('char-rank');
    const charRankNumber = document.getElementById('char-rank-number');
    if (charRank) {
        charRank.style.display = 'none';
        charRank.textContent = 'Rank 0';
    }
    if (charRankNumber) charRankNumber.textContent = '';
    
    // Clear skill eligibility display
    const skillEligibility = document.getElementById('top-skill-eligibility');
    if (skillEligibility) skillEligibility.textContent = '';
    
    // Clear benefit eligibility display
    const benefitEligibility = document.getElementById('top-benefit-eligibility');
    if (benefitEligibility) benefitEligibility.textContent = '';
    
    // Clear credits display
    const charCredits = document.getElementById('char-credits');
    if (charCredits) charCredits.textContent = 'CR 0';
    
    // Clear skills display
    const skillsDisplay = document.getElementById('skills-display');
    if (skillsDisplay) skillsDisplay.innerHTML = '<span class="section-label">Skills </span>None';
    
    // Clear benefits display
    const benefitsDisplay = document.getElementById('benefits-display');
    if (benefitsDisplay) benefitsDisplay.innerHTML = '<span class="section-label">Benefits </span>None';
    
    // Clear all characteristic values
    const characteristics = ['strength', 'dexterity', 'endurance', 'intelligence', 'education', 'social'];
    characteristics.forEach(char => {
        // Clear bottom panel display
        const element = document.getElementById(`bottom-${char}-value`);
        if (element) {
            element.textContent = '-';
            if (uiConfig && uiConfig.characteristic_quality) {
                element.classList.remove(...uiConfig.characteristic_quality.all_classes);
            }
        }
        
        // Reset main characteristic panel buttons to "?" state
        const mainElement = document.getElementById(`${char}-value`);
        if (mainElement) {
            mainElement.textContent = '?';
        }
    });
    
    // Clear roll panel outcome
    if (rollOutcome) {
        rollOutcome.textContent = '-';
    }
    
    // Reset button states - disable all service buttons
    const buttonMap = {
        'survival': 'left-survival-btn',
        'commission': 'left-commission-btn', 
        'promotion': 'left-promotion-btn',
        'skills': 'left-skills-btn',
        'ageing': 'left-ageing-btn',
        'reenlistment': 'left-reenlist-btn',
        'muster_out': 'mustering-out-btn'
    };
    
    Object.values(buttonMap).forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            disableButton(button);
        }
    });
    
    // Hide enlist section initially
    const enlistSection = document.getElementById('enlist-section');
    if (enlistSection) {
        enlistSection.style.display = 'none';
    }
    
    // Hide archive button when no character
    const archiveBtn = document.getElementById('archive-character-btn');
    if (archiveBtn) {
        archiveBtn.style.display = 'none';
    }
    
    console.log('UI state cleared for new character');
}

async function archiveCharacter() {
    console.log('Archive function called. Current character:', currentCharacter ? currentCharacter.name : 'null');
    if (!currentCharacter || !currentCharacter.name) {
        console.error('No character to archive');
        return;
    }
    
    try {
        // Temporarily disable button to prevent double-clicks
        const archiveBtn = document.getElementById('archive-character-btn');
        if (archiveBtn) {
            archiveBtn.disabled = true;
            archiveBtn.textContent = 'Archiving...';
        }
        
        const response = await fetch('/api/archive_character', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`Character '${data.character_name}' archived successfully`);
            
            // Immediately clear state and reset for new character
            console.log('Character archived - resetting to fresh state');
            
            // Clear UI state completely
            clearUIState();
            
            // Show message indicating readiness for new character
            const charName = document.getElementById('char-name');
            if (charName) {
                charName.textContent = 'Ready for New Character';
            }
            
            // Re-enable and hide archive button since no character exists now
            if (archiveBtn) {
                archiveBtn.disabled = false;
                archiveBtn.textContent = 'Archive Character';
                archiveBtn.style.backgroundColor = '';
                archiveBtn.style.display = 'none'; // Hide it since no character to archive
            }
            
            console.log('Ready for new character creation');
            
        } else {
            console.error('Archive failed:', data.error);
            
            // Show error feedback
            if (archiveBtn) {
                archiveBtn.textContent = 'Archive Failed';
                archiveBtn.style.backgroundColor = '#dc3545';
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    archiveBtn.disabled = false;
                    archiveBtn.textContent = 'Archive Character';
                    archiveBtn.style.backgroundColor = '';
                }, 2000);
            }
        }
    } catch (error) {
        console.error('Error archiving character:', error);
        
        // Reset button on error
        const archiveBtn = document.getElementById('archive-character-btn');
        if (archiveBtn) {
            archiveBtn.disabled = false;
            archiveBtn.textContent = 'Archive Character';
            archiveBtn.style.backgroundColor = '';
        }
    }
}

async function updateCharacterNameWithRank() {
    const charName = document.getElementById('char-name');
    if (!charName || !currentCharacter) return;
    
    // Check if character is commissioned and has a rank
    if (currentCharacter.commissioned && currentCharacter.rank > 0 && currentCharacter.career) {
        try {
            const response = await fetch('/api/get_rank_title', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    service: currentCharacter.career,
                    rank: currentCharacter.rank
                })
            });
            
            const data = await response.json();
            if (data.success && data.rank_title && data.rank_title !== 'Unknown') {
                // Display rank title before name
                charName.textContent = `${data.rank_title} ${currentCharacter.name || 'Unknown'}`;
            } else {
                // Fallback to just name
                charName.textContent = currentCharacter.name || 'Unknown';
            }
        } catch (error) {
            console.error('Error fetching rank title:', error);
            // Fallback to just name
            charName.textContent = currentCharacter.name || 'Unknown';
        }
    } else {
        // Not commissioned or no rank, just show name
        charName.textContent = currentCharacter.name || 'Unknown';
    }
}

function updateRecentRollDisplay(rollType, result, details = '') {
    const recentRollText = document.getElementById('recent-roll-text');
    if (recentRollText) {
        const rollDescription = `${rollType}: ${result}${details ? ' - ' + details : ''}`;
        recentRollText.textContent = rollDescription;
    }
}

function setupRollDisplay(rollType, options = {}) {
    if (!rollTitle || !rollDescription) return;
    
    switch (rollType) {
        case 'survival':
            rollTitle.textContent = 'PHASE: SURVIVAL - Survival Check';
            rollDescription.textContent = 'Roll 2d6 to survive this term';
            break;
        case 'commission':
            rollTitle.textContent = 'PHASE: COMMISSION - Commission Check';
            rollDescription.textContent = 'Roll 2d6 to gain officer rank';
            break;
        case 'promotion':
            rollTitle.textContent = 'PHASE: PROMOTION - Promotion Check';
            rollDescription.textContent = 'Roll 2d6 for promotion';
            break;
        case 'reenlistment':
            rollTitle.textContent = 'PHASE: REENLISTMENT - Reenlistment Check';
            rollDescription.textContent = 'Roll 2d6 to continue career';
            break;
        case 'departure':
            rollTitle.textContent = 'PHASE: VOLUNTARY DEPARTURE - Leaving Service';
            rollDescription.textContent = 'Character is voluntarily leaving service';
            break;
        default:
            rollTitle.textContent = 'Roll Check';
            rollDescription.textContent = 'Roll 2d6';
            break;
    }
}

function updateCharacterDisplay() {
    if (!currentCharacter) return;
    
    // Update character name and basic info
    const charName = document.getElementById('char-name');
    const charService = document.getElementById('char-service');
    const charAge = document.getElementById('char-age');
    const charTerms = document.getElementById('char-terms');
    const termNumberTitle = document.getElementById('term-number-title');
    
    // Update character name with rank title if commissioned
    if (charName) {
        updateCharacterNameWithRank();
    }
    if (charService) {
        let serviceText = currentCharacter.career || '';
        if (currentCharacter.career) {
            let contractStatus;
            if (currentCharacter.drafted === true) {
                contractStatus = 'Drafted';
            } else if (currentCharacter.commissioned === true) {
                contractStatus = 'Commissioned';
            } else {
                contractStatus = 'Enlisted';
            }
            serviceText = `${currentCharacter.career} (${contractStatus})`;
        }
        charService.textContent = serviceText;
    }
    if (charAge) {
        const defaultAge = uiConfig?.defaults?.starting_age || 18;
        charAge.textContent = `Age ${currentCharacter.age || defaultAge}`;
    }
    if (charTerms) {
        const terms = currentCharacter.terms_served || 0;
        const rank = currentCharacter.rank || 0;
        let termsText = `Terms ${terms}`;
        if (rank > 0) {
            termsText += ` Rank ${rank}`;
        }
        charTerms.textContent = termsText;
    }
    
    // Update UPP display
    const uppString = document.getElementById('upp-string');
    if (uppString) {
        uppString.textContent = currentCharacter.upp || '______';
    }
    
    // Update term number display
    if (termNumberTitle) {
        if (currentCharacter.career_status === "complete") {
            termNumberTitle.textContent = `CAREER COMPLETE`;
        } else {
            const currentTerm = currentCharacter.current_term || 1;
            termNumberTitle.textContent = `TERM ${currentTerm}`;
        }
    }
    
    // Update skills eligibility counter
    const skillEligibility = document.getElementById('top-skill-eligibility');
    if (skillEligibility) {
        const eligibleSkills = currentCharacter.skill_roll_eligibility || 0;
        if (eligibleSkills > 0) {
            skillEligibility.textContent = `Skills ${eligibleSkills}`;
            skillEligibility.style.display = 'inline';
        } else {
            skillEligibility.style.display = 'none';
        }
    }
    
    // Update benefit rolls eligibility counter
    const benefitEligibility = document.getElementById('top-benefit-eligibility');
    if (benefitEligibility) {
        console.log(`DEBUG: Updating benefits counter, character terms: ${currentCharacter.terms_served}, mustered: ${!!currentCharacter.mustering_out_benefits}`);
        let benefitRolls = 0;
        let isEstimated = false;
        
        // Check if character has mustered out and get actual benefit rolls count
        if (currentCharacter.mustering_out_benefits) {
            // Find the mustering out summary event to get benefit_rolls count
            const careerHistory = currentCharacter.career_history || [];
            const musteringSummary = careerHistory.find(event => event.event_type === 'mustering_out_summary');
            if (musteringSummary && musteringSummary.benefit_rolls) {
                benefitRolls = musteringSummary.benefit_rolls;
            }
        } else if (currentCharacter.terms_served > 0) {
            // Character is still active - calculate estimated benefits if they mustered out now
            const termsServed = currentCharacter.terms_served || 0;
            const rank = currentCharacter.rank || 0;
            
            console.log(`DEBUG: Benefits calculation - terms: ${termsServed}, rank: ${rank}`);
            
            // Calculate total rolls (same logic as backend)
            let totalRolls = termsServed;
            if (rank >= 1 && rank <= 2) {
                totalRolls += 1;
            } else if (rank >= 3 && rank <= 4) {
                totalRolls += 2;
            } else if (rank >= 5 && rank <= 6) {
                totalRolls += 3;
            }
            
            // Assume maximum of 3 cash rolls, remainder would be benefits
            const maxCashRolls = Math.min(3, totalRolls);
            benefitRolls = totalRolls - maxCashRolls;
            isEstimated = true;
            
            console.log(`DEBUG: totalRolls: ${totalRolls}, maxCashRolls: ${maxCashRolls}, benefitRolls: ${benefitRolls}`);
        }
        
        if (benefitRolls > 0) {
            const displayText = isEstimated ? `~Benefits ${benefitRolls}` : `Benefits ${benefitRolls}`;
            benefitEligibility.textContent = displayText;
            benefitEligibility.style.display = 'inline';
        } else {
            benefitEligibility.style.display = 'none';
        }
    }
    
    // Update credits display
    const creditsDisplay = document.getElementById('char-credits');
    if (creditsDisplay) {
        // Get credits from mustering out benefits if available, otherwise default to 0
        let credits = 0;
        if (currentCharacter.mustering_out_benefits && currentCharacter.mustering_out_benefits.cash) {
            credits = currentCharacter.mustering_out_benefits.cash;
        } else if (currentCharacter.credits) {
            credits = currentCharacter.credits;
        }
        creditsDisplay.textContent = `CR ${credits.toLocaleString()}`;
    }
    
    // Update benefits display
    updateBenefitsDisplay();
    
    // Update skills display
    updateSkillsDisplay();
    
    // Update characteristics display in bottom panel
    updateCharacteristicsDisplay();
}

function updateBenefitsDisplay() {
    if (!currentCharacter) return;
    
    const benefitsDisplay = document.getElementById('benefits-display');
    if (!benefitsDisplay) return;
    
    const musteringOutBenefits = currentCharacter.mustering_out_benefits;
    if (musteringOutBenefits && musteringOutBenefits.items && musteringOutBenefits.items.length > 0) {
        // Character has mustered out and received benefits
        const items = musteringOutBenefits.items;
        
        // Aggregate duplicate benefits into counts
        const benefitCounts = {};
        items.forEach(item => {
            // Skip items that already have count notation (from new backend logic)
            if (item.includes(' x ')) {
                return; // Already formatted, use as-is
            }
            benefitCounts[item] = (benefitCounts[item] || 0) + 1;
        });
        
        // Convert counts to display format
        const displayItems = [];
        
        // Add pre-formatted items (from new backend logic)
        items.filter(item => item.includes(' x ')).forEach(item => {
            displayItems.push(item);
        });
        
        // Add aggregated items
        Object.entries(benefitCounts).forEach(([benefit, count]) => {
            if (count > 1) {
                displayItems.push(`${benefit} x ${count}`);
            } else {
                displayItems.push(benefit);
            }
        });
        
        benefitsDisplay.innerHTML = `<span class="section-label">Benefits </span>${displayItems.join(', ')}`;
    } else {
        // No benefits yet
        benefitsDisplay.innerHTML = '<span class="section-label">Benefits </span>None';
    }
}

function updateSkillsDisplay() {
    if (!currentCharacter) return;
    
    const skillsDisplay = document.getElementById('skills-display');
    if (!skillsDisplay) return;
    
    const skills = currentCharacter.skills || {};
    const skillEntries = Object.entries(skills);
    
    if (skillEntries.length === 0) {
        skillsDisplay.innerHTML = '<span class="section-label">Skills </span>None';
    } else {
        const skillTexts = skillEntries.map(([skill, level]) => {
            return level > 1 ? `${skill}-${level}` : skill;
        });
        skillsDisplay.innerHTML = `<span class="section-label">Skills </span>${skillTexts.join(', ')}`;
    }
}

function updateUPPDisplay() {
    if (!currentCharacter) return;
    
    // Update UPP string (6-character hex representation of characteristics)
    const uppElement = document.getElementById('upp-string');
    if (uppElement && currentCharacter.upp) {
        uppElement.textContent = currentCharacter.upp;
    }
    
    // Update age
    const ageElement = document.getElementById('char-age');
    if (ageElement && currentCharacter.age) {
        ageElement.textContent = `Age ${currentCharacter.age}`;
    }
    
    // Update terms served
    const termsElement = document.getElementById('char-terms');
    if (termsElement && currentCharacter.terms_served !== undefined) {
        termsElement.textContent = `Terms ${currentCharacter.terms_served}`;
    }
    
    // Update rank if character has one
    const rankElement = document.getElementById('char-rank');
    if (rankElement && currentCharacter.rank !== undefined && currentCharacter.rank > 0) {
        rankElement.textContent = `Rank ${currentCharacter.rank}`;
        rankElement.style.display = 'inline';
    } else if (rankElement) {
        rankElement.style.display = 'none';
    }
}

function updateCharacteristicsDisplay() {
    if (!currentCharacter) return;
    
    const charDisplay = document.getElementById('characteristics-display');
    const characteristics = currentCharacter.characteristics || {};
    
    // Show characteristics display if character has any characteristics
    if (Object.keys(characteristics).length > 0) {
        if (charDisplay) {
            charDisplay.style.display = 'block';
        }
        
        // Update each characteristic
        const charMap = {
            'strength': 'bottom-strength-value',
            'dexterity': 'bottom-dexterity-value', 
            'endurance': 'bottom-endurance-value',
            'intelligence': 'bottom-intelligence-value',
            'education': 'bottom-education-value',
            'social': 'bottom-social-value'
        };
        
        Object.entries(charMap).forEach(([charName, elementId]) => {
            const element = document.getElementById(elementId);
            const value = characteristics[charName];
            
            if (element && value !== undefined) {
                element.textContent = value;
                applyCharacteristicColor(element, value);
            } else if (element) {
                element.textContent = '-';
                // Remove color classes when no value
                if (uiConfig && uiConfig.characteristic_quality) {
                    element.classList.remove(...uiConfig.characteristic_quality.all_classes);
                }
            }
        });
    } else {
        // Hide characteristics display if no characteristics
        if (charDisplay) {
            charDisplay.style.display = 'none';
        }
    }
}

function hasCompletedActionThisTerm(actionType) {
    if (!currentCharacter) return false;
    
    const currentTerm = (currentCharacter.terms_served || 0) + 1;
    const careerHistory = currentCharacter.career_history || [];
    
    // Find the start of the current term
    let currentTermStartIndex = 0;
    for (let i = careerHistory.length - 1; i >= 0; i--) {
        const event = careerHistory[i];
        if (event.event_type === 'reenlistment_attempt' && event.new_term_started) {
            currentTermStartIndex = i + 1;
            break;
        }
    }
    
    // Check if the action has been completed since the current term started
    for (let i = currentTermStartIndex; i < careerHistory.length; i++) {
        const event = careerHistory[i];
        if (event.event_type === actionType) {
            return true;
        }
    }
    
    return false;
}

function updateUIState() {
    if (!currentCharacter) return;
    
    // Show enlist button after character creation
    const enlistSection = document.getElementById('enlist-section');
    if (currentCharacter.name && enlistSection) {
        enlistSection.style.display = 'block';
    }
    
    // Show archive button when character exists and has a name
    const archiveBtn = document.getElementById('archive-character-btn');
    if (currentCharacter.name && archiveBtn) {
        archiveBtn.style.display = 'block';
    } else if (archiveBtn) {
        archiveBtn.style.display = 'none';
    }
    
    // Update button states based on character readiness flags
    updateButtonStates();
    
    // Check what phase we're in
    if (currentCharacter.upp === '______' || (currentCharacter.upp && currentCharacter.upp.includes('_'))) {
        // Need to generate characteristics (either all blank or partially complete)
        showCharacteristicsPanel();
    } else if (!currentCharacter.career) {
        // Need to enlist - just ensure characteristics display is updated
        // Hover effects will be set up when user clicks "Enlist" button
        updateCharacteristicsDisplay();
    } else if (currentCharacter.rdy_for_commission_check) {
        // Ready for commission roll
        showCommissionRoll();
    } else if (currentCharacter.rdy_for_promotion_check) {
        // Ready for promotion roll
        showPromotionRoll();
    } else {
        // For survival and other phases, leave middle panel empty
        // User must manually click the appropriate button in left sidebar
        hideAllPanels();
    }
}

async function updateButtonStates() {
    if (!currentCharacter) {
        // No character loaded - disable all service buttons
        disableAllServiceButtons();
        return;
    }
    
    try {
        // Get available actions from backend
        const response = await fetch('/api/get_available_actions');
        const data = await response.json();
        
        if (!data.success) {
            console.error('Error getting available actions:', data.error);
            return;
        }
        
        const availableActions = data.available_actions || [];
        console.log('Available actions:', availableActions);
        
        // Update button states based on backend response
        const buttonMap = {
            'survival': 'left-survival-btn',
            'commission': 'left-commission-btn', 
            'promotion': 'left-promotion-btn',
            'skills': 'left-skills-btn',
            'ageing': 'left-ageing-btn',
            'reenlistment': 'left-reenlist-btn',
            'muster_out': 'mustering-out-btn'
        };
        
        // First disable all service buttons
        Object.values(buttonMap).forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                disableButton(button);
            }
        });
        
        // Then enable only the available actions
        availableActions.forEach(action => {
            const buttonId = buttonMap[action];
            if (buttonId) {
                const button = document.getElementById(buttonId);
                if (button) {
                    enableButton(button);
                }
            }
        });
        
    } catch (error) {
        console.error('Error updating button states:', error);
    }
}

function enableAllButtons() {
    const survivalBtn = document.getElementById('left-survival-btn');
    const commissionBtn = document.getElementById('left-commission-btn');
    const promotionBtn = document.getElementById('left-promotion-btn');
    const skillsBtn = document.getElementById('left-skills-btn');
    const ageingBtn = document.getElementById('left-ageing-btn');
    const reenlistBtn = document.getElementById('left-reenlist-btn');
    
    if (survivalBtn) enableButton(survivalBtn);
    if (commissionBtn) enableButton(commissionBtn);
    if (promotionBtn) enableButton(promotionBtn);
    if (skillsBtn) enableButton(skillsBtn);
    if (ageingBtn) enableButton(ageingBtn);
    if (reenlistBtn) enableButton(reenlistBtn);
}

function enableButton(button) {
    button.disabled = false;
    button.classList.remove('btn-disabled');
    button.style.pointerEvents = 'auto';
}

function disableButton(button) {
    button.disabled = true;
    button.classList.add('btn-disabled');
    button.style.pointerEvents = 'none';
}

async function showSurvivalRoll() {
    if (!currentCharacter) return;
    
    // Get survival requirements from backend
    try {
        const response = await fetch('/api/action_probability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action_type: 'survival'
            })
        });
        
        const data = await response.json();
        if (data.success) {
            setupRollPanel('survival', data);
            showRollPanel();
        }
    } catch (error) {
        console.error('Error getting survival data:', error);
    }
}

async function showCommissionRoll() {
    if (!currentCharacter) return;
    
    // Get commission requirements from backend
    try {
        const response = await fetch('/api/action_probability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action_type: 'commission'
            })
        });
        
        const data = await response.json();
        if (data.success) {
            setupRollPanel('commission', data);
            showRollPanel();
        }
    } catch (error) {
        console.error('Error getting commission data:', error);
    }
}

async function showPromotionRoll() {
    if (!currentCharacter) return;
    
    // Get promotion requirements from backend
    try {
        const response = await fetch('/api/action_probability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action_type: 'promotion'
            })
        });
        
        const data = await response.json();
        if (data.success) {
            setupRollPanel('promotion', data);
            showRollPanel();
        }
    } catch (error) {
        console.error('Error getting promotion data:', error);
    }
}

function setupRollPanel(rollType, data) {
    // Hide/show appropriate UI elements
    const bonusesElement = document.getElementById('roll-bonuses');
    const bonusesBox = bonusesElement ? bonusesElement.parentElement : null;
    const choiceElement = document.getElementById('roll-choice-btn');
    const choiceBox = choiceElement ? choiceElement.parentElement : null;
    const choiceBtn = document.getElementById('roll-choice-btn');
    const choiceText = document.getElementById('roll-choice-text');
    
    if (rollType === 'survival') {
        // Configure panel for survival roll
        rollTitle.textContent = 'PHASE: SURVIVAL - Survival Check';
        rollDescription.textContent = 'Roll 2d6 to survive this term';
        if (bonusesBox) bonusesBox.style.display = 'flex';
        if (choiceBox) choiceBox.classList.add('choice-box-hidden');
    } else if (rollType === 'commission') {
        // Configure panel for commission roll
        rollTitle.textContent = 'PHASE: COMMISSION - Commission Check';
        rollDescription.textContent = 'Roll 2d6 to gain officer rank';
        if (bonusesBox) bonusesBox.style.display = 'flex';
        if (choiceBox) choiceBox.classList.add('choice-box-hidden');
    } else if (rollType === 'promotion') {
        // Configure panel for promotion roll
        rollTitle.textContent = 'PHASE: PROMOTION - Promotion Check';
        rollDescription.textContent = 'Roll 2d6 to advance in rank';
        if (bonusesBox) bonusesBox.style.display = 'flex';
        if (choiceBox) choiceBox.classList.add('choice-box-hidden');
    } else if (rollType === 'reenlistment') {
        // Configure panel for reenlistment choice
        rollTitle.textContent = 'PHASE: REENLISTMENT - Service Decision';
        rollDescription.textContent = 'Choose your preference - both require rolls';
        
        // Hide bonuses box (no bonuses for reenlistment)
        if (bonusesBox) bonusesBox.style.display = 'none';
        
        // Show choice box and get options from backend
        if (choiceBox) choiceBox.classList.remove('choice-box-hidden');
        
        // Get reenlistment options from backend instead of hardcoded logic
        setupReenlistmentOptions(choiceText, choiceBtn);
        
        // Update main button text
        const rollBtnText = rollDiceBtn.querySelector('.roll-btn-text');
        if (rollBtnText) rollBtnText.textContent = 'Reenlist';
    } else if (rollType === 'ageing') {
        // Configure panel for ageing roll
        rollTitle.textContent = 'PHASE: AGEING - Ageing Check';
        rollDescription.textContent = 'Roll for age-related effects';
        if (bonusesBox) bonusesBox.style.display = 'flex';
        if (choiceBox) choiceBox.classList.add('choice-box-hidden');
    }
    
    // Reset main button text for non-reenlistment rolls
    if (rollType !== 'reenlistment') {
        const rollBtnText = rollDiceBtn.querySelector('.roll-btn-text');
        if (rollBtnText) rollBtnText.textContent = 'Roll';
    }
    
    rollTarget.textContent = data.target || '-';
    rollBonuses.textContent = data.total_modifier || '0';
    
    // Calculate and display success percentage in outcome box
    const target = parseInt(data.target) || 0;
    const modifier = parseInt(data.total_modifier) || 0;
    const successPercentage = calculateSuccessPercentage(target, modifier);
    
    // Show percentage in outcome box before rolling
    if (rollOutcome) {
        rollOutcome.textContent = Math.round(successPercentage) + '%';
        console.log('Showing success percentage for', rollType);
    } else {
        console.error('rollOutcome element not found!');
    }
    
    // Store roll type for when dice are rolled
    rollDiceBtn.dataset.rollType = rollType;
}

function showRollPanel() {
    // Hide other panels
    hideAllPanels();
    
    // Show roll panel
    rollPanel.style.display = 'block';
}

function hideRollPanel() {
    rollPanel.style.display = 'none';
}

function hideAllPanels() {
    const panels = [
        'roll-panel',
        'characteristics-panel', 
        'skills-panel',
        'ageing-panel',
        'enlistment-panel',
        'mustering-out-panel'
    ];
    
    panels.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (panel) panel.style.display = 'none';
    });
    
    // Note: characteristics-display stays visible once shown
}

async function showSkillsPanel() {
    if (!currentCharacter) return;
    
    // Hide other panels
    hideAllPanels();
    
    // Show skills panel
    const skillsPanel = document.getElementById('skills-panel');
    if (skillsPanel) {
        skillsPanel.style.display = 'block';
    }
    
    try {
        // Get available skill tables from backend
        const response = await fetch('/api/available_skill_tables');
        const data = await response.json();
        
        if (data.success) {
            const availableTables = data.available_tables;
            
            // Update button visibility based on backend rules
            const tableButtons = {
                'personal': document.getElementById('personal-skill-btn'),
                'service': document.getElementById('service-skill-btn'),
                'advanced': document.getElementById('advanced-skill-btn'),
                'education': document.getElementById('education-skill-btn')
            };
            
            Object.entries(tableButtons).forEach(([tableName, button]) => {
                if (button) {
                    button.style.display = availableTables[tableName] ? 'block' : 'none';
                }
            });
        } else {
            console.error('Failed to get available skill tables:', data.error);
            // Fallback to showing all tables
            const allButtons = ['personal-skill-btn', 'service-skill-btn', 'advanced-skill-btn', 'education-skill-btn'];
            allButtons.forEach(btnId => {
                const btn = document.getElementById(btnId);
                if (btn) btn.style.display = 'block';
            });
        }
    } catch (error) {
        console.error('Error getting available skill tables:', error);
        // Fallback to showing all tables
        const allButtons = ['personal-skill-btn', 'service-skill-btn', 'advanced-skill-btn', 'education-skill-btn'];
        allButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) btn.style.display = 'block';
        });
    }
    
    // Add event listeners for skill table buttons
    setupSkillTableListeners();
}

function setupSkillTableListeners() {
    const skillButtons = [
        { id: 'personal-skill-btn', table: 'personal' },
        { id: 'service-skill-btn', table: 'service' },
        { id: 'advanced-skill-btn', table: 'advanced' },
        { id: 'education-skill-btn', table: 'education' }
    ];
    
    skillButtons.forEach(({ id, table }) => {
        const btn = document.getElementById(id);
        if (btn) {
            // Remove existing listeners to avoid duplicates
            btn.replaceWith(btn.cloneNode(true));
            const newBtn = document.getElementById(id);
            newBtn.addEventListener('click', () => rollOnSkillTable(table));
        }
    });
}

async function rollOnSkillTable(tableName) {
    if (!currentCharacter) return;
    
    try {
        const response = await fetch('/api/resolve_skill', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                table_choice: tableName
            })
        });
        
        const data = await response.json();
        if (data.success) {
            // Update character data
            currentCharacter = data.character;
            
            // Show skill result in UI (no popup)
            const skillEvent = data.skill_event;
            if (skillEvent) {
                console.log(`Skill gained: ${skillEvent.skill_gained || 'Unknown skill'}`);
                // Update recent roll display
                const rollDetails = `${skillEvent.roll} on ${tableName} table`;
                updateRecentRollDisplay('Skill Gained', skillEvent.skill_gained, rollDetails);
            }
            
            // Update character display
            updateCharacterDisplay();
            updateButtonStates();
            
            // Check if more skill rolls are available
            if (currentCharacter.skill_roll_eligibility > 0) {
                // Stay in skills panel for next roll
                showSkillsPanel();
            } else {
                // No more skills available, hide panel
                hideAllPanels();
            }
        }
    } catch (error) {
        console.error('Error rolling skill:', error);
    }
}

function showAgeingPanel() {
    if (!currentCharacter) return;
    
    // Hide other panels
    hideAllPanels();
    
    // Show ageing panel
    const ageingPanel = document.getElementById('ageing-panel');
    if (ageingPanel) {
        ageingPanel.style.display = 'block';
    }
    
    // Set up the years button - check if character is injured
    const addYearsBtn = document.getElementById('add-years-btn');
    if (addYearsBtn) {
        // Check if character was injured during survival
        const isInjured = currentCharacter.survival_outcome === 'injured';
        const yearsToAdd = isInjured ? 2 : 4;
        
        // Update button text based on injury status
        addYearsBtn.textContent = `+${yearsToAdd} Years`;
        
        // Remove existing listeners to avoid duplicates
        addYearsBtn.replaceWith(addYearsBtn.cloneNode(true));
        const newBtn = document.getElementById('add-years-btn');
        newBtn.textContent = `+${yearsToAdd} Years`; // Ensure text is preserved after cloning
        newBtn.addEventListener('click', performAgeing);
    }
}

async function performAgeing() {
    if (!currentCharacter) return;
    
    try {
        const response = await fetch('/api/ageing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        if (data.success) {
            // Update character data
            currentCharacter = data.character;
            
            // Update recent roll display
            const result = data.ageing_result;
            if (result) {
                const rollDetails = `${result.roll} vs aging threshold ${result.target}`;
                const outcome = result.effects && result.effects.length > 0 ? 
                    result.effects.join(', ') : 'No effects';
                updateRecentRollDisplay('Aging', outcome, rollDetails);
            }
            
            // Update character display
            updateCharacterDisplay();
            updateButtonStates();
            
            // Hide ageing panel
            hideAllPanels();
        }
    } catch (error) {
        console.error('Error performing ageing:', error);
    }
}

async function handleRollDice() {
    const rollType = rollDiceBtn.dataset.rollType;
    
    if (rollType === 'survival') {
        await performSurvivalRoll();
    } else if (rollType === 'commission') {
        await performCommissionRoll();
    } else if (rollType === 'promotion') {
        await performPromotionRoll();
    } else if (rollType === 'reenlistment') {
        await performReenlistRoll();
    }
}

async function performSurvivalRoll() {
    try {
        // Disable button during roll
        rollDiceBtn.disabled = true;
        rollOutcome.textContent = 'Rolling...';
        
        const response = await fetch('/api/survival', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        if (data.success) {
            // Update character data
            currentCharacter = data.character;
            
            // Show result
            const result = data.survival_result;
            const outcome = result.outcome === 'survived' ? 'SURVIVED' : 'INJURED';
            
            // Show the outcome
            rollOutcome.textContent = outcome;
            
            // Update recent roll display
            const rollDetails = `${result.roll}+${result.modifier} vs ${result.target}`;
            updateRecentRollDisplay('Survival', outcome, rollDetails);
            
            // Update character display
            updateCharacterDisplay();
            
            // Update button states (disable survival button after completion)
            updateButtonStates();
            
            // Check for injury and show message
            if (result.outcome === 'injured') {
                // Show injury message but still show aging button
                setTimeout(() => {
                    rollOutcome.textContent = 'INJURED - Must age before medical discharge';
                }, 2000); // Show injury result for 2 seconds first
            } else {
                // Re-enable roll dice button for next action
                rollDiceBtn.disabled = false;
            }
        } else {
            rollOutcome.textContent = 'Error: ' + data.error;
        }
    } catch (error) {
        console.error('Error performing survival roll:', error);
        rollOutcome.textContent = 'Error performing roll';
        rollDiceBtn.disabled = false; // Re-enable only on error
    }
}

async function performCommissionRoll() {
    try {
        // Disable button during roll
        rollDiceBtn.disabled = true;
        rollOutcome.textContent = 'Rolling...';
        
        const response = await fetch('/api/commission', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        if (data.success) {
            // Update character data
            currentCharacter = data.character;
            
            // Show result
            const result = data.commission_result;
            const outcome = result.success ? 'COMMISSIONED' : 'COMMISSION DENIED';
            
            // Show the outcome
            rollOutcome.textContent = outcome;
            
            // Update recent roll display
            const rollDetails = `${result.roll}+${result.modifier} vs ${result.target}`;
            updateRecentRollDisplay('Commission', outcome, rollDetails);
            
            // Update character display
            updateCharacterDisplay();
            // Update button states but don't auto-show panels (preserve roll outcome)
            updateButtonStates();
            
            // Re-enable roll dice button for next action
            rollDiceBtn.disabled = false;
            
            // Keep roll outcome visible until user clicks another button
            // No automatic UI state update
        } else {
            rollOutcome.textContent = 'Error: ' + data.error;
        }
    } catch (error) {
        console.error('Error performing commission roll:', error);
        rollOutcome.textContent = 'Error performing roll';
        rollDiceBtn.disabled = false; // Re-enable only on error
    }
}

async function performPromotionRoll() {
    try {
        // Disable button during roll
        rollDiceBtn.disabled = true;
        rollOutcome.textContent = 'Rolling...';
        
        const response = await fetch('/api/promotion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        if (data.success) {
            // Update character data
            currentCharacter = data.character;
            
            // Show result
            const result = data.promotion_result;
            const outcome = result.success ? 'PROMOTED' : 'PROMOTION DENIED';
            
            // Show the outcome
            rollOutcome.textContent = outcome;
            
            // Update recent roll display
            const rollDetails = `${result.roll}+${result.modifier} vs ${result.target}`;
            updateRecentRollDisplay('Promotion', outcome, rollDetails);
            
            // Update character display
            updateCharacterDisplay();
            
            // Update button states (disable promotion button after completion)
            updateButtonStates();
            
            // Re-enable roll dice button for next action
            rollDiceBtn.disabled = false;
        } else {
            rollOutcome.textContent = 'Error: ' + data.error;
        }
    } catch (error) {
        console.error('Error performing promotion roll:', error);
        rollOutcome.textContent = 'Error performing roll';
        rollDiceBtn.disabled = false; // Re-enable only on error
    }
}

async function showReenlistRoll() {
    if (!currentCharacter) return;
    
    // Get reenlistment requirements from backend
    try {
        const response = await fetch('/api/action_probability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action_type: 'reenlist'
            })
        });
        
        const data = await response.json();
        if (data.success) {
            setupRollPanel('reenlistment', data);
            showRollPanel();
        }
    } catch (error) {
        console.error('Error getting reenlistment data:', error);
    }
}

async function performReenlistRoll() {
    try {
        // Disable button during roll
        rollDiceBtn.disabled = true;
        rollOutcome.textContent = 'Rolling...';
        
        const response = await fetch('/api/reenlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                preference: 'reenlist'
            })
        });
        
        const data = await response.json();
        if (data.success) {
            // Update character data
            currentCharacter = data.character;
            
            // Show result
            const result = data.reenlistment_result;
            const outcome = result.continue_career ? 'REENLISTED' : result.outcome.toUpperCase();
            
            // Show the outcome
            rollOutcome.textContent = outcome;
            
            // Update recent roll display
            const rollDetails = `${result.roll}+${result.modifier} vs ${result.target}`;
            updateRecentRollDisplay('Reenlistment', outcome, rollDetails);
            
            // Update character display
            updateCharacterDisplay();
            
            // Update button states (handle new term transition)
            updateButtonStates();
            
            // Re-enable roll dice button for next action
            rollDiceBtn.disabled = false;
        } else {
            rollOutcome.textContent = 'Error: ' + data.error;
        }
    } catch (error) {
        console.error('Error performing reenlistment roll:', error);
        rollOutcome.textContent = 'Error performing roll';
        rollDiceBtn.disabled = false; // Re-enable only on error
    }
}

async function showMusterOutPanel() {
    if (!currentCharacter) return;
    
    // Hide other panels
    hideAllPanels();
    
    try {
        // Get muster out info from backend
        const response = await fetch('/api/muster_out_info');
        const data = await response.json();
        
        if (data.success) {
            const maxCashRolls = data.max_cash_rolls;
            
            // Update button states based on max cash rolls
            const cashButtons = ['cash-0-btn', 'cash-1-btn', 'cash-2-btn', 'cash-3-btn'];
            cashButtons.forEach((btnId, index) => {
                const btn = document.getElementById(btnId);
                if (btn) {
                    if (index <= maxCashRolls) {
                        btn.disabled = false;
                        btn.style.opacity = '1';
                        btn.style.cursor = 'pointer';
                    } else {
                        btn.disabled = true;
                        btn.style.opacity = '0.3';
                        btn.style.cursor = 'not-allowed';
                    }
                }
            });
            
            // Show mustering out panel
            const musterOutPanel = document.getElementById('mustering-out-panel');
            if (musterOutPanel) {
                musterOutPanel.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error getting muster out info:', error);
        
        // Fallback: show panel with all buttons enabled
        const musterOutPanel = document.getElementById('mustering-out-panel');
        if (musterOutPanel) {
            musterOutPanel.style.display = 'block';
        }
    }
}

async function performMusterOut(cashRolls) {
    try {
        const response = await fetch('/api/muster_out', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cash_rolls: cashRolls
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            console.error('Muster out error:', data.error);
            return;
        }
        
        // Update current character
        currentCharacter = data.character;
        
        // Update recent roll display with actual mustering out benefits
        const benefits = data.character.mustering_out_benefits;
        if (benefits) {
            const cash = benefits.cash || 0;
            const items = benefits.items || [];
            const benefitsList = items.length > 0 ? items.join(', ') : 'none';
            const cashText = cash > 0 ? `${cash} credits` : 'no credits';
            updateRecentRollDisplay('Mustered Out', `${cashText}, ${benefitsList}`, 'Career complete');
        } else {
            updateRecentRollDisplay('Mustered Out', 'Career complete', 'No benefits received');
        }
        
        // Hide muster out panel
        hideAllPanels();
        
        // Update displays
        updateCharacterDisplay(data);
        updateButtonStates(data);
        
        // Show muster out results in activity log if available
        if (data.event_log) {
            displayEventLog(data.event_log);
        }
        
        // Check if career is complete - character is archived but still visible
        if (data.career_complete) {
            console.log('Character career completed and archived');
            
            // Show completion message in character name area
            const charName = document.getElementById('char-name');
            if (charName) {
                const originalName = currentCharacter.name;
                charName.textContent = `${originalName} (Career Complete)`;
            }
            
            // Character is archived by backend but remains visible
            // User must manually use "Archive Character" button to reset UI
        }
        
    } catch (error) {
        console.error('Error performing muster out:', error);
    }
}

// Character Creation Functions
function showCharacteristicsPanel() {
    hideAllPanels();
    document.getElementById('characteristics-panel').style.display = 'block';
}

async function generateCharacteristic(charName) {
    try {
        const response = await fetch('/api/generate_characteristic', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                characteristic: charName
            })
        });
        
        const data = await response.json();
        if (data.success) {
            // Update the button to show the value
            const valueElement = document.getElementById(`${charName}-value`);
            if (valueElement) {
                valueElement.textContent = data.value;
            }
            
            // Update bottom characteristics display
            updateBottomCharacteristics(charName, data.value);
            
            // Update current character
            currentCharacter = data.character;
            updateCharacterDisplay();
            updateUPPDisplay();
            updateUIState();
            
            // Note: Hover effects will be set up when user clicks "Enlist" button
        }
    } catch (error) {
        console.error('Error generating characteristic:', error);
    }
}

function updateBottomCharacteristics(charName, value) {
    // Show the characteristics display panel
    const charDisplay = document.getElementById('characteristics-display');
    if (charDisplay) {
        charDisplay.style.display = 'block';
    }
    
    // Update the value in the bottom display
    const bottomElement = document.getElementById(`bottom-${charName}-value`);
    if (bottomElement) {
        bottomElement.textContent = value;
        
        // Apply color coding based on characteristic value
        applyCharacteristicColor(bottomElement, value);
    }
}

// Global UI configuration loaded from backend
let uiConfig = null;

async function loadUIConfig() {
    try {
        const response = await fetch('/api/ui_config');
        const data = await response.json();
        if (data.success) {
            uiConfig = data.config;
        } else {
            console.error('Failed to load UI config:', data.error);
        }
    } catch (error) {
        console.error('Error loading UI config:', error);
    }
}

function applyCharacteristicColor(element, value) {
    // Use backend-provided configuration if available
    if (uiConfig && uiConfig.characteristic_quality) {
        const qualityConfig = uiConfig.characteristic_quality;
        
        // Remove all existing color classes
        element.classList.remove(...qualityConfig.all_classes);
        
        // Find the appropriate threshold
        for (const threshold of qualityConfig.thresholds) {
            if (value >= threshold.min && value <= threshold.max) {
                element.classList.add(threshold.class);
                return;
            }
        }
        
        // If no threshold matches, use default class
        element.classList.add(qualityConfig.default_class);
    }
}

// Enlistment Functions
async function showEnlistmentPanel() {
    // Check if character has already completed their career
    if (currentCharacter && currentCharacter.mustering_out_benefits) {
        console.log('Character has already completed their career and cannot start a new one');
        return;
    }
    
    // Check if character already has a career
    if (currentCharacter && currentCharacter.career) {
        console.log('Character already has a career and cannot enlist in a different service');
        return;
    }
    
    hideAllPanels();
    document.getElementById('enlistment-panel').style.display = 'block';
    
    await loadEnlistmentProbabilities();
    
    // Ensure we have current character data before setting up hover effects
    await loadCurrentCharacter();
    
    // Set up hover effects after ensuring character data is loaded
    setTimeout(() => {
        setupEnlistmentHoverEffects();
    }, 100);
}

async function loadEnlistmentProbabilities() {
    try {
        const response = await fetch('/api/enlistment_probabilities', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        
        if (data.success) {
            // Convert probabilities to array and sort by percentage (highest first)
            const serviceProbs = Object.entries(data.probabilities).map(([service, prob]) => ({
                service,
                percentage: prob.percentage || 0,
                data: prob
            })).sort((a, b) => b.percentage - a.percentage);
            
            // Update service probabilities with better formatting
            serviceProbs.forEach(({ service, percentage, data }) => {
                const probElement = document.getElementById(`${service.toLowerCase()}-prob`);
                if (probElement) {
                    probElement.textContent = `${Math.round(percentage)}%`;
                }
                
                // Update button text to include percentage in service name
                const serviceBtn = document.getElementById(`${service.toLowerCase()}-btn`);
                if (serviceBtn) {
                    const serviceNameElement = serviceBtn.querySelector('.service-name');
                    if (serviceNameElement) {
                        const serviceName = service.charAt(0).toUpperCase() + service.slice(1);
                        serviceNameElement.textContent = `${serviceName} (${Math.round(percentage)}%)`;
                    }
                }
            });
            
            // Reorder buttons by success probability
            reorderEnlistmentButtons(serviceProbs);
        }
    } catch (error) {
        console.error('Error loading enlistment probabilities:', error);
    }
}

function reorderEnlistmentButtons(serviceProbs) {
    const enlistmentGrid = document.querySelector('.enlistment-grid');
    if (!enlistmentGrid) return;
    
    // Create a fragment to hold the reordered buttons
    const fragment = document.createDocumentFragment();
    
    // Add buttons in order of success probability (highest first)
    serviceProbs.forEach(({ service, percentage }) => {
        const serviceBtn = document.getElementById(`${service.toLowerCase()}-btn`);
        if (serviceBtn) {
            // Remove from current position and add to fragment
            serviceBtn.remove();
            fragment.appendChild(serviceBtn);
        }
    });
    
    // Add all reordered buttons back to the grid
    enlistmentGrid.appendChild(fragment);
}

async function setupEnlistmentHoverEffects() {
    if (!currentCharacter || !currentCharacter.characteristics) {
        return;
    }
    
    try {
        // Get enlistment bonus requirements from backend
        const response = await fetch('/api/enlistment_bonus_requirements');
        
        const data = await response.json();
        if (!data.success) {
            console.error('Failed to get enlistment bonus requirements:', data.error);
            return;
        }
        
        // Use the clean bonus requirements data from backend
        const enlistmentBonuses = data.bonus_requirements;
        
        const services = ['navy', 'marines', 'army', 'scouts', 'merchants', 'others'];
        
        services.forEach(service => {
            const serviceBtn = document.getElementById(`${service}-btn`);
            if (!serviceBtn) return;
            
            // Remove existing listeners to prevent duplicates
            const newServiceBtn = serviceBtn.cloneNode(true);
            serviceBtn.parentNode.replaceChild(newServiceBtn, serviceBtn);
            
            // Add fresh event listeners
            newServiceBtn.addEventListener('mouseenter', () => {
                highlightCharacteristicsForService(service, enlistmentBonuses[service] || []);
            });
            
            newServiceBtn.addEventListener('mouseleave', () => {
                clearCharacteristicHighlights();
            });
            
            // Re-add click listener for enlistment
            newServiceBtn.addEventListener('click', () => attemptEnlistment(service));
        });
    } catch (error) {
        console.error('Error setting up enlistment hover effects:', error);
    }
}

function highlightCharacteristicsForService(service, bonuses) {
    if (!currentCharacter || !currentCharacter.characteristics) return;
    
    const characteristics = currentCharacter.characteristics;
    
    // First, collect all qualifying characteristics for this service
    const qualifyingChars = {};
    bonuses.forEach(({ char, req, bonus }) => {
        const charValue = characteristics[char] || 0;
        if (charValue >= req) {
            if (!qualifyingChars[char]) {
                qualifyingChars[char] = [];
            }
            qualifyingChars[char].push(bonus);
        }
    });
    
    // Check if character qualifies for bonuses from multiple characteristics
    const hasMultipleCharacteristicBonuses = Object.keys(qualifyingChars).length > 1;
    
    // Now apply highlighting based on collected bonuses
    Object.entries(qualifyingChars).forEach(([char, bonusArray]) => {
        // Target the parent char-stat div (the entire box), not just the value span
        const charBox = document.getElementById(`bottom-${char}-value`);
        if (charBox) {
            const charStatBox = charBox.closest('.char-stat');
            if (charStatBox) {
                // Determine highlight class based on bonuses
                let highlightClass;
                if (hasMultipleCharacteristicBonuses) {
                    highlightClass = 'char-highlight-both'; // Gold for bonuses from multiple characteristics
                } else if (bonusArray.includes(2)) {
                    highlightClass = 'char-highlight-2'; // Cyan for +2
                } else if (bonusArray.includes(1)) {
                    highlightClass = 'char-highlight-1'; // Green for +1
                }
                
                charStatBox.classList.add(highlightClass);
            }
        }
    });
}

function clearCharacteristicHighlights() {
    const characteristics = ['strength', 'dexterity', 'endurance', 'intelligence', 'education', 'social'];
    
    characteristics.forEach(char => {
        // Target the entire char-stat boxes (parent divs)
        const charBox = document.getElementById(`bottom-${char}-value`);
        if (charBox) {
            const charStatBox = charBox.closest('.char-stat');
            if (charStatBox) {
                charStatBox.classList.remove('char-highlight-1', 'char-highlight-2', 'char-highlight-both');
            }
        }
    });
}

async function attemptEnlistment(service) {
    try {
        const response = await fetch('/api/enlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                service: service.charAt(0).toUpperCase() + service.slice(1)
            })
        });
        
        const data = await response.json();
        if (data.success) {
            currentCharacter = data.character;
            
            // Update recent roll display
            const result = data.enlistment_result;
            if (result) {
                const outcome = result.success ? 'ENLISTED' : 'DRAFTED';
                const rollDetails = `${result.roll}+${result.modifier} vs ${result.target}`;
                updateRecentRollDisplay('Enlistment', outcome, rollDetails);
            }
            
            updateCharacterDisplay();
            updateUIState();
        }
    } catch (error) {
        console.error('Error attempting enlistment:', error);
    }
}

async function setupReenlistmentOptions(choiceText, choiceBtn) {
    try {
        // Get reenlistment options from backend
        const response = await fetch('/api/reenlistment_options');
        const data = await response.json();
        
        if (data.success) {
            const departureOption = data.options.departure;
            
            // Set button text from backend
            if (choiceText) {
                choiceText.textContent = departureOption.text;
            }
            
            // Set up click handler with correct preference value
            if (choiceBtn) {
                choiceBtn.onclick = () => {
                    attemptVoluntaryDeparture(departureOption.preference);
                };
            }
        } else {
            console.error('Failed to get reenlistment options:', data.error);
            // Fallback - backend should provide this via API
            if (choiceText) {
                choiceText.textContent = 'Leave'; // Generic fallback only
            }
            if (choiceBtn) {
                choiceBtn.onclick = () => {
                    const buttonText = choiceText.textContent.toLowerCase();
                    const preference = buttonText === 'leave' ? 'discharge' : buttonText;
                    attemptVoluntaryDeparture(preference);
                };
            }
        }
    } catch (error) {
        console.error('Error getting reenlistment options:', error);
        // Fallback - backend should provide this via API
        if (choiceText) {
            choiceText.textContent = 'Leave'; // Generic fallback only
        }
        if (choiceBtn) {
            choiceBtn.onclick = () => {
                const buttonText = choiceText.textContent.toLowerCase();
                const preference = buttonText === 'leave' ? 'discharge' : buttonText;
                attemptVoluntaryDeparture(preference);
            };
        }
    }
}

// Voluntary departure function
async function attemptVoluntaryDeparture(preference) {
    try {
        const response = await fetch('/api/reenlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ preference: preference })
        });
        
        const data = await response.json();
        if (data.success) {
            currentCharacter = data.character;
            
            // Show result in roll panel
            setupRollDisplay('departure', {});
            showRollPanel();
            
            const result = data.reenlistment_result;
            if (result) {
                rollTarget.textContent = result.target || '-';
                rollBonuses.textContent = result.modifier || '0';
                
                // Calculate and display success percentage for reenlistment in outcome box
                const target = parseInt(result.target) || 0;
                const modifier = parseInt(result.modifier) || 0;
                const successPercentage = calculateSuccessPercentage(target, modifier);
                rollOutcome.textContent = Math.round(successPercentage) + '%';
                
                // Show the outcome
                let outcomeText = `Roll: ${result.roll} - ${result.status_text}`;
                if (result.continue_career) {
                    outcomeText += ' (Retained for another term)';
                } else {
                    outcomeText += ' (Departure approved)';
                }
                rollOutcome.textContent = outcomeText;
            }
            
            updateCharacterDisplay();
            updateUIState();
        }
    } catch (error) {
        console.error('Error attempting departure:', error);
    }
}