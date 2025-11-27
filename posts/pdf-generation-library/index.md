---
title: "Building a PDF Generation Library from Scratch in Rust"
date: "2024-05-09"
excerpt: "Implementing a complete PDF generation library in Rust with JSON document support, TTF font embedding, and low-level PDF spec compliance for deterministic output suitable for regression testing."
category: "Computer Science"
tags: ["Rust", "PDF", "Font Rendering", "Document Generation", "Type Systems"]
author: "Giovanni Gravili"
---

In this post, I'll walk you through my implementation of TeXtr, a PDF generation library written in Rust that converts JSON documents into fully-formatted PDF files. This project taught me that building a PDF generator is fundamentally about understanding binary file formats and coordinate systems. The technical challenge lies in correctly encoding every detail according to the PDF specification: font metrics, glyph mappings, character positioning, and page structure. I learned that the PDF format is deceptively complex, with layers of indirection (object references, stream encoding, resource dictionaries) that must all align perfectly for readers to parse the file correctly. Working in Rust proved ideal because the type system catches encoding errors at compile time, and the ownership model prevents the memory leaks that plague C-based PDF libraries. Most importantly, I discovered that deterministic output is critical for testing: by controlling document and instance IDs, I could generate byte-identical PDFs for regression testing via postscript comparison.

The PDF format is ubiquitous for document distribution because it preserves exact layout across platforms. Unlike HTML (which reflows based on viewport) or DOCX (which depends on font availability), PDFs specify absolute positions for every glyph. This makes them ideal for legal documents, academic papers, and print media where layout must be pixel-perfect. However, generating PDFs programmatically is notoriously difficult because the specification is over 1,000 pages and requires handling font embedding, Unicode mapping, and complex object graphs.

The challenge was to build a library that handles font loading and embedding from TTF files, character-to-glyph-ID mapping with proper Unicode support, text positioning in millimeters with conversion to PDF points, page creation with customizable dimensions, and JSON document serialization for high-level control. Each component required deep understanding of both the PDF specification and font file formats.

# Architecture Overview

TeXtr implements two interfaces for PDF generation. The low-level interface is `PdfDocument`, which exposes functions like `add_page_with_layer`, `add_font`, and `write_text_to_layer_in_page`. This gives complete control but requires manual tracking of page and layer indices. The high-level interface is `Document`, which deserializes from JSON and automatically manages the PDF construction process. This is the intended use case: external layouting algorithms generate the JSON, and TeXtr handles PDF encoding.

The JSON document format specifies two unique identifiers (document ID and instance ID) for deterministic output and an operations array that describes content:

```json
{
  "documentId": "QU2KK7yivMeRDnU8DodEQxnfqJAe4wZ2",
  "instanceId": "DLjCAhuTD3cvaoQCJnMvkC0iNWEGEfyD",
  "operations": [
    {
      "pageWidth": 210.0,
      "pageHeight": 297.0
    },
    {
      "color": [0.0, 0.0, 0.0],
      "position": [50.0, 200.0],
      "textString": "Hello, world!",
      "fontSize": 48.0,
      "fontIndex": 0
    }
  ]
}
```

The operations are untagged serde enums, meaning the JSON structure determines which variant to deserialize. `AppendNewPage` creates a new page with specified dimensions in millimeters. `WriteUnicodeText` renders text at a given position with color, font, and size. Operations execute sequentially, building the PDF page by page.

Converting a `Document` to a `PdfDocument` involves loading all Computer Modern fonts (the CMU family, including math fonts), iterating through operations to construct pages and write text, and finalizing the PDF with `write_all` using the instance ID:

```rust
pub fn to_pdf_document(&self) -> Result<PdfDocument, ContextError> {
    let mut pdf_document = PdfDocument::new(self.document_id.clone());

    // Load Computer Modern fonts
    let fonts_directory = std::fs::read_dir("fonts/computer-modern")?;
    let mut font_paths: Vec<PathBuf> = fonts_directory
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.path().extension() == Some("ttf".as_ref()))
        .map(|entry| entry.path())
        .collect();
    font_paths.sort();

    // Load Latin Modern Math font
    font_paths.push(PathBuf::from("fonts/lm-math/opentype/latinmodern-math.otf"));

    for font_path in font_paths {
        pdf_document.add_font(&font_path)?;
    }

    let mut current_page_index = 0;
    let mut current_layer_index = 0;

    for operation in &self.operations {
        match operation {
            Operation::WriteUnicodeText {
                color, position, text_string, font_size, font_index
            } => {
                pdf_document.write_text_to_layer_in_page(
                    current_page_index,
                    current_layer_index,
                    *color,
                    text_string.clone(),
                    *font_index,
                    *font_size,
                    *position,
                )?;
            }
            Operation::AppendNewPage { page_width, page_height } => {
                let (page_index, layer_index) =
                    pdf_document.add_page_with_layer(*page_width, *page_height);
                current_page_index = page_index;
                current_layer_index = layer_index;
            }
        }
    }

    pdf_document.write_all(self.instance_id.clone())?;
    Ok(pdf_document)
}
```

The font loading order is deterministic (sorted paths) so font indices remain consistent across runs. This is crucial for the JSON format, where `fontIndex` references fonts by their loading order.

# Font Embedding and Glyph Mapping

Embedding TrueType fonts in PDFs is complex because the PDF format predates Unicode. PDFs use Character ID (CID) fonts, which map 16-bit glyph IDs to Unicode codepoints via a CMap (character map). The process involves parsing the TTF file to extract metrics (ascent, descent, units per em), extracting glyph-to-Unicode mappings from the font's cmap table, calculating glyph widths for proper text spacing, and generating a CID-to-Unicode CMap for text extraction.

I use the `owned_ttf_parser` crate to parse TTF files. The `TtfFontFace` struct wraps the parsed face and provides metric extraction:

```rust
struct TtfFontFace {
    inner: std::sync::Arc<owned_ttf_parser::OwnedFace>,
    units_per_em: u16,
}

impl TtfFontFace {
    fn font_metrics(&self) -> FontMetrics {
        FontMetrics {
            ascent: self.face().ascender(),
            descent: self.face().descender(),
            units_per_em: self.units_per_em,
        }
    }

    fn glyph_id(&self, codepoint: char) -> Option<u16> {
        self.face()
            .glyph_index(codepoint)
            .map(|glyph_id| glyph_id.0)
    }

    fn glyph_ids(&self) -> HashMap<u16, char> {
        let font_subtables = self.face().tables().cmap?
            .subtables
            .into_iter()
            .filter(|subtable| subtable.is_unicode());

        let mut gid_to_codepoint_map =
            HashMap::with_capacity(self.face().number_of_glyphs() as usize);

        for subtable in font_subtables {
            subtable.codepoints(|codepoint| {
                if let Ok(character) = char::try_from(codepoint) {
                    if let Some(glyph_index) = subtable.glyph_index(codepoint) {
                        if glyph_index.0 > 0 {
                            gid_to_codepoint_map
                                .entry(glyph_index.0)
                                .or_insert(character);
                        }
                    }
                }
            });
        }

        gid_to_codepoint_map
    }
}
```

The `glyph_ids` function iterates through all Unicode subtables in the font's cmap, extracting the mapping from glyph IDs to characters. This mapping is essential for generating the CID-to-Unicode CMap, which allows PDF readers to extract text for copy-paste operations.

Glyph metrics determine character widths for proper spacing. The horizontal advance (how far to move the cursor after drawing the glyph) is scaled from font units to a $1000$-unit square:

```rust
fn glyph_metrics(&self, glyph_id: u16) -> Option<GlyphMetrics> {
    let glyph_id = owned_ttf_parser::GlyphId(glyph_id);

    if let Some(width) = self.face().glyph_hor_advance(glyph_id) {
        let width = width as u32;
        let height = self.face()
            .glyph_bounding_box(glyph_id)
            .map(|bbox| {
                (bbox.y_max - bbox.y_min - self.face().descender()) as u32
            })
            .unwrap_or(1000);

        Some(GlyphMetrics { width, height })
    } else {
        None
    }
}
```

The width scaling uses the formula:

$$\text{scaled\_width} = \frac{\text{glyph\_width} \times 1000}{\text{units\_per\_em}}$$

This normalizes all fonts to the same coordinate space, simplifying PDF layout calculations.

# PDF Object Structure

The PDF format represents documents as a graph of objects referenced by object IDs. Each object has a type (dictionary, stream, array, integer, etc.) and objects reference each other via indirect references. The root is the catalog object, which references the pages tree, which references individual page objects, each containing content streams (the drawing operations for that page) and resource dictionaries (fonts, images, etc.).

I use the `lopdf` crate for low-level PDF object manipulation. The `PdfDocument` struct maintains the object graph:

```rust
pub struct PdfDocument {
    fonts: BTreeMap<String, (lopdf::ObjectId, Font)>,
    pub inner_document: lopdf::Document,
    pub identifier: String,
    pages: Vec<PdfPage>,
}
```

The `fonts` map stores loaded fonts by their PDF names (`F0`, `F1`, etc.) along with their object IDs. The `inner_document` is the `lopdf::Document` that manages the object graph. The `pages` vector holds page structures before they are serialized into the PDF.

Inserting a font into the PDF requires creating multiple linked objects. The font dictionary specifies the font type and encoding, the font descriptor contains metrics and the embedded font file, the descendant font dictionary specifies CID font properties, and the ToUnicode CMap enables text extraction:

```rust
fn insert_into_document(&self, inner_document: &mut lopdf::Document) -> lopdf::Dictionary {
    let face_metrics = self.ttf_face.font_metrics();

    // Create font stream containing TTF data
    let font_stream = lopdf::Stream::new(
        lopdf::Dictionary::from_iter(vec![
            ("Length1", Integer(self.bytes.len() as i64))
        ]),
        self.bytes.clone(),
    ).with_compression(false);

    // Build font descriptor with metrics
    let font_descriptor = lopdf::Dictionary::from_iter(vec![
        ("Type", Name("FontDescriptor".into())),
        ("FontName", Name(self.face_identifier.clone().into())),
        ("Ascent", Integer(face_metrics.ascent as i64)),
        ("Descent", Integer(face_metrics.descent as i64)),
        ("CapHeight", Integer(face_metrics.ascent as i64)),
        ("ItalicAngle", Integer(0)),
        ("Flags", Integer(32)),
        ("StemV", Integer(80)),
    ]);

    // Generate glyph width arrays
    let width_objects = generate_width_arrays(&self.ttf_face, &face_metrics);

    // Create CIDFont dictionary
    let cid_font = lopdf::Dictionary::from_iter(vec![
        ("Type", Name("Font".into())),
        ("Subtype", Name("CIDFontType2".into())),
        ("BaseFont", Name(self.face_identifier.clone().into())),
        ("CIDSystemInfo", Dictionary(lopdf::Dictionary::from_iter(vec![
            ("Registry", String("Adobe".into(), Literal)),
            ("Ordering", String("Identity".into(), Literal)),
            ("Supplement", Integer(0)),
        ]))),
        ("W", Array(width_objects)),
        ("DW", Integer(1000)),
    ]);

    // Generate ToUnicode CMap
    let cmap = generate_cid_to_unicode_map(
        self.face_identifier.clone(),
        self.ttf_face.glyph_ids()
    );
    let cmap_stream_id = inner_document.add_object(
        lopdf::Stream::new(lopdf::Dictionary::new(), cmap.into_bytes())
    );

    // Build top-level font dictionary
    lopdf::Dictionary::from_iter(vec![
        ("Type", Name("Font".into())),
        ("Subtype", Name("Type0".into())),
        ("BaseFont", Name(self.face_identifier.clone().into())),
        ("Encoding", Name("Identity-H".into())),
        ("DescendantFonts", Array(vec![Dictionary(cid_font)])),
        ("ToUnicode", Reference(cmap_stream_id)),
    ])
}
```

The width array (`W` entry) specifies glyph widths in CID font order. The PDF specification requires grouping glyph IDs into ranges where the first byte matches. For example, glyphs $0\text{x}1000$ through $0\text{x}10\text{FF}$ form one range. Each range contains at most $100$ glyphs:

```rust
let mut width_objects = Vec::new();
let mut current_range_start = 0;
let mut current_widths = Vec::new();

let percentage_scaling = 1000.0 / (face_metrics.units_per_em as f32);

for glyph_id in 0..self.ttf_face.glyph_count() {
    if let Some(metrics) = self.ttf_face.glyph_metrics(glyph_id) {
        if glyph_id == current_range_start + current_widths.len() as u16 {
            let scaled_width = (metrics.width as f32 * percentage_scaling) as i64;
            current_widths.push(Integer(scaled_width));
        } else {
            width_objects.push(Integer(current_range_start as i64));
            width_objects.push(Array(std::mem::take(&mut current_widths)));
            current_range_start = glyph_id;
            current_widths.push(Integer((metrics.width as f32 * percentage_scaling) as i64));
        }
    }
}

width_objects.push(Integer(current_range_start as i64));
width_objects.push(Array(current_widths));
```

This produces a flattened array like `[20, [21, 99, 34], 50, [18, 42]]`, meaning glyph $20$ has width $21$, glyph $21$ has width $99$, glyph $22$ has width $34$, glyph $50$ has width $18$, and glyph $51$ has width $42$.

# Text Rendering and Coordinate Systems

PDF uses a bottom-left origin coordinate system where the origin $(0, 0)$ is at the bottom-left corner of the page. Positive $x$ extends right, positive $y$ extends up. This differs from most graphics systems (which use top-left origin). I convert from millimeters to PDF points using the formula:

$$\text{points} = \text{millimeters} \times 2.834646$$

This factor derives from the definition: $1$ point $= 1/72$ inch, and $1$ millimeter $= 1/25.4$ inch, so $1$ mm $= 25.4/72 \approx 2.834646$ points.

Writing text to a PDF layer involves constructing a sequence of PDF operators (drawing commands) that the renderer executes:

```rust
pub fn write_text_to_layer_in_page(
    &mut self,
    page_index: usize,
    layer_index: usize,
    color: [f32; 3],
    text: String,
    font_index: usize,
    font_size: f32,
    caret_position: [f32; 2],
) -> Result<(), ContextError> {
    let font = self.get_font(font_index)?.1.clone();

    // Begin text object
    self.add_operations_to_layer(
        layer_index,
        page_index,
        vec![Operation::new("BT", vec![])],
    )?;

    // Set font and size
    self.add_operations_to_layer(
        layer_index,
        page_index,
        vec![Operation::new("Tf", vec![
            font.face_identifier.into(),
            font_size.into()
        ])],
    )?;

    // Set text position
    let [x, y] = caret_position;
    self.add_operations_to_layer(
        layer_index,
        page_index,
        vec![Operation::new("Td", vec![
            millimeters_to_points(x).into(),
            millimeters_to_points(y).into()
        ])],
    )?;

    // Set text color
    let [r, g, b] = color;
    self.add_operations_to_layer(
        layer_index,
        page_index,
        vec![Operation::new("rg", vec![r.into(), g.into(), b.into()])],
    )?;

    // Convert text to glyph IDs
    let mut glyph_ids = Vec::new();
    for character in text.nfc() {
        if let Some(glyph_id) = font.ttf_face.glyph_id(character) {
            glyph_ids.push(glyph_id);
        } else {
            log::warn!("Character {:?} not found in font", character);
        }
    }

    // Encode glyph IDs as bytes
    let glyph_bytes: Vec<u8> = glyph_ids
        .iter()
        .flat_map(|id| vec![(id >> 8) as u8, (id & 255) as u8])
        .collect();

    // Show text
    self.add_operations_to_layer(
        layer_index,
        page_index,
        vec![Operation::new("Tj", vec![
            Object::String(glyph_bytes, StringFormat::Hexadecimal)
        ])],
    )?;

    // End text object
    self.add_operations_to_layer(
        layer_index,
        page_index,
        vec![Operation::new("ET", vec![])],
    )?;

    Ok(())
}
```

The `BT` (begin text) and `ET` (end text) operators delimit the text object. The `Tf` operator sets the font and size. The `Td` operator translates the text matrix (moves the cursor). The `rg` operator sets the RGB fill color. The `Tj` operator shows text by rendering glyphs.

Unicode normalization (`.nfc()`) ensures characters are in canonical composed form. For example, "é" can be represented as a single codepoint (`U+00E9`) or as "e" + combining acute accent (`U+0065` + `U+0301`). NFC normalization chooses the single-codepoint form when available, ensuring consistent glyph mapping.

Glyph IDs are encoded as 16-bit big-endian values. The byte sequence `[0x12, 0x34, 0x56, 0x78]` represents glyph IDs $0\text{x}1234$ and $0\text{x}5678$. PDF readers decode these using the font's encoding (Identity-H for horizontal writing).

# Page Structure and Layers

PDFs organize content into pages, each containing one or more layers (optional content groups). Layers allow toggling visibility of content groups, useful for multi-language documents or engineering drawings with different detail levels. I create a default layer for each page:

```rust
pub fn add_page_with_layer(&mut self, page_width: f32, page_height: f32) -> (usize, usize) {
    let mut pdf_page = PdfPage {
        number: self.pages.len() + 1,
        width: millimeters_to_points(page_width),
        height: millimeters_to_points(page_height),
        layers: Vec::new(),
        resources: PdfResources::default(),
        extend_with: None,
    };

    let pdf_layer = PdfLayer {
        name: "Layer0".into(),
        operations: Vec::new(),
    };

    pdf_page.layers.push(pdf_layer);
    self.pages.push(pdf_page);

    let page_index = self.pages.len() - 1;
    let layer_index = 0;

    (page_index, layer_index)
}
```

The page dimensions use points internally, but the API accepts millimeters for user convenience. Layers are converted into PDF content streams when finalizing the document. The `operations` vector accumulates drawing commands (`BT`, `Tf`, `Td`, etc.) that will be encoded into a binary stream.

When writing the PDF, layers are wrapped with Optional Content Group (OCG) markers:

```rust
for (index, layer) in self.layers.iter_mut().enumerate() {
    layer.operations.insert(0, Operation::new("q", vec![]));
    layer.operations.insert(0, Operation::new("BDC", vec![
        Name("OC".into()),
        Name(ocg_references[index].0.clone().into()),
    ]));

    layer.operations.push(Operation::new("Q", vec![]));
    layer.operations.push(Operation::new("EMC", vec![]));

    let layer_stream: lopdf::Stream = layer.clone().into();
    layer_streams.push(layer_stream);
}
```

The `q` and `Q` operators save and restore the graphics state, creating an isolated context for the layer. The `BDC` (begin marked content) and `EMC` (end marked content) operators delimit the optional content. The `OC` tag references the OCG dictionary, which specifies layer properties (name, visibility, etc.).

# Deterministic Output for Testing

A critical feature of TeXtr is deterministic PDF generation. Given the same input JSON, the library produces byte-identical PDFs every time. This enables regression testing by comparing PDFs after code changes. Traditional PDF libraries use random UUIDs for document IDs and timestamps for metadata, making output non-deterministic.

I achieve determinism by requiring explicit document and instance IDs (32-character strings provided by the user), using a fixed timestamp (Unix epoch) for creation and modification dates, sorting font paths before loading to ensure consistent font indices, and avoiding any random number generation.

The testing workflow generates fuzz targets (random JSON documents), converts them to PDFs (the reference outputs), converts PDFs to postscript format for easier text comparison, and runs the conversion again after code changes and diffs against references:

```bash
# Generate random JSON fuzz targets
cargo test generate_fuzz_targets -- --exact

# Generate reference PDFs
cargo test generate_target_references_from_fuzz_targets -- --exact

# After code changes, compare outputs
cargo test compare_fuzz_targets_with_target_references -- --exact
```

The postscript conversion uses `gs` (Ghostscript) to convert PDFs to PS format:

```bash
gs -sDEVICE=ps2write -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=output.ps input.pdf
```

Postscript is text-based, making diffs meaningful. Binary PDF diffs show raw byte changes without context. The test compares postscript files using the `similar-asserts` crate:

```rust
let reference_ps = std::fs::read_to_string(&reference_path)?;
let current_ps = std::fs::read_to_string(&current_path)?;

assert_eq!(
    reference_ps,
    current_ps,
    "PDF output changed for {}",
    fuzz_target
);
```

If the assertion fails, the crate prints a colorized diff showing exactly what changed, making it easy to identify regressions.

# Optimization with Ghostscript

The PDFs generated by TeXtr are functional but unoptimized. They contain redundant objects and uncompressed streams, making files large ($1$-$2$ MB for simple documents). I provide helper functions to optimize PDFs using Ghostscript or `ps2pdf`:

```rust
pub fn optimize_pdf_file_with_gs(pdf_path: &str) -> Result<(), ContextError> {
    let output_path = format!("{}.swp", pdf_path);

    let status = std::process::Command::new("gs")
        .arg("-sDEVICE=pdfwrite")
        .arg("-dCompatibilityLevel=1.5")
        .arg("-dPDFSETTINGS=/ebook")
        .arg("-dNOPAUSE")
        .arg("-dQUIET")
        .arg("-dBATCH")
        .arg(format!("-sOutputFile={}", output_path))
        .arg(pdf_path)
        .spawn()?
        .wait()?;

    if !status.success() {
        return Err(ContextError::with_context("gs optimization failed"));
    }

    std::fs::rename(output_path, pdf_path)?;
    Ok(())
}
```

The `-dPDFSETTINGS=/ebook` option balances file size and quality, suitable for on-screen viewing. Other options include `/screen` (lower quality, smaller size) and `/printer` (higher quality, larger size). Ghostscript also fixes subtle issues in the PDF structure, such as incorrect bounding boxes for glyph highlighting.

The optimization reduces file sizes by $80$-$90$%. A $1.5$ MB unoptimized PDF becomes $200$ KB after optimization. The process takes $0.5$-$2$ seconds depending on document complexity.

# Error Handling and Context

Rust's `Result` type forces explicit error handling, but generic error types (`Box<dyn Error>`) lose context about where errors occurred. I implemented a custom `ContextError` type that chains error messages:

```rust
pub struct ContextError {
    pub context: String,
    pub source_error: Option<String>,
}

impl ContextError {
    pub fn with_context<S: Into<String>>(context: S) -> Self {
        ContextError {
            context: context.into(),
            source_error: None,
        }
    }

    pub fn with_error<S: Into<String>>(
        context: S,
        error: &dyn std::error::Error
    ) -> Self {
        ContextError {
            context: context.into(),
            source_error: Some(error.to_string()),
        }
    }
}

impl std::fmt::Display for ContextError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match &self.source_error {
            Some(source) => write!(f, "{}: {}", self.context, source),
            None => write!(f, "{}", self.context),
        }
    }
}
```

Using this type throughout the codebase produces informative error chains:

```
Failed to save PDF file: failed to write bytes: permission denied
```

This is much more useful than a bare "permission denied" error, which doesn't indicate what operation failed. The error propagates through the call stack, accumulating context at each level.

# Lessons Learned

Building a PDF library from scratch taught me several important lessons about low-level document processing. First, specifications are essential but insufficient. The PDF specification is comprehensive but lacks practical examples for edge cases. I spent hours debugging glyph width encoding because the spec doesn't clearly explain the scaling factor. Examining PDFs generated by other tools (using `pdfinfo` and manual inspection) revealed the correct approach.

Second, deterministic output is invaluable for testing. Binary formats are notoriously difficult to test because minor changes cause widespread byte differences. By controlling all sources of randomness, I could use simple byte comparison for regression tests. This caught numerous bugs during development where refactoring accidentally changed output.

Third, font handling is the hardest part of PDF generation. Parsing TTF files, extracting glyph metrics, generating CID-to-Unicode maps, and encoding width arrays all require careful attention to detail. One off-by-one error in glyph ID encoding caused text to render as random glyphs, which took days to debug. Using the type system to distinguish glyph IDs from Unicode codepoints prevented similar errors.

Finally, Rust's ownership model shines for binary format manipulation. The PDF object graph has complex reference patterns (fonts reference font descriptors, pages reference resource dictionaries, etc.). In C, this would require manual reference counting or garbage collection. Rust's `Arc` (atomic reference counting) and explicit cloning made memory management straightforward without sacrificing performance.

---

Implementing a PDF generation library demonstrates how understanding binary file formats enables creating powerful document processing tools. The PDF specification is complex, but breaking it into manageable components (font embedding, text rendering, page structure) makes implementation tractable. Rust's type system and ownership model provide safety guarantees that prevent entire classes of bugs common in C-based PDF libraries. The project serves as a foundation for more complex document generation systems, from automated report generation to typesetting engines. Understanding how each layer works, from Unicode normalization to postscript optimization, provides deep appreciation for the engineering that makes digital documents portable and precise.
