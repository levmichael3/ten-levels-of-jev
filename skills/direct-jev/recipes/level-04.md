level: 4
title: Confidence Gating
type: noul
question: Should this action run automatically, or does a human need to decide?
true: Auto-execute (confidence > 0.9 bar)
false: Human decides (confidence < 0.5 floor); between 0.5–0.9 asks for confirmation
threshold: bar 0.9 = auto, floor 0.5 = human, middle = ask
options: A. Bash tool gate, B. Account actions, C. Citation check
