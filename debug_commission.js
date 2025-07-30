// Commission Button Debug Script
// Run this in browser console to debug commission button issues

console.log('=== COMMISSION BUTTON DEBUG ===');

// Check if we're in a character session
console.log('1. Character State Check:');
console.log('currentCharacter exists:', typeof currentCharacter !== 'undefined' && currentCharacter !== null);
if (typeof currentCharacter !== 'undefined' && currentCharacter) {
    console.log('Character name:', currentCharacter.name);
    console.log('Terms served:', currentCharacter.terms_served);
    console.log('Career:', currentCharacter.career);
    console.log('Ready for commission:', currentCharacter.rdy_for_commission_check);
    console.log('Already commissioned:', currentCharacter.commissioned);
    console.log('Rank:', currentCharacter.rank);
} else {
    console.log('No current character - fetching from backend...');
    fetch('/api/current_character')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log('Backend character found:', data.character.name);
                console.log('Terms served:', data.character.terms_served);
                console.log('Ready for commission:', data.character.rdy_for_commission_check);
            } else {
                console.log('No character in backend either');
            }
        });
}

// Check DOM elements
console.log('\n2. DOM Elements Check:');
const actionsPanel = document.getElementById('actions-panel');
const commissionBtn = document.getElementById('commission-action-btn');
const leftCommissionBtn = document.getElementById('left-commission-btn');

console.log('Actions panel exists:', actionsPanel !== null);
console.log('Actions panel visible:', actionsPanel ? (actionsPanel.style.display !== 'none' && actionsPanel.offsetWidth > 0) : false);
console.log('Commission action button exists:', commissionBtn !== null);
console.log('Commission action button visible:', commissionBtn ? (commissionBtn.style.display !== 'none' && commissionBtn.offsetWidth > 0) : false);
console.log('Left commission button exists:', leftCommissionBtn !== null);
console.log('Left commission button visible:', leftCommissionBtn ? (leftCommissionBtn.style.display !== 'none' && leftCommissionBtn.offsetWidth > 0) : false);

// Check click handlers
console.log('\n3. Click Handlers Check:');
if (commissionBtn) {
    console.log('Commission button has click handler:', typeof commissionBtn.onclick === 'function');
    console.log('Commission button disabled:', commissionBtn.disabled);
    console.log('Commission button pointer events:', commissionBtn.style.pointerEvents);
}

// Test showCommissionButton function
console.log('\n4. Function Test:');
if (typeof showCommissionButton === 'function') {
    console.log('showCommissionButton function exists - testing...');
    showCommissionButton();
} else {
    console.log('showCommissionButton function not found!');
}

// Test commission API call
console.log('\n5. API Test:');
fetch('/api/action_probability', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({action_type: 'commission'})
})
.then(res => res.json())
.then(data => {
    console.log('Commission probability API result:', data);
})
.catch(err => {
    console.log('Commission API error:', err);
});

console.log('=== DEBUG COMPLETE ===');