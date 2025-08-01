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
        }
    } catch (error) {
        console.log('No current character loaded');
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
}

function updateUIState() {
    if (!currentCharacter) return;
    
    // Show enlist button after character creation
    const enlistSection = document.getElementById('enlist-section');
    if (currentCharacter.name && enlistSection) {
        enlistSection.style.display = 'block';
    }
    
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
        'enlistment-panel',
        'mustering-out-panel'
    ];
    
    panels.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (panel) panel.style.display = 'none';
    });
    
    // Note: characteristics-display stays visible once shown
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
            
            // Keep roll outcome visible until user clicks another button
            // No automatic UI state update
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
            
            // Keep roll outcome visible until user clicks another button
            // No automatic UI state update
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
            
            // Keep roll outcome visible until user clicks another button
            // No automatic UI state update
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
        const response = await fetch('/api/enlistment_probabilities');
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