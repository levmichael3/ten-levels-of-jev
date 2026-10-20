level: 5
title: Intent and Model Routing
type: choice
question: Route this task to the cheapest suitable harness.
options: A. agent (fast), B. agent (reasoning), C. browser agent, D. human, E. script
threshold: ambiguity score > 0.7 routes to browser or human; otherwise cheapest harness
options: A. Agent router, B. Intent router, C. Model router (least costly model that can complete)
