Over the past year I have been intermittently memorizing over a thousand kanji and a few thousands of Japanese vocabulary words. Although I often struggled to gauge my reading comprehension—some words I knew well, others I had never seen—out of frustration I spent an evening coding a Chrome extension that loads your Anki deck and immediately lets you visualize your progress in reading comprehension. In simple terms, words you know well are underlined in green, while those you know less well in red. Available now on my GitHub at this [link](https://github.com/ghovax/AnkiLevels). Free for anyone to use as they please under any permissive license that may apply.

![](Screenshot 2025-11-28 at 01.15.52.png)

### How Does It Work?

The card data is fetched from Anki via the Anki Connect extension. Once per day, this data is processed to obtain each card's statistics—interval, lapses, and repetitions—and to calculate a difficulty level ranging from 0 to 100. These data are then used to highlight words on the page. The extension defaults to the deck called "Japanese," but that can be customized in the code.

The "interval" indicates the number of days until the card is next due for review. "Lapses" indicates how many times you have forgotten a given card. "Repetitions" is the total number of views. The "ease factor" reflects, in Anki’s internal statistics, how easily you remember the card. Interval is the most important parameter because a longer interval indicates a stronger memory for that specific word or character. An interval of six months (180 days) is associated with long-term memory, while a one-day interval means the item was just learned and is likely to be forgotten. To convert interval into a normalized score from 0 to 100, assign ranges based on retention duration: 90–100 for intervals of six months or more; 75–90 for three to six months; 50–75 for three weeks to three months; 30–50 for one to three weeks; and 10–30 for one week or less.

$$x$$