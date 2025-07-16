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
                updateRankDisplay(data.character.rank, getRankTitle(career, data.character.rank));
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
                updateRankDisplay(data.character.rank, getRankTitle(career, data.character.rank));
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
                updateRankDisplay(data.character.rank, getRankTitle(career, data.character.rank));
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
                
                // Show reenlistment options if ageing was completed
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
                    updateRankDisplay(data.character.rank, getRankTitle(career, data.character.rank));
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
    let medicalBtn = document.getElementById('medical-btn');

    // Hide all by default
    reenlistBtn.style.display = 'none';
    leaveRetireBtn.style.display = 'none';
    if (medicalBtn) medicalBtn.style.display = 'none';

    if (!availableOptions) return;

    if (availableOptions.includes('reenlist')) {
        reenlistBtn.style.display = 'inline-block';
    }
    if (availableOptions.includes('leave')) {
        leaveRetireBtn.textContent = 'Leave';
        leaveRetireBtn.style.display = 'inline-block';
    }
    if (availableOptions.includes('retire')) {
        leaveRetireBtn.textContent = 'Retire';
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
                
                // Update success message to indicate new term (no popup)
                console.log(`Successfully reenlisted! Beginning term ${data.term_number}.`);
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
                
                // Update success message to indicate new term
                console.log(`Successfully reenlisted! Beginning term ${data.term_number}.`);
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
    // Implementation depends on your HTML structure
    console.log('Updating term panel for character:', character);
    
    // Update skills display in top panel
    updateSkillsDisplay(character);
    
    // Update term outcomes in bottom panel
    updateTermOutcomes(character);
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

function updateTermOutcomes(character) {
    // Get the current term number
    const currentTerm = character.terms_served || 0;
    
    // Find events for the current term
    const termEvents = {
        survival: null,
        commission: null,
        promotion: null,
        skills: [],
        ageing: null,
        reenlistment: null
    };
    
    if (character.career_history) {
        character.career_history.forEach(event => {
            // Determine which term this event belongs to
            // This is a simplified approach - you might need to refine this logic
            if (event.event_type === 'survival_check') {
                termEvents.survival = event;
            } else if (event.event_type === 'commission_check') {
                termEvents.commission = event;
            } else if (event.event_type === 'promotion_check') {
                termEvents.promotion = event;
            } else if (event.event_type === 'skill_resolution' && event.result_type === 'skill_gain') {
                termEvents.skills.push(event);
            } else if (event.event_type === 'ageing_check') {
                termEvents.ageing = event;
            } else if (event.event_type === 'reenlistment_attempt') {
                termEvents.reenlistment = event;
            }
        });
    }
    
    // Update the term outcomes in the bottom panel
    updateTermItem('Survival', termEvents.survival);
    updateTermItem('Commission', termEvents.commission);
    updateTermItem('Promotion', termEvents.promotion);
    updateTermItem('Skills', termEvents.skills);
    updateTermItem('Ageing', termEvents.ageing);
    updateTermItem('Reenlistment', termEvents.reenlistment);
}

function updateTermItem(actionName, event) {
    const termItems = document.querySelectorAll('.term-item');
    let targetItem = null;
    
    // Find the matching term item
    termItems.forEach(item => {
        const actionSpan = item.querySelector('.term-action');
        if (actionSpan && actionSpan.textContent === actionName) {
            targetItem = item;
        }
    });
    
    if (targetItem) {
        const outcomeSpan = targetItem.querySelector('.term-outcome');
        if (outcomeSpan) {
            if (Array.isArray(event)) {
                // Handle skills array
                if (event.length > 0) {
                    const skillNames = event.map(e => e.skill_gained).filter(s => s);
                    outcomeSpan.textContent = skillNames.join(', ');
                } else {
                    outcomeSpan.textContent = 'None';
                }
            } else if (event) {
                // Handle single events
                if (event.outcome) {
                    outcomeSpan.textContent = event.outcome;
                } else if (event.status_text) {
                    outcomeSpan.textContent = event.status_text;
                } else {
                    outcomeSpan.textContent = 'Completed';
                }
            } else {
                outcomeSpan.textContent = '<outcome>';
            }
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
        console.log('Confirm Mustering Out pressed. Cash rolls:', cashRolls);
        // TODO: Call backend endpoint for mustering out with cashRolls
    };

    // Add elements to the mustering section
    musteringSection.appendChild(label);
    musteringSection.appendChild(select);
    musteringSection.appendChild(confirmBtn);
};
