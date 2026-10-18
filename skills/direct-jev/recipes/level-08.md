level: 8
title: Cheap Reads
type: noul
question: Does this file hold the feature the agent needs — without sending the file into context?
true: Agent gets typed answer (yes/no); file never enters agent context
false: Agent must read the file itself
threshold: yes > 0.8 means the file's question can be answered without reading it
options: A. ask_jev_file_bool (one file, one yes/no), B. ask_jev_file_choice (one file, pick from options), C. ask_jev_file_score (one file, one scale the agent writes)
