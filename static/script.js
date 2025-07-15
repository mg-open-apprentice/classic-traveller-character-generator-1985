// Remove mock character data and mock functions

// Helper to update the UPP string in the UI
function updateUPPSlot(index, hexChar) {
    let upp = document.getElementById('upp-string').textContent.split('');
    upp[index] = hexChar;
    document.getElementById('upp-string').textContent = upp.join('');
}

// Track how many characteristic buttons remain
let remainingCharButtons = 6;

document.getElementById('create-character-btn').onclick = function() {
    fetch('/api/create_character', {method: 'POST'})
        .then(res => res.json())
        .then(data => {
            // Display the generated name as the third item in the top line
            document.getElementById('char-name').textContent = data.name;
            document.getElementById('char-age').textContent = 'Age: ' + data.age;
            document.getElementById('char-terms').textContent = 'Terms: ' + data.terms_served;
            document.getElementById('upp-string').textContent = data.upp || '______';
            document.getElementById('char-service').textContent = 'Service';

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
                            document.querySelector('.section:has(#personal-btn)').style.display = anyAvailable ? 'block' : 'none';
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
    document.getElementById(btnId).onclick = function() {
        fetch('/api/enlist', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({service: serviceName})
        })
        .then(res => res.json())
        .then(data => {
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
                updateRankDisplay(0, '');
                
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
            } else {
                alert(data.error || "Enlistment failed.");
            }
        });
    };
}

setupEnlistmentButton('navy-btn', 'Navy');
setupEnlistmentButton('marines-btn', 'Marines');
setupEnlistmentButton('army-btn', 'Army');
setupEnlistmentButton('scouts-btn', 'Scouts');
setupEnlistmentButton('merchants-btn', 'Merchants');
setupEnlistmentButton('others-btn', 'Others');

function updateRankDisplay(rank, rankTitle) {
    document.getElementById('char-rank').textContent = rankTitle ? rankTitle : '';
    document.getElementById('char-rank-number').textContent = (rank && rank > 0) ? `Rank: ${rank}` : '';
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
            
            // Show/hide skill buttons based on backend available_tables
            if (data.ready_for_skills && data.survival_result && data.survival_result.available_tables) {
                const available = data.survival_result.available_tables;
                document.getElementById('personal-btn').style.display = available.personal ? 'inline-block' : 'none';
                document.getElementById('service-btn').style.display = available.service ? 'inline-block' : 'none';
                document.getElementById('advanced-btn').style.display = available.advanced ? 'inline-block' : 'none';
                document.getElementById('education-skill-btn').style.display = available.education ? 'inline-block' : 'none';
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
                updateRankDisplay(result.rank, getRankTitle(result.career, result.rank));
                // Show promotion button
                document.getElementById('promotion-btn').style.display = 'inline-block';
            }

            // Update skill eligibility counter if present
            if (data.skill_eligibility !== undefined) {
                document.getElementById('top-skill-eligibility').textContent = data.skill_eligibility;
            }
        } else {
            alert(data.error || "Commission check failed.");
        }
    });
};

// Helper to get rank title (you may want to adjust this mapping)
function getRankTitle(career, rank) {
    // Example mapping for Navy, expand as needed
    const navyRanks = ["", "Ensign", "Lieutenant", "Lt Cmdr", "Commander", "Captain", "Admiral"];
    if (career === "Navy" && rank >= 1 && rank < navyRanks.length) {
        return navyRanks[rank];
    }
    // Add mappings for other careers as needed
    return "";
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
                updateRankDisplay(result.rank, getRankTitle(result.career, result.rank));
            }

            // Update skill eligibility counter if present
            if (data.skill_eligibility !== undefined) {
                document.getElementById('top-skill-eligibility').textContent = data.skill_eligibility;
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
                    document.querySelector('.section:has(#personal-btn)').style.display = 'none';
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