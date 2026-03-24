v0.35.11 Hidden Room Logic Fix Pass

1. Hidden room key focus lights are pinned and no longer dynamically culled, fixing floor 1 flicker.
2. Floor 2 red worms use body glow + soft ground glow; the ugly circular pool glow was removed.
3. Floor 3/4/5 mushroom and node light state logic restored:
   - Floor 3: sequence flashes, correct inputs stay lit, wrong input resets to dark and replays sequence.
   - Floor 4: starts dark, only correct interactions light up.
   - Floor 5: targets are dim at start, become steady once pushed into place.
4. Floor 6 legacy room: bread/bag captions faster, money bag reward 500 gold.
5. Dialogue controls updated: Space/Enter reveal current line, Escape skips the whole blind dialogue. Legacy captions: Space reveals, Escape closes.
