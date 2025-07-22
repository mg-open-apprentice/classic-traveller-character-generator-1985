// ===============================================================================
// CRITICAL RULE: NO GAME CALCULATIONS IN JAVASCRIPT!
// 
// ALL game rule calculations must be done in character_generation_rules.py
// JavaScript is ONLY for UI interactions:
// - Show/hide panels and buttons
// - Make API calls to Python backend  
// - Display results from Python
// - NO dice rolling, probability math, modifiers, targets, or game rules
// ===============================================================================

// BUTTON STATE MANAGEMENT
// - Enlist button: goes grey after pressed, stays grey for session
// - Term buttons: go grey when pressed, reset for new term except commission
// - Commission: once successful, stays grey for entire chargen sequence

function disableButton(buttonId) {
    const btn = document.getElementById(buttonId);
    if (btn) {
        btn.classList.add('btn-disabled');
        btn.disabled = true;
    }
}

function enableButton(buttonId) {
    const btn = document.getElementById(buttonId);
    if (btn) {
        btn.classList.remove('btn-disabled');
        btn.disabled = false;
    }
}

// Track permanent states
let enlistPressed = false;
let commissionSuccessful = false;

function resetTermButtons() {
    // Reset all term buttons except commission (if successful)
    enableButton('left-survival-btn');
    enableButton('left-skills-btn');
    enableButton('left-ageing-btn');
    enableButton('left-reenlist-btn');
    
    // Reset promotion button
    enableButton('left-promotion-btn');
    
    // Only reset commission if not permanently successful
    if (!commissionSuccessful) {
        enableButton('left-commission-btn');
    }
}

function handleCommissionSuccess() {
    commissionSuccessful = true;
}

// Outcome display functions
function showOutcomeDisplay() {
    document.getElementById('outcome-display').style.display = 'block';
}

function updateOutcomeText(text) {
    document.getElementById('outcome-text').textContent = text;
    showOutcomeDisplay();
}

// CHARACTER GENERATION STATE MACHINE
// 1. Create Character -> Generate Characteristics
// 2. All Characteristics -> Show Enlist
// 3. Enlist -> Show Survival (automatic)
// 4. Survival -> Show Commission (if eligible) or Skills
// 5. Commission -> Show Promotion (if eligible) or Skills  
// 6. Promotion -> Show Skills
// 7. Skills -> Show Ageing (when eligibility exhausted)
// 8. Ageing -> Show Reenlist/Leave choice

function showNextStep(currentStep, characterData) {
    console.log('State machine: moving from', currentStep, 'to next step');
    
    // Hide all term buttons first
    hideAllTermButtons();
    
    switch(currentStep) {
        case 'enlistment':
            showSurvivalButton();
            break;
            
        case 'survival':
            if (canShowCommissionButton(characterData)) {
                showCommissionButton();
            } else {
                showSkillsButton(characterData);
            }
            break;
            
        case 'commission':
            if (canShowPromotionButton(characterData)) {
                showPromotionButton();
            } else {
                showSkillsButton(characterData);
            }
            break;
            
        case 'promotion':
            showSkillsButton(characterData);
            break;
            
        case 'skills':
            // Check if more skills available
            const skillEligibility = characterData.skill_eligibility || 0;
            if (skillEligibility > 0) {
                // Keep showing skills
                showSkillsButton(characterData);
            } else {
                showAgeingButton();
            }
            break;
            
        case 'ageing':
            showReenlistLeaveButtons();
            break;
    }
}

function hideAllTermButtons() {
    document.getElementById('left-survival-btn').style.display = 'none';
    document.getElementById('left-commission-btn').style.display = 'none';
    document.getElementById('left-promotion-btn').style.display = 'none';
    document.getElementById('left-skills-btn').style.display = 'none';
    document.getElementById('left-ageing-btn').style.display = 'none';
    document.getElementById('left-reenlist-btn').style.display = 'none';
    document.getElementById('leave-btn').style.display = 'none';
}

function showSurvivalButton() {
    document.getElementById('left-survival-btn').style.display = 'block';
    // Reset button state
    const btn = document.getElementById('left-survival-btn');
    btn.style.backgroundColor = '';
    btn.style.color = '';
    btn.disabled = false;
    btn.style.cursor = '';
}

function showCommissionButton() {
    document.getElementById('left-commission-btn').style.display = 'block';
    // Reset button state
    const btn = document.getElementById('left-commission-btn');
    btn.style.backgroundColor = '';
    btn.style.color = '';
    btn.disabled = false;
    btn.style.cursor = '';
}

function showPromotionButton() {
    document.getElementById('left-promotion-btn').style.display = 'block';
    // Reset button state
    const btn = document.getElementById('left-promotion-btn');
    btn.style.backgroundColor = '';
    btn.style.color = '';
    btn.disabled = false;
    btn.style.cursor = '';
}

function showSkillsButton(characterData) {
    const skillEligibility = characterData.skill_eligibility || 0;
    if (skillEligibility > 0) {
        document.getElementById('left-skills-btn').style.display = 'block';
        // Reset button state
        const btn = document.getElementById('left-skills-btn');
        btn.style.backgroundColor = '';
        btn.style.color = '';
        btn.disabled = false;
        btn.style.cursor = '';
    }
}

function showAgeingButton() {
    document.getElementById('left-ageing-btn').style.display = 'block';
    // Reset button state
    const btn = document.getElementById('left-ageing-btn');
    btn.style.backgroundColor = '';
    btn.style.color = '';
    btn.disabled = false;
    btn.style.cursor = '';
}

function showReenlistLeaveButtons() {
    document.getElementById('left-reenlist-btn').style.display = 'block';
    document.getElementById('leave-btn').style.display = 'block';
    // Reset button states
    const reenlistBtn = document.getElementById('left-reenlist-btn');
    reenlistBtn.style.backgroundColor = '';
    reenlistBtn.style.color = '';
    reenlistBtn.disabled = false;
    reenlistBtn.style.cursor = '';
    
    const leaveBtn = document.getElementById('leave-btn');
    if (leaveBtn) {
        leaveBtn.style.backgroundColor = '';
        leaveBtn.style.color = '';
        leaveBtn.disabled = false;
        leaveBtn.style.cursor = '';
    }
}

// Old updateEventDisplay function removed - superseded by new action panels

// Helper to calculate and display probability
function calculateAndDisplayProbability(target, modifiers, element) {
    fetch('/api/calculate_probability', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({target: target, modifiers: modifiers})
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.probability) {
            const percentage = data.probability.percentage;
            let color = '#00ff00'; // Green
            
            // Simple color coding
            if (percentage >= 50) color = '#00ff00'; // Green
            else if (percentage >= 25) color = '#ffff00'; // Yellow  
            else color = '#ff0000'; // Red
            
            element.innerHTML = `<span style="color:${color}; font-weight:bold;">${percentage}%</span>`;
        } else {
            element.textContent = '-';
        }
    })
    .catch(error => {
        console.error('Probability calculation failed:', error);
        element.textContent = '-';
    });
}

// Helper to determine which characteristics are relevant for each test type
function getRelevantCharacteristics(testType, result, characterData) {
    if (!characterData || !characterData.characteristics) {
        return '-';
    }
    
    const chars = characterData.characteristics;
    let relevantChars = [];
    
    switch (testType.toLowerCase()) {
        case 'enlistment':
            // Different services use different characteristics for enlistment
            if (result.assigned_service) {
                const service = result.assigned_service.toLowerCase();
                if (service.includes('navy')) relevantChars = [`INT:${chars.intelligence}`, `EDU:${chars.education}`];
                else if (service.includes('marines')) relevantChars = [`STR:${chars.strength}`, `END:${chars.endurance}`];
                else if (service.includes('army')) relevantChars = [`DEX:${chars.dexterity}`, `END:${chars.endurance}`];
                else if (service.includes('scouts')) relevantChars = [`INT:${chars.intelligence}`, `STR:${chars.strength}`];
                else if (service.includes('merchants')) relevantChars = [`STR:${chars.strength}`, `INT:${chars.intelligence}`];
                else if (service.includes('others')) relevantChars = [`DEX:${chars.dexterity}`, `INT:${chars.intelligence}`];
            }
            break;
            
        case 'survival':
            // Survival tests typically use different characteristics per service
            if (characterData.career) {
                const career = characterData.career.toLowerCase();
                if (career.includes('navy')) relevantChars = [`INT:${chars.intelligence}`];
                else if (career.includes('marines')) relevantChars = [`END:${chars.endurance}`];
                else if (career.includes('army')) relevantChars = [`EDU:${chars.education}`];
                else if (career.includes('scouts')) relevantChars = [`END:${chars.endurance}`];
                else if (career.includes('merchants')) relevantChars = [`EDU:${chars.education}`];
                else if (career.includes('others')) relevantChars = [`INT:${chars.intelligence}`];
            }
            break;
            
        case 'commission':
            // Commission tests typically use Social
            relevantChars = [`SOC:${chars.social}`];
            break;
            
        case 'promotion':
            // Promotion tests vary by service but often use INT or EDU
            if (characterData.career) {
                const career = characterData.career.toLowerCase();
                if (career.includes('navy')) relevantChars = [`EDU:${chars.education}`];
                else if (career.includes('marines')) relevantChars = [`SOC:${chars.social}`];
                else if (career.includes('army')) relevantChars = [`EDU:${chars.education}`];
                else if (career.includes('scouts')) relevantChars = [`EDU:${chars.education}`];
                else if (career.includes('merchants')) relevantChars = [`INT:${chars.intelligence}`];
                else relevantChars = [`EDU:${chars.education}`];
            }
            break;
            
        case 'skill':
            // Skills don't typically have specific characteristic requirements
            relevantChars = ['-'];
            break;
            
        default:
            // Try to extract from modifier details if available
            if (result.modifier_details && result.modifier_details.length) {
                result.modifier_details.forEach(detail => {
                    const charMatch = detail.match(/(STR|DEX|END|INT|EDU|SOC|Strength|Dexterity|Endurance|Intelligence|Education|Social)/i);
                    if (charMatch) {
                        const charName = charMatch[1].substring(0, 3).toUpperCase();
                        const charKey = getCharacteristicKey(charName);
                        if (charKey && chars[charKey] !== undefined) {
                            relevantChars.push(`${charName}:${chars[charKey]}`);
                        }
                    }
                });
            }
    }
    
    return relevantChars.length > 0 ? relevantChars.join(', ') : '-';
}

// Helper to convert characteristic abbreviations to full keys
function getCharacteristicKey(abbrev) {
    const mapping = {
        'STR': 'strength',
        'DEX': 'dexterity', 
        'END': 'endurance',
        'INT': 'intelligence',
        'EDU': 'education',
        'SOC': 'social'
    };
    return mapping[abbrev.toUpperCase()];
}

// Get color for stat value (2-12 range)
function getStatColor(value) {
    const colors = {
        2: '#8B0000', 3: '#B22222', 4: '#DC143C',
        5: '#FF4500', 6: '#FF8C00',
        7: '#FFFF00', 8: '#ADFF2F',
        9: '#32CD32', 10: '#228B22',
        11: '#00CED1', 12: '#4169E1'
    };
    return colors[value] || '#666';
}

// Reveal characteristic with color and animation
function revealCharacteristic(buttonId, statName, value) {
    const button = document.getElementById(buttonId);
    const valueElement = button.querySelector('.char-value');
    
    if (!button || !valueElement) {
        console.error('Button or value element not found:', buttonId);
        return;
    }
    
    // Remove pre-roll state
    button.classList.remove('pre-roll');
    
    // Set color based on value
    const statColor = getStatColor(value);
    button.style.setProperty('--stat-color', statColor);
    button.style.borderColor = statColor;
    button.style.color = statColor;
    
    // Reveal value with animation
    valueElement.textContent = value;
    button.classList.add('revealed');
    
    // Update UPP immediately
    const charToUPPIndex = {
        'strength': 0, 'dexterity': 1, 'endurance': 2,
        'intelligence': 3, 'education': 4, 'social': 5
    };
    
    if (statName in charToUPPIndex) {
        const index = charToUPPIndex[statName];
        const hexChar = value < 10 ? String(value) : String.fromCharCode(65 + value - 10);
        updateUPPSlot(index, hexChar);
    }
    
    // Update bottom panel characteristics display
    updateBottomCharacteristics(statName, value);
}

// Update characteristics in bottom panel
function updateBottomCharacteristics(charName, value) {
    const bottomValueElement = document.getElementById(`bottom-${charName}-value`);
    if (bottomValueElement) {
        const statColor = getStatColor(value);
        bottomValueElement.textContent = value;
        bottomValueElement.style.color = statColor;
        bottomValueElement.style.fontWeight = 'bold';
    }
}

// Helper to update the UPP string in the UI
function updateUPPSlot(index, hexChar) {
    let upp = document.getElementById('upp-string').textContent.split('');
    upp[index] = hexChar;
    document.getElementById('upp-string').textContent = upp.join('');
}

// Helper to update UPP from characteristics object
function updateUPPFromCharacteristics(characteristics) {
    const charToUPPIndex = {
        'strength': 0,
        'dexterity': 1,
        'endurance': 2,
        'intelligence': 3,
        'education': 4,
        'social': 5
    };
    
    // Get the current UPP string
    const uppElement = document.getElementById('upp-string');
    if (!uppElement) {
        console.error('UPP element not found');
        return;
    }
    
    let currentUPP = uppElement.textContent;
    console.log('Current UPP:', currentUPP);
    console.log('Characteristics to update:', characteristics);
    
    // Ensure the UPP string is exactly 6 characters
    if (currentUPP.length !== 6) {
        console.log('UPP string not 6 characters, creating new one');
        currentUPP = '______';
    }
    
    let upp = currentUPP.split('');
    
    // Update each characteristic in the UPP
    for (const [charName, value] of Object.entries(characteristics)) {
        if (charName in charToUPPIndex) {
            const index = charToUPPIndex[charName];
            const hexChar = value < 10 ? String(value) : String.fromCharCode(65 + value - 10);
            upp[index] = hexChar;
            console.log(`Updating ${charName} (${value}) at index ${index} to '${hexChar}'`);
        }
    }
    
    const newUPP = upp.join('');
    console.log('New UPP:', newUPP);
    
    // Update the display
    uppElement.textContent = newUPP;
}

// Track how many characteristic buttons remain
let remainingCharButtons = 6;

document.getElementById('create-character-btn').onclick = function() {
    fetch('/api/create_character', {method: 'POST'})
        .then(res => res.json())
        .then(async data => {
            // Display the generated name as the third item in the top line
            document.getElementById('char-name').textContent = data.name;
            document.getElementById('char-age').textContent = 'Age: ' + data.age;
            document.getElementById('char-terms').textContent = 'Terms: ' + data.terms_served;
            document.getElementById('upp-string').textContent = data.upp || '______';
            document.getElementById('char-service').textContent = 'Service';
            
            // Hide enlist button and bottom characteristics until complete
            document.getElementById('enlist-section').style.display = 'none';
            document.getElementById('characteristics-display').style.display = 'none';
            
            // Show characteristics panel
            showCharacteristicsPanel();

            // Update term panel if character data is provided
            if (data.character) {
                updateTermPanel(data.character);
            }
        });
};

function setupCharacteristicButton(btnId, charName) {
    document.getElementById(btnId).onclick = function() {
        fetch('/api/generate_characteristic', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({characteristic: charName})
        })
        .then(res => res.json())
        .then(data => {
            // Use the new reveal function with color and animation
            revealCharacteristic(btnId, charName, data.value);
            document.getElementById(btnId).style.pointerEvents = 'none'; // Disable further clicks
            
            remainingCharButtons--;
            
            // Update the UPP string
            if (data.upp) {
                document.getElementById('upp-string').textContent = data.upp;
            }
            
            // If this was the last characteristic, show Enlist button and metrics
            if (remainingCharButtons === 0) {
                document.getElementById('enlist-section').style.display = 'block';
                document.getElementById('characteristics-display').style.display = 'block';
                showServiceMetrics();
                
                // Fetch available skill tables and show/hide skill buttons accordingly
                fetch('/api/available_skill_tables')
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && data.available_tables) {
                            const available = data.available_tables;
                            document.getElementById('personal-skill-btn').style.display = available.personal ? 'block' : 'none';
                            document.getElementById('service-skill-btn').style.display = available.service ? 'block' : 'none';
                            document.getElementById('advanced-skill-btn').style.display = available.advanced ? 'block' : 'none';
                            document.getElementById('education-skill-btn').style.display = available.education ? 'block' : 'none';
                            // Optionally show the skills section if at least one is available
                            const anyAvailable = available.personal || available.service || available.advanced || available.education;
                            const skillsSection = getSkillsSection();
                            if (skillsSection) skillsSection.style.display = anyAvailable ? 'block' : 'none';
                        }
                    });
            }
        });
    };
}

setupCharacteristicButton('strength-btn', 'strength');
setupCharacteristicButton('dexterity-btn', 'dexterity');
setupCharacteristicButton('endurance-btn', 'endurance');
setupCharacteristicButton('intelligence-btn', 'intelligence');
setupCharacteristicButton('education-btn', 'education');
setupCharacteristicButton('social-btn', 'social');

// Show service metrics panel and fetch data from backend
function showServiceMetrics() {
    document.getElementById('service-metrics-panel').style.display = 'block';
    
    // Fetch enlistment probabilities from backend
    fetch('/api/enlistment_probabilities', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.probabilities) {
                updateEnlistmentMetrics(data.probabilities);
            }
        })
        .catch(error => {
            console.error('Error fetching enlistment metrics:', error);
        });
}

// Update enlistment metrics display with sorting and color coding
function updateEnlistmentMetrics(metrics) {
    // Convert probabilities to array and sort by enlistment percentage (best to worst)
    const services = Object.entries(metrics).map(([key, data]) => ({
        key: key,
        name: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize service name
        percentage: data.percentage || 0
    })).sort((a, b) => b.percentage - a.percentage);
    
    // Get the metrics grid container
    const gridContainer = document.getElementById('enlistment-metrics-grid');
    gridContainer.innerHTML = ''; // Clear existing content
    
    // Apply characteristic color grammar based on ranking
    services.forEach((service, index) => {
        const color = getEnlistmentRankColor(index, services.length);
        
        const serviceElement = document.createElement('div');
        serviceElement.className = 'metric-service';
        serviceElement.innerHTML = `
            <div class="service-name" style="color: ${color};">${service.name}</div>
            <div class="metric-row">
                <span class="metric-label">Enlist:</span>
                <span class="metric-value" style="color: ${color}; font-weight: bold;">${service.percentage}%</span>
            </div>
        `;
        
        gridContainer.appendChild(serviceElement);
    });
}

// Get color based on ranking (using characteristic color grammar)
function getEnlistmentRankColor(rank, totalServices) {
    // Map ranking to characteristic colors: best=blue, worst=red
    const colors = ['#4169E1', '#00CED1', '#32CD32', '#FFFF00', '#FF8C00', '#8B0000']; // Blue to red
    
    if (rank < colors.length) {
        return colors[rank];
    }
    
    // Fallback for more than 6 services
    return colors[colors.length - 1];
}

// Setup Enlist button
document.getElementById('enlist-btn').onclick = function() {
    if (enlistPressed) return; // Prevent multiple clicks
    
    hideCharacteristicsPanel();
    showEnlistmentProbabilities();
    
    // Gray out enlist button permanently
    disableButton('enlist-btn');
    enlistPressed = true;
};

function setupEnlistmentButton(btnId, serviceName) {
    document.getElementById(btnId).onclick = async function() {
        try {
            const res = await fetch('/api/enlist', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({service: serviceName})
            });
            const data = await res.json();
            // Hide all enlistment buttons
            document.getElementById('navy-btn').style.display = 'none';
            document.getElementById('marines-btn').style.display = 'none';
            document.getElementById('army-btn').style.display = 'none';
            document.getElementById('scouts-btn').style.display = 'none';
            document.getElementById('merchants-btn').style.display = 'none';
            document.getElementById('others-btn').style.display = 'none';
            
            if (data.success) {
                // Hide enlistment panel and show empty middle panel
                hideEnlistmentPanel();
                
                // Hide all middle panel sections - start with clean slate
                document.getElementById('actions-panel').style.display = 'none';
                document.getElementById('skills-panel').style.display = 'none';
                document.getElementById('event-panel').style.display = 'none'; // Keep event panel hidden
                
                const service = data.enlistment_result.assigned_service || data.career || '';
                const outcome = data.enlistment_result.outcome || '';
                const capitalizedOutcome = outcome.charAt(0).toUpperCase() + outcome.slice(1);
                document.getElementById('char-service').textContent = `${service} ${capitalizedOutcome}`;
                
                // Show enlistment outcome text
                const roll = data.enlistment_result.roll || 0;
                const target = data.enlistment_result.target || 0;
                const outcomeText = outcome === 'enlisted' 
                    ? `Enlistment Successful: Rolled ${roll} vs target ${target} - Enlisted in ${service}!`
                    : `Enlistment Failed: Rolled ${roll} vs target ${target} - Drafted into ${service}.`;
                updateOutcomeText(outcomeText);
                
                const name = document.getElementById('char-name').textContent;
                updateRankDisplay(0);
                
                // Update action probabilities for the new character
                if (data.character) {
                    updateActionProbabilities(data.character);
                }

                // Commission and promotion handling now done in actions panel
                
                // ADD: Update term panel with latest character data
                if (data.character) {
                    updateTermPanel(data.character);
                }
                
                // Buttons are now always visible in HTML - no need to show/hide
                
                // No need for state machine - all buttons are always visible
            } else {
                alert(data.error || "Enlistment failed.");
            }
        } catch (error) {
            console.error('Error during enlistment:', error);
            alert('Error during enlistment');
        }
    };
}

setupEnlistmentButton('navy-btn', 'Navy');
setupEnlistmentButton('marines-btn', 'Marines');
setupEnlistmentButton('army-btn', 'Army');
setupEnlistmentButton('scouts-btn', 'Scouts');
setupEnlistmentButton('merchants-btn', 'Merchants');
setupEnlistmentButton('others-btn', 'Others');

// Function to update action probabilities and visibility
function updateActionProbabilities(character) {
    // Reset all action buttons to fresh state
    const survivalBtn = document.getElementById('survival-action-btn');
    const commissionBtn = document.getElementById('commission-action-btn');
    const promotionBtn = document.getElementById('promotion-action-btn');
    
    // Reset visual states
    [survivalBtn, commissionBtn, promotionBtn].forEach(btn => {
        btn.classList.remove('completed', 'disabled');
        btn.style.pointerEvents = 'auto';
    });
    
    if (!character || !character.characteristics) {
        return;
    }
    
    // Always show survival button as active
    survivalBtn.style.display = 'block';
    // Get survival probability from Python backend (NO JavaScript calculations!)
    fetch('/api/action_probability', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action_type: 'survival'})
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.probability) {
            updateActionProbabilityDisplay('survival-action-prob', data.probability.percentage);
        } else {
            document.getElementById('survival-action-prob').textContent = '-';
        }
    })
    .catch(() => {
        document.getElementById('survival-action-prob').textContent = '-';
    });
    
    // Hide commission and promotion buttons - they should only appear when left panel buttons are clicked
    commissionBtn.style.display = 'none';
    promotionBtn.style.display = 'none';
    
    // Reset survival probability display
    document.getElementById('survival-action-prob').textContent = '-';
}

// Helper function to check if character is in Scouts or Others
function isScoutsOrOthers(character) {
    const career = character.career?.toLowerCase() || '';
    return career.includes('scouts') || career.includes('others');
}

// REMOVED: calculateActionProbability function - all calculations now done in Python backend

// Function to update action probability display
function updateActionProbabilityDisplay(elementId, percentage) {
    const element = document.getElementById(elementId);
    if (element) {
        let color = '#00ff00'; // Green
        if (percentage >= 50) color = '#00ff00'; // Green
        else if (percentage >= 25) color = '#ffff00'; // Yellow
        else color = '#ff0000'; // Red
        
        element.innerHTML = `<span style="color:${color};">${percentage}%</span>`;
    }
}

// Helper functions for action button eligibility
function canShowCommissionButton(character) {
    if (!character) return false;
    
    // Already commissioned - can only commission once
    if (character.commissioned) return false;
    
    // Drafted characters can't get commission
    if (character.drafted) return false;
    
    // Scouts and Others don't have commissions
    if (isScoutsOrOthers(character)) return false;
    
    // If injured this term, can't attempt commission
    if (character.survival_outcome === 'injured') return false;
    
    return true;
}

function canShowPromotionButton(character) {
    if (!character) return false;
    
    // Drafted characters can't get promotion
    if (character.drafted) return false;
    
    // Scouts and Others don't have promotions
    if (isScoutsOrOthers(character)) return false;
    
    // If injured this term, can't attempt promotion
    if (character.survival_outcome === 'injured') return false;
    
    // If commission was attempted and failed this term, cannot promote
    if (character.commission_failed_this_term) return false;
    
    return true;
}

// Setup action button handlers
function setupActionButton(btnId, actionType) {
    document.getElementById(btnId).onclick = function() {
        // Hide the action that was clicked
        this.style.display = 'none';
        
        // Call the appropriate API endpoint
        let apiEndpoint = '/api/' + actionType;
        
        fetch(apiEndpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Mark this action as completed (visual feedback)
                this.classList.add('completed');
                this.style.pointerEvents = 'none'; // Disable further clicks
                
                // Get result data
                let result;
                if (actionType === 'survival') {
                    result = data.survival_result;
                } else if (actionType === 'commission') {
                    result = data.commission_result;
                } else if (actionType === 'promotion') {
                    result = data.promotion_result;
                }
                
                // Update the button to show outcome instead of probability
                const probabilityElement = this.querySelector('.action-probability');
                if (probabilityElement && result.outcome) {
                    probabilityElement.textContent = result.outcome.toUpperCase();
                }
                
                // No longer show old event display - keep actions panel visible
                
                // Update character display
                if (data.character) {
                    updateTermPanel(data.character);
                    
                    // Update age and terms if provided
                    if (data.character.age !== undefined) {
                        document.getElementById('char-age').textContent = 'Age: ' + data.character.age;
                    }
                    if (data.character.terms_served !== undefined) {
                        document.getElementById('char-terms').textContent = 'Terms: ' + data.character.terms_served;
                    }
                    
                    // Update rank display if applicable
                    if (data.character.rank !== undefined) {
                        updateRankDisplay(data.character.rank);
                    }
                    
                    // Update service status
                    if (data.character.career) {
                        let status = data.character.commissioned ? 'Commissioned' : 'Enlisted';
                        document.getElementById('char-service').textContent = `${data.character.career} ${status}`;
                    }
                    
                    // Show next available actions after survival
                    if (actionType === 'survival') {
                        showNextActionsAfterSurvival(data.character, result);
                    } else {
                        // For commission/promotion, check if we should show skills or continue with remaining actions
                        checkForNextAction(data.character);
                    }
                }
                
                // Update skill eligibility if provided
                if (data.skill_eligibility !== undefined) {
                    document.getElementById('top-skill-eligibility').textContent = data.skill_eligibility;
                }
                
                // Show skills section if ready
                if (data.ready_for_skills) {
                    fetch('/api/available_skill_tables')
                        .then(res => res.json())
                        .then(tableData => {
                            if (tableData.success && tableData.available_tables) {
                                const available = tableData.available_tables;
                                document.getElementById('personal-skill-btn').style.display = available.personal ? 'block' : 'none';
                                document.getElementById('service-skill-btn').style.display = available.service ? 'block' : 'none';
                                document.getElementById('advanced-skill-btn').style.display = available.advanced ? 'block' : 'none';
                                document.getElementById('education-skill-btn').style.display = available.education ? 'block' : 'none';
                                
                                const anyAvailable = available.personal || available.service || available.advanced || available.education;
                                const skillsSection = getSkillsSection();
                                if (skillsSection) skillsSection.style.display = anyAvailable ? 'block' : 'none';
                            }
                        });
                } else {
                    const skillsSection = getSkillsSection();
                    if (skillsSection) skillsSection.style.display = 'none';
                }
                
                // Handle special cases based on action results
                if (actionType === 'survival' && result.outcome === 'injured') {
                    // Show medical options if injured
                    const reenlistBtn = document.getElementById('reenlist-btn');
                    const leaveBtn = document.getElementById('leave-btn');
                    if (reenlistBtn) reenlistBtn.style.display = 'none';
                    if (leaveBtn) leaveBtn.style.display = 'none';
                    
                    // Add medical button if not present
                    if (!document.getElementById('medical-btn')) {
                        const medicalBtn = document.createElement('button');
                        medicalBtn.id = 'medical-btn';
                        medicalBtn.className = 'btn';
                        medicalBtn.textContent = 'Medical';
                        medicalBtn.onclick = function() {
                            alert('Medical event triggered!');
                        };
                        if (reenlistBtn && reenlistBtn.parentNode) {
                            reenlistBtn.parentNode.appendChild(medicalBtn);
                        }
                    }
                    document.getElementById('medical-btn').style.display = 'block';
                }
                
            } else {
                alert(data.error || `${actionType} action failed.`);
            }
        })
        .catch(error => {
            console.error(`Error during ${actionType}:`, error);
            alert(`Error during ${actionType}`);
        });
    };
}

setupActionButton('survival-action-btn', 'survival');
setupActionButton('commission-action-btn', 'commission');
setupActionButton('promotion-action-btn', 'promotion');

// Function to show next actions after survival
function showNextActionsAfterSurvival(character, survivalResult) {
    const commissionBtn = document.getElementById('commission-action-btn');
    const promotionBtn = document.getElementById('promotion-action-btn');
    
    // If injured, remove commission/promotion buttons and move to skills/reenlistment
    if (survivalResult.outcome === 'injured') {
        commissionBtn.style.display = 'none';
        promotionBtn.style.display = 'none';
        
        setTimeout(() => {
            checkForSkillsOrReenlistment(character);
        }, 1500);
        return;
    }
    
    // If survived, enable previously greyed out buttons
    
    // Handle commission button
    if (commissionBtn.style.display === 'block') {
        if (canShowCommissionButton(character)) {
            // Enable commission button
            commissionBtn.classList.remove('disabled');
            commissionBtn.style.pointerEvents = 'auto';
            // Commission probability calculation removed - now done in Python backend when clicked
        } else {
            // Hide if no longer eligible (already commissioned)
            commissionBtn.style.display = 'none';
        }
    }
    
    // Handle promotion button
    if (promotionBtn.style.display === 'block') {
        if (canShowPromotionButton(character)) {
            // Enable promotion button
            promotionBtn.classList.remove('disabled');
            promotionBtn.style.pointerEvents = 'auto';
            // Promotion probability calculation removed - now done in Python backend when clicked
        } else {
            // Hide if not eligible
            promotionBtn.style.display = 'none';
        }
    }
    
    // If no commission/promotion available, move to skills
    const hasAvailableActions = (commissionBtn.style.display === 'block' && !commissionBtn.classList.contains('completed')) ||
                               (promotionBtn.style.display === 'block' && !promotionBtn.classList.contains('completed'));
    
    if (!hasAvailableActions) {
        setTimeout(() => {
            checkForSkillsOrReenlistment(character);
        }, 1500);
    }
}

// Function to check for next action after commission/promotion
function checkForNextAction(character) {
    const commissionBtn = document.getElementById('commission-action-btn');
    const promotionBtn = document.getElementById('promotion-action-btn');
    
    // If commission was just completed successfully, hide commission button permanently
    if (commissionBtn.classList.contains('completed') && character.commissioned) {
        commissionBtn.style.display = 'none';
    }
    
    // Check if there are any remaining actions
    const commissionAvailable = commissionBtn.style.display !== 'none' && !commissionBtn.classList.contains('completed');
    const promotionAvailable = promotionBtn.style.display !== 'none' && !promotionBtn.classList.contains('completed');
    
    // If no more actions available, move to skills
    if (!commissionAvailable && !promotionAvailable) {
        setTimeout(() => {
            checkForSkillsOrReenlistment(character);
        }, 1500); // Give time to see result
    }
}

// Function to check if we should show skills or reenlistment options
function checkForSkillsOrReenlistment(character) {
    // Check if skills are available
    fetch('/api/available_skill_tables')
        .then(res => res.json())
        .then(tableData => {
            if (tableData.success && tableData.available_tables) {
                const available = tableData.available_tables;
                const anySkillsAvailable = available.personal || available.service || available.advanced || available.education;
                
                if (anySkillsAvailable && character.skill_eligibility > 0) {
                    // Show skills panel with appropriate layout
                    showSkillsPanelWithLayout(available);
                } else {
                    // Hide actions panel and move to reenlistment/ageing
                    hideActionsPanel();
                    showReenlistmentOptions(character);
                }
            } else {
                // Hide actions panel and move to reenlistment/ageing
                hideActionsPanel();
                showReenlistmentOptions(character);
            }
        })
        .catch(error => {
            console.error('Error checking skill tables:', error);
            hideActionsPanel();
            showReenlistmentOptions(character);
        });
}

// Function to show skills panel with appropriate layout
function showSkillsPanelWithLayout(availableSkills) {
    // Show the skills panel
    showSkillsPanel();
    
    // Count available skills
    const skillCount = Object.values(availableSkills).filter(Boolean).length;
    const skillsGrid = document.getElementById('skills-grid');
    
    // Set grid layout based on skill count
    skillsGrid.className = 'skills-grid'; // Reset classes
    if (skillCount === 3) {
        skillsGrid.classList.add('three-skills');
    } else if (skillCount === 4) {
        skillsGrid.classList.add('four-skills');
    }
    
    // Show all available skill buttons (keep them visible during skill selection)
    // Always show the basic three tables
    document.getElementById('personal-skill-btn').style.display = 'flex';
    document.getElementById('service-skill-btn').style.display = 'flex';
    document.getElementById('advanced-skill-btn').style.display = 'flex';
    
    // Show education table only if character qualifies (Education 8+)
    if (availableSkills.education) {
        document.getElementById('education-skill-btn').style.display = 'flex';
    } else {
        document.getElementById('education-skill-btn').style.display = 'none';
    }
}

// Function to show reenlistment options
function showReenlistmentOptions(character) {
    // Check if ageing is needed first
    if (character.ready_for_ageing) {
        document.getElementById('ageing-btn').style.display = 'block';
    } else if (character.ready_for_reenlistment) {
        document.getElementById('reenlist-btn').style.display = 'block';
        document.getElementById('leave-btn').style.display = 'block';
    }
    // Update reenlistment buttons based on character state
    updateReenlistmentButtons(character, character.available_options || []);
}

// Helper to show probability for upcoming action
function showUpcomingActionProbability(testType, target, modifiers = 0) {
    const probabilityEl = document.getElementById('event-probability');
    const testEl = document.getElementById('event-test');
    const targetEl = document.getElementById('event-target');
    
    if (testEl) testEl.textContent = testType;
    if (targetEl) targetEl.textContent = target;
    if (probabilityEl) {
        calculateAndDisplayProbability(target, modifiers, probabilityEl);
    }
}

// Show characteristics panel
function showCharacteristicsPanel() {
    document.getElementById('event-panel').style.display = 'none';
    document.getElementById('enlistment-panel').style.display = 'none';
    document.getElementById('actions-panel').style.display = 'none';
    document.getElementById('skills-panel').style.display = 'none';
    document.getElementById('characteristics-panel').style.display = 'flex';
    
    // Reset remaining button count
    remainingCharButtons = 6;
    
    // Hide enlist button until all characteristics are revealed
    document.getElementById('enlist-section').style.display = 'none';
    
    // Reset all buttons to unrevealed state and add pre-roll animation
    document.querySelectorAll('.characteristic-btn').forEach(btn => {
        btn.classList.remove('revealed');
        btn.classList.add('pre-roll');
        btn.style.removeProperty('--stat-color');
        btn.style.borderColor = '';
        btn.style.color = '';
        btn.style.pointerEvents = 'auto';
        const valueElement = btn.querySelector('.char-value');
        if (valueElement) {
            valueElement.textContent = '?';
        }
    });
    
    // Reset all values to ?
    const valueElements = document.querySelectorAll('.char-value');
    valueElements.forEach(element => {
        element.textContent = '?';
    });
}

// Hide characteristics panel
function hideCharacteristicsPanel() {
    document.getElementById('characteristics-panel').style.display = 'none';
}

// Show enlistment probabilities for all services
function showEnlistmentProbabilities() {
    // Show the enlistment panel and hide other panels
    document.getElementById('event-panel').style.display = 'none';
    document.getElementById('characteristics-panel').style.display = 'none';
    document.getElementById('enlistment-panel').style.display = 'flex';
    
    // Fetch enlistment probabilities
    fetch('/api/enlistment_probabilities', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.probabilities) {
            const probs = data.probabilities;
            
            // Update probability displays and apply bonus color classes
            updateEnlistmentProbabilityAndColor('navy', 'navy-prob', 'navy-btn', probs.navy);
            updateEnlistmentProbabilityAndColor('marines', 'marines-prob', 'marines-btn', probs.marines);
            updateEnlistmentProbabilityAndColor('army', 'army-prob', 'army-btn', probs.army);
            updateEnlistmentProbabilityAndColor('scouts', 'scouts-prob', 'scouts-btn', probs.scouts);
            updateEnlistmentProbabilityAndColor('merchants', 'merchants-prob', 'merchants-btn', probs.merchants);
            updateEnlistmentProbabilityAndColor('others', 'others-prob', 'others-btn', probs.others);
        }
    })
    .catch(error => {
        console.error('Failed to get enlistment probabilities:', error);
    });
    
}

// Update enlistment probability display and apply bonus color class
function updateEnlistmentProbabilityAndColor(serviceName, probId, btnId, probData) {
    const probElement = document.getElementById(probId);
    const btnElement = document.getElementById(btnId);
    
    if (probElement && probData && !probData.error) {
        const percentage = probData.percentage;
        let color = '#00ff00'; // Green
        
        // Color coding for percentage text
        if (percentage >= 50) color = '#00ff00'; // Green
        else if (percentage >= 25) color = '#ffff00'; // Yellow
        else color = '#ff0000'; // Red
        
        probElement.innerHTML = `<span style="color:${color};">${percentage}%</span>`;
        
        // Calculate total bonus from modifier details
        let totalBonus = 0;
        if (probData.modifier_details && probData.modifier_details.length > 0) {
            probData.modifier_details.forEach(detail => {
                // Parse bonus from strings like "Intelligence 8≥8 (+1)" or "Strength 9≥8 (+2)"
                const match = detail.match(/\(\+(\d+)\)/);
                if (match) {
                    totalBonus += parseInt(match[1]);
                }
            });
        }
        
        // Apply bonus CSS class to button
        if (btnElement) {
            // Remove existing bonus classes
            btnElement.classList.remove('bonus-1', 'bonus-2', 'bonus-3');
            
            // Apply appropriate bonus class
            if (totalBonus >= 3) {
                btnElement.classList.add('bonus-3');
            } else if (totalBonus >= 2) {
                btnElement.classList.add('bonus-2');
            } else if (totalBonus >= 1) {
                btnElement.classList.add('bonus-1');
            }
        }
    } else if (probElement) {
        probElement.textContent = '-'; // Fallback
    }
}


// Hide enlistment panel and show actions panel
function hideEnlistmentPanel() {
    document.getElementById('enlistment-panel').style.display = 'none';
    document.getElementById('characteristics-panel').style.display = 'none';
    showActionsPanel();
}

// Show actions panel
function showActionsPanel() {
    document.getElementById('event-panel').style.display = 'none';
    document.getElementById('enlistment-panel').style.display = 'none';
    document.getElementById('characteristics-panel').style.display = 'none';
    document.getElementById('actions-panel').style.display = 'flex';
}

// Hide actions panel (no longer show old event panel)
function hideActionsPanel() {
    document.getElementById('actions-panel').style.display = 'none';
    // Don't show old event panel anymore - it's superseded
}

// Show skills panel
function showSkillsPanel() {
    document.getElementById('event-panel').style.display = 'none';
    document.getElementById('enlistment-panel').style.display = 'none';
    document.getElementById('characteristics-panel').style.display = 'none';
    document.getElementById('actions-panel').style.display = 'none';
    document.getElementById('skills-panel').style.display = 'flex';
}

// Hide skills panel (no longer show old event panel)
function hideSkillsPanel() {
    document.getElementById('skills-panel').style.display = 'none';
    // Don't show old event panel anymore - it's superseded
}

async function updateRankDisplay(rank) {
    try {
        const response = await fetch('/api/get_rank_title', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.rank_title) {
                // Update rank title display
                document.getElementById('char-rank-number').textContent = data.rank_title;
                
                // Update character name with rank prefix if commissioned (rank > 0)
                updateCharacterNameWithRank(data.rank_title, data.rank > 0);
                
                // Update service status (enlisted vs commissioned)
                updateServiceStatus(data.rank > 0);
                
                // Show/update rank number in UPP area
                updateRankNumber(data.rank);
            } else {
                document.getElementById('char-rank-number').textContent = '';
            }
        }
    } catch (error) {
        console.error('Error getting rank title:', error);
        document.getElementById('char-rank-number').textContent = '';
    }
}

function updateCharacterNameWithRank(rankTitle, isCommissioned) {
    const nameElement = document.getElementById('char-name');
    const currentText = nameElement.textContent;
    
    // Remove any existing rank prefix (anything before the last word)
    const words = currentText.split(' ');
    const actualName = words[words.length - 1]; // Last word is the name
    
    if (isCommissioned && rankTitle) {
        nameElement.textContent = `${rankTitle} ${actualName}`;
    } else {
        nameElement.textContent = actualName;
    }
}

function updateServiceStatus(isCommissioned) {
    const serviceElement = document.getElementById('char-service');
    const currentText = serviceElement.textContent;
    
    // Extract service name (first word) and update status
    const words = currentText.split(' ');
    const serviceName = words[0]; // First word is the service name
    
    if (isCommissioned) {
        serviceElement.textContent = `${serviceName} Commissioned`;
    } else {
        // Keep existing status if not commissioned (could be Enlisted, Drafted, etc.)
        if (!currentText.includes('Commissioned')) {
            // Don't change if already showing non-commissioned status
            return;
        }
    }
}

function updateRankNumber(rank) {
    const rankElement = document.getElementById('char-rank');
    if (rank > 0) {
        rankElement.textContent = `Rank ${rank}`;
        rankElement.style.display = 'inline';
    } else {
        rankElement.style.display = 'none';
    }
}

// Add click handlers for demonstration purposes
const buttons = document.querySelectorAll('.btn');
buttons.forEach(button => {
    if (!button.onclick) {
        button.onclick = function() {
            console.log(`${button.textContent} button clicked`);
            // Show some visual feedback
            const eventSections = document.querySelectorAll('.event-record .event-section');
            if (eventSections.length > 0) {
                eventSections[0].querySelector('.event-label').textContent = `Action: ${button.textContent} selected`;
                if (eventSections.length > 1) {
                    eventSections[1].querySelector('.event-label').textContent = 'Status: Processing...';
                }
            }
        };
    }
}); 

// Legacy survival button handler (now handled in actions panel)
/*document.getElementById('survival-btn').onclick = function() {
    fetch('/api/survival', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Survival action completed (legacy handler - no longer used)
            
            // Update the term panel with survival outcome
            const termItems = document.querySelectorAll('.term-item');
            if (termItems.length > 0) {
                // Find the survival term item and update its outcome
                const survivalTermItem = termItems[0]; // First item is survival
                const outcomeSpan = survivalTermItem.querySelector('.term-outcome');
                if (outcomeSpan) {
                    outcomeSpan.textContent = result.outcome || 'Unknown';
                }
            }
            
            // Update skill eligibility counter
            if (data.skill_eligibility !== undefined) {
                document.getElementById('top-skill-eligibility').textContent = data.skill_eligibility;
            }
            
            // Show/hide skill buttons based on ready_for_skills flag
            if (data.ready_for_skills) {
                // Fetch available skill tables from the API
                fetch('/api/available_skill_tables')
                    .then(res => res.json())
                    .then(tableData => {
                        if (tableData.success && tableData.available_tables) {
                            const available = tableData.available_tables;
                document.getElementById('personal-skill-btn').style.display = available.personal ? 'block' : 'none';
                document.getElementById('service-skill-btn').style.display = available.service ? 'block' : 'none';
                document.getElementById('advanced-skill-btn').style.display = available.advanced ? 'block' : 'none';
                document.getElementById('education-skill-btn').style.display = available.education ? 'block' : 'none';
                            
                            // Show the skills section
                            const anyAvailable = available.personal || available.service || available.advanced || available.education;
                            const skillsSection = getSkillsSection();
                            if (skillsSection) skillsSection.style.display = anyAvailable ? 'block' : 'none';
                        }
                    });
            } else {
                // Hide the skills section if not ready for skills
                const skillsSection = getSkillsSection();
                if (skillsSection) skillsSection.style.display = 'none';
            }

            // Commission and promotion handling now done in actions panel

            // If show_medical is true, replace reenlist/leave with a medical button
            if (data.show_medical) {
                // Hide reenlist and leave buttons if they exist
                var reenlistBtn = document.getElementById('reenlist-btn');
                var leaveBtn = document.getElementById('leave-btn');
                if (reenlistBtn) reenlistBtn.style.display = 'none';
                if (leaveBtn) leaveBtn.style.display = 'none';
                // Add a medical button if not already present
                if (!document.getElementById('medical-btn')) {
                    var medicalBtn = document.createElement('button');
                    medicalBtn.id = 'medical-btn';
                    medicalBtn.className = 'btn';
                    medicalBtn.textContent = 'Medical';
                    // Add your medical button handler here
                    medicalBtn.onclick = function() {
                        alert('Medical event triggered!');
                    };
                    // Insert the button in the same parent as reenlist/leave
                    if (reenlistBtn && reenlistBtn.parentNode) {
                        reenlistBtn.parentNode.appendChild(medicalBtn);
                    } else if (leaveBtn && leaveBtn.parentNode) {
                        leaveBtn.parentNode.appendChild(medicalBtn);
                    } else {
                        // Fallback: add to body
                        document.body.appendChild(medicalBtn);
                    }
                }
            } else {
                // If not injured, remove the medical button if it exists
                var medicalBtn = document.getElementById('medical-btn');
                if (medicalBtn) medicalBtn.remove();
            }

            // Update character display if character data is provided
            if (data.character) {
                if (data.character.age !== undefined) {
                    document.getElementById('char-age').textContent = 'Age: ' + data.character.age;
                }
                if (data.character.terms_served !== undefined) {
                    document.getElementById('char-terms').textContent = 'Terms: ' + data.character.terms_served;
                }
            }
            
            // Update rank display if character has rank information
            if (data.character && data.character.rank !== undefined) {
                const career = data.character.career || '';
                updateRankDisplay(data.character.rank);
            }

            // ADD: Update term panel with latest character data
            if (data.character) {
                updateTermPanel(data.character);
            }

            // Update terms served if survived
            if (result.outcome === 'survived') {
                // This would need to be handled by the backend, but for now we can show it
                console.log('Character survived - terms should be incremented');
            }
        } else {
            alert(data.error || "Survival check failed.");
        }
    });
};*/

// Legacy commission button handler (now handled in actions panel)
/*
document.getElementById('commission-btn').onclick = function() {
    console.log("Commission button clicked"); // Debug log
    fetch('/api/commission', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    .then(data => {
        // Commission action completed (legacy handler - no longer used)

        if (data.success && data.commission_result) {
            const result = data.commission_result;

            // Update the term panel with commission outcome
            const termItems = document.querySelectorAll('.term-item');
            if (termItems.length > 1) {
                // Second item is commission
                const commissionTermItem = termItems[1];
                const outcomeSpan = commissionTermItem.querySelector('.term-outcome');
                if (outcomeSpan) {
                    outcomeSpan.textContent = result.outcome || 'Unknown';
                }
            }

            // If commissioned, update rank display and show promotion button
            if (result.success && result.rank !== undefined) {
                updateRankDisplay(result.rank);
                // Promotion now available (handled in actions panel)
            }
            // Update skill eligibility counter if present
            if (data.skill_eligibility !== undefined) {
                document.getElementById('top-skill-eligibility').textContent = data.skill_eligibility;
            }
            // Update character display if character data is provided
            if (data.character) {
                if (data.character.age !== undefined) {
                    document.getElementById('char-age').textContent = 'Age: ' + data.character.age;
                }
                if (data.character.terms_served !== undefined) {
                    document.getElementById('char-terms').textContent = 'Terms: ' + data.character.terms_served;
                }
                // Update service/status display: show 'Commissioned' if commissioned, else 'Enlisted'
                if (data.character.career) {
                    let status = data.character.commissioned ? 'Commissioned' : 'Enlisted';
                    document.getElementById('char-service').textContent = `${data.character.career} ${status}`;
                }
            }
            // Update rank display if character has rank information
            if (data.character && data.character.rank !== undefined) {
                const career = data.character.career || '';
                updateRankDisplay(data.character.rank);
            }
            
            // ADD: Update term panel with latest character data
            if (data.character) {
                updateTermPanel(data.character);
            }
            
            // Promotion handling now done in actions panel
        } else {
            alert(data.error || "Commission check failed.");
        }
    });
};*/

// Helper to get rank title from server
async function getRankTitle() {
    try {
        const response = await fetch('/api/get_rank_title', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        const data = await response.json();
        if (data.success) {
            return data.rank_title;
        }
    } catch (error) {
        console.error('Error fetching rank title:', error);
    }
    return "";
}

// Function to update character name display with rank title
async function updateCharacterNameWithRank(characterName) {
    const rankTitle = await getRankTitle();
    const charNameElement = document.getElementById('char-name');
    
    if (rankTitle && rankTitle.trim() !== '') {
        charNameElement.textContent = `${rankTitle} ${characterName}`;
    } else {
        charNameElement.textContent = characterName;
    }
} 

// Legacy promotion button handler (now handled in actions panel)
/*document.getElementById('promotion-btn').onclick = function() {
    console.log("Promotion button clicked"); // Debug log
    fetch('/api/promotion', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    .then(data => {
        // Promotion action completed (legacy handler - no longer used)

        if (data.success && data.promotion_result) {
            const result = data.promotion_result;

            // Update the term panel with promotion outcome
            const termItems = document.querySelectorAll('.term-item');
            if (termItems.length > 2) {
                // Third item is promotion
                const promotionTermItem = termItems[2];
                const outcomeSpan = promotionTermItem.querySelector('.term-outcome');
                if (outcomeSpan) {
                    outcomeSpan.textContent = result.outcome || 'Unknown';
                }
            }

            // If promoted, update rank display
            if (result.success && result.rank !== undefined) {
                updateRankDisplay(result.rank);
            }

            // Update skill eligibility counter if present
            if (data.skill_eligibility !== undefined) {
                document.getElementById('top-skill-eligibility').textContent = data.skill_eligibility;
            }
            
            // Update character display if character data is provided
            if (data.character) {
                if (data.character.age !== undefined) {
                    document.getElementById('char-age').textContent = 'Age: ' + data.character.age;
                }
                if (data.character.terms_served !== undefined) {
                    document.getElementById('char-terms').textContent = 'Terms: ' + data.character.terms_served;
                }
            }
            
            // Update rank display if character has rank information
            if (data.character && data.character.rank !== undefined) {
                const career = data.character.career || '';
                updateRankDisplay(data.character.rank);
            }
            
            // ADD: Update term panel with latest character data
            if (data.character) {
                updateTermPanel(data.character);
            }
        } else {
            alert(data.error || "Promotion check failed.");
        }
    });
};*/

function setupSkillButton(btnId, tableChoice) {
    document.getElementById(btnId).onclick = function() {
        // Hide skills panel and show event panel with skill result
        hideSkillsPanel();
        
        fetch('/api/resolve_skill', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({table_choice: tableChoice})
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.skill_event) {
                // Skill resolved - no longer show old event display
                // Update skill eligibility counter
                if (data.skill_eligibility !== undefined) {
                    document.getElementById('top-skill-eligibility').textContent = data.skill_eligibility;
                }
                
                // Check if more skills are available
                if (data.ready_for_skills && data.skill_eligibility > 0) {
                    // Show skills panel again with updated available tables
                    setTimeout(() => {
                        fetch('/api/available_skill_tables')
                            .then(res => res.json())
                            .then(tableData => {
                                if (tableData.success && tableData.available_tables) {
                                    showSkillsPanelWithLayout(tableData.available_tables);
                                } else {
                                    showReenlistmentOptions(data.character);
                                }
                            })
                            .catch(error => {
                                console.error('Error checking skill tables:', error);
                                showReenlistmentOptions(data.character);
                            });
                    }, 2000); // Give time to see skill result
                } else {
                    // No more skills available, move to reenlistment/ageing
                    setTimeout(() => {
                        showReenlistmentOptions(data.character);
                    }, 2000);
                }
                // Update age in UI if present in response
                if (data.character && data.character.age !== undefined) {
                    document.getElementById('char-age').textContent = 'Age: ' + data.character.age;
                }
                // Update term panel and skills display
                if (data.character) {
                    updateTermPanel(data.character);
                }
                

                
                // Update UPP if characteristic increase occurred
                if (data.skill_event && data.skill_event.result_type === 'characteristic_increase') {
                    updateUPPFromCharacteristics(data.character.characteristics);
                }
                
                // Always update reenlistment buttons if options are available
                if (data.available_options && data.available_options.length > 0) {
                    updateReenlistmentButtons(data.character, data.available_options);
                }
                
                // Update character display if character data is provided
                if (data.character) {
                    if (data.character.age !== undefined) {
                        document.getElementById('char-age').textContent = 'Age: ' + data.character.age;
                    }
                    if (data.character.terms_served !== undefined) {
                        document.getElementById('char-terms').textContent = 'Terms: ' + data.character.terms_served;
                    }
                }
                
                // Update rank display if character has rank information
                if (data.character && data.character.rank !== undefined) {
                    const career = data.character.career || '';
                    updateRankDisplay(data.character.rank);
                }
            } else {
                alert(data.error || 'Skill resolution failed.');
            }
        });
    };
}

// Legacy sidebar skill buttons (commented out)
/*setupSkillButton('personal-skill-btn', 'personal');
setupSkillButton('service-skill-btn', 'service');
setupSkillButton('advanced-skill-btn', 'advanced');
setupSkillButton('education-skill-btn', 'education');*/

// New skills panel buttons
setupSkillButton('personal-skill-btn', 'personal');
setupSkillButton('service-skill-btn', 'service');
setupSkillButton('advanced-skill-btn', 'advanced');
setupSkillButton('education-skill-btn', 'education'); 

function updateReenlistmentButtons(character, availableOptions) {
    const reenlistBtn = document.getElementById('reenlist-btn');
    const leaveRetireBtn = document.getElementById('leave-btn');
    const ageingBtn = document.getElementById('ageing-btn');
    let medicalBtn = document.getElementById('medical-btn');

    // Hide all by default
    reenlistBtn.style.display = 'none';
    leaveRetireBtn.style.display = 'none';
    if (medicalBtn) medicalBtn.style.display = 'none';
    if (ageingBtn) ageingBtn.style.display = 'none';

    // If character is ready for ageing, only show the Ageing button
    if (character.ready_for_ageing) {
        if (ageingBtn) ageingBtn.style.display = 'block';
        return; // Don't show reenlist/leave until ageing is done
    }

    // ADD: If character is ready for reenlistment, show reenlistment options
    if (character.ready_for_reenlistment) {
        reenlistBtn.style.display = 'block';
        leaveRetireBtn.textContent = 'Leave';
        leaveRetireBtn.style.display = 'block';
        return;
    }

    // Fallback to availableOptions logic for other cases
    if (!availableOptions) {
        return;
    }

    if (availableOptions.includes('reenlist')) {
        reenlistBtn.style.display = 'block';
    }
    // Only show 'Retire' if availableOptions includes 'retire', otherwise show 'Leave'
    if (availableOptions.includes('retire')) {
        leaveRetireBtn.textContent = 'Retire';
        leaveRetireBtn.style.display = 'block';
    } else if (availableOptions.includes('leave')) {
        leaveRetireBtn.textContent = 'Leave';
        leaveRetireBtn.style.display = 'block';
    }
    if (availableOptions.includes('medical')) {
        if (!medicalBtn) {
            medicalBtn = document.createElement('button');
            medicalBtn.id = 'medical-btn';
            medicalBtn.className = 'btn';
            medicalBtn.textContent = 'Medical';
            medicalBtn.onclick = function() {
                fetch('/api/reenlist', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({preference: 'discharge'})
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.reenlistment_result) {
                        alert('Medical discharge: ' + (data.reenlistment_result.status_text || ''));
                        if (data.character && data.available_options) {
                            updateReenlistmentButtons(data.character, data.available_options);
                        }
                        // ADD: Update term panel with latest character data
                        if (data.character) {
                            updateTermPanel(data.character);
                        }
                    } else {
                        alert(data.error || 'Medical discharge failed.');
                    }
                });
            };
            leaveRetireBtn.parentNode.appendChild(medicalBtn);
        }
        medicalBtn.style.display = 'block';
    }
}

// This handler is no longer needed - using left-reenlist-btn instead
/*
document.getElementById('reenlist-btn').onclick = function() {
    fetch('/api/reenlist', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({preference: 'reenlist'})
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.reenlistment_result) {
            // When receiving reenlistment response
            if (data.new_term) {
                // Reset all term-specific state variables
                // Note: These would be Vue.js reactive variables in a Vue app
                // For vanilla JS, we'll reset the UI state directly
                
                // Update current term number
                if (data.term_number !== undefined) {
                    document.getElementById('char-terms').textContent = 'Terms: ' + data.term_number;
                }
                
                // Show actions panel for new term
                showActionsPanel();
                if (data.character) {
                    updateActionProbabilities(data.character);
                }
                
                // Hide skills section
                const skillsSection = getSkillsSection();
                if (skillsSection) skillsSection.style.display = 'none'; // Hide skills section
                
                // Hide reenlistment buttons since we're starting a new term
                document.getElementById('reenlist-btn').style.display = 'none';
                document.getElementById('leave-btn').style.display = 'none';
                let medicalBtn = document.getElementById('medical-btn');
                if (medicalBtn) medicalBtn.style.display = 'none';
                

            }
            
            if (data.character && data.available_options) updateReenlistmentButtons(data.character, data.available_options);
            // Hide reenlist and leave/retire buttons after outcome
            document.getElementById('reenlist-btn').style.display = 'none';
            document.getElementById('leave-btn').style.display = 'none';
            let medicalBtn = document.getElementById('medical-btn');
            if (medicalBtn) medicalBtn.style.display = 'none';
            // Update term panel
            if (data.character) {
                updateTermPanel(data.character);
            }
        } else {
            alert(data.error || 'Reenlistment failed.');
        }
    });
};
*/

document.getElementById('leave-btn').onclick = function() {
    // Use 'retire' if button says Retire, otherwise 'leave'
    const pref = this.textContent === 'Retire' ? 'retire' : 'leave';
    fetch('/api/reenlist', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({preference: pref})
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.reenlistment_result) {
            // When receiving reenlistment response
            if (data.new_term) {
                // Reset all term-specific state variables
                // Note: These would be Vue.js reactive variables in a Vue app
                // For vanilla JS, we'll reset the UI state directly
                
                // Update current term number
                if (data.term_number !== undefined) {
                    document.getElementById('char-terms').textContent = 'Terms: ' + data.term_number;
                }
                
                // Show actions panel for new term
                showActionsPanel();
                if (data.character) {
                    updateActionProbabilities(data.character);
                }
                
                // Hide skills section
                const skillsSection = getSkillsSection();
                if (skillsSection) skillsSection.style.display = 'none'; // Hide skills section
                
                // Hide reenlistment buttons since we're starting a new term
                document.getElementById('reenlist-btn').style.display = 'none';
                document.getElementById('leave-btn').style.display = 'none';
                let medicalBtn = document.getElementById('medical-btn');
                if (medicalBtn) medicalBtn.style.display = 'none';
                

            }
            
            if (data.character && data.available_options) updateReenlistmentButtons(data.character, data.available_options);
            // Hide reenlist and leave/retire buttons after outcome
            document.getElementById('reenlist-btn').style.display = 'none';
            document.getElementById('leave-btn').style.display = 'none';
            let medicalBtn = document.getElementById('medical-btn');
            if (medicalBtn) medicalBtn.style.display = 'none';
            // Update term panel
            if (data.character) {
                updateTermPanel(data.character);
            }
        } else {
            alert(data.error || (pref === 'retire' ? 'Retirement failed.' : 'Leave failed.'));
        }
    });
}; 

function updateTermPanel(character) {
    // This function updates the term panel with character information
    console.log('Updating term panel for character:', character);
    
    // Update skills display in top panel
    updateSkillsDisplay(character);
    
    // Update credits and benefits displays
    updateCreditsDisplay(character);
    updateBenefitsDisplay(character);
    
    // Always update terms served and age in the UI
    if (character.terms_served !== undefined) {
        document.getElementById('char-terms').textContent = 'Terms: ' + character.terms_served;
    }
    if (character.age !== undefined) {
        document.getElementById('char-age').textContent = 'Age: ' + character.age;
    }
    
    // Update term title in sidebar
    updateTermTitle(character);

    // ALWAYS update UPP display to reflect current characteristics
    if (character.characteristics) {
        console.log('Updating UPP from characteristics:', character.characteristics);
        updateUPPFromCharacteristics(character.characteristics);
    }

    // Display mustering out rolls in pink next to skill eligibility (cyan)
    let musteringRolls = null;
    if (character.mustering_out_benefits && character.mustering_out_benefits.cash_roll_details && character.mustering_out_benefits.benefit_roll_details) {
        musteringRolls = character.mustering_out_benefits.cash_roll_details.length + character.mustering_out_benefits.benefit_roll_details.length;
    } else if (character.terms_served !== undefined && character.rank !== undefined) {
        let totalRolls = parseInt(character.terms_served);
        const rank = parseInt(character.rank) || 0;
        if (rank >= 1 && rank <= 2) totalRolls += 1;
        else if (rank >= 3 && rank <= 4) totalRolls += 2;
        else if (rank >= 5 && rank <= 6) totalRolls += 3;
        musteringRolls = totalRolls;
    }
    const skillEl = document.getElementById('top-skill-eligibility');
    let moEl = document.getElementById('top-mustering-rolls');
    if (!moEl) {
        moEl = document.createElement('span');
        moEl.id = 'top-mustering-rolls';
        moEl.style.marginLeft = '8px';
        skillEl.parentNode.insertBefore(moEl, skillEl.nextSibling);
    }
    if (musteringRolls !== null && !isNaN(musteringRolls)) {
        moEl.innerHTML = `<span style="color:pink; font-size: 16px; font-weight: bold;">${musteringRolls}</span>`;
    } else {
        moEl.innerHTML = '';
    }

    // Update the static term title regardless of which report is showing
    const staticTitle = document.querySelector('.term-title');
    if (staticTitle) {
        const currentTerm = getCurrentTermNumber(character);
        staticTitle.textContent = `CURRENT TERM ${currentTerm}`;
    }

    // If mustering out, replace the term report with the mustering out report
    const termRecord = document.querySelector('.term-record');
    let moDiv = document.getElementById('mustering-out-summary');
    if (character.mustering_out_benefits) {
        // Remove all children from termRecord except the mustering out summary
        Array.from(termRecord.children).forEach(child => {
            if (child.id !== 'mustering-out-summary') termRecord.removeChild(child);
        });
        if (!moDiv) {
            moDiv = document.createElement('div');
            moDiv.id = 'mustering-out-summary';
            moDiv.className = 'section';
            termRecord.appendChild(moDiv);
        }
        // Format the mustering out report in four categories like term panel
        const mo = character.mustering_out_benefits;
        let summary = `<div class="term-title" style="color:#fff; font-weight:bold; border-bottom:1px solid #333; padding-bottom:3px; margin-bottom:10px;">MUSTERING OUT REPORT</div>`;
        summary += `<div class="term-item"><span class="term-action">Benefits</span><span class="term-outcome"><span style="color:#00ffff; font-weight:bold;">${mo.items && mo.items.length > 0 ? mo.items.join(', ').toUpperCase() : 'NONE'}</span></span></div>`;
        summary += `<div class="term-item"><span class="term-action">Personal</span><span class="term-outcome"><span style="color:#ff6600; font-weight:bold;">${mo.characteristic_boosts && Object.keys(mo.characteristic_boosts).length > 0 ? Object.entries(mo.characteristic_boosts).map(([stat, val]) => `${stat.toUpperCase()}+${val}`).join(', ') : 'NONE'}</span></span></div>`;
        summary += `<div class="term-item"><span class="term-action">Cash</span><span class="term-outcome"><span style="color:#00ff00; font-weight:bold;">CR${mo.cash ? mo.cash.toLocaleString() : 0}</span></span></div>`;
        summary += `<div class="term-item"><span class="term-action">Retirement Pay</span><span class="term-outcome"><span style="color:#ffff00; font-weight:bold;">${mo.retirement_pay ? `CR${mo.retirement_pay.toLocaleString()}` : 'NONE'}</span></span></div>`;
        moDiv.innerHTML = summary;
        return;
    } else {
        // If not mustered out, remove the mustering out summary if present
        if (moDiv) moDiv.remove();
        
        // Title is already updated in updateCharacterDisplay function
    }

    // Update term outcomes in bottom panel (only if not mustered out)
    updateTermOutcomes(character);
    
    // Update event panel (middle panel) for ageing events
    updateEventPanel(character);
    
    // Update UPP display to reflect current characteristics
    if (character.characteristics) {
        updateUPPFromCharacteristics(character.characteristics);
    }
}

function updateTermTitle(character) {
    const termTitleElement = document.getElementById('term-title');
    if (!termTitleElement) return;
    
    // Before enlistment
    if (!character.career || !character.terms_served) {
        termTitleElement.textContent = 'Pre-Enlistment';
        return;
    }
    
    // After enlistment, show current term number
    const currentTerm = character.terms_served || 1;
    termTitleElement.textContent = `TERM ${currentTerm}`;
}

function updateSkillsDisplay(character) {
    // Extract all skills from the character's career history
    const skills = [];
    const skillCounts = {};
    
    if (character.career_history) {
        character.career_history.forEach(event => {
            if (event.event_type === 'skill_resolution' && event.result_type === 'skill_gain' && event.skill_gained) {
                const skill = event.skill_gained;
                skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            }
        });
    }
    
    const skillsDisplay = document.getElementById('skills-display');
    if (skillsDisplay) {
        if (Object.keys(skillCounts).length > 0) {
            // Create horizontal skill items
            let skillsHTML = '';
            Object.entries(skillCounts).forEach(([skill, count]) => {
                const displayText = count > 1 ? `${skill}-${count}` : skill;
                skillsHTML += `<span class="skill-item">${displayText}</span>`;
            });
            skillsDisplay.innerHTML = skillsHTML;
        } else {
            skillsDisplay.innerHTML = 'None';
        }
    }
}

function updateCreditsDisplay(character) {
    const creditsDisplay = document.getElementById('char-credits');
    if (creditsDisplay) {
        let credits = 0;
        
        // Get credits from mustering out benefits
        if (character.mustering_out_benefits && character.mustering_out_benefits.cash) {
            credits = character.mustering_out_benefits.cash;
        }
        
        creditsDisplay.textContent = `CR ${credits.toLocaleString()}`;
    }
}

function updateBenefitsDisplay(character) {
    const benefitsDisplay = document.getElementById('benefits-display');
    if (benefitsDisplay) {
        let benefits = [];
        
        if (character.mustering_out_benefits) {
            const mo = character.mustering_out_benefits;
            
            // Add items
            if (mo.items && mo.items.length > 0) {
                benefits = benefits.concat(mo.items);
            }
            
            // Add characteristic boosts
            if (mo.characteristic_boosts && Object.keys(mo.characteristic_boosts).length > 0) {
                Object.entries(mo.characteristic_boosts).forEach(([stat, boost]) => {
                    benefits.push(`${stat.substring(0,3).toUpperCase()}+${boost}`);
                });
            }
            
            // Add retirement pay
            if (mo.retirement_pay && mo.retirement_pay > 0) {
                benefits.push(`Pension: CR${mo.retirement_pay.toLocaleString()}/yr`);
            }
        }
        
        if (benefits.length > 0) {
            benefitsDisplay.textContent = benefits.join(', ');
        } else {
            benefitsDisplay.textContent = 'None';
        }
    }
}

// Helper function to get current term number
function getCurrentTermNumber(character) {
    return character.terms_served || 1; // Use actual terms_served, default to 1 if not set
}

// Improve the ageing display in the term outcomes
function updateTermOutcomes(character) {
    // Get the current term number - show the LATEST term by default
    const currentTerm = character.terms_served || 0;
    
    // FIXED: Define targetTerm outside the if block to fix scope issue
    const targetTerm = currentTerm; // Show the latest term
    
    // Title is now updated earlier in updateCharacterDisplay function
    
    // ADD BACK: Initialize termEvents object
    const termEvents = {
        survival: null,
        commission: null,
        promotion: null,
        skills: [],
        ageing: null,
        reenlistment: null
    };
    
    // Find events for the SPECIFIC term (latest term by default)
    if (character.career_history) {
        let termCount = 0;
        let termStartIndex = 0;
        let termEndIndex = character.career_history.length;
        
        // FIXED: Handle term 0 (first term) specially
        if (targetTerm === 0) {
            // Term 0 starts from the beginning and ends at the first reenlistment
            termStartIndex = 0;
            for (let i = 0; i < character.career_history.length; i++) {
                const event = character.career_history[i];
                if (event.event_type === 'reenlistment_attempt' && event.new_term_started) {
                    termEndIndex = i; // Stop at first reenlistment
                    break;
                }
            }
        } else {
            // Find the start and end of the TARGET term (for terms 1+)
            for (let i = 0; i < character.career_history.length; i++) {
                const event = character.career_history[i];
                if (event.event_type === 'reenlistment_attempt' && event.new_term_started) {
                    termCount++;
                    if (termCount === targetTerm) {
                        termStartIndex = i + 1; // Start after this reenlistment
                    } else if (termCount === targetTerm + 1) {
                        termEndIndex = i; // Stop at next reenlistment
                        break;
                    }
                }
            }
        }
        
        // Process events for the SPECIFIC term only
        for (let i = termStartIndex; i < termEndIndex; i++) {
            const event = character.career_history[i];
            
            if (event.event_type === 'survival_check') {
                termEvents.survival = event;
            } else if (event.event_type === 'commission_check') {
                termEvents.commission = event;
            } else if (event.event_type === 'promotion_check') {
                termEvents.promotion = event;
            } else if (event.event_type === 'skill_resolution' && (event.result_type === 'skill_gain' || event.result_type === 'characteristic_increase')) {
                termEvents.skills.push(event);
            } else if (event.event_type === 'ageing_check') {
                termEvents.ageing = event;
            } else if (event.event_type === 'reenlistment_attempt') {
                termEvents.reenlistment = event;
                break;
            }
        }
        
        // FIXED: Find the reenlistment event that STARTED this term
        // The reenlistment event should be the one that begins the current term
        if (targetTerm === 0) {
            // For term 0, look for the reenlistment event that starts term 1
            for (let i = 0; i < character.career_history.length; i++) {
                const event = character.career_history[i];
                if (event.event_type === 'reenlistment_attempt' && event.new_term_started) {
                    termEvents.reenlistment = event;
                    break;
                }
            }
        } else {
            // For terms 1+, look for the reenlistment event that started this term
            let termCount = 0;
            for (let i = 0; i < character.career_history.length; i++) {
                const event = character.career_history[i];
                if (event.event_type === 'reenlistment_attempt' && event.new_term_started) {
                    termCount++;
                    if (termCount === targetTerm) {
                        termEvents.reenlistment = event;
                        break;
                    }
                }
            }
        }
    }
    
    // Check if character is already commissioned (rank 1 or higher)
    const currentRank = character.rank || 0;
    const isCommissioned = currentRank >= 1;
    
    // DEBUG: Log what we found for this term
    console.log(`[DEBUG] Term ${targetTerm} events:`, {
        survival: termEvents.survival ? 'found' : 'not found',
        commission: termEvents.commission ? 'found' : 'not found',
        promotion: termEvents.promotion ? 'found' : 'not found',
        skills: termEvents.skills.length,
        ageing: termEvents.ageing ? 'found' : 'not found',
        reenlistment: termEvents.reenlistment ? 'found' : 'not found'
    });
    
    // Update the term outcomes in the LOWER PANEL
    updateLowerPanelOutcome('Survival', termEvents.survival);
    
    // Always show Commission like Survival and Promotion
    showLowerPanelOutcome('Commission');
    updateLowerPanelOutcome('Commission', termEvents.commission);
    
    updateLowerPanelOutcome('Promotion', termEvents.promotion);
    updateLowerPanelOutcome('Skills', termEvents.skills);
    updateLowerPanelOutcome('Ageing', termEvents.ageing);
    updateLowerPanelOutcome('Reenlistment', termEvents.reenlistment);
}

// Replace the updateLowerPanelOutcome function with this enhanced version:

function updateLowerPanelOutcome(actionName, event) {
    // Find the term-item that contains this action in the lower panel
    const termItems = document.querySelectorAll('.term-item');
    let targetItem = null;
    
    for (let item of termItems) {
        const actionSpan = item.querySelector('.term-action');
        if (actionSpan && actionSpan.textContent === actionName) {
            targetItem = item;
            break;
        }
    }
    
    if (!targetItem) return;
    
    const outcomeSpan = targetItem.querySelector('.term-outcome');
    if (!outcomeSpan) return;
    
    if (!event) {
        outcomeSpan.innerHTML = '<span style="color:gray;">Not applicable</span>';
        return;
    }
    
    let content = '';
    
    if (actionName === 'Survival') {
        const outcome = event.outcome || 'unknown';
        let color = 'gray';
        if (outcome === 'survived') color = '#00ff00'; // Bright green
        else if (outcome === 'injured') color = '#ff6600'; // Orange
        else color = '#ff0000'; // Red
        
        content = `<span style="color:${color}; font-weight:bold;">${outcome.toUpperCase()}</span>`;
        
        // Show roll details
        if (event.roll !== undefined && event.target !== undefined) {
            content += ` <span style="color:#ffff00;">(${event.roll}/${event.target})</span>`;
        }
        if (event.modifier !== undefined && event.modifier !== 0) {
            content += ` <span style="color:#00ffff;">[+${event.modifier}]</span>`;
        }
    } else if (actionName === 'Commission') {
        const outcome = event.success ? 'commissioned' : 'failed';
        let color = event.success ? '#00ff00' : '#ff0000';
        
        content = `<span style="color:${color}; font-weight:bold;">${outcome.toUpperCase()}</span>`;
        
        if (event.success && event.rank !== undefined) {
            content += ` <span style="color:#00ffff;">(Rank ${event.rank})</span>`;
        }
        
        // Show roll details
        if (event.roll !== undefined && event.target !== undefined) {
            content += ` <span style="color:#ffff00;">(${event.roll}/${event.target})</span>`;
        }
        if (event.modifier !== undefined && event.modifier !== 0) {
            content += ` <span style="color:#00ffff;">[+${event.modifier}]</span>`;
        }
    } else if (actionName === 'Promotion') {
        const outcome = event.success ? 'promoted' : 'failed';
        let color = event.success ? '#00ff00' : '#ff0000';
        
        content = `<span style="color:${color}; font-weight:bold;">${outcome.toUpperCase()}</span>`;
        
        if (event.success && event.rank !== undefined) {
            content += ` <span style="color:#00ffff;">(Rank ${event.rank})</span>`;
        }
        
        // Show roll details
        if (event.roll !== undefined && event.target !== undefined) {
            content += ` <span style="color:#ffff00;">(${event.roll}/${event.target})</span>`;
        }
        if (event.modifier !== undefined && event.modifier !== 0) {
            content += ` <span style="color:#00ffff;">[+${event.modifier}]</span>`;
        }
    } else if (actionName === 'Skills') {
        if (Array.isArray(event) && event.length > 0) {
            const skillDisplays = event.map(skill => {
                if (skill.result_type === 'characteristic_increase') {
                    // Handle characteristic increases like "+1 EDU"
                    const charName = skill.skill_gained || `${skill.characteristic.charAt(0).toUpperCase() + skill.characteristic.slice(1).toLowerCase()} +1`;
                    return charName;
                } else {
                    // Handle regular skills
                    const skillName = skill.skill_gained || skill.result_type;
                    const levelGain = skill.level_gain || '+1';
                    return `${skillName} ${levelGain}`;
                }
            }).filter(Boolean);
            const outcome = skillDisplays.join(', ');
            let color = '#00ffff'; // Cyan for skills gained
            
            content = `<span style="color:${color}; font-weight:bold;">${outcome}</span>`;
        } else {
            const outcome = 'none this term';
            let color = 'gray';
            content = `<span style="color:${color}; font-weight:bold;">${outcome.toUpperCase()}</span>`;
        }
    } else if (actionName === 'Ageing') {
        if (event.age_increase !== undefined) {
            if (event.ageing_effects && event.ageing_effects.length > 0) {
                const effects = event.ageing_effects.join(', ');
                content = `<span style="color:#ff6600; font-weight:bold;">${effects.toUpperCase()}</span> <span style="color:#ffff00; font-weight:bold;">AGE ${event.current_age}</span>`;
            } else {
                content = `<span style="color:#00ff00; font-weight:bold;">NO EFFECTS</span> <span style="color:#ffff00; font-weight:bold;">AGE ${event.current_age}</span>`;
            }
        } else {
            const outcome = 'no effects';
            let color = '#00ff00'; // Lime green
            content = `<span style="color:${color}; font-weight:bold;">${outcome.toUpperCase()}</span>`;
        }
    } else if (actionName === 'Reenlistment') {
        const outcome = event.continue_career ? 'reenlisted' : (event.outcome || 'unknown');
        let color = 'gray';
        if (outcome === 'reenlisted') color = '#00ff00'; // Bright green
        else if (outcome === 'retired') color = '#ff6600'; // Orange
        else if (outcome === 'discharged' || outcome === 'medical_discharge') color = '#ff0000'; // Red
        
        content = `<span style="color:${color}; font-weight:bold;">${outcome.toUpperCase()}</span>`;
        
        // Show roll details
        if (event.roll !== undefined && event.target !== undefined) {
            content += ` <span style="color:#ffff00;">(${event.roll}/${event.target})</span>`;
        }
        if (event.modifier !== undefined && event.modifier !== 0) {
            content += ` <span style="color:#00ffff;">[+${event.modifier}]</span>`;
        }
    }
    
    outcomeSpan.innerHTML = content;
}

// NEW FUNCTION: Hide a specific outcome line in the lower panel
function hideLowerPanelOutcome(actionName) {
    // Find the term-item that contains this action in the lower panel
    const termItems = document.querySelectorAll('.term-item');
    let targetItem = null;
    
    for (let item of termItems) {
        const actionSpan = item.querySelector('.term-action');
        if (actionSpan && actionSpan.textContent === actionName) {
            targetItem = item;
            break;
        }
    }
    
    if (targetItem) {
        // Hide the entire term-item div
        targetItem.style.display = 'none';
    }
}

// NEW FUNCTION: Show a specific outcome line in the lower panel
function showLowerPanelOutcome(actionName) {
    // Find the term-item that contains this action in the lower panel
    const termItems = document.querySelectorAll('.term-item');
    let targetItem = null;
    
    for (let item of termItems) {
        const actionSpan = item.querySelector('.term-action');
        if (actionSpan && actionSpan.textContent === actionName) {
            targetItem = item;
            break;
        }
    }
    
    if (targetItem) {
        // Show the entire term-item div
        targetItem.style.display = 'block';
    }
}

// NEW FUNCTION: Show ageing effects for the entire career
function updateCareerAgeingSummary(character) {
    const termRecord = document.querySelector('.term-record');
    let ageingSummaryDiv = document.getElementById('career-ageing-summary');
    
    if (!ageingSummaryDiv) {
        ageingSummaryDiv = document.createElement('div');
        ageingSummaryDiv.id = 'career-ageing-summary';
        ageingSummaryDiv.className = 'section';
        termRecord.appendChild(ageingSummaryDiv);
    }
    
    // Find all ageing events
    const ageingEvents = character.career_history.filter(event => event.event_type === 'ageing_check');
    const ageingDetails = character.career_history.filter(event => event.event_type === 'ageing_check_detail');
    
    if (ageingEvents.length === 0) {
        ageingSummaryDiv.innerHTML = `<strong>Career Ageing:</strong> <span style="color:lime;">No ageing effects</span>`;
        return;
    }
    
    let content = `<strong>Career Ageing Summary:</strong><br>`;
    
    ageingEvents.forEach((event, index) => {
        const termNumber = index + 1;
        content += `<span style="color:yellow;">Term ${termNumber}: Age ${event.previous_age}→${event.current_age}</span>`;
        
        if (event.ageing_effects && event.ageing_effects.length > 0) {
            content += ` <span style="color:red;">(${event.ageing_effects.join(', ')})</span>`;
        } else {
            content += ` <span style="color:lime;">(No effects)</span>`;
        }
        content += '<br>';
    });
    
    ageingSummaryDiv.innerHTML = content;
}

// Improve the updateTermItem function for ageing display
function updateTermItem(itemName, event, ageingDetailsByTerm = null) {
    const termRecord = document.querySelector('.term-record');
    let itemDiv = document.getElementById(`term-${itemName.toLowerCase()}`);
    
    if (!itemDiv) {
        itemDiv = document.createElement('div');
        itemDiv.id = `term-${itemName.toLowerCase()}`;
        itemDiv.className = 'section';
        termRecord.appendChild(itemDiv);
    }
    
    if (!event) {
        itemDiv.innerHTML = `<strong>${itemName}:</strong> <span style="color:gray;">Not applicable</span>`;
        return;
    }
    
    let content = `<strong>${itemName}:</strong> `;
    
    if (itemName === 'Survival') {
        const outcome = event.outcome || 'unknown';
        let color = 'gray';
        if (outcome === 'survived') color = '#00ff00'; // Bright green
        else if (outcome === 'injured') color = '#ff6600'; // Orange
        else color = '#ff0000'; // Red
        
        content += `<span style="color:${color}; font-weight:bold;">${outcome.toUpperCase()}</span>`;
        if (event.roll !== undefined && event.target !== undefined) {
            content += ` <span style="color:#ffff00;">(${event.roll}/${event.target})</span>`;
        }
        if (event.modifier !== undefined && event.modifier !== 0) {
            content += ` <span style="color:#00ffff;">[+${event.modifier}]</span>`;
        }
    } else if (itemName === 'Commission') {
        if (event.success) {
            content += `<span style="color:#00ff00; font-weight:bold;">COMMISSIONED</span>`;
            if (event.rank !== undefined) {
                content += ` <span style="color:#00ffff;">(Rank ${event.rank})</span>`;
            }
        } else {
            content += `<span style="color:#ff0000; font-weight:bold;">FAILED</span>`;
        }
        if (event.roll !== undefined && event.target !== undefined) {
            content += ` <span style="color:#ffff00;">(${event.roll}/${event.target})</span>`;
        }
        if (event.modifier !== undefined && event.modifier !== 0) {
            content += ` <span style="color:#00ffff;">[+${event.modifier}]</span>`;
        }
    } else if (itemName === 'Promotion') {
        if (event.success) {
            content += `<span style="color:#00ff00; font-weight:bold;">PROMOTED</span>`;
            if (event.rank !== undefined) {
                content += ` <span style="color:#00ffff;">(Rank ${event.rank})</span>`;
            }
        } else {
            content += `<span style="color:#ff0000; font-weight:bold;">FAILED</span>`;
        }
        if (event.roll !== undefined && event.target !== undefined) {
            content += ` <span style="color:#ffff00;">(${event.roll}/${event.target})</span>`;
        }
        if (event.modifier !== undefined && event.modifier !== 0) {
            content += ` <span style="color:#00ffff;">[+${event.modifier}]</span>`;
        }
    } else if (itemName === 'Skills') {
        if (Array.isArray(event) && event.length > 0) {
            // Only show skills gained in this specific term, not all career skills
            const skillNames = event.map(skill => skill.skill_gained || skill.result_type).filter(Boolean);
            content += `<span style="color:#00ffff; font-weight:bold;">${skillNames.join(', ')}</span>`;
            
            // Show roll details for each skill gained this term
            event.forEach(skill => {
                if (skill.roll !== undefined) {
                    content += `<br><span style="color:#ffff00; font-size:0.9em;">${skill.skill_gained || skill.result_type}: (${skill.roll})</span>`;
                }
            });
        } else {
            content += `<span style="color:gray;">None this term</span>`;
        }
    } else if (itemName === 'Ageing') {
        if (event.age_increase !== undefined) {
            content += `<span style="color:#ffff00; font-weight:bold;">Age ${event.previous_age}→${event.current_age}</span>`;
            
            if (event.checks_performed && event.checks_performed.length > 0) {
                content += `<br><span style="color:#ff6600;">Checks: ${event.checks_performed.join(', ')}</span>`;
            }
            
            if (event.ageing_effects && event.ageing_effects.length > 0) {
                content += `<br><span style="color:#ff0000;">Effects: ${event.ageing_effects.join(', ')}</span>`;
            } else {
                content += `<br><span style="color:#00ff00;">No characteristic loss</span>`;
            }
            
            // Show ageing roll details if available
            if (event.roll !== undefined && event.target !== undefined) {
                content += `<br><span style="color:#ffff00;">Ageing roll: (${event.roll}/${event.target})</span>`;
            }
        } else {
            content = `<span style="color:#00ff00;">No effects</span>`;
        }
    } else if (itemName === 'Reenlistment') {
        if (event.continue_career) {
            content += `<span style="color:#00ff00; font-weight:bold;">REENLISTED</span>`;
            if (event.roll !== undefined && event.target !== undefined) {
                content += ` <span style="color:#ffff00;">(${event.roll}/${event.target})</span>`;
            }
            if (event.age !== undefined) {
                content += `<br><span style="color:#ffff00;">Age ${event.age}</span>`;
            }
        } else {
            const outcome = event.outcome || 'unknown';
            let color = '#ff6600'; // Orange
            if (outcome === 'discharged') color = '#ff0000'; // Red
            else if (outcome === 'retired') color = '#ff6600'; // Orange
            else if (outcome === 'medical_discharge') color = '#ff0000'; // Red
            
            content += `<span style="color:${color}; font-weight:bold;">${outcome.toUpperCase()}</span>`;
            if (event.roll !== undefined && event.target !== undefined) {
                content += ` <span style="color:#ffff00;">(${event.roll}/${event.target})</span>`;
            }
            if (event.age !== undefined) {
                content += `<br><span style="color:#ffff00;">Age ${event.age}</span>`;
            }
        }
        
        // Add status text if available
        if (event.status_text) {
            content += `<br><span style="color:gray;">${event.status_text}</span>`;
        }
    }
    
    itemDiv.innerHTML = content;
}

// For the event panel (middle), display ageing_check_detail events when the latest event is an ageing_check
function updateEventPanel(character) {
    const eventSections = document.querySelectorAll('.event-record .event-section');
    if (!character.career_history || character.career_history.length === 0) return;
    
    const lastEvent = character.career_history[character.career_history.length - 1];
    
    // Check if the last event is an ageing check
    if (lastEvent.event_type === 'ageing_check') {
        // Find all ageing_check_detail events after this ageing_check
        let idx = character.career_history.length - 1;
        while (idx > 0 && character.career_history[idx].event_type !== 'ageing_check') idx--;
        let details = [];
        for (let i = idx + 1; i < character.career_history.length; i++) {
            if (character.career_history[i].event_type === 'ageing_check_detail') {
                details.push(character.career_history[i]);
            } else {
                break;
            }
        }
        
        // Display in the event panel
        if (eventSections.length > 0) {
            eventSections[0].querySelector('.event-label').textContent = 'Ageing Events:';
            let detailText = '';
            
            if (details.length > 0) {
                details.forEach(detail => {
                    detailText += `Age ${detail.age}: ${detail.stat} roll ${detail.roll}/${detail.target} → ${detail.loss > 0 ? '-' + detail.loss : '0'}; `;
                });
            } else {
                detailText = 'No characteristic loss this term.';
            }
            
            if (eventSections.length > 1) {
                eventSections[1].querySelector('.event-label').textContent = detailText;
            }
        }
    } else {
        // Clear ageing display if not showing ageing
        if (eventSections.length > 0) {
            eventSections[0].querySelector('.event-label').textContent = '';
        }
        if (eventSections.length > 1) {
            eventSections[1].querySelector('.event-label').textContent = '';
        }
    }
}

// Helper function to get the skills section reliably
function getSkillsSection() {
    const personalBtn = document.getElementById('personal-skill-btn');
    if (personalBtn && personalBtn.parentElement) {
        return personalBtn.parentElement;
    }
    return null;
}

document.getElementById('mustering-out-btn').onclick = function() {
    // Remove the Muster Out button
    const musteringSection = document.getElementById('mustering-section');
    const musterOutBtn = document.getElementById('mustering-out-btn');
    if (musterOutBtn) musteringSection.removeChild(musterOutBtn);

    // Create select dropdown for cash rolls
    const label = document.createElement('label');
    label.setAttribute('for', 'cash-rolls');
    label.textContent = 'Number of Cash Rolls:';
    label.style.marginRight = '8px';

    const select = document.createElement('select');
    select.id = 'cash-rolls';
    select.name = 'cash-rolls';
    for (let i = 0; i <= 3; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        select.appendChild(option);
    }
    select.style.marginRight = '8px';

    // Create confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn';
    confirmBtn.id = 'confirm-mustering-btn';
    confirmBtn.textContent = 'Confirm Mustering Out';
    confirmBtn.onclick = function() {
        const cashRolls = select.value;
        fetch('/api/muster_out', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({cash_rolls: cashRolls})
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Format the mustering out results
                const mo = data.mustering_out || {};
                let summary = `<strong>Mustering Out Results:</strong><br>`;
                summary += `Cash: <span style="color:lime;">Cr${mo.cash ? mo.cash.toLocaleString() : 0}</span><br>`;
                if (mo.items && mo.items.length > 0) {
                    summary += `Items: <span style="color:cyan;">${mo.items.join(', ')}</span><br>`;
                }
                if (mo.characteristic_boosts && Object.keys(mo.characteristic_boosts).length > 0) {
                    summary += `Stat Boosts: <span style="color:orange;">`;
                    summary += Object.entries(mo.characteristic_boosts).map(([stat, val]) => `${stat}+${val}`).join(', ');
                    summary += `</span><br>`;
                }
                if (mo.cash_roll_details && mo.cash_roll_details.length > 0) {
                    summary += `<em>Cash Rolls:</em> `;
                    summary += mo.cash_roll_details.map(r => r.total_roll).join(', ') + '<br>';
                }
                if (mo.benefit_roll_details && mo.benefit_roll_details.length > 0) {
                    summary += `<em>Benefit Rolls:</em> `;
                    summary += mo.benefit_roll_details.map(r => r.benefit).join(', ') + '<br>';
                }

                // Display in the bottom panel (or wherever you want)
                const termRecord = document.querySelector('.term-record');
                let moDiv = document.getElementById('mustering-out-summary');
                if (!moDiv) {
                    moDiv = document.createElement('div');
                    moDiv.id = 'mustering-out-summary';
                    moDiv.className = 'section';
                    termRecord.appendChild(moDiv);
                }
                moDiv.innerHTML = summary;

                // Optionally, update the character display as well
                if (data.character) {
                    updateTermPanel(data.character);
                }
            } else {
                alert(data.error || 'Mustering out failed.');
            }
        });
    };

    // Add elements to the mustering section
    musteringSection.appendChild(label);
    musteringSection.appendChild(select);
    musteringSection.appendChild(confirmBtn);
};



// REMOVED: Old ageing button handler - now using left panel workflow

// Dice Roll Report functionality - button doesn't exist, commenting out
/*
document.getElementById('dice-report-btn').onclick = function() {
    fetch('/api/dice_roll_report', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(`Dice roll report saved successfully!\n\nFile: ${data.filename}\nLocation: ${data.path}`);
        } else {
            alert(data.error || 'Failed to generate dice roll report.');
        }
    })
    .catch(error => {
        console.error('Error generating dice roll report:', error);
        alert('Error generating dice roll report.');
    });
};
*/

// Left panel term action buttons
document.getElementById('left-survival-btn').onclick = function() {
    document.getElementById('actions-panel').style.display = 'block';
    document.getElementById('event-panel').style.display = 'none';
    document.getElementById('survival-action-btn').style.display = 'block';
};

// Middle panel survival action button
document.getElementById('survival-action-btn').onclick = function() {
    fetch('/api/survival', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Hide the survival action button after it's clicked
            document.getElementById('survival-action-btn').style.display = 'none';
            
            // Disable the left panel survival button
            disableButton('left-survival-btn');
            
            // Show outcome text
            const outcome = data.survival_result?.outcome || 'survived';
            const roll = data.survival_result?.roll || 0;
            const target = data.survival_result?.target || 0;
            const outcomeText = `Survival Check: Rolled ${roll} vs target ${target} - ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}!`;
            updateOutcomeText(outcomeText);
            
            // Update character display and panels
            if (data.character) {
                updateTermPanel(data.character);
                updateEventPanel(data.character);
            }
            
            // No state machine - keep all buttons visible
        } else {
            alert(data.error || 'Survival check failed.');
        }
    })
    .catch(error => {
        console.error('Error during survival check:', error);
        alert('Error during survival check.');
    });
};

// Left panel commission button
document.getElementById('left-commission-btn').onclick = function() {
    document.getElementById('actions-panel').style.display = 'block';
    document.getElementById('event-panel').style.display = 'none';
    document.getElementById('commission-action-btn').style.display = 'block';
    
    // Fetch and display commission probability
    fetch('/api/action_probability', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action_type: 'commission'})
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.probability) {
            document.getElementById('commission-action-prob').textContent = data.probability.percentage + '%';
        } else {
            document.getElementById('commission-action-prob').textContent = 'Error';
        }
    });
};

// REMOVED: calculateCommissionProbabilityBasic - all calculations now done in Python backend

// Left panel promotion button
document.getElementById('left-promotion-btn').onclick = function() {
    document.getElementById('actions-panel').style.display = 'block';
    document.getElementById('event-panel').style.display = 'none';
    document.getElementById('promotion-action-btn').style.display = 'block';
    
    // Fetch and display promotion probability
    fetch('/api/action_probability', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action_type: 'promotion'})
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.probability) {
            document.getElementById('promotion-action-prob').textContent = data.probability.percentage + '%';
        } else {
            document.getElementById('promotion-action-prob').textContent = 'Error';
        }
    });
};

// REMOVED: calculatePromotionProbabilityBasic - all calculations now done in Python backend

// Middle panel commission action button
document.getElementById('commission-action-btn').onclick = async function() {
    fetch('/api/commission', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Hide the commission action button after it's clicked
            document.getElementById('commission-action-btn').style.display = 'none';
            
            // Disable the left panel commission button
            disableButton('left-commission-btn');
            
            // Show outcome text
            const success = data.commission_result?.success || false;
            const roll = data.commission_result?.roll || 0;
            const target = data.commission_result?.target || 0;
            const rank = data.commission_result?.rank || 0;
            const outcomeText = success 
                ? `Commission Successful: Rolled ${roll} vs target ${target} - Promoted to Rank ${rank}!`
                : `Commission Failed: Rolled ${roll} vs target ${target} - Better luck next time.`;
            updateOutcomeText(outcomeText);
            
            // Update character display and panels
            if (data.character) {
                updateTermPanel(data.character);
                updateEventPanel(data.character);
                
                // Check if commission was successful
                if (data.commission_result && data.commission_result.success) {
                    handleCommissionSuccess();
                    // Update rank display after successful commission
                    updateRankDisplay(data.commission_result.rank || 1);
                }
            }
            
            // No need for state machine - all buttons stay visible
        } else {
            alert(data.error || 'Commission attempt failed.');
        }
    })
    .catch(error => {
        console.error('Error during commission check:', error);
        alert('Error during commission check.');
    });
};

// Middle panel promotion action button
document.getElementById('promotion-action-btn').onclick = async function() {
    fetch('/api/promotion', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Hide the promotion action button after it's clicked
            document.getElementById('promotion-action-btn').style.display = 'none';
            
            // Disable the left panel promotion button
            disableButton('left-promotion-btn');
            
            // Show outcome text
            const success = data.promotion_result?.success || false;
            const roll = data.promotion_result?.roll || 0;
            const target = data.promotion_result?.target || 0;
            const rank = data.promotion_result?.rank || 0;
            const outcomeText = success 
                ? `Promotion Successful: Rolled ${roll} vs target ${target} - Promoted to Rank ${rank}!`
                : `Promotion Failed: Rolled ${roll} vs target ${target} - Remain at current rank.`;
            updateOutcomeText(outcomeText);
            
            // Update character display and panels
            if (data.character) {
                updateTermPanel(data.character);
                updateEventPanel(data.character);
                
                // Update rank display after successful promotion
                if (success && data.promotion_result) {
                    updateRankDisplay(data.promotion_result.rank || 0);
                }
            }
            
            // No state machine - keep all buttons visible
        } else {
            alert(data.error || 'Promotion attempt failed.');
        }
    })
    .catch(error => {
        console.error('Error during promotion check:', error);
        alert('Error during promotion check.');
    });
};

// Left panel skills button
document.getElementById('left-skills-btn').onclick = function() {
    // Show the skills panel
    document.getElementById('skills-panel').style.display = 'block';
    
    // Hide other panels
    document.getElementById('actions-panel').style.display = 'none';
    document.getElementById('event-panel').style.display = 'none';
    document.getElementById('characteristics-panel').style.display = 'none';
    document.getElementById('enlistment-panel').style.display = 'none';
    
    // Get current character to check skill eligibility
    fetch('/api/current_character')
    .then(res => res.json())
    .then(data => {
        if (data.success && data.character) {
            const skillEligibility = data.character.skill_eligibility || 0;
            if (skillEligibility <= 0) {
                alert('No skill eligibility remaining this term.');
                document.getElementById('skills-panel').style.display = 'none';
                return;
            }
            
            // Update skills panel header with remaining eligibility
            updateSkillsHeader(skillEligibility);
            
            // Load available skill tables
            return fetch('/api/available_skill_tables');
        } else {
            throw new Error('Could not get character data');
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.available_tables) {
            // Convert dictionary to array of available table names
            const availableTableNames = Object.keys(data.available_tables)
                .filter(table => data.available_tables[table] === true);
            showAvailableSkillTables(availableTableNames);
        } else {
            alert('Error loading skill tables.');
        }
    })
    .catch(error => {
        console.error('Error loading skills:', error);
        alert('Error loading skills.');
    });
    
    // Gray out skills button
};

// Function to show available skill tables
function showAvailableSkillTables(availableTables) {
    // Hide all skill buttons first
    document.getElementById('personal-skill-btn').style.display = 'none';
    document.getElementById('service-skill-btn').style.display = 'none';
    document.getElementById('advanced-skill-btn').style.display = 'none';
    document.getElementById('education-skill-btn').style.display = 'none';
    
    // Show only available skill table buttons and set up click handlers
    availableTables.forEach(table => {
        const tableId = table.toLowerCase() + '-skill-btn';
        const button = document.getElementById(tableId);
        if (button) {
            button.style.display = 'block';
            
            // Set up click handler to resolve skill from this table
            button.onclick = function() {
                resolveSkillFromTable(table.toLowerCase());
            };
        }
    });
}

// Function to update skills panel header with remaining eligibility
function updateSkillsHeader(remainingEligibility) {
    const skillsHeader = document.querySelector('.skills-header h3');
    if (skillsHeader) {
        skillsHeader.textContent = `Skill Development (${remainingEligibility} remaining)`;
    }
}

// Function to resolve skill from chosen table
function resolveSkillFromTable(tableName) {
    fetch('/api/resolve_skill', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({table_choice: tableName})
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Update character display with new skill
            if (data.character) {
                updateTermPanel(data.character);
                updateEventPanel(data.character);
                
                // Check remaining skill eligibility
                const remainingEligibility = data.character.skill_eligibility || 0;
                
                if (remainingEligibility <= 0) {
                    // No more skills available - hide the skills panel
                    document.getElementById('skills-panel').style.display = 'none';
                } else {
                    // Update header with new count and keep panel open
                    updateSkillsHeader(remainingEligibility);
                }
            }
            
            // Show what skill was gained
            if (data.skill_event && data.skill_event.skill_gained) {
                console.log('Skill gained:', data.skill_event.skill_gained);
            }
        } else {
            alert(data.error || 'Skill resolution failed.');
        }
    })
    .catch(error => {
        console.error('Error resolving skill:', error);
        alert('Error resolving skill.');
    });
}

// Left panel reenlist button
document.getElementById('left-reenlist-btn').onclick = function() {
    // Call reenlistment API with preference to continue
    fetch('/api/reenlist', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({preference: 'reenlist'})
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Update character display
            if (data.character) {
                updateTermPanel(data.character);
                updateEventPanel(data.character);
            }
            
            // Check if new term started or career ended
            if (data.new_term) {
                console.log('New term started!');
                // Update term title to next term number
                const termTitle = document.getElementById('term-number-title');
                if (termTitle && data.term_number) {
                    termTitle.textContent = `TERM ${data.term_number}`;
                }
                // Reset term buttons for new term
                resetTermButtons();
            }
        } else {
            alert(data.error || 'Reenlistment failed.');
        }
    })
    .catch(error => {
        console.error('Error during reenlistment:', error);
        alert('Error during reenlistment.');
    });
    
    // Gray out reenlist button
};

// Leave button - triggers mustering out
document.getElementById('leave-btn').onclick = function() {
    // Call reenlistment API with preference to leave/retire
    fetch('/api/reenlist', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({preference: 'retire'})
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Update character display
            if (data.character) {
                updateTermPanel(data.character);
                updateEventPanel(data.character);
            }
            
            // Career ended - trigger mustering out
            if (data.route === 'mustering_out') {
                console.log('Career ended - ready for mustering out');
                // Could show mustering out interface here
            }
        } else {
            alert(data.error || 'Leave service failed.');
        }
    })
    .catch(error => {
        console.error('Error leaving service:', error);
        alert('Error leaving service.');
    });
    
    // Gray out leave button
    disableButton('leave-btn');
};

// Muster Out button
document.getElementById('mustering-out-btn').onclick = function() {
    // Call mustering out API
    fetch('/api/muster_out', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({cash_rolls: 0}) // Default to 0 for now
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('Character mustered out successfully!');
            if (data.character) {
                updateTermPanel(data.character);
            }
        } else {
            alert(data.error || 'Mustering out failed.');
        }
    })
    .catch(error => {
        console.error('Error during muster out:', error);
        alert('Error during muster out.');
    });
    
    // Gray out muster out button
    disableButton('mustering-out-btn');
};

// Left panel ageing button
document.getElementById('left-ageing-btn').onclick = function() {
    // Show the actions panel
    document.getElementById('actions-panel').style.display = 'block';
    
    // Hide other panels
    document.getElementById('event-panel').style.display = 'none';
    document.getElementById('characteristics-panel').style.display = 'none';
    document.getElementById('enlistment-panel').style.display = 'none';
    document.getElementById('skills-panel').style.display = 'none';
    
    // Create and show ageing action button (since it doesn't exist in HTML yet)
    let ageingBtn = document.getElementById('ageing-action-btn');
    if (!ageingBtn) {
        // Create the ageing action button if it doesn't exist
        const actionsGrid = document.querySelector('.actions-grid');
        ageingBtn = document.createElement('button');
        ageingBtn.className = 'action-btn';
        ageingBtn.id = 'ageing-action-btn';
        ageingBtn.innerHTML = '<div class="action-name">Ageing</div><div class="action-probability" id="ageing-action-prob">Age four years</div>';
        actionsGrid.appendChild(ageingBtn);
        
        // Set up the click handler for the ageing action button
        ageingBtn.onclick = function() {
            fetch('/api/ageing', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Hide the ageing action button after it's clicked
                    document.getElementById('ageing-action-btn').style.display = 'none';
                    
                    // Update character display and panels
                    if (data.character) {
                        updateTermPanel(data.character);
                        updateEventPanel(data.character);
                    }
                } else {
                    alert(data.error || 'Ageing check failed.');
                }
            })
            .catch(error => {
                console.error('Error during ageing check:', error);
                alert('Error during ageing check.');
            });
        };
    }
    
    // Show the ageing action button
    ageingBtn.style.display = 'block';
    
    // Hide other action buttons
    document.getElementById('survival-action-btn').style.display = 'none';
    document.getElementById('commission-action-btn').style.display = 'none';
    document.getElementById('promotion-action-btn').style.display = 'none';
    
    // Gray out ageing button
};
