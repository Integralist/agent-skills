# Markdown Code Blocks

Shared markdown convention. Reference this from any skill that produces,
formats, or templates markdown content containing code blocks.

Whenever producing a code block for markdown (`markdown` or `md`), use 4
backticks instead of 3:

`````markdown
````markdown
some markdown inside with a code block:

```go
type foo string
```

more markdown
````
`````

Using 4 backticks ensures that any inner 3-backtick code blocks do not break
rendering.
