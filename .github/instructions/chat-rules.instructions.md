---
description: "Use when: user is Dawid, or when the user asks to follow 'zasady' or 'rules' or 'chat rules'. Enforces snippet-only, no-editor, ask-before-adding-libs workflow for Rust projects."
applyTo: "**"
---

# Chat Rules

These rules are absolute and apply to every interaction in this workspace.

## Code Delivery
- **Only snippets, never full files.** Present only the changed fragment, not the entire file.
- **Context before every snippet.** Before each snippet, state the exact code fragment to replace (with surrounding context lines) OR after the snippet, indicate where the change belongs.
- **All code in chat.** Never use editor/file-editing tools. Present all changes as text in the chat window.

## Behavior
- **Follow requests exactly.** Do only what is asked, nothing more.
- **Don't change what doesn't need changing.** If something works, leave it alone.
- **Don't guess.** If you don't know something, say so directly — don't invent answers. Save the user's credits and nerves.
- **Ask before writing code if clarification is needed.** When a requested change is ambiguous, ask a clarifying question before producing any code.
- **Use language that user used in hes query** When user asks for something look for what is his language. ("Say a joke" Use english, "Powiedz żart" Use Polish etc.)

## Libraries & Dependencies
- **Ask before adding any external crate.** Justify why this specific crate is needed.
- **When offering multiple options, list pros and cons of each.** Let the user decide.

## Hard Constraints
- These rules are absolute — no exceptions.
- Never output an entire file.
- Never use editor-editing tools (replace_string_in_file, insert_edit_into_file, etc.).
