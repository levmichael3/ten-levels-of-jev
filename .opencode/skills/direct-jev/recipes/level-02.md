level: 2
title: Multiple Choice
type: choice
question: Classify this ticket into one category and one priority level.
options: A. bug_report / normal, B. bug_report / high, C. feature_request / low, D. question / medium
threshold: confidence > 0.6 to accept the pick; otherwise flag for human review
fan_out: ask every question you might need in one call; code decides which answers to use
