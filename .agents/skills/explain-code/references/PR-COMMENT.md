# PR Clarification Comment

Read this before drafting a comment.

1. **Draft** once the user accepts, using
   [voice-integralist](../../voice-integralist/SKILL.md): a brief, airy,
   first-person understanding check from a reader of the PR, not its author.
   Keep Problem and Solution, useful Notes, caveats, evidence as
   GitHub-resolvable links, and the diagram if it still helps. Begin with
   `👋 Just checking I've understood this PR properly (likely I've got bits wrong).`,
   phrase uncertain motivation as a question, and end with one question
   inviting correction, such as "Is that the right reading, or have I missed
   why this is needed?" It asks for clarification, not approval or changes.
   Done when the draft is written.
2. **Show** the full draft in a four-backtick Markdown block with the PR URL
   outside it, ask whether to post exactly this to that PR, and wait. After
   any edit, show the new draft and ask again: approval covers only the
   latest text and destination shown. Done when the user explicitly approves.
3. **Post** exactly the approved body as a comment, not a review, with
   `gh pr comment <PR URL> --body-file -` or the host's equivalent, and
   report the comment URL. If posting fails or the result is unclear, say so
   and check for an existing comment before retrying, so the author gets no
   duplicate. Done when the comment URL is reported.
