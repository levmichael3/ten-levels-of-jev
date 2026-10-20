level: 6
title: Guardrail Hooks
type: noul
question: Should this tool command run, or does it mean to destroy something?
true: Block the command (irreversible or destructive intent > 0.7)
false: Allow the command
threshold: irreversible 0.86 blocks; destructive intent 0.99 blocks; middle asks human
options: A. Bash gate (irreversible/destructive/reversible), B. Write gate (credential check), C. Result screen (injected instructions)
