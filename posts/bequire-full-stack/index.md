---
title: "Building an AI-Powered Document Generation System"
date: "2025-11-28"
excerpt: "Designing and implementing a full-stack application that transforms lectures and reference materials into structured study documents using LLM orchestration, custom Markdown parsing, and sequential content generation."
category: "Software Engineering"
tags:
  ["Full-Stack Development", "AI", "TypeScript", "React", "System Architecture"]
author: "Giovanni Gravili"
---

In this post, I'll walk you through my implementation of Bequire, an AI-powered document generation system that transforms lecture recordings and reference materials into comprehensive study documents. This project taught me that building reliable AI applications requires more than calling an API. The unpredictability of LLM outputs demands robust parsing, validation, and retry mechanisms at every layer. I learned that existing Markdown parsers fail when content is malformed or contains unusual patterns (which LLMs frequently produce), necessitating a custom parser built specifically to handle AI-generated text. The architecture emerged from necessity: a queue-based worker system to handle long-running generation jobs, sequential section-by-section generation to maintain coherence while managing token limits, and a layered approach where prompts, validation, and formatting each have distinct responsibilities.

The challenge was to create a system that takes unstructured inputs (audio transcripts, PDF documents, images) and produces polished, well-structured study materials with proper citations, LaTeX equations, and hierarchical organization. What started as a simple document generator evolved into a sophisticated orchestration system that manages prompt sequencing, validates outputs, handles retries, and maintains consistency across multiple AI interactions.

# System Architecture

Bequire is structured as a modern full-stack application with clear separation between frontend, backend, and processing layers. The frontend is built with Next.js and React, providing an interactive document viewer, chat interface, and project management system. Users can upload lecture recordings, attach reference PDFs or images, and configure document generation parameters like length and language.

The backend is an Express.js API server that handles file uploads, user authentication via Firebase, and job orchestration. When a user requests document generation, the API creates a job entry in Firestore and enqueues it to a Redis-backed BullMQ queue. This decoupling is critical: document generation can take several minutes (sometimes 10-15 minutes for long documents with many references), so we need asynchronous processing that won't block the API or timeout HTTP connections.

The worker process continuously monitors the queue, pulling jobs and executing the multi-stage document generation pipeline. Each stage (OCR, transcription, structure analysis, section generation, validation) runs sequentially, with progress updates written back to Firestore so the frontend can display real-time status. The separation between API and worker also enables horizontal scaling: we can run multiple workers to process jobs in parallel without modifying the API layer.

Storage is handled through Google Cloud Storage for uploaded files and generated documents, while Firestore stores metadata (projects, documents, chat history, job status). This hybrid approach keeps the document tree structure in Firestore for fast queries while offloading large binary files to object storage.

# The Document Generation Pipeline

The core innovation is the sequential document generation pipeline. When a job starts, the worker first processes all input files. Audio files are transcribed using speech-to-text APIs, capturing the lecturer's spoken content. PDF documents and images are processed through OCR to extract text, preserving page numbers for later citation. This creates a corpus of source material: the full lecture transcript and all extracted reference content.

The next stage determines which parts of the reference materials are actually relevant to the lecture. Since reference PDFs can be hundreds of pages, we can't include everything in the generation context. An LLM analyzes the transcript and scans through the OCR text, identifying which pages contain information that supports or explains concepts discussed in the lecture. This relevance filtering is crucial for staying within token limits while ensuring citations are accurate and useful.

With the filtered content ready, the system performs structure analysis. Rather than generating the entire document in one massive prompt, we first ask the LLM to outline the document: identify major topics, determine appropriate sections, and create a hierarchical structure. This produces a table of contents like structure: a title and a list of section headings with brief descriptions of what each should cover. The outline varies based on the requested document length (short, medium, or long), which controls how many sections are generated.

The actual content generation happens section by section. For each section in the outline, we construct a prompt that includes the full transcript, the relevant OCR pages, the document title, a list of all section titles (for context), and specific instructions for generating this particular section. The prompt emphasizes maintaining consistency with previous sections while exploring the specific subtopic. This sequential approach ensures each section has full context about the lecture while keeping individual prompts manageable in size.

Each generated section undergoes validation. We parse the Markdown to verify the heading structure is correct, check that footnote references are sequential and complete, and ensure no content was truncated. If validation fails (which happens regularly with LLM outputs), the system retries generation for that specific section, sometimes with an adjusted prompt that points out what went wrong. This retry mechanism with targeted feedback dramatically improves output quality.

After all sections are generated, the system assembles them into a complete document, parses the entire structure to build an abstract syntax tree, and performs final processing: deduplicating footnotes, verifying citation completeness, and converting inline math to proper LaTeX delimiters. The final Markdown document is stored in Cloud Storage, and the AST representation is saved to Firestore for efficient rendering.

# Custom Markdown Parsing

One of the most challenging technical aspects was building a Markdown parser robust enough to handle AI-generated content. Standard parsers like markdown-it or remark expect well-formed input: properly closed tags, consistent heading hierarchies, balanced delimiters. LLMs regularly produce malformed output: unclosed code blocks, inconsistent list indentation, mixed delimiter styles for LaTeX equations, and footnote references that don't match actual footnotes.

The custom parser I implemented takes a fundamentally different approach. Rather than expecting perfect input, it's designed to interpret and correct common malformations. The parsing happens in multiple passes, each addressing a specific concern.

The first pass applies transformations to normalize content. Dollar signs in non-math contexts get escaped (since $20 shouldn't trigger LaTeX parsing). LaTeX delimiters get standardized: `\[...\]` and `\(...\)` are converted to `$$...$$` and `$...$` respectively, because these are what the renderer expects. Backtick code blocks sometimes contain extra backticks from the LLM's "thinking" process; these get unwrapped.

The second pass parses individual elements line by line. Each line is classified: is it a heading, list item, code fence, table row, blockquote, horizontal rule, or paragraph? Special handling applies to multi-line structures like tables (which can span dozens of lines) and display equations (which might contain newlines). The parser maintains state about indentation levels to correctly identify nested list items, which is critical for building hierarchy.

List handling deserves special mention because it's particularly error-prone with AI-generated content. The parser detects the indentation pattern (tabs or spaces, and how many spaces per level) by analyzing the entire document first. Then it builds a hierarchy: top-level items and their nested children, preserving the tree structure even when indentation is inconsistent. This prevents the common issue where a malformed sublist breaks the entire document structure.

The third pass constructs the abstract syntax tree. The parser walks through the flat list of elements and builds a hierarchical document tree based on heading levels. Sections contain subsections, which contain paragraphs, lists, equations, and tables. This AST representation enables sophisticated operations: we can extract just the section titles, verify heading hierarchy, count footnotes, or reconstruct the Markdown with corrections applied.

Footnote parsing is particularly complex because LLMs use inconsistent citation formats. The parser recognizes multiple patterns: standard `[^1]` references, inline superscript patterns like `^[1]^`, and even malformed patterns where the caret is misplaced. It then validates that every reference has a corresponding footnote definition and that numbering is sequential. If the LLM skipped a number or duplicated one, the parser can detect and report it for retry.

The final reconstruction pass takes the AST and serializes it back to Markdown, applying fixes: normalizing heading markers, ensuring consistent list formatting, properly escaping special characters, and removing duplicate footnotes. This round-trip capability (parse to AST, modify, reconstruct to Markdown) enables sophisticated document transformations that would be impossible with regex-based approaches.

# Prompt Engineering and Control Flow

Effective prompt engineering emerged as critical for reliable document generation. Each stage of the pipeline uses carefully crafted instruction templates stored in the `instructions` directory. These templates include specific formatting requirements, examples of desired output, and explicit constraints.

The structure analysis prompt, for instance, asks the LLM to analyze the lecture transcript and produce a numbered list of section titles with descriptions, bounded by minimum and maximum section counts based on document length. The prompt includes negative examples (what not to do) and emphasizes that the output must be machine-parseable. This specificity reduces variability and makes validation more straightforward.

Section generation prompts are more elaborate. They include the full transcript, relevant OCR pages, document title, list of all sections (so the LLM knows what comes before and after), and specific instructions about the section's focus. For documents with reference materials, the citation instructions are embedded: use the `{{{filename-pN}}}` format for citations, ensure every claim referencing external material is cited, and place footnotes at the end. For documents without references, these instructions are omitted entirely to prevent the LLM from inventing citations.

LaTeX handling required specific instructions because LLMs often produce malformed math. The prompts explicitly state: use `$$...$$` for display equations, use `$...$` for inline math, never use `\[...\]` or `\(...\)` (because our renderer doesn't support them). When equations appear at the end of sentences, the punctuation goes inside the delimiter: `$E = mc^2.$` not `$E = mc^2$.` This level of detail is tedious but necessary for consistent output.

The control flow uses retry mechanisms with exponential backoff. If a section generation fails validation, the system waits briefly and tries again, up to three attempts. Each retry includes feedback about what was wrong: "The heading level was incorrect" or "Footnote references are not sequential starting from 1". This targeted feedback significantly improves success rates on retry. For catastrophic failures (the LLM produces completely unusable output three times in a row), the system logs the error, marks the section as failed, and continues with subsequent sections rather than aborting the entire job.

Progress tracking happens through Firestore updates after each major stage. The job document stores a percentage completion and a status message like "Analyzing lecture structure" or "Generating section 3 of 5". The frontend polls this document every few seconds and updates a progress bar, giving users visibility into long-running jobs. This polling pattern is simple but effective for our use case where jobs run for minutes, not milliseconds.

# Chat System and Dynamic Citations

Beyond document generation, Bequire includes a chat interface where users can ask questions about their documents. This required solving a different set of problems: maintaining conversation context, extracting relevant document sections, and dynamically generating citations.

When a user sends a message, the system retrieves the full chat history and determines which documents are currently in context (documents the user added to the conversation). For each document in context, it loads the document content and concatenates it into a large prompt alongside the chat history. The LLM sees the documents, the conversation so far, and the user's new question, then generates a response.

Citations in chat responses use a special syntax: `{{{filename-pN}}}` references a specific page, `{{{filename-pN-pM}}}` references a page range, and `{{{filename}}}` references a file without a specific page. After the LLM responds, the backend parses these citation markers, validates them against the actual reference files (checking that the page numbers exist and the filename is correct), and converts them to numbered footnotes.

The conversion process builds a footnote list where each unique combination of file and pages gets a number. If the LLM references the same source multiple times, we reuse the footnote number. Invalid citations (referencing a file that doesn't exist or pages that are out of range) are logged as warnings but not inserted into the final output. This prevents broken citations from appearing in the user interface.

Markdown rendering in the chat uses the same custom parser developed for document generation. Chat responses can include headings, lists, code blocks, LaTeX equations, and footnotes. The parser converts the Markdown to HTML, then a React component renders it with appropriate styling and interactive footnotes. Clicking a footnote opens a dialog showing the source material and page numbers, allowing users to verify claims and explore references.

One interesting challenge was handling malformed Markdown in real-time chat. Unlike document generation, which can retry, chat responses are synchronous (from the user's perspective). The parser needed to be maximally forgiving: if the LLM produces broken Markdown, render what's salvageable rather than showing an error. The strategy is to classify as much as possible (treating ambiguous lines as paragraphs) and gracefully degrade when structure is unclear. This ensures users always get a readable response even when the LLM makes formatting mistakes.

# Frontend Architecture and User Experience

The frontend uses Next.js with React Server Components for the initial page load and client-side components for interactive features. The document viewer is the most complex component, managing state for the selected document, scroll position, chat panel visibility, and citation highlights.

The viewer uses a three-panel layout: a project/document list on the left, the main document content in the center, and an optional chat panel on the right. The chat panel slides in from the right when activated, implemented using ResizablePanels from `react-resizable-panels`. This keeps the chat contextually attached to the document rather than opening in a modal or separate page.

Document rendering happens by parsing the Markdown AST stored in Firestore and converting it to React components. Headings become styled `<h1>`, `<h2>`, etc. elements. Lists render as `<ul>` or `<ol>` with proper nesting. Code blocks use syntax highlighting. LaTeX equations render using KaTeX on the client side. Footnote references are interactive: hovering shows a tooltip preview, clicking opens a full dialog with source information.

The citation dialog displays the source filename, page numbers, and the footnote text. For PDF reference files, it includes a link to open the specific page in a PDF viewer (implemented with `react-pdf`). This provides immediate verification of claims: users can jump from a citation in the study document directly to the source material to confirm or explore further.

Real-time updates during document generation use polling rather than WebSockets (a pragmatic choice for simplicity). The frontend checks the job status every two seconds while a document is generating. When the status changes, the UI updates the progress bar and status message. Once generation completes, the document automatically appears in the library. This provides a responsive experience without the complexity of maintaining WebSocket connections.

File uploads use a multi-step wizard interface. Users select or create a project, then add audio recordings and reference files (PDFs or images). Each file shows a preview: audio files display duration, PDFs show page count, images show thumbnails. After files are uploaded to Cloud Storage, the user configures generation settings (document length, language) and submits the job. This guided flow reduces errors and sets clear expectations about what the system will produce.

Error handling throughout the frontend follows a consistent pattern: API errors show toast notifications at the top of the screen with clear messages about what went wrong. Failed uploads can be retried. Jobs that fail during processing show error details in the document generation queue component. This transparency helps users understand when they need to take action (like re-uploading a corrupted file) versus when they can simply wait (like when a temporary API error occurs).

# Technical Challenges and Lessons Learned

Building Bequire surfaced several non-obvious challenges that shaped the final architecture.

The first major challenge was managing LLM context windows. Early versions attempted to generate entire documents in one prompt, which worked for short lectures but failed catastrophically for longer ones. Token limits were hit, outputs were truncated mid-sentence, and citation accuracy suffered because the model couldn't attend to all reference pages. Sequential generation solved this by splitting the work into stages (structure, then sections) where each prompt has a bounded size. The tradeoff is increased latency (more API calls) and the need for explicit coherence instructions ("maintain consistency with previous sections"), but the reliability improvement was dramatic.

The second challenge was handling non-deterministic failures. LLMs occasionally produce completely invalid output: missing required fields, wrong formatting, hallucinated citations. Naive retry (just try again with the same prompt) has low success rates because there's no feedback about what went wrong. The breakthrough was adding validation-informed retries: parse the output, identify specific issues, and include those in the next prompt attempt. Success rates went from around 60% to over 90% for complex sections.

The third challenge was parsing and validating AI-generated Markdown. Standard parsers assume well-formed input. When they encounter malformation, they fail hard (throw exceptions) or silently produce garbage (misinterpret structure). Building a custom parser that interprets intent rather than demanding perfection was essential. The parser doesn't just report errors; it infers what the LLM probably meant and corrects it. This "forgiving by design" philosophy extends throughout the system: assume mistakes will happen and handle them gracefully rather than treating them as exceptional.

Citation handling presented unique difficulties. LLMs are prone to hallucinating page numbers (citing page 47 when the document only has 30 pages) or inventing filenames. The solution was two-fold: provide explicit file listings in the prompt with exact page counts, and validate every citation against the actual reference files during post-processing. Invalid citations get logged for debugging but aren't inserted into the output. This prevents incorrect information from reaching users while maintaining valid citations.

Performance optimization was necessary as the system grew. Early versions loaded entire document contents into memory during chat, which caused API timeouts for large documents. The solution was to use Firestore's chunking capabilities: store documents as multiple subdocuments (sections) and load only what's needed for the current conversation. Similarly, reference file OCR results are stored as individual page documents that can be loaded selectively rather than as one massive blob.

The queue-based architecture proved invaluable for debugging. Because every job is persistent in Firestore with full logs, failures can be inspected retroactively. Job artifacts (intermediate outputs, error messages, retry counts) provide visibility into what went wrong. This observability is difficult to achieve with purely synchronous request-response patterns where failures vanish unless explicitly logged.

Testing AI systems is fundamentally different from testing deterministic code. Unit tests can verify parsing and validation logic, but end-to-end tests that include LLM calls are slow, expensive, and non-deterministic. The approach I settled on was comprehensive validation at boundaries: ensure inputs are well-formed before sending to the LLM, validate outputs thoroughly after receiving them, and design the system to degrade gracefully when validation fails. This "defensive in-depth" strategy treats LLM interactions as unreliable external services rather than trusted components.

---

Building Bequire has been one of my most instructive projects. It bridges multiple domains: full-stack web development, AI orchestration, document processing, and system design. The architecture that emerged (queue-based workers, sequential generation, custom parsing, validation-informed retries) reflects the unique challenges of building reliable applications on top of unpredictable LLM outputs.

The key insight is that working with AI requires designing around uncertainty. Traditional software engineering assumes components behave deterministically: given the same input, they produce the same output. LLMs violate this assumption fundamentally. Success requires layers of validation, graceful degradation when outputs are wrong, and retry mechanisms that provide feedback rather than just repeating failures.

More broadly, the project demonstrates that AI applications are systems engineering problems. The LLM is a component, not the application. The value comes from orchestration: preprocessing inputs, constructing effective prompts, validating outputs, handling failures, and presenting results in a usable interface. The code managing these concerns dwarfs the actual LLM API calls (3,600 lines of AI utilities, 1,600 lines of Markdown parsing, versus a few dozen lines of actual API interaction).

For anyone building similar systems, the lessons are clear: invest in robust parsing and validation, expect failures and design retry mechanisms with feedback, break complex generation into sequential stages with bounded context, and build observability into every layer so you can debug when things inevitably go wrong. AI is powerful, but productionizing it requires rigor and defensive engineering.
