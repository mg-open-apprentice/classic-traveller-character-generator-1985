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
            currentCharacter = data;
            updateCharacterDisplay();
            updateUIState();
        }
    } catch (error) {
        console.error('Error creating character:', error);
    }
}

function updateCharacterDisplay() {
    if (!currentCharacter) return;
    
    // Update character name and basic info
    const charName = document.getElementById('char-name');
    const charService = document.getElementById('char-service');
    const charAge = document.getElementById('char-age');
    const charTerms = document.getElementById('char-terms');
    
    if (charName) charName.textContent = currentCharacter.name || 'Unknown';
    if (charService) {
        let serviceText = currentCharacter.career || '';
        if (currentCharacter.career) {
            let contractStatus;
            if (currentCharacter.drafted === true) {
                contractStatus = 'Drafted';
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
        charTerms.textContent = `Terms ${terms} Rank ${rank}`;
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
        const credits = currentCharacter.credits || 0;
        creditsDisplay.textContent = `CR ${credits.toLocaleString()}`;
    }
    
    // Update skills display
    updateSkillsDisplay();
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
        
        // Update button states based on backend response
        const buttonMap = {
            'survival': 'left-survival-btn',
            'commission': 'left-commission-btn', 
            'promotion': 'left-promotion-btn',
            'skills': 'left-skills-btn',
            'ageing': 'left-ageing-btn',
            'reenlistment': 'left-reenlist-btn'
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
    if (rollType === 'survival') {
        // Configure panel for survival roll
        rollTitle.textContent = 'PHASE: SURVIVAL - Survival Check';
        rollDescription.textContent = 'Roll 2d6 to survive this term';
    } else if (rollType === 'commission') {
        // Configure panel for commission roll
        rollTitle.textContent = 'PHASE: COMMISSION - Commission Check';
        rollDescription.textContent = 'Roll 2d6 to gain officer rank';
    } else if (rollType === 'promotion') {
        // Configure panel for promotion roll
        rollTitle.textContent = 'PHASE: PROMOTION - Promotion Check';
        rollDescription.textContent = 'Roll 2d6 to advance in rank';
    } else if (rollType === 'reenlistment') {
        // Configure panel for reenlistment roll
        rollTitle.textContent = 'PHASE: REENLISTMENT - Reenlistment Check';
        rollDescription.textContent = 'Roll 2d6 to continue service';
    } else if (rollType === 'ageing') {
        // Configure panel for ageing roll
        rollTitle.textContent = 'PHASE: AGEING - Ageing Check';
        rollDescription.textContent = 'Roll for age-related effects';
    }
    
    rollTarget.textContent = data.target || '-';
    rollBonuses.textContent = data.total_modifier || '0';
    rollOutcome.textContent = '-';
    
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
        } else {
            rollOutcome.textContent = 'Error: ' + data.error;
        }
    } catch (error) {
        console.error('Error performing survival roll:', error);
        rollOutcome.textContent = 'Error performing roll';
    } finally {
        rollDiceBtn.disabled = false;
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
            
            // Keep roll outcome visible until user clicks another button
            // No automatic UI state update
        } else {
            rollOutcome.textContent = 'Error: ' + data.error;
        }
    } catch (error) {
        console.error('Error performing commission roll:', error);
        rollOutcome.textContent = 'Error performing roll';
    } finally {
        rollDiceBtn.disabled = false;
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
        } else {
            rollOutcome.textContent = 'Error: ' + data.error;
        }
    } catch (error) {
        console.error('Error performing promotion roll:', error);
        rollOutcome.textContent = 'Error performing roll';
    } finally {
        rollDiceBtn.disabled = false;
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
        } else {
            rollOutcome.textContent = 'Error: ' + data.error;
        }
    } catch (error) {
        console.error('Error performing reenlistment roll:', error);
        rollOutcome.textContent = 'Error performing roll';
    } finally {
        rollDiceBtn.disabled = false;
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
    element.classList.remove('char-excellent', 'char-good', 'char-average', 'char-poor');
    
    // Apply color based on value (Traveller characteristic bonuses)
    if (value >= 15) {
        element.classList.add('char-excellent'); // +3 bonus - bright green
    } else if (value >= 12) {
        element.classList.add('char-good'); // +2 bonus - green  
    } else if (value >= 9) {
        element.classList.add('char-average'); // +1 bonus - yellow
    } else if (value >= 6) {
        element.classList.add('char-average'); // 0 bonus - normal
    } else {
        element.classList.add('char-poor'); // negative bonus - red
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