# Story Mode Components

<cite>
**Referenced Files in This Document**
- [apps/web/app/(game)/story/page.tsx](file://apps/web/app/(game)/story/page.tsx)
- [apps/web/store/story-store.ts](file://apps/web/store/story-store.ts)
- [apps/web/lib/story-data.ts](file://apps/web/lib/story-data.ts)
- [apps/web/lib/character-config.ts](file://apps/web/lib/character-config.ts)
- [apps/web/components/story/story-hud.tsx](file://apps/web/components/story/story-hud.tsx)
- [apps/web/components/story/narrative-panel.tsx](file://apps/web/components/story/narrative-panel.tsx)
- [apps/web/components/story/world-map.tsx](file://apps/web/components/story/world-map.tsx)
- [apps/web/components/story/choice-cards.tsx](file://apps/web/components/story/choice-cards.tsx)
- [apps/web/components/story/cinematic-zone-enter.tsx](file://apps/web/components/story/cinematic-zone-enter.tsx)
- [apps/web/components/story/boss-gate-transition.tsx](file://apps/web/components/story/boss-gate-transition.tsx)
- [apps/web/components/story/narrator-box.tsx](file://apps/web/components/story/narrator-box.tsx)
- [apps/web/components/story/npc-dialogue.tsx](file://apps/web/components/story/npc-dialogue.tsx)
- [apps/web/components/story/pixel-portrait.tsx](file://apps/web/components/story/pixel-portrait.tsx)
- [apps/web/components/story/consequence-overlay.tsx](file://apps/web/components/story/consequence-overlay.tsx)
- [apps/web/components/story/rank-up-overlay.tsx](file://apps/web/components/story/rank-up-overlay.tsx)
- [apps/web/components/story/story-sfx-context.tsx](file://apps/web/components/story/story-sfx-context.tsx)
- [apps/web/contexts/narration-context.tsx](file://apps/web/contexts/narration-context.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains the story mode UI components that drive narrative progression and character interaction. It covers:
- Campaign tracking and HUD
- Narrative panels for dialogue and narration
- Location navigation via the world map
- Decision-making with timed choice cards
- Cinematic transitions and boss gate sequences
- State management for story progression, branching paths, and character development
- Integration with story data models, animation systems, and audio-visual effects
- Responsive design and accessibility
- Performance considerations for rich media assets

## Project Structure
The story mode is implemented as a React client application integrated with a centralized Zustand store, typed story data, and shared contexts for narration and sound effects. The main story page orchestrates transitions, overlays, and panels.

```mermaid
graph TB
Page["StoryModePage<br/>(page.tsx)"] --> HUD["StoryHud<br/>(story-hud.tsx)"]
Page --> Map["WorldMap<br/>(world-map.tsx)"]
Page --> Narrator["StoryNarrator<br/>(narrative-panel.tsx)"]
Page --> Status["StoryStatusPanel<br/>(story-status-panel.tsx)"]
Page --> Overlay1["ConsequenceOverlay<br/>(consequence-overlay.tsx)"]
Page --> Overlay2["RankUpOverlay<br/>(rank-up-overlay.tsx)"]
Page --> BossGate["BossGateTransition<br/>(boss-gate-transition.tsx)"]
Page --> Cinematic["CinematicZoneEnter<br/>(cinematic-zone-enter.tsx)"]
HUD --> Store["useStoryStore<br/>(story-store.ts)"]
Map --> Store
Narrator --> Store
Status --> Store
Overlay1 --> Store
Overlay2 --> Store
BossGate --> Store
Cinematic --> Store
Narrator --> NPC["NpcDialogue<br/>(npc-dialogue.tsx)"]
Narrator --> NarratorBox["NarratorBox<br/>(narrator-box.tsx)"]
NPC --> SFX["StorySFXContext<br/>(story-sfx-context.tsx)"]
NarratorBox --> SFX
Choice["ChoiceCards<br/>(choice-cards.tsx)"] --> SFX
Choice --> Store
Choice --> CharCfg["CharacterConfig<br/>(character-config.ts)"]
HUD --> Narration["NarrationContext<br/>(narration-context.tsx)"]
Cinematic --> AudioMgr["AudioManagerContext<br/>(audio-manager-context.tsx)"]
```

**Diagram sources**
- [apps/web/app/(game)/story/page.tsx](file://apps/web/app/(game)/story/page.tsx#L46-L186)
- [apps/web/components/story/story-hud.tsx](file://apps/web/components/story/story-hud.tsx#L30-L177)
- [apps/web/components/story/world-map.tsx](file://apps/web/components/story/world-map.tsx#L179-L224)
- [apps/web/components/story/narrative-panel.tsx](file://apps/web/components/story/narrative-panel.tsx#L17-L90)
- [apps/web/components/story/choice-cards.tsx](file://apps/web/components/story/choice-cards.tsx#L33-L332)
- [apps/web/components/story/cinematic-zone-enter.tsx](file://apps/web/components/story/cinematic-zone-enter.tsx#L54-L253)
- [apps/web/components/story/boss-gate-transition.tsx](file://apps/web/components/story/boss-gate-transition.tsx#L24-L183)
- [apps/web/components/story/consequence-overlay.tsx](file://apps/web/components/story/consequence-overlay.tsx#L17-L122)
- [apps/web/components/story/rank-up-overlay.tsx](file://apps/web/components/story/rank-up-overlay.tsx#L16-L58)
- [apps/web/components/story/npc-dialogue.tsx](file://apps/web/components/story/npc-dialogue.tsx#L34-L263)
- [apps/web/components/story/narrator-box.tsx](file://apps/web/components/story/narrator-box.tsx#L19-L183)
- [apps/web/components/story/story-sfx-context.tsx](file://apps/web/components/story/story-sfx-context.tsx#L95-L117)
- [apps/web/contexts/narration-context.tsx](file://apps/web/contexts/narration-context.tsx#L72-L194)
- [apps/web/store/story-store.ts](file://apps/web/store/story-store.ts#L175-L307)
- [apps/web/lib/character-config.ts](file://apps/web/lib/character-config.ts#L17-L39)

**Section sources**
- [apps/web/app/(game)/story/page.tsx](file://apps/web/app/(game)/story/page.tsx#L46-L186)

## Core Components
- StoryHud: Displays campaign context (zone, act), XP progress, rank, optional boss health, voice toggle, energy meter (zone 2), scars, and debts.
- NarrativePanel: Renders narrative blocks with streaming support and animated caret; includes helper to render styled text.
- WorldMap: Presents three story zones as interactive nodes with completion status, difficulty, tooltips, and progress.
- ChoiceCards: Timed decision UI with typewriter prompt reveal, dynamic timer visuals, optional tier hints, and obscured choices under certain conditions.
- CinematicZoneEnter: Full-screen cinematic intro per zone with lore text, skip affordance, and ambient audio intensity adjustment.
- BossGateTransition: Boss encounter intro with optional debuff activation and readiness cue.
- NarratorBox and NpcDialogue: Full-width narrator lines and character dialogue with typewriter effect, TTS integration, and SFX.
- ConsequenceOverlay and RankUpOverlay: Non-blocking overlays for XP/scars/debts and rank-ups with auto-dismiss and SFX.
- StorySFXContext and NarrationContext: Centralized audio effects and text-to-speech orchestration.
- StoryStore: Centralized state for session, stats, gamification, chat, choices, audio intensity, and actions.

**Section sources**
- [apps/web/components/story/story-hud.tsx](file://apps/web/components/story/story-hud.tsx#L30-L177)
- [apps/web/components/story/narrative-panel.tsx](file://apps/web/components/story/narrative-panel.tsx#L17-L90)
- [apps/web/components/story/world-map.tsx](file://apps/web/components/story/world-map.tsx#L179-L224)
- [apps/web/components/story/choice-cards.tsx](file://apps/web/components/story/choice-cards.tsx#L33-L332)
- [apps/web/components/story/cinematic-zone-enter.tsx](file://apps/web/components/story/cinematic-zone-enter.tsx#L54-L253)
- [apps/web/components/story/boss-gate-transition.tsx](file://apps/web/components/story/boss-gate-transition.tsx#L24-L183)
- [apps/web/components/story/narrator-box.tsx](file://apps/web/components/story/narrator-box.tsx#L19-L183)
- [apps/web/components/story/npc-dialogue.tsx](file://apps/web/components/story/npc-dialogue.tsx#L34-L263)
- [apps/web/components/story/consequence-overlay.tsx](file://apps/web/components/story/consequence-overlay.tsx#L17-L122)
- [apps/web/components/story/rank-up-overlay.tsx](file://apps/web/components/story/rank-up-overlay.tsx#L16-L58)
- [apps/web/components/story/story-sfx-context.tsx](file://apps/web/components/story/story-sfx-context.tsx#L95-L117)
- [apps/web/contexts/narration-context.tsx](file://apps/web/contexts/narration-context.tsx#L72-L194)
- [apps/web/store/story-store.ts](file://apps/web/store/story-store.ts#L175-L307)

## Architecture Overview
The story mode follows a unidirectional data flow:
- StoryStore holds all state and exposes actions to mutate it.
- Typed story data models define acts, scenes, choices, and moods.
- UI components subscribe to the store and render based on state.
- Narration and SFX contexts provide immersive audio feedback.
- Transitions and overlays are orchestrated from the main page.

```mermaid
sequenceDiagram
participant User as "Player"
participant Page as "StoryModePage"
participant Map as "WorldMap"
participant Cin as "CinematicZoneEnter"
participant HUD as "StoryHud"
participant Narr as "StoryNarrator/NarrativePanel"
participant Choice as "ChoiceCards"
participant Store as "useStoryStore"
User->>Page : Select zone
Page->>Cin : Show cinematic
Cin-->>Page : onComplete()
Page->>Store : startZone(zone)
Page->>HUD : Render HUD with zone/act
Page->>Narr : Render narrative blocks
Narr->>Choice : Present choices (optional)
User->>Choice : Pick choice
Choice->>Store : Apply XP/Scars/Debts
Store-->>Page : Update state (consequencePayload, rank, etc.)
Page->>Page : Show overlays (ConsequenceOverlay/RankUpOverlay)
```

**Diagram sources**
- [apps/web/app/(game)/story/page.tsx](file://apps/web/app/(game)/story/page.tsx#L68-L81)
- [apps/web/components/story/cinematic-zone-enter.tsx](file://apps/web/components/story/cinematic-zone-enter.tsx#L54-L95)
- [apps/web/components/story/world-map.tsx](file://apps/web/components/story/world-map.tsx#L209-L220)
- [apps/web/components/story/choice-cards.tsx](file://apps/web/components/story/choice-cards.tsx#L272-L275)
- [apps/web/store/story-store.ts](file://apps/web/store/story-store.ts#L179-L200)

## Detailed Component Analysis

### StoryHud
- Purpose: Campaign HUD showing zone, act, XP progress, rank, optional boss health, voice toggle, energy meter (zone 2), scars, and debts.
- State dependencies: zone, act, xp, rank, scars, debts, energyMeter, actStreakWithoutScar, bossPhase, bossHealth.
- Animations: Framer Motion progress bars for XP and boss health; pulse indicators for streak and energy low.
- Accessibility: Clear labels, keyboard focus, and ARIA-friendly structure; voice toggle with live state.

```mermaid
flowchart TD
Start(["Render StoryHud"]) --> ReadState["Read useStoryStore state"]
ReadState --> XPBar["Compute XP progress and render bar"]
ReadState --> Rank["Display rank badge"]
ReadState --> OptionalBars{"Boss in combat?"}
OptionalBars --> |Yes| BossBar["Render boss health bar"]
OptionalBars --> |No| VoiceToggle["Render voice toggle"]
ReadState --> EnergyCheck{"Zone 2 and energyMeter exists?"}
EnergyCheck --> |Yes| EnergyBar["Render energy meter with color thresholds"]
EnergyCheck --> |No| ScarsDebts["Render scars and debts counts"]
VoiceToggle --> End(["Done"])
BossBar --> End
EnergyBar --> End
ScarsDebts --> End
```

**Diagram sources**
- [apps/web/components/story/story-hud.tsx](file://apps/web/components/story/story-hud.tsx#L30-L177)
- [apps/web/store/story-store.ts](file://apps/web/store/story-store.ts#L42-L81)

**Section sources**
- [apps/web/components/story/story-hud.tsx](file://apps/web/components/story/story-hud.tsx#L30-L177)
- [apps/web/store/story-store.ts](file://apps/web/store/story-store.ts#L42-L81)

### NarrativePanel
- Purpose: Container for narrative blocks with auto-scrolling, streaming content, and animated caret.
- Features: Typewriter-like streaming, optional loader when streaming without content, and helper renderer for styled text.
- Accessibility: Scroll-to-bottom on updates; readable typography and contrast.

```mermaid
sequenceDiagram
participant Panel as "NarrativePanel"
participant Parent as "StoryNarrator"
participant Store as "useStoryStore"
Parent->>Panel : children + streamingContent + isStreaming
alt Streaming and content present
Panel->>Panel : Animate new block with caret
else Streaming without content
Panel->>Panel : Show loader + text
end
Panel->>Panel : Auto-scroll to bottom
```

**Diagram sources**
- [apps/web/components/story/narrative-panel.tsx](file://apps/web/components/story/narrative-panel.tsx#L17-L57)

**Section sources**
- [apps/web/components/story/narrative-panel.tsx](file://apps/web/components/story/narrative-panel.tsx#L17-L90)

### WorldMap
- Purpose: Interactive map of story zones with completion status, difficulty, tooltips, and progress.
- Behavior: Hover tooltips, selection callbacks, completion progress bar, and animated entrance.
- Integration: Uses zone metadata and completion records from the store.

```mermaid
flowchart TD
Init["Render WorldMap"] --> Progress["Compute completion percentage"]
Progress --> Nodes["Render ZoneNodes in order"]
Nodes --> Hover["Hover tooltip with description"]
Nodes --> Select["onSelectZone callback"]
Select --> End(["Zone selected"])
```

**Diagram sources**
- [apps/web/components/story/world-map.tsx](file://apps/web/components/story/world-map.tsx#L179-L224)

**Section sources**
- [apps/web/components/story/world-map.tsx](file://apps/web/components/story/world-map.tsx#L179-L224)

### ChoiceCards
- Purpose: Timed decision UI with typewriter prompt, timer bar, and choice buttons.
- Mechanics: Dynamic timer affected by scars; optional tier hints; obscured choices for higher tiers under certain conditions; SFX on selection and timer ticks.
- Integration: Reads character config per zone for styling and portrait.

```mermaid
flowchart TD
Start(["Render ChoiceCards"]) --> Prompt["Typewriter reveal prompt"]
Prompt --> Timer["Start countdown with SFX on thresholds"]
Timer --> Choices["Render choices with badges and shimmer"]
Choices --> Select{"Choice selected?"}
Select --> |Yes| Apply["Apply XP/Scars/Debts via store"]
Apply --> Overlay["Set consequencePayload"]
Overlay --> End(["Done"])
Select --> |No| Timeout["Auto-select worst choice on timeout"]
Timeout --> End
```

**Diagram sources**
- [apps/web/components/story/choice-cards.tsx](file://apps/web/components/story/choice-cards.tsx#L33-L115)
- [apps/web/lib/character-config.ts](file://apps/web/lib/character-config.ts#L17-L39)

**Section sources**
- [apps/web/components/story/choice-cards.tsx](file://apps/web/components/story/choice-cards.tsx#L33-L332)
- [apps/web/lib/character-config.ts](file://apps/web/lib/character-config.ts#L17-L39)

### CinematicZoneEnter
- Purpose: Full-screen cinematic intro per zone with lore paragraphs, skip affordance, and ambient audio intensity.
- Behavior: Controlled timeline with staggered lore reveals and automatic completion callback.

```mermaid
sequenceDiagram
participant Page as "StoryModePage"
participant Cin as "CinematicZoneEnter"
participant Audio as "AudioManagerContext"
Page->>Cin : Show cinematic for selected zone
Cin->>Audio : setIntensity(0)
Cin->>Cin : Reveal title/subtitle
Cin->>Cin : Staggered lore lines
Cin-->>Page : onComplete()
```

**Diagram sources**
- [apps/web/components/story/cinematic-zone-enter.tsx](file://apps/web/components/story/cinematic-zone-enter.tsx#L54-L95)
- [apps/web/app/(game)/story/page.tsx](file://apps/web/app/(game)/story/page.tsx#L72-L77)

**Section sources**
- [apps/web/components/story/cinematic-zone-enter.tsx](file://apps/web/components/story/cinematic-zone-enter.tsx#L54-L253)

### BossGateTransition
- Purpose: Boss encounter intro with optional debuff activation and readiness cue.
- Behavior: Phased presentation with SFX and auto-dismiss after readiness.

```mermaid
sequenceDiagram
participant Page as "StoryModePage"
participant Boss as "BossGateTransition"
participant Store as "useStoryStore"
Page->>Boss : Show with zone and triggered debts
Boss->>Boss : Play boss appear SFX
alt Debts present
Boss->>Boss : Show debuffs activating
else No debts
Boss->>Boss : Skip to ready
end
Boss-->>Page : onDismiss()
```

**Diagram sources**
- [apps/web/components/story/boss-gate-transition.tsx](file://apps/web/components/story/boss-gate-transition.tsx#L24-L63)

**Section sources**
- [apps/web/components/story/boss-gate-transition.tsx](file://apps/web/components/story/boss-gate-transition.tsx#L24-L183)

### NarratorBox and NpcDialogue
- Purpose: Full-width narrator lines and character dialogue with typewriter effect and TTS.
- Features: Click-to-skip, animated caret, corner accents, and SFX on text ticks.
- Integration: Uses NarrationContext for TTS and StorySFXContext for audio cues.

```mermaid
sequenceDiagram
participant NarratorBox as "NarratorBox"
participant Npc as "NpcDialogue"
participant TTS as "NarrationContext"
participant SFX as "StorySFXContext"
NarratorBox->>TTS : speak(text)
NarratorBox->>SFX : play("textTick") periodically
Npc->>TTS : speak(text)
Npc->>SFX : play("textTick") periodically
```

**Diagram sources**
- [apps/web/components/story/narrator-box.tsx](file://apps/web/components/story/narrator-box.tsx#L19-L61)
- [apps/web/components/story/npc-dialogue.tsx](file://apps/web/components/story/npc-dialogue.tsx#L34-L121)
- [apps/web/contexts/narration-context.tsx](file://apps/web/contexts/narration-context.tsx#L112-L178)
- [apps/web/components/story/story-sfx-context.tsx](file://apps/web/components/story/story-sfx-context.tsx#L95-L117)

**Section sources**
- [apps/web/components/story/narrator-box.tsx](file://apps/web/components/story/narrator-box.tsx#L19-L183)
- [apps/web/components/story/npc-dialogue.tsx](file://apps/web/components/story/npc-dialogue.tsx#L34-L263)
- [apps/web/contexts/narration-context.tsx](file://apps/web/contexts/narration-context.tsx#L72-L194)
- [apps/web/components/story/story-sfx-context.tsx](file://apps/web/components/story/story-sfx-context.tsx#L95-L117)

### ConsequenceOverlay and RankUpOverlay
- Purpose: Non-blocking overlays for XP/scars/debts and rank-ups with auto-dismiss and SFX.
- Behavior: Staggered animations per item; continue button dismissal.

```mermaid
flowchart TD
Start(["Overlay shown"]) --> Items{"Payload contains XP/Scars/Debts?"}
Items --> |XP| XPSFX["Play XP SFX"]
Items --> |Scars| ScarSFX["Play Scar SFX and optional streak broken SFX"]
Items --> |Debts| DebtSFX["Play Debt SFX"]
XPSFX --> Delay["Auto-dismiss after delay"]
ScarSFX --> Delay
DebtSFX --> Delay
Delay --> End(["Overlay dismissed"])
```

**Diagram sources**
- [apps/web/components/story/consequence-overlay.tsx](file://apps/web/components/story/consequence-overlay.tsx#L17-L33)
- [apps/web/components/story/rank-up-overlay.tsx](file://apps/web/components/story/rank-up-overlay.tsx#L16-L26)

**Section sources**
- [apps/web/components/story/consequence-overlay.tsx](file://apps/web/components/story/consequence-overlay.tsx#L17-L122)
- [apps/web/components/story/rank-up-overlay.tsx](file://apps/web/components/story/rank-up-overlay.tsx#L16-L58)

### PixelPortrait
- Purpose: 8×8 pixel-art representation for characters with CRT scanline overlay and active glow.
- Integration: Used by NpcDialogue and ChoiceCards to maintain visual consistency.

**Section sources**
- [apps/web/components/story/pixel-portrait.tsx](file://apps/web/components/story/pixel-portrait.tsx#L78-L151)

## Dependency Analysis
- StoryStore is the central dependency for all UI components rendering state and invoking actions.
- ChoiceCards depends on CharacterConfig for zone-specific styling and portrait.
- NarratorBox and NpcDialogue depend on NarrationContext for TTS and StorySFXContext for audio cues.
- CinematicZoneEnter integrates with AudioManagerContext to adjust ambient intensity.
- ConsequenceOverlay and RankUpOverlay integrate with StorySFXContext and StoryStore for state-driven SFX and timing.

```mermaid
graph LR
Store["useStoryStore"] --> HUD["StoryHud"]
Store --> Map["WorldMap"]
Store --> Narr["NarrativePanel"]
Store --> Choice["ChoiceCards"]
Store --> Overlay1["ConsequenceOverlay"]
Store --> Overlay2["RankUpOverlay"]
Store --> Boss["BossGateTransition"]
Store --> Page["StoryModePage"]
Choice --> CharCfg["CharacterConfig"]
Narr --> Narration["NarrationContext"]
Narr --> SFX["StorySFXContext"]
Choice --> SFX
Overlay1 --> SFX
Overlay2 --> SFX
Cinematic["CinematicZoneEnter"] --> AudioMgr["AudioManagerContext"]
```

**Diagram sources**
- [apps/web/store/story-store.ts](file://apps/web/store/story-store.ts#L175-L307)
- [apps/web/components/story/choice-cards.tsx](file://apps/web/components/story/choice-cards.tsx#L59-L60)
- [apps/web/lib/character-config.ts](file://apps/web/lib/character-config.ts#L17-L39)
- [apps/web/components/story/narrator-box.tsx](file://apps/web/components/story/narrator-box.tsx#L24-L25)
- [apps/web/components/story/npc-dialogue.tsx](file://apps/web/components/story/npc-dialogue.tsx#L58-L59)
- [apps/web/components/story/consequence-overlay.tsx](file://apps/web/components/story/consequence-overlay.tsx#L18-L28)
- [apps/web/components/story/rank-up-overlay.tsx](file://apps/web/components/story/rank-up-overlay.tsx#L17-L21)
- [apps/web/components/story/cinematic-zone-enter.tsx](file://apps/web/components/story/cinematic-zone-enter.tsx#L56-L67)

**Section sources**
- [apps/web/store/story-store.ts](file://apps/web/store/story-store.ts#L175-L307)
- [apps/web/components/story/choice-cards.tsx](file://apps/web/components/story/choice-cards.tsx#L59-L60)
- [apps/web/lib/character-config.ts](file://apps/web/lib/character-config.ts#L17-L39)
- [apps/web/components/story/narrator-box.tsx](file://apps/web/components/story/narrator-box.tsx#L24-L25)
- [apps/web/components/story/npc-dialogue.tsx](file://apps/web/components/story/npc-dialogue.tsx#L58-L59)
- [apps/web/components/story/consequence-overlay.tsx](file://apps/web/components/story/consequence-overlay.tsx#L18-L28)
- [apps/web/components/story/rank-up-overlay.tsx](file://apps/web/components/story/rank-up-overlay.tsx#L17-L21)
- [apps/web/components/story/cinematic-zone-enter.tsx](file://apps/web/components/story/cinematic-zone-enter.tsx#L56-L67)

## Performance Considerations
- Animation and transitions: Prefer hardware-accelerated properties (opacity, transforms) and keep durations reasonable to avoid jank.
- Audio: Web Audio API is used for deterministic SFX; ensure context resumes on user gesture to avoid autoplay restrictions.
- Text rendering: Typewriter effects use periodic updates; throttle intervals and cancel timers on unmount.
- Media assets: Pixel portraits and icons are lightweight; lazy-load images if extended to larger sprites.
- Store updates: Use atomic updates and avoid unnecessary re-renders by selecting minimal slices of state.
- Streaming content: Debounce or batch updates to narrative panels to prevent excessive reflows.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Voice narration not playing:
  - Verify NarrationContext is enabled and stored preference; check browser speech synthesis availability.
- SFX not playing:
  - Ensure AudioContext is created and resumed on user interaction; confirm device supports Web Audio.
- Overlays not dismissing:
  - Confirm auto-dismiss timers are cleared on unmount and overlay dismissal callbacks are invoked.
- Choice timer anomalies:
  - Validate timer computation logic and ensure intervals are cleared on unmount and choice selection.
- Cinematic skip not working:
  - Ensure completion callback is invoked and pending zone state is cleared.

**Section sources**
- [apps/web/contexts/narration-context.tsx](file://apps/web/contexts/narration-context.tsx#L72-L194)
- [apps/web/components/story/story-sfx-context.tsx](file://apps/web/components/story/story-sfx-context.tsx#L95-L117)
- [apps/web/components/story/consequence-overlay.tsx](file://apps/web/components/story/consequence-overlay.tsx#L30-L33)
- [apps/web/components/story/choice-cards.tsx](file://apps/web/components/story/choice-cards.tsx#L93-L115)
- [apps/web/components/story/cinematic-zone-enter.tsx](file://apps/web/components/story/cinematic-zone-enter.tsx#L97-L101)

## Conclusion
The story mode UI components form a cohesive system for narrative progression and character interaction. They leverage a centralized store, typed data models, and immersive audio/visual feedback to deliver a polished, responsive, and accessible experience across devices. The modular design allows for easy extension of zones, choices, and narrative flows while maintaining consistent UX patterns.