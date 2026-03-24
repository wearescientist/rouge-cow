# Hidden room layout pass 2026-03-19

## Scope
- Removed ambient/secret worms from hidden rooms except floor2 puzzle worms.
- Reduced hidden room light pool sizes and shrank crystal ball visual size.
- Added squashed stone pedestal under the crystal ball.
- Reworked floor1 spacing and board footprint.
- Reworked floor2 worm spread and restored rabbit demo chain.
- Reworked floor3 random mushroom scatter and looping preview cadence.
- Reworked floor4 to use set1_mush_01 / set5_mush_02 / set5_mush_16 with wider random layout.
- Swapped floor5 blockers to dec_statue.
- Tuned floor6 legacy layout.
- Added runtime layout tool API on window.HiddenRoomLayoutTool.

## Layout tool API
- `HiddenRoomLayoutTool.listLayoutTargets()`
- `HiddenRoomLayoutTool.moveLayoutTarget('orb', 8, 0)`
- `HiddenRoomLayoutTool.captureCurrentLayout()`
- `HiddenRoomLayoutTool.resetFloorLayout(1)`
- `HiddenRoomLayoutTool.clearLayoutOverrides()`
