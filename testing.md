# Testing

## Functional Testing Only

This is an experimental project. Testing focuses on verifying the system works, not comprehensive test coverage.

## Primary Test

### test_character_careers.py

**What it does**: Runs all 6 career paths through 7 complete terms with rigged dice (always roll 11).

**Why it's useful**: Validates the entire character generation system works without crashes.

**How to run**:
```bash
python test_character_careers.py
```

**What success looks like**: All 12 test scenarios complete (6 services × 2 education levels).

## Manual Testing

**Run the app**:
```bash
python app.py
```

**Basic checks**:
- Create a character
- Go through a few career terms
- Verify buttons work as expected
- Check that the system doesn't crash

## That's It

For this experimental stage, if `test_character_careers.py` passes and manual testing works, the system is functional enough to continue development.