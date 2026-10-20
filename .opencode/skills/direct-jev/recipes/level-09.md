level: 9
title: Files at Scale
type: noul
question: Are any of these files relevant to the question, without reading any of them?
true: Code picks the first relevant file (pick_first_file); agent opens only that one file
false: No files relevant
threshold: pick_first_file selects path with highest noul; cap at 255 files after code prunes node_modules/.git/binaries
options: A. Several paths, one block, one question each, answers per path, B. A glob over a directory (expand and prune in code, 255 cap), C. Recursive, then pick first: judge the whole repo, then open only the file that matters
