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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    setupEventListeners();
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
    // Roll dice button
    rollDiceBtn.addEventListener('click', handleRollDice);
    
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
    if (charAge) charAge.textContent = '18';
    if (charTerms) charTerms.textContent = '0';
    
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
        const element = document.getElementById(`bottom-${char}-value`);
        if (element) {
            element.textContent = '-';
            element.classList.remove('char-excellent', 'char-good', 'char-average', 'char-poor');
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

function updateCharacterDisplay() {
    if (!currentCharacter) return;
    
    // Update character name and basic info
    const charName = document.getElementById('char-name');
    const charService = document.getElementById('char-service');
    const charAge = document.getElementById('char-age');
    const charTerms = document.getElementById('char-terms');
    
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
    if (charAge) charAge.textContent = `Age ${currentCharacter.age || 18}`;
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
        benefitsDisplay.innerHTML = `<span class="section-label">Benefits </span>${items.join(', ')}`;
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
                element.classList.remove('char-bad', 'char-poor', 'char-average', 'char-good', 'char-excellent');
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
    if (currentCharacter.upp === '______') {
        // Need to generate characteristics
        showCharacteristicsPanel();
    } else if (!currentCharacter.career) {
        // Need to enlist
        showEnlistmentPanel();
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
    const bonusesBox = document.getElementById('roll-bonuses-box');
    const choiceBox = document.getElementById('roll-choice-box');
    const choiceBtn = document.getElementById('roll-choice-btn');
    const choiceText = document.getElementById('roll-choice-text');
    
    if (rollType === 'survival') {
        // Configure panel for survival roll
        rollTitle.textContent = 'PHASE: SURVIVAL - Survival Check';
        rollDescription.textContent = 'Roll 2d6 to survive this term';
        if (bonusesBox) bonusesBox.style.display = 'block';
        if (choiceBox) choiceBox.style.display = 'none';
    } else if (rollType === 'commission') {
        // Configure panel for commission roll
        rollTitle.textContent = 'PHASE: COMMISSION - Commission Check';
        rollDescription.textContent = 'Roll 2d6 to gain officer rank';
        if (bonusesBox) bonusesBox.style.display = 'block';
        if (choiceBox) choiceBox.style.display = 'none';
    } else if (rollType === 'promotion') {
        // Configure panel for promotion roll
        rollTitle.textContent = 'PHASE: PROMOTION - Promotion Check';
        rollDescription.textContent = 'Roll 2d6 to advance in rank';
        if (bonusesBox) bonusesBox.style.display = 'block';
        if (choiceBox) choiceBox.style.display = 'none';
    } else if (rollType === 'reenlistment') {
        // Configure panel for reenlistment choice
        rollTitle.textContent = 'PHASE: REENLISTMENT - Service Decision';
        rollDescription.textContent = 'Choose your preference - both require rolls';
        
        // Hide bonuses box (no bonuses for reenlistment)
        if (bonusesBox) bonusesBox.style.display = 'none';
        
        // Show choice box with appropriate text
        if (choiceBox) choiceBox.style.display = 'block';
        if (choiceText && currentCharacter) {
            const termsServed = currentCharacter.terms_served || 0;
            choiceText.textContent = termsServed >= 4 ? 'Retire' : 'Leave';
        }
        
        // Set up choice button click handler
        if (choiceBtn) {
            choiceBtn.onclick = () => {
                const preference = choiceText.textContent.toLowerCase();
                attemptVoluntaryDeparture(preference);
            };
        }
        
        // Update main button text
        const rollBtnText = rollDiceBtn.querySelector('.roll-btn-text');
        if (rollBtnText) rollBtnText.textContent = 'Reenlist';
    } else if (rollType === 'ageing') {
        // Configure panel for ageing roll
        rollTitle.textContent = 'PHASE: AGEING - Ageing Check';
        rollDescription.textContent = 'Roll for age-related effects';
        if (bonusesBox) bonusesBox.style.display = 'block';
        if (choiceBox) choiceBox.style.display = 'none';
    }
    
    // Reset main button text for non-reenlistment rolls
    if (rollType !== 'reenlistment') {
        const rollBtnText = rollDiceBtn.querySelector('.roll-btn-text');
        if (rollBtnText) rollBtnText.textContent = 'Roll 2d6';
    }
    
    rollTarget.textContent = data.target || '-';
    rollBonuses.textContent = data.total_modifier || '0';
    
    // Clear previous outcome
    if (rollOutcome) {
        rollOutcome.textContent = '-';
        console.log('Cleared roll outcome for', rollType);
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
    
    // Show appropriate skill table buttons based on education
    const educationLevel = currentCharacter.characteristics?.education || 0;
    const showEducationTable = educationLevel >= 8;
    
    // Always show these three tables
    const personalBtn = document.getElementById('personal-skill-btn');
    const serviceBtn = document.getElementById('service-skill-btn');
    const advancedBtn = document.getElementById('advanced-skill-btn');
    const educationBtn = document.getElementById('education-skill-btn');
    
    if (personalBtn) personalBtn.style.display = 'block';
    if (serviceBtn) serviceBtn.style.display = 'block';
    if (advancedBtn) advancedBtn.style.display = 'block';
    
    // Show education table only if education 8+
    if (educationBtn) {
        educationBtn.style.display = showEducationTable ? 'block' : 'none';
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
    
    // Set up the +4 years button
    const addYearsBtn = document.getElementById('add-years-btn');
    if (addYearsBtn) {
        // Remove existing listeners to avoid duplicates
        addYearsBtn.replaceWith(addYearsBtn.cloneNode(true));
        const newBtn = document.getElementById('add-years-btn');
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
            rollOutcome.textContent = `${result.roll} + ${result.modifier} = ${result.total} - ${outcome}`;
            
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
            rollOutcome.textContent = `${result.roll} + ${result.modifier} = ${result.total} - ${outcome}`;
            
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
            rollOutcome.textContent = `${result.roll} + ${result.modifier} = ${result.total} - ${outcome}`;
            
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
            rollOutcome.textContent = `${result.roll} + ${result.modifier} = ${result.total} - ${outcome}`;
            
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

function showMusterOutPanel() {
    if (!currentCharacter) return;
    
    // Hide other panels
    hideAllPanels();
    
    // Show mustering out panel
    const musterOutPanel = document.getElementById('mustering-out-panel');
    if (musterOutPanel) {
        musterOutPanel.style.display = 'block';
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
            updateUIState();
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

function applyCharacteristicColor(element, value) {
    // Remove existing color classes
    element.classList.remove('char-bad', 'char-poor', 'char-average', 'char-good', 'char-excellent');
    
    // Apply color based on value (Bad to Good progression)
    if (value >= 11) {
        element.classList.add('char-excellent'); // 11+: Gold
    } else if (value >= 9) {
        element.classList.add('char-good'); // 9-10: Silver
    } else if (value >= 6) {
        element.classList.add('char-average'); // 6-8: Green
    } else if (value >= 3) {
        element.classList.add('char-poor'); // 3-5: Orange
    } else {
        element.classList.add('char-bad'); // 0-2: Red
    }
}

// Enlistment Functions
function showEnlistmentPanel() {
    hideAllPanels();
    document.getElementById('enlistment-panel').style.display = 'block';
    loadEnlistmentProbabilities();
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
            // Update service probabilities
            Object.entries(data.probabilities).forEach(([service, prob]) => {
                const probElement = document.getElementById(`${service.toLowerCase()}-prob`);
                if (probElement) {
                    probElement.textContent = `${prob}%`;
                }
            });
        }
    } catch (error) {
        console.error('Error loading enlistment probabilities:', error);
    }
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
            updateCharacterDisplay();
            updateUIState();
        }
    } catch (error) {
        console.error('Error attempting enlistment:', error);
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