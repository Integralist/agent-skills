# GLOSSARY.md Format

## Structure

````md
# {Project Name} Glossary

{One or two sentence description of the project and glossary scope.}

## Language

**Order**:
A request from a customer to purchase one or more items.
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account
````

## Rules

- **Be opinionated.** When multiple words exist for the same concept, pick
  the best one and list the others under `_Avoid_`.
- **Keep definitions tight.** Use one or two sentences. Define what the term
  is, not what it does.
- **Only include project-specific domain terms.** General programming
  concepts (timeouts, error types, utility patterns) do not belong, even if
  the project uses them extensively.
- **Group related terms under subheadings** when natural clusters emerge.
  Keep all terms in the project's single `GLOSSARY.md`.
