---
title: "Building a Browser Extension to Visualize Anki Learning Progress"
date: "2024-10-01"
excerpt: "A Chrome extension that highlights words on web pages based on Anki card difficulty levels, combining spaced repetition data with real-world reading to visualize vocabulary mastery."
category: "Computer Science"
tags: ["Browser Extension", "TypeScript", "Anki", "WXT", "IndexedDB"]
author: "Giovanni Gravili"
---

In this post, I'll walk you through my implementation of Anki Levels, a browser extension that bridges spaced repetition learning with real-world reading. This project taught me that effective browser extensions require careful attention to performance. The naive approach of searching thousands of words through every text node on a page creates noticeable lag. I learned to use IndexedDB for persistent caching, batch processing with idle callbacks to avoid blocking the UI, and the TreeWalker API for efficient DOM traversal. The most interesting challenge was handling overlapping words in languages like Japanese where longer phrases contain shorter words. The solution uses a level-based layout system that stacks color-coded underlines, showing multiple matches simultaneously without visual clutter. Working with the WXT framework made cross-browser development straightforward, handling manifest generation and build configuration automatically.

The core idea emerged from a frustration with traditional language learning. When studying Japanese through Anki, I could review flashcards effectively, but I had no sense of my progress in real-world contexts. Which words on a news article would I recognize? Which kanji compounds had I mastered? The disconnect between controlled flashcard review and wild reading was jarring. I wanted a tool that would show me, in real time, which words I knew well and which needed more practice. The result is an extension that transforms any web page into a personalized difficulty map, color-coding words from red (difficult) to green (mastered) based on my actual Anki statistics.

<div style="text-align: center; margin: 30px 0;">
  <img src="/.posts-build/anki-levels-extension/Screenshot%202025-11-28%20at%2001.15.52.png" alt="Example of highlighted text" style="border: 1px solid #e5e7eb; border-radius: 8px;" />
  <p style="margin-top: 10px; font-size: 0.9em; color: #666;">Words highlighted with color-coded difficulty levels showing vocabulary mastery across a web page.</p>
</div>

# Architecture and Data Flow

The extension follows a two-component architecture typical of modern browser extensions: a background script that manages data synchronization and a content script that highlights words on pages. The separation of concerns is crucial for performance and reliability.

The background script (`background.ts`) runs persistently and handles all communication with Anki through the AnkiConnect add-on. AnkiConnect exposes a local HTTP API on `localhost:8765` that allows external applications to query card data. The background script fetches all cards from the "Japanese" deck (the default deck name), computes difficulty levels based on card statistics, and caches the results in IndexedDB. This architecture means content scripts never directly communicate with Anki, they simply request pre-processed word data from the background script.

The data flow works like this:

1. Background script connects to AnkiConnect and queries for all cards in the "Japanese" deck
2. For each card, extract the "Expression" field (the word or phrase) and statistics (interval, lapses, repetitions)
3. Compute a difficulty level from $0$ to $100$ based on these statistics
4. Store the word-to-difficulty mapping in IndexedDB for instant retrieval
5. Content scripts request this mapping when a page loads
6. Highlight words on the page using the difficulty data

The separation between data fetching (background) and presentation (content) is important for two reasons. First, it avoids making network requests from content scripts, which run on every page and could be blocked by content security policies. Second, it enables caching: once the background script fetches data, all tabs can use it instantly without redundant API calls.

# Computing Difficulty from Card Statistics

The most interesting algorithmic challenge was converting Anki's card statistics into a meaningful difficulty score. Anki tracks several metrics for each card:

- **Interval**: Days until the card is next due for review
- **Lapses**: Number of times you've forgotten the card
- **Repetitions**: Total number of reviews
- **Ease**: Ease factor (how easily you remember the card)

The interval is the most important signal. In spaced repetition, longer intervals indicate stronger memory. A card with a $180$-day interval is firmly in long-term memory, while a $1$-day interval means you just learned it. I designed a scoring function that maps intervals to a $[0, 100]$ scale:

$$
\text{intervalScore}(i) = \begin{cases}
90 + \min\left(\frac{i - 180}{365}, 1\right) \cdot 10 & \text{if } i \geq 180 \\
75 + \frac{i - 90}{90} \cdot 15 & \text{if } 90 \leq i < 180 \\
50 + \frac{i - 21}{69} \cdot 25 & \text{if } 21 \leq i < 90 \\
30 + \frac{i - 7}{14} \cdot 20 & \text{if } 7 \leq i < 21 \\
10 + \frac{i - 1}{6} \cdot 20 & \text{if } 1 \leq i < 7 \\
0 & \text{if } i < 1
\end{cases}
$$

where $i$ is the interval in days.

```typescript
let intervalScore = 0;
if (interval >= 180) {
  intervalScore = 90 + Math.min((interval - 180) / 365, 1) * 10; // 90-100 for 6+ months
} else if (interval >= 90) {
  intervalScore = 75 + ((interval - 90) / 90) * 15; // 75-90 for 3-6 months
} else if (interval >= 21) {
  intervalScore = 50 + ((interval - 21) / 69) * 25; // 50-75 for 3 weeks to 3 months
} else if (interval >= 7) {
  intervalScore = 30 + ((interval - 7) / 14) * 20; // 30-50 for 1-3 weeks
} else if (interval >= 1) {
  intervalScore = 10 + ((interval - 1) / 6) * 20; // 10-30 for 1-7 days
} else {
  intervalScore = 0; // New card
}
```

This function is piecewise linear, with steeper slopes for shorter intervals where changes matter more. Going from $1$ day to $7$ days is a big jump ($10$ to $30$ points), while going from $180$ days to $365$ days is incremental ($90$ to $95$ points). The breakpoints reflect natural milestones in spaced repetition: one week (established in short-term memory), three weeks (transitioning to medium-term), three months (solid medium-term), six months (entering long-term).

Lapses apply a penalty because mistakes indicate difficulty:

$$
\text{lapsesScore}(l) = -\min(l \cdot 5, 25)
$$

where $l$ is the number of lapses.

```typescript
const lapsesScore = -Math.min(lapses * 5, 25);
```

Each lapse costs $5$ points, capped at $25$ points total. This is intentionally gentle because occasional lapses are normal, especially for difficult words. I don't want a single mistake to tank a word's score.

Repetitions provide a small bonus:

$$
\text{repsBonus}(r) = \begin{cases}
\min(r \cdot 2, 10) & \text{if } r > 0 \\
0 & \text{otherwise}
\end{cases}
$$

where $r$ is the number of repetitions.

```typescript
const repsBonus = reps > 0 ? Math.min(reps * 2, 10) : 0;
```

Even if the interval is short, having reviewed a card multiple times shows engagement. This helps distinguish truly new cards (never reviewed) from young cards (recently started).

The final score combines these:

$$
\text{difficultyLevel} = \max(0, \min(100, \text{intervalScore} + \text{lapsesScore} + \text{repsBonus}))
$$

```typescript
let difficultyLevel = intervalScore + lapsesScore + repsBonus;
difficultyLevel = Math.max(0, Math.min(100, difficultyLevel));
```

Clamping to $[0, 100]$ ensures the output is always a valid percentage. The result is a single number that captures how well I know each word, derived from my actual learning history.

# Performance Optimization with IndexedDB

The extension needs to handle thousands of words efficiently. My Japanese deck contains over $5{,}000$ cards. Fetching this data from Anki on every page load would be slow and wasteful. The solution is aggressive caching using IndexedDB.

IndexedDB is a browser-native database that persists data locally. Unlike `localStorage` (limited to $5$-$10$ MB), IndexedDB can store large datasets. I created a simple wrapper class around IndexedDB to store the word-to-difficulty mapping:

```typescript
class AnkiDB {
  private dbName = "AnkiLevelsDB";
  private storeName = "words";

  async saveWords(
    words: Map<string, { difficultyLevel: number }>,
  ): Promise<void> {
    const transaction = this.db!.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);

    // Clear existing data
    store.clear();

    // Add all words
    words.forEach((data, word) => {
      store.put({ word, difficultyLevel: data.difficultyLevel });
    });
  }

  async getWords(): Promise<Map<string, { difficultyLevel: number }> | null> {
    const transaction = this.db!.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);
    const request = store.getAll();

    // Convert array to Map for fast lookups
    const wordMap = new Map<string, { difficultyLevel: number }>();
    results.forEach((item: any) => {
      wordMap.set(item.word, { difficultyLevel: item.difficultyLevel });
    });
    return wordMap;
  }
}
```

The key operations are `saveWords` (called after syncing with Anki) and `getWords` (called by content scripts). Using a `Map` for the in-memory representation gives $O(1)$ lookup time when checking if a word exists.

The background script syncs with Anki on a schedule:

```typescript
const SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

async function syncWithAnki() {
  console.log("Syncing with Anki...");
  const words = await fetchJapaneseCards();
  cachedWords = words;
  await db.saveWords(words);
  await db.saveMetadata("lastSync", Date.now());
  console.log(`Synced ${words.size} words from Anki`);
}

// On startup, load from IndexedDB immediately
const savedWords = await db.getWords();
if (savedWords) {
  cachedWords = savedWords;
  console.log(`Loaded ${savedWords.size} words from IndexedDB`);
}

// Check if we need to sync
const lastSync = await db.getMetadata("lastSync");
const now = Date.now();
if (!lastSync || now - lastSync > SYNC_INTERVAL) {
  syncWithAnki();
}
```

This gives the best of both worlds: instant loading from IndexedDB cache on every page, and periodic background syncing to keep data fresh. The $24$-hour interval balances freshness with performance. Most people don't review enough cards in a day to significantly change the difficulty distribution.

Fetching data from Anki itself is optimized with batching:

```typescript
const BATCH_SIZE = 500;
const batches: number[][] = [];
for (let i = 0; i < cardIds.length; i += BATCH_SIZE) {
  batches.push(cardIds.slice(i, i + BATCH_SIZE));
}

// Process batches in parallel (max 5 concurrent requests)
const MAX_CONCURRENT = 5;
for (let i = 0; i < batches.length; i += MAX_CONCURRENT) {
  const batchGroup = batches.slice(i, i + MAX_CONCURRENT);
  const results = await Promise.all(
    batchGroup.map((batch) => callAnkiConnect("cardsInfo", { cards: batch })),
  );
  results.forEach((result) => allCardsInfo.push(...result));
}
```

Instead of fetching card info one at a time ($5{,}000$ sequential API calls), we batch $500$ cards per request and process $5$ requests concurrently. This reduces the sync from minutes to seconds.

# Efficient DOM Traversal and Highlighting

The content script faces the hardest performance challenge: finding and highlighting words in the page's DOM without blocking the UI. Web pages can have tens of thousands of text nodes. Naively searching every node for every word would be $O(\text{nodes} \times \text{words})$, which is prohibitively slow.

The solution uses several optimizations:

**TreeWalker API**: Instead of recursively walking the DOM tree manually, I use the built-in `TreeWalker` API to efficiently find all text nodes:

```typescript
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
  acceptNode: (node) => {
    const parent = node.parentElement;
    const tagName = parent.tagName;
    // Skip script, style, textarea, input
    if (
      tagName === "SCRIPT" ||
      tagName === "STYLE" ||
      tagName === "TEXTAREA" ||
      tagName === "INPUT"
    ) {
      return NodeFilter.FILTER_REJECT;
    }
    return NodeFilter.FILTER_ACCEPT;
  },
});

const textNodes: Text[] = [];
let node;
while ((node = walker.nextNode())) {
  textNodes.push(node as Text);
}
```

The filter rejects nodes we should never highlight (scripts, styles, form inputs). This reduces the search space significantly.

**Batch processing with idle callbacks**: Processing all nodes at once would freeze the page. Instead, I process nodes in batches during idle time:

```typescript
const batchSize = 50;
let processed = 0;

function processBatch() {
  const end = Math.min(processed + batchSize, textNodes.length);
  const deadline = performance.now() + 8; // Max 8ms per batch

  for (let i = processed; i < end; i++) {
    if (performance.now() >= deadline) break; // Don't block too long

    const textNode = textNodes[i];
    // ... highlight words in this node ...
  }

  processed = end;
  if (processed < textNodes.length) {
    requestIdleCallback(processBatch, { timeout: 1000 });
  }
}

processBatch();
```

Each batch processes up to $50$ nodes but yields control if it takes more than $8$ ms. This keeps the page responsive. Using `requestIdleCallback` tells the browser to schedule processing when the main thread is idle, so it doesn't interfere with scrolling or interaction.

**Quick substring checks**: Before doing expensive matching, we check if a word could possibly exist in the text:

```typescript
for (const [word, data] of sortedWords) {
  if (!text.includes(word)) continue; // Fast rejection
  // ... do expensive matching ...
}
```

The `includes` check is a fast native string search. For text that doesn't contain any target words, this skips all the matching logic.

**Sorted words for longest-match-first**: Words are sorted by length (longest first) before matching. This ensures that if both "日本" (Japan) and "日本語" (Japanese language) are in the deck, we match the longer "日本語" first. Otherwise, "日本" would match and consume those characters, preventing the longer match.

```typescript
const sortedWords = Array.from(wordsMap.entries()).sort(
  (a, b) => b[0].length - a[0].length,
);
```

# Handling Overlapping Words

In Japanese (and many languages), words can overlap. Consider the sentence "日本語を勉強する" (I study Japanese). If my deck contains both "日本語" (Japanese language), "日本" (Japan), "勉強" (study), and "勉強する" (to study), we have overlapping matches:

- "日本語" matches characters $0$-$2$
- "日本" matches characters $0$-$1$ (overlaps with "日本語")
- "勉強する" matches characters $4$-$7$
- "勉強" matches characters $4$-$5$ (overlaps with "勉強する")

Simply highlighting the longest match would lose information about the shorter words. The user should see that they know both "日本" and the compound "日本語", possibly at different difficulty levels.

My solution is to highlight based on the primary (longest) match but add color-coded underlines for all overlapping words. Each underline is stacked vertically to avoid overlap:

```typescript
// Group overlapping matches
for (const match of matches) {
  const existingGroup = finalMatches.find(
    (existing) =>
      (match.index >= existing.index &&
        match.index < existing.index + existing.length) ||
      (match.index + match.length > existing.index &&
        match.index < existing.index),
  );

  if (existingGroup) {
    existingGroup.overlapping.push(match);
  } else {
    finalMatches.push({ ...match, overlapping: [match] });
  }
}
```

This groups matches that overlap into clusters. For each cluster, we highlight the background using the primary match's color and add stacked underlines for all matches:

```typescript
// Assign vertical levels to avoid underline overlap
const levels: number[] = [];
match.overlapping.forEach((m, idx) => {
  let level = 0;
  while (true) {
    let hasOverlap = false;
    for (let i = 0; i < idx; i++) {
      if (levels[i] === level) {
        // Check if they overlap at this level
        const mEnd = m.index + m.word.length;
        const otherEnd = other.index + other.word.length;
        if (!(mEnd <= other.index || m.index >= otherEnd)) {
          hasOverlap = true;
          break;
        }
      }
    }
    if (!hasOverlap) {
      levels[idx] = level;
      break;
    }
    level++;
  }
});
```

This algorithm assigns each overlapping word to a vertical level such that words at the same level don't overlap. It's a simple greedy allocation: for each word, try level $0$. If there's already a word at level $0$ that overlaps, try level $1$, and so on.

The underlines are positioned using CSS:

```typescript
match.overlapping.forEach((m, idx) => {
  const color = getDifficultyColor(m.data.difficultyLevel);
  const level = levels[idx];
  const offset = `calc(-1 * (1px + ${level * 2}px))`;

  const relativeStart = m.index - match.index;
  const matchLength = m.word.length;
  const totalLength = match.word.length;

  const leftPercent = (relativeStart / totalLength) * 100;
  const widthPercent = (matchLength / totalLength) * 100;

  const underline = document.createElement("span");
  underline.style.left = `${leftPercent}%`;
  underline.style.width = `calc(${widthPercent}% - 2%)`;
  underline.style.bottom = `${offset}`;
  underline.style.height = "1.5px";
  underline.style.backgroundColor = color;

  span.appendChild(underline);
});
```

Each underline is an absolutely-positioned child span, placed at a percentage offset within the parent highlight span. This ensures the underline length matches the word length, even when multiple words overlap.

<div style="text-align: center; margin: 30px 0;">
  <img src="/.posts-build/anki-levels-extension/Screenshot%202025-11-28%20at%2001.17.19.png" alt="Overlapping word detection" style="border: 1px solid #e5e7eb; border-radius: 8px;" />
  <p style="margin-top: 10px; font-size: 0.9em; color: #666;">Multiple overlapping words shown with stacked color-coded underlines.</p>
</div>

The result is visually clean. Users can hover over a highlighted word to see a tooltip listing all matches and their difficulty percentages:

```typescript
if (match.overlapping.length > 1) {
  const tooltipLines = match.overlapping
    .map((m) => `${m.word} (${Math.round(m.data.difficultyLevel)}%)`)
    .join("\n");
  span.title = `${tooltipLines}`;
} else {
  span.title = `${match.word} (${Math.round(match.data.difficultyLevel)}%)`;
}
```

# Color Coding and Visual Design

The color scheme maps difficulty levels to a red-to-green gradient. Red indicates difficult words (low score), green indicates mastered words (high score):

$$
\text{color}(d) = \text{rgb}\left(\left\lfloor 255 \cdot \left(1 - \frac{d}{100}\right) \right\rfloor, \left\lfloor 255 \cdot \frac{d}{100} \right\rfloor, 0\right)
$$

where $d$ is the difficulty level in $[0, 100]$.

```typescript
function getDifficultyColor(level: number): string {
  const red = Math.round(255 * (1 - level / 100));
  const green = Math.round(255 * (level / 100));
  return `rgb(${red}, ${green}, 0)`;
}
```

This produces a smooth gradient:

- $0\%$ → `rgb(255, 0, 0)` (red)
- $25\%$ → `rgb(191, 64, 0)` (orange)
- $50\%$ → `rgb(127, 127, 0)` (yellow)
- $75\%$ → `rgb(64, 191, 0)` (yellow-green)
- $100\%$ → `rgb(0, 255, 0)` (green)

The background is the color at $20\%$ opacity (alpha = $0.2$ in hex, or `33` in hex notation):

```typescript
span.style.backgroundColor = `${primaryColor}33`;
```

This provides subtle highlighting that doesn't obscure the text. The underlines are fully opaque, making them stand out for quick visual scanning.

<div style="text-align: center; margin: 30px 0;">
  <img src="/.posts-build/anki-levels-extension/Screenshot%202025-11-28%20at%2001.17.40.png" alt="Color-coded difficulty levels" style="border: 1px solid #e5e7eb; border-radius: 8px;" />
  <p style="margin-top: 10px; font-size: 0.9em; color: #666;">Different difficulty levels shown with color gradient from red to green.</p>
</div>

# Browser Extension Development with WXT

I built the extension using the WXT framework, which streamlines cross-browser extension development. WXT handles the boilerplate: generating manifest files, setting up TypeScript, managing builds for Chrome and Firefox, and providing a development server with hot reload.

The configuration is minimal:

```typescript
export default defineConfig({
  manifest: {
    name: "Anki Levels",
    description:
      "Highlight words on web pages based on your Anki card difficulty levels",
    permissions: ["storage", "tabs"],
  },
});
```

WXT automatically generates `manifest.json` for both Manifest V3 (Chrome) and Manifest V2 (Firefox). The `entrypoints` directory structure maps directly to extension components:

- `entrypoints/background.ts` → background service worker
- `entrypoints/content.ts` → content script

TypeScript compilation, bundling, and output directory management are all handled automatically. Development mode (`npm run dev`) watches for changes and rebuilds instantly. This made iteration fast, I could modify the highlighting algorithm and see results immediately without manual reloading.

The permissions are minimal. `storage` is needed for IndexedDB caching. Notably, I don't request broad permissions like `<all_urls>` for the background script. Only the content script runs on pages, and it communicates with the background script through message passing.

# Real-World Usage and Lessons Learned

Using the extension has changed how I read Japanese content online. News articles, blog posts, and documentation now display as personalized difficulty maps. At a glance, I can see which articles are within my current level and which will challenge me. Words I've mastered (green) fade into the background, while words I'm struggling with (red-orange) stand out, prompting review.

The most surprising insight was how much vocabulary I've acquired without realizing it. Articles that felt intimidating are often $70$-$80\%$ green. Conversely, some words I thought I knew well are still orange, revealing gaps in my retention. This visual feedback loop makes reading more engaging and provides natural motivation for reviewing difficult words.

Performance in practice has been excellent. Pages with thousands of Japanese characters (like Wikipedia articles) highlight in under $200$ ms. The idle callback batching prevents any noticeable lag during scrolling or interaction. Syncing with Anki takes $3$-$5$ seconds for my $5{,}000$-card deck, which is acceptable for a background task that runs once per day.

One limitation I discovered is that the extension works best with languages where words are clearly separated or where Anki cards represent discrete vocabulary items. For languages with complex morphology or agglutination, the exact-match approach can miss conjugations or variations. A future enhancement could use stemming or lemmatization to match word families.

The project also reinforced the importance of caching and lazy loading in browser extensions. Background scripts are service workers in Manifest V3, meaning they can be terminated at any time to save memory. All state must be persisted in `chrome.storage` or IndexedDB. Content scripts are isolated from each other, so each tab must request data independently. Designing for these constraints from the start prevents bugs and improves reliability.

---

Building Anki Levels taught me that effective browser extensions require balancing functionality, performance, and user experience. The core algorithm is simple (fetch words, compute difficulty, highlight matches), but the devil is in the details: efficient DOM traversal, responsive UI during processing, handling edge cases like overlapping words, and presenting information clearly without overwhelming the page.

The extension bridges two worlds: the controlled environment of flashcard review and the chaotic reality of native content. By visualizing my Anki progress in context, it makes learning tangible. Instead of abstract statistics (this card has a $90$-day interval), I see immediate feedback (I can read this article because these words are green). This closes the gap between studying and using the language, which is ultimately the goal of language learning.

The code is straightforward, just a few hundred lines of TypeScript, yet it has become an indispensable tool in my daily routine. Understanding how it works, from the difficulty scoring algorithm to the level-based underline layout, gives me confidence to extend it further. Future possibilities include support for multiple decks, custom color schemes, difficulty histograms for articles, and integration with other spaced repetition systems. The foundation is solid, and the potential is exciting.
