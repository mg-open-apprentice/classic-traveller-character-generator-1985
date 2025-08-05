# Development Setup

## Quick Start

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the application
python app.py

# Test that it works
python test_character_careers.py
```

## Project Structure

```
├── app.py                          # Flask server
├── character_generation_rules.py   # Game logic
├── character_generation_tables.py  # Game data
├── static/
│   ├── script.js                   # Frontend code
│   └── style.css                   # Styling
├── templates/
│   └── index.html                  # Main UI
├── characters/                     # Generated character saves
└── test_character_careers.py       # Functional tests
```

## Development Workflow

1. **Make changes** to backend (`*.py`) or frontend (`static/*`)
2. **Test functionality** - Run `python test_character_careers.py`
3. **Manual check** - Run the app and try creating a character
4. **That's it** - No complex build process or deployment steps

## Key Development Principles

- **Backend has all game logic** - Never add rule calculations to JavaScript
- **Frontend just displays** - Show what backend tells it to show
- **Keep it simple** - This is an experimental project

## Common Tasks

### Adding New Features
1. Implement game logic in `character_generation_rules.py`
2. Add any new data to `character_generation_tables.py`  
3. Create API endpoint in `app.py`
4. Update frontend to call new endpoint
5. Test with `python test_character_careers.py`

### Debugging Issues
- Check browser console for JavaScript errors
- Look at Flask console for Python errors
- Verify API responses in browser dev tools

### Making UI Changes
- Edit `templates/index.html` for structure
- Edit `static/style.css` for appearance
- Edit `static/script.js` for behavior (but no game logic!)

## Dependencies

**Python**: Flask 3.1.0+ (see `requirements.txt`)
**Frontend**: Vanilla JavaScript, no frameworks
**No build tools**: Just edit and refresh

## Notes

This is an experimental Classic Traveller character generator. The focus is on getting the game rules right, not on sophisticated development practices.