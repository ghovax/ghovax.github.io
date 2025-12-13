This project began as an exam assignment for my bachelor's but evolved into a full-fledged undertaking: implementing a PDF generator from scratch that produces files from a predefined custom JSON document format. Before I knew about tools like Pandoc, it was instructive to read the PDF specification and implement it directly. The main challenge is that PDF is a binary format requiring precise encoding of every detail—font metrics, glyph mappings, character positioning, and page structure—so readers can decode it. The format is deceptively complex, with interacting layers such as object references, stream encoding, and resource dictionaries that must align perfectly for valid files. Rust was ideal for this project because its strong type system catches many errors at compile time. My goal was not only to generate PDFs but to produce deterministic, byte-for-byte identical documents for reliable testing, which requires controlling generation parameters via low-level APIs and converting to PostScript. The code is fully publicly available, thoroughly documented, and published on [GitHub](https://crates.io/crates/textr) and [crates.io](https://github.com/ghovax/textr) at these links. 

The library provides both a command-line interface for generating PDFs and a high-level API, which was used specifically to create the following example. The resulting PDF is available at the following [link](https://github.com/ghovax/textr/blob/master/assets/pdfs/DLjCAhuTD3cvaoQCJnMvkC0iNWEGEfyD.pdf?raw=true). As you can see in the following screenshot, the text can be correctly highlighted using a standard PDF reader, demonstrating the validity of the output.

![](Screenshot 2025-12-13 at 16.51.02.png)

### Implementation

This challenge quickly became extremely complex. The text files must be loaded and embedded within the PDF starting from the original TTF font file, with a complete character-to-glyph mapping and proper Unicode support. Text positioning must be specified in millimeters and converted to PDF points, and pages must be created with customizable dimensions. All of this must be driven through a high-level interface—a JSON file that is deserialized at runtime to produce the input for PDF generation.

The high-level JSON interface defines the sequence of operations required to generate a PDF. It initializes the page with the specified width and height in millimeters, then executes text operations within that page. Text is placed by specifying its RGB color, the position in millimeters measured from the bottom-left corner, the content to be written, the font size, and the font index to use. Fonts are currently loaded by default by the program because external font loading is not yet fully implemented; available choices include typewriter, sans-serif, bold, standard, and Roman from the Latin Modern family used in LaTeX documents. Additionally, the document ID and the instance ID must be specified. These two parameters are required to uniquely identify a document and to enable reproducible billing. They can be provided manually by the user. The font loading order is determined by sorting the paths so the font indices remain consistent across runs.  

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

I'm betting that TrueType fonts in PDFs are complicated because the PDF specification predates Unicode. PDFs use character IDs (CIDs) and CID fonts, which map 16-bit glyph IDs to Unicode code points via a CMAP (character map). The process involves parsing the TTF file to extract the ascent and descent in font units per em, extracting glyph-to-Unicode mappings from the font's CMAP table, calculating glyph widths for proper text spacing, and generating a CID-to-Unicode CMAP for text extraction. The glyph metrics determine character widths for spacing and the horizontal advance—the distance to move the cursor before drawing the glyph. The horizontal advance is scaled from font units to a default 1000-unit square using a normalization formula, which places all fonts in the same coordinate space and simplifies PDF layout calculations:

$$\text{scaled width} = \frac{\text{glyph width} \times 1000}{\text{units per em}}$$

After loading the fonts and preparing the groundwork, the next step is to write to a given PDF layer by constructing a sequence of PDF operators—drawing commands that the renderer executes; this also requires understanding that PDF points relate to millimeters by a specific conversion:

$$\text{points} = \text{millimeters} \times 2.834646$$

This factor derives from the definition of points in relation to inches.

### Deterministic Output for Testing

The library focuses on producing byte-identical PDFs every time to enable regression testing by comparing PDFs after code changes. Traditional PDF libraries use random UUIDs for document IDs and timestamps in metadata, which makes output non-deterministic. Testing generates fuzz targets—random JSON documents—converts them to PDFs as reference outputs, converts those PDFs to PostScript for easier text-based diffing using a Goss script, and then reconverts after code changes to verify diffs against the references. Binary PDF diffs show raw byte changes without context, whereas PostScript diffs are meaningful. The PDFs my library generates are functional but unoptimized: they contain redundant objects and uncompressed streams, making files large—usually a few megabytes even for simple documents because all font files are embedded. I provide a helper function that typically reduces file sizes by 80–90%. I spent hours developing these solutions; it was a difficult learning process to understand PDFs and how to generate them, since minor changes can cause widespread byte differences. Another major challenge was identifying sources of randomness, which allowed me to catch numerous bugs that otherwise caused unintended output changes.

The test outputs have not been included in the repository because they are quite large—about half a gigabyte—due to redundant PDFs and PostScript files that are not optimized by Ghostscript for verification reasons.