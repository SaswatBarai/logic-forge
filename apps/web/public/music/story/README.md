# Story Mode BGM Tracks

Place these MP3 files in this folder for dynamic story soundtrack. The app uses Howler.js with crossfade (1.5s) when switching tracks. If a file is missing, a synthesized fallback plays.

## Required filenames

| Save as         | Intensity | Use case                          |
|-----------------|-----------|------------------------------------|
| `calm.mp3`      | 0         | Intro, peaceful scenes            |
| `tense.mp3`     | 1         | Mid-zone, uncertain choices       |
| `climactic.mp3` | 2         | Boss / high-stakes moments        |
| `resolution.mp3`| 3         | After victory, wrap-up            |

## Download (free, CC-licensed)

Download from OpenGameArt.org and **rename** the file to match the table above:

| Filename to save as | Track                              | Link |
|---------------------|------------------------------------|------|
| `calm.mp3`          | Hero Immortal                      | https://opengameart.org/content/hero-immortal |
| `tense.mp3`         | Battle Theme 2 (Tense Battle Loop) | https://opengameart.org/content/battle-theme-2 |
| `climactic.mp3`     | Final Battle of the Dark Wizards   | https://opengameart.org/content/final-battle-of-the-dark-wizards |
| `resolution.mp3`    | Fanfare for Space                  | https://opengameart.org/content/fanfare-for-space |

Place each file at `apps/web/public/music/story/<filename>`.
