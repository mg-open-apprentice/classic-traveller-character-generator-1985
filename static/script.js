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
            
            // Initialize character name display (no rank initially)
            await updateCharacterNameWithRank(data.name);

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
            // Hide the button
            document.getElementById(btnId).style.display = 'none';
            remainingCharButtons--;
            // Only update the UPP string when the last characteristic is rolled
            if (data.upp) {
                document.getElementById('upp-string').textContent = data.upp;
            }
            // If this was the last button, hide the whole section
            if (remainingCharButtons === 0) {
                document.getElementById('characteristics-section').style.display = 'none';
                // Fetch available skill tables and show/hide skill buttons accordingly
                fetch('/api/available_skill_tables')
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && data.available_tables) {
                            const available = data.available_tables;
                            document.getElementById('personal-btn').style.display = available.personal ? 'inline-block' : 'none';
                            document.getElementById('service-btn').style.display = available.service ? 'inline-block' : 'none';
                            document.getElementById('advanced-btn').style.display = available.advanced ? 'inline-block' : 'none';
                            document.getElementById('education-skill-btn').style.display = available.education ? 'inline-block' : 'none';
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
                const service = data.enlistment_result.assigned_service || data.career || '';
                const outcome = data.enlistment_result.outcome || '';
                const capitalizedOutcome = outcome.charAt(0).toUpperCase() + outcome.slice(1);
                document.getElementById('char-service').textContent = `${service} ${capitalizedOutcome}`;
                
                const name = document.getElementById('char-name').textContent;
                await updateRankDisplay(0);
                
                // Populate the event-record middle panel
                const result = data.enlistment_result;
                const eventSections = document.querySelectorAll('.event-record .event-section');
                if (eventSections.length >= 6) {
                    eventSections[0].querySelector('.event-label').textContent = 'Conditions: ' + (result.modifier_details && result.modifier_details.length ? result.modifier_details.join(', ') : 'None');
                    eventSections[1].querySelector('.event-label').textContent = 'Test: Enlistment';
                    eventSections[2].querySelector('.event-label').textContent = 'Target: ' + (result.target !== undefined ? result.target : '');
                    eventSections[3].querySelector('.event-label').textContent = 'Roll: ' + (result.roll !== undefined ? result.roll : '');
                    eventSections[4].querySelector('.event-label').textContent = 'Modifiers: ' + (result.modifier !== undefined ? result.modifier : '');
                    eventSections[5].querySelector('.event-label').textContent = 'Outcome: ' + (result.outcome || '');
                }

                // Update commission and promotion button visibility
                if (typeof data.show_commission !== 'undefined') {
                    document.getElementById('commission-btn').style.display = data.show_commission ? 'inline-block' : 'none';
                }
                if (typeof data.show_promotion !== 'undefined') {
                    document.getElementById('promotion-btn').style.display = data.show_promotion ? 'inline-block' : 'none';
                }
                
                // ADD: Update term panel with latest character data
                if (data.character) {
                    updateTermPanel(data.character);
                }
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

async function updateRankDisplay(rank) {
    const rankTitle = await getRankTitle();
    document.getElementById('char-rank-number').textContent = (rank && rank > 0) ? `Rank: ${rank}` : '';
    
    // Also update character name with rank title
    const charNameElement = document.getElementById('char-name');
    const currentName = charNameElement.textContent;
    // Extract just the character name (assume it's the last two words: FirstName LastName)
    const nameParts = currentName.trim().split(/\s+/);
    const baseName = nameParts.slice(-2).join(' '); // Get last two words
    await updateCharacterNameWithRank(baseName);
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

// Add survival button handler
document.getElementById('survival-btn').onclick = function() {
    fetch('/api/survival', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Hide the survival button
            document.getElementById('survival-btn').style.display = 'none';
            
            // Display survival outcome in event record panel
            const result = data.survival_result;
            const eventSections = document.querySelectorAll('.event-record .event-section');
            if (eventSections.length >= 6) {
                eventSections[0].querySelector('.event-label').textContent = 'Conditions: ' + (result.modifier_details && result.modifier_details.length ? result.modifier_details.join(', ') : 'None');
                eventSections[1].querySelector('.event-label').textContent = 'Test: Survival';
                eventSections[2].querySelector('.event-label').textContent = 'Target: ' + (result.target !== undefined ? result.target : '');
                eventSections[3].querySelector('.event-label').textContent = 'Roll: ' + (result.roll !== undefined ? result.roll : '');
                eventSections[4].querySelector('.event-label').textContent = 'Modifiers: ' + (result.modifier !== undefined ? result.modifier : '');
                eventSections[5].querySelector('.event-label').textContent = 'Outcome: ' + (result.outcome || '');
            }
            
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
                document.getElementById('personal-btn').style.display = available.personal ? 'inline-block' : 'none';
                document.getElementById('service-btn').style.display = available.service ? 'inline-block' : 'none';
                document.getElementById('advanced-btn').style.display = available.advanced ? 'inline-block' : 'none';
                document.getElementById('education-skill-btn').style.display = available.education ? 'inline-block' : 'none';
                            
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

            // Hide commission and promotion buttons if needed
            if (typeof data.show_commission !== 'undefined') {
                document.getElementById('commission-btn').style.display = data.show_commission ? 'inline-block' : 'none';
            }
            if (typeof data.show_promotion !== 'undefined') {
                document.getElementById('promotion-btn').style.display = data.show_promotion ? 'inline-block' : 'none';
            }

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
}; 

// Add commission button handler
document.getElementById('commission-btn').onclick = function() {
    console.log("Commission button clicked"); // Debug log
    fetch('/api/commission', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    .then(data => {
        // Hide the commission button permanently
        document.getElementById('commission-btn').style.display = 'none';

        if (data.success && data.commission_result) {
            const result = data.commission_result;

            // Display commission outcome in event record panel
            const eventSections = document.querySelectorAll('.event-record .event-section');
            if (eventSections.length >= 6) {
                eventSections[0].querySelector('.event-label').textContent = 'Conditions: ' + (result.modifier_details && result.modifier_details.length ? result.modifier_details.join(', ') : 'None');
                eventSections[1].querySelector('.event-label').textContent = 'Test: Commission';
                eventSections[2].querySelector('.event-label').textContent = 'Target: ' + (result.target !== undefined ? result.target : '');
                eventSections[3].querySelector('.event-label').textContent = 'Roll: ' + (result.roll !== undefined ? result.roll : '');
                eventSections[4].querySelector('.event-label').textContent = 'Modifiers: ' + (result.modifier !== undefined ? result.modifier : '');
                eventSections[5].querySelector('.event-label').textContent = 'Outcome: ' + (result.outcome || '');
            }

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
                // Show promotion button
                document.getElementById('promotion-btn').style.display = 'inline-block';
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
            
            // Ensure promotion button visibility matches backend after commission attempt
            if (typeof data.show_promotion !== 'undefined') {
                document.getElementById('promotion-btn').style.display = data.show_promotion ? 'inline-block' : 'none';
            }
        } else {
            alert(data.error || "Commission check failed.");
        }
    });
};

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

document.getElementById('promotion-btn').onclick = function() {
    console.log("Promotion button clicked"); // Debug log
    fetch('/api/promotion', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    .then(data => {
        // Hide the promotion button
        document.getElementById('promotion-btn').style.display = 'none';

        if (data.success && data.promotion_result) {
            const result = data.promotion_result;

            // Display promotion outcome in event record panel
            const eventSections = document.querySelectorAll('.event-record .event-section');
            if (eventSections.length >= 6) {
                eventSections[0].querySelector('.event-label').textContent = 'Conditions: ' + (result.modifier_details && result.modifier_details.length ? result.modifier_details.join(', ') : 'None');
                eventSections[1].querySelector('.event-label').textContent = 'Test: Promotion';
                eventSections[2].querySelector('.event-label').textContent = 'Target: ' + (result.target !== undefined ? result.target : '');
                eventSections[3].querySelector('.event-label').textContent = 'Roll: ' + (result.roll !== undefined ? result.roll : '');
                eventSections[4].querySelector('.event-label').textContent = 'Modifiers: ' + (result.modifier !== undefined ? result.modifier : '');
                eventSections[5].querySelector('.event-label').textContent = 'Outcome: ' + (result.outcome || '');
            }

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
}; 

function setupSkillButton(btnId, tableChoice) {
    document.getElementById(btnId).onclick = function() {
        fetch('/api/resolve_skill', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({table_choice: tableChoice})
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.skill_event) {
                // Display skill gain in event record panel
                const eventSections = document.querySelectorAll('.event-record .event-section');
                if (eventSections.length >= 6) {
                    eventSections[0].querySelector('.event-label').textContent = 'Skill Table: ' + (data.skill_event.table_choice || '');
                    eventSections[1].querySelector('.event-label').textContent = 'Test: Skill';
                    eventSections[2].querySelector('.event-label').textContent = 'Roll: ' + (data.skill_event.roll !== undefined ? data.skill_event.roll : '');
                    eventSections[3].querySelector('.event-label').textContent = 'Skill: ' + (data.skill_event.skill_gained || '');
                    eventSections[4].querySelector('.event-label').textContent = 'Type: ' + (data.skill_event.result_type || '');
                    eventSections[5].querySelector('.event-label').textContent = 'Eligibilities Left: ' + (data.skill_eligibility !== undefined ? data.skill_eligibility : '');
                }
                // Update skill eligibility counter
                if (data.skill_eligibility !== undefined) {
                    document.getElementById('top-skill-eligibility').textContent = data.skill_eligibility;
                }
                // Show/hide skill buttons based on backend available_tables
                if (data.skill_event.available_tables) {
                    const available = data.skill_event.available_tables;
                    document.getElementById('personal-btn').style.display = available.personal ? 'inline-block' : 'none';
                    document.getElementById('service-btn').style.display = available.service ? 'inline-block' : 'none';
                    document.getElementById('advanced-btn').style.display = available.advanced ? 'inline-block' : 'none';
                    document.getElementById('education-skill-btn').style.display = available.education ? 'inline-block' : 'none';
                }
                // Hide skills section if no more eligibilities
                if (!data.ready_for_skills) {
                    const skillsSection = getSkillsSection();
                    if (skillsSection) skillsSection.style.display = 'none';
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

setupSkillButton('personal-btn', 'personal');
setupSkillButton('service-btn', 'service');
setupSkillButton('advanced-btn', 'advanced');
setupSkillButton('education-skill-btn', 'education'); 

function updateReenlistmentButtons(character, availableOptions) {
    const reenlistBtn = document.getElementById('reenlist-btn');
    const leaveRetireBtn = document.getElementById('leave-retire-btn');
    const ageingBtn = document.getElementById('ageing-btn');
    let medicalBtn = document.getElementById('medical-btn');

    // Hide all by default
    reenlistBtn.style.display = 'none';
    leaveRetireBtn.style.display = 'none';
    if (medicalBtn) medicalBtn.style.display = 'none';
    if (ageingBtn) ageingBtn.style.display = 'none';

    // If character is ready for ageing, only show the Ageing button
    if (character.ready_for_ageing) {
        if (ageingBtn) ageingBtn.style.display = 'inline-block';
        return; // Don't show reenlist/leave until ageing is done
    }

    // ADD: If character is ready for reenlistment, show reenlistment options
    if (character.ready_for_reenlistment) {
        reenlistBtn.style.display = 'inline-block';
        leaveRetireBtn.textContent = 'Leave';
        leaveRetireBtn.style.display = 'inline-block';
        return;
    }

    // Fallback to availableOptions logic for other cases
    if (!availableOptions) {
        return;
    }

    if (availableOptions.includes('reenlist')) {
        reenlistBtn.style.display = 'inline-block';
    }
    // Only show 'Retire' if availableOptions includes 'retire', otherwise show 'Leave'
    if (availableOptions.includes('retire')) {
        leaveRetireBtn.textContent = 'Retire';
        leaveRetireBtn.style.display = 'inline-block';
    } else if (availableOptions.includes('leave')) {
        leaveRetireBtn.textContent = 'Leave';
        leaveRetireBtn.style.display = 'inline-block';
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
        medicalBtn.style.display = 'inline-block';
    }
}

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
                
                // Reset UI workflow - show survival button, hide others
                document.getElementById('survival-btn').style.display = 'inline-block';
                document.getElementById('commission-btn').style.display = 'none';
                document.getElementById('promotion-btn').style.display = 'none';
                const skillsSection = getSkillsSection();
                if (skillsSection) skillsSection.style.display = 'none'; // Hide skills section
                
                // Hide reenlistment buttons since we're starting a new term
                document.getElementById('reenlist-btn').style.display = 'none';
                document.getElementById('leave-retire-btn').style.display = 'none';
                let medicalBtn = document.getElementById('medical-btn');
                if (medicalBtn) medicalBtn.style.display = 'none';
                

            }
            
            if (data.character && data.available_options) updateReenlistmentButtons(data.character, data.available_options);
            // Hide reenlist and leave/retire buttons after outcome
            document.getElementById('reenlist-btn').style.display = 'none';
            document.getElementById('leave-retire-btn').style.display = 'none';
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

document.getElementById('leave-retire-btn').onclick = function() {
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
                
                // Reset UI workflow - show survival button, hide others
                document.getElementById('survival-btn').style.display = 'inline-block';
                document.getElementById('commission-btn').style.display = 'none';
                document.getElementById('promotion-btn').style.display = 'none';
                const skillsSection = getSkillsSection();
                if (skillsSection) skillsSection.style.display = 'none'; // Hide skills section
                
                // Hide reenlistment buttons since we're starting a new term
                document.getElementById('reenlist-btn').style.display = 'none';
                document.getElementById('leave-retire-btn').style.display = 'none';
                let medicalBtn = document.getElementById('medical-btn');
                if (medicalBtn) medicalBtn.style.display = 'none';
                

            }
            
            if (data.character && data.available_options) updateReenlistmentButtons(data.character, data.available_options);
            // Hide reenlist and leave/retire buttons after outcome
            document.getElementById('reenlist-btn').style.display = 'none';
            document.getElementById('leave-retire-btn').style.display = 'none';
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
    
    // Always update terms served in the UI
    if (character.terms_served !== undefined) {
        document.getElementById('char-terms').textContent = 'Terms: ' + character.terms_served;
    }

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
    
    // Format skills for display
    const skillList = Object.entries(skillCounts).map(([skill, count]) => {
        return count > 1 ? `${skill}-${count}` : skill;
    });
    
    const skillsDisplay = document.getElementById('skills-display');
    if (skillsDisplay) {
        if (skillList.length > 0) {
            skillsDisplay.textContent = skillList.join(', ');
        } else {
            skillsDisplay.textContent = 'None';
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
    const personalBtn = document.getElementById('personal-btn');
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



// Add this ageing button handler
document.getElementById('ageing-btn').onclick = function() {
    fetch('/api/ageing', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Hide the ageing button
            document.getElementById('ageing-btn').style.display = 'none';
            
            // CRITICAL: After ageing completes, check for reenlistment options
            console.log('[DEBUG] Ageing completed, checking for reenlistment options...');
            console.log('[DEBUG] available_options:', data.available_options);
            
            // Update reenlistment buttons with available options
            if (data.available_options && data.available_options.length > 0) {
                updateReenlistmentButtons(data.character, data.available_options);
            }
            
            // Update character display
            if (data.character) {
                updateTermPanel(data.character);
                updateEventPanel(data.character);
            }
        } else {
            alert(data.error || 'Ageing check failed.');
        }
    });
};
