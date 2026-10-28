# Outcome diagrams

Use focused, high-level Mermaid diagrams to help a reviewer see what a plan
slice or task will produce and what is new or changing. Choose coverage by
distinct outcomes, not by the number of work items: the visual should reduce
reading effort, not become another source of clutter.

**Choose coverage.** Give each slice or task a diagram when it introduces a
distinct interaction, structure, state change, or result worth visualising.
Use one shared diagram when several small items contribute to the same
outcome. Mix shared diagrams with individual ones where only some items need
a closer view. Omit a diagram when it adds nothing beyond an already-clear
sentence. For a flat milestone plan, apply the same judgment to milestone
groups. Decide from the change itself, not just its line count.

**Show the outcome.** Choose whichever Mermaid type makes the result easiest
to understand. Show the behaviour or structure after the item is complete,
with only the surrounding context needed to understand it. Use a before/after
comparison only when it clarifies the change. Label relevant elements or
relationships `new`, `changed`, or `existing` in text, rather than relying on
colour alone. Keep labels short and use the document's names. Show the
result, not the author's work sequence or test-and-implementation steps.

**Place it early.** Put an individual diagram after the item's delivered
outcome, before signatures, tests, or implementation detail. Put a shared
diagram after the Summary when it covers the whole document, or before the
first item it covers. Caption each diagram with the slice, task, or milestone
IDs it covers. Add another diagram only when it explains a distinct outcome,
not the same picture at another level of detail.

**Keep the contract in text.** Diagrams are review aids, not extra requirements
or a replacement for milestones, exact interfaces, tests, or verification.
Keep each item's written contract self-contained even when its diagram is
shared. Ground every diagram in the source and verified code; distinguish
existing behaviour from planned additions without inventing design details.

**Check the visual.** Use the conventions-mermaid skill to render and inspect
each diagram. Check that the result and the changed parts are clear at a
glance, the text is legible, and the diagram matches the written outcome.

**Example.** Ten small call-site migrations to one replacement API usually
need one shared diagram of the resulting interaction, not ten near-identical
pictures. A task introducing a separate retry lifecycle may need its own
state diagram, even if its code change is small.
