# Development notes

## Round 1 review

The first round uses basic Vue 3 features and does not have a complex framework or a large application structure. The code is still explainable for an interview, but the following parts should be kept in mind for later simplification:

1. `computed`, `ref` and `onMounted` are used together in `src/App.vue`. They are standard Vue features, but they introduce several ideas at once.
2. Search filtering joins the title, summary, category and keyword list before checking the search text. This is useful, but it can be reduced to a simpler search rule if needed.
3. Saved guides use an array plus `localStorage`. The array is simple, but saving and loading browser data adds extra logic.
4. The template uses `v-for`, `v-if`, `v-model`, dynamic classes and event modifiers. These are normal Vue syntax, but each one should be explained clearly during the interview.
5. `src/style.css` uses CSS variables, `clamp()`, grid, flexbox, transitions and media queries. These are visual techniques rather than complex application logic, but the CSS can be made more direct in a later visual round if it becomes difficult to explain.

## Simplification plan

- Keep the data-driven cards because they support the assignment requirement for changing content and are easy to demonstrate.
- Keep the current features working while developing the next rounds.
- When polishing later, simplify one idea at a time rather than rewriting the whole app.
- If a feature is not needed for the current task, prefer a short local implementation before adding another library or abstraction.

## Rubric direction

The project target is a solid Meets Expectations result, with some areas reaching medium or medium-high quality when this can be done with simple code. We do not need to chase every Exceeds Expectations description.

- **A.1 Development stack and coding:** Keep using Vue 3 with clear files and readable functions. Do not add advanced libraries only to make the implementation look more sophisticated.
- **A.2 Responsiveness:** Check the layout on small and large screens and fix obvious layout problems with simple CSS media queries.
- **B.1 Validations:** Add clear validation feedback where the assignment needs user input. The current search handles an empty search and an unavailable result; later we should check whether the task requires another validation type.
- **B.2 Dynamic data and data structure:** The current JavaScript data file and Vue loops already demonstrate internal dynamic data. Fetching from an external API or adding a more complex data layer is not needed unless the assignment specifically requires it.

If a higher-grade criterion would require a complex feature, extra library, backend behaviour or a major change in structure, discuss it before implementation.
