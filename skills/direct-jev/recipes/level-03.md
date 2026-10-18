level: 3
title: Composite Scoring
type: score
question: Score this infrastructure change on severity, frustration, and report quality.
weights: { severity: 0.6, frustration: 0.3, report_quality: 0.1 }
threshold: combined score > 0.5 triggers auto-route; 0.5–0.8 needs review; > 0.8 auto-execute
options: A. Ticket priority, B. Code review risk, C. Idea verdict (kill / fix / ship)
