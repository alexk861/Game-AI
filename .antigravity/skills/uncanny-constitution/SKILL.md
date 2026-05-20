---
name: uncanny-constitution
description: The master Product Constitution and layout design rules for Uncanny. Evaluates all code changes, layout designs, copywriting, gameplay readability, cinematic restraint, and mobile ergonomic boundaries for the mobile-first perception game experience.
risk: safe
category: design-constitution
source: local
date_added: '2026-05-20'
tags: [uncanny, design-system, architecture, copywriting, mobile-ux, accessibility, cinematic-ui]
triggers: [uncanny, game UI, visual style, atmosphere, layout, button style, copy editing, gameplay UX]
---

# Uncanny Product Constitution Playbook

This master skill playbook governs all interface development, copywriting, spatial engineering, animation behaviors, and gameplay presentation for the mobile-first perception game **Uncanny**.

Uncanny is an **atmospheric photographic ritual of uncertainty**.

It is NOT:
- a SaaS application
- a dashboard
- a hacker terminal
- a cyberpunk interface
- a gamified AI quiz
- a fintech-style UI

The player should feel:

> “I am quietly studying something I do not fully trust.”

This playbook serves as a strict product constitution.
All proposed changes must be evaluated against these rules.

If a visual decision improves atmosphere but harms usability:
# usability wins.

---

# The 11 Critical Product Rules

1. **Readability always wins over atmosphere.**
   If text becomes difficult to read or interaction clarity weakens, the UI has failed.

2. **The image is always the emotional center.**
   Photography dominates emotional attention. UI must visually step back.

3. **One screen = one emotional purpose.**
   Avoid dashboard thinking, split views, crowded overlays, or competing interaction layers.

4. **Gameplay must remain fast and understandable.**
   The player should instantly understand:
   - what this screen is
   - what action is expected
   - what happened
   - what happens next

5. **Reveal screens prioritize emotional clarity.**
   The reveal should feel like a quiet realization, not a scoreboard.

6. **Mobile thumb ergonomics are mandatory.**
   All primary interactions must feel effortless one-handed.

7. **Avoid pure black overload.**
   Prefer:
   - graphite
   - charcoal
   - warm near-black
   - muted silver
   Never use empty pitch-black voids.

8. **Avoid fake terminal language.**
   Never use:
   - ASCII brackets
   - protocol jargon
   - registry terminology
   - system node language
   - hacker aesthetics

9. **Avoid excessive overlays and visual noise.**
   Grain, vignette, blur, motion, glow, chromatic drift, and scanlines must remain subtle.

10. **Never let the game become a generic AI quiz or dashboard.**
    The product should feel like:
    - a strange photography exhibit
    - a psychological perception ritual
    - an emotional ambiguity experiment

11. **If atmosphere conflicts with usability, usability wins.**

---

# Gameplay Primacy Rule

Uncanny is a playable experience first,
an atmosphere second.

No visual decision may:
- delay interaction
- weaken readability
- obscure state clarity
- reduce touch comfort
- slow understanding

Beautiful but unusable interfaces are failures.

---

# Fast Comprehension Rule

A first-time player must understand:
- what this screen is
- what action is expected
- whether they succeeded or failed
- what happens next

within 3 seconds.

If atmosphere slows understanding:
# clarity wins.

---

# Emotional Hierarchy Rule

The emotional reaction to the image
must arrive before analytics or statistics.

The player should:
1. feel
2. interpret
3. reflect

NOT:
1. read metrics
2. parse data
3. analyze UI panels

---

# Anti-Abstraction Rule

The experience should feel:
- emotionally intelligent
- psychologically restrained
- human

NOT:
- artistically self-indulgent
- confusing
- abstract for its own sake

Avoid:
- atmosphere that hides interaction
- cinematic ideas that reduce usability
- visual ambiguity that weakens gameplay clarity

---

# Atmosphere Debt Rule

Every atmospheric effect introduces atmosphere debt.

If one atmospheric layer becomes stronger,
another layer should usually become weaker.

Never simultaneously maximize:
- grain
- blur
- darkness
- vignette
- glow
- motion
- chromatic aberration
- overlays
- scanlines

The interface should feel:
- restrained
- photographic
- quiet
- intentional

NOT:
- over-processed
- noisy
- visually stacked

---

# Gameplay Readability Checklist

Before finalizing any gameplay or layout change:

- [ ] Primary gameplay CTA visible within 2 seconds
- [ ] Correct / incorrect state instantly readable
- [ ] Next action obvious
- [ ] Image remains emotional focus
- [ ] No overlay collision
- [ ] No competing UI layers
- [ ] No dense information blocks
- [ ] No unreadable image darkening
- [ ] Mobile thumb actions reachable naturally

---

# Reveal Screen Doctrine

The reveal is the emotional climax of the game.

Priority order:
1. photograph
2. emotional sentence
3. correctness
4. collective perception
5. metadata

The reveal should feel:
- quiet
- reflective
- uncomfortable
- human

Avoid:
- dashboard layouts
- excessive metrics
- giant scorecards
- analytics overload
- crowded panels

Recommended pacing:
- image visible first
- emotional sentence appears immediately
- secondary metadata delayed 1200–1500ms

---

# Cinematic Restraint Checklist

Animations and transitions must feel:
- restrained
- tactile
- calm
- cinematic

NOT:
- bouncy
- flashy
- hyperactive
- gamey

Rules:

- [ ] Max transition duration: 250ms
- [ ] Prefer soft ease-out curves
- [ ] No elastic spring motion
- [ ] No pulsing neon glows
- [ ] No looping visual noise
- [ ] No continuous HUD animation
- [ ] Grain opacity stays between 0.02–0.04
- [ ] Motion should support emotion, not distract from it

---

# Mobile Ergonomics Checklist

- [ ] Minimum touch target: 48px × 48px
- [ ] Primary interactions within lower 40% of viewport
- [ ] One-handed play possible
- [ ] Safe-area insets respected
- [ ] No unreachable corner actions
- [ ] No accidental double-tap traps
- [ ] No precision taps required during gameplay
- [ ] Overlays use pointer-events-none where appropriate

---

# Copywriting Doctrine

The tone must feel:
- observational
- cinematic
- restrained
- psychologically ambiguous
- human

Good:
- “Most people trusted this.”
- “You hesitated here.”
- “Something feels slightly wrong.”
- “This image caused uncertainty.”

Bad:
- “PROTOCOL ACTIVE”
- “REGISTRY NODE”
- “OBJECTIVE CONSENSUS”
- “SIGNAL LOCKED”

Avoid:
- AI-marketing language
- therapy language
- startup copy
- hype phrasing
- over-explanation

---

# Visual Palette Doctrine

Preferred palette:
- graphite
- charcoal
- warm near-black
- muted silver
- desaturated slate
- restrained amber accents

Avoid:
- neon purple
- bright SaaS blue
- cyberpunk magenta
- terminal green
- luxury gold overload

Accent colors should:
- guide interaction
- support emotional focus
- remain subtle

---

# Future Contribution Rulebook

Any new skill, UI system, or workflow added to Uncanny must:

1. Pass gameplay readability review
2. Preserve mobile ergonomics
3. Respect cinematic restraint
4. Keep the image as hero
5. Avoid dashboard patterns
6. Avoid growth-hacking patterns
7. Avoid monetization clutter
8. Avoid feature creep
9. Avoid visual stacking
10. Respect emotional pacing

All future contributions should support:
- silence
- tension
- uncertainty
- restraint
- photographic immersion

---

# Quality Control Lint Bar

REJECT immediately if TRUE:

- [ ] Introduces pure black overload
- [ ] Uses SaaS brand colors (#8251EE, bright blue, neon green)
- [ ] Uses cyberpunk UI language
- [ ] Uses dashboard/grid-heavy layouts
- [ ] Reduces image readability
- [ ] Makes interaction unclear
- [ ] Places primary CTA outside thumb comfort zone
- [ ] Uses bouncing spring animations
- [ ] Adds unnecessary overlays
- [ ] Adds visual noise without emotional purpose
- [ ] Prioritizes atmosphere over gameplay clarity

---

# Final Product Philosophy

Uncanny should feel like:

- a quiet perception experiment
- a cinematic photographic ritual
- an emotionally uncertain gallery
- a strange archive of believable images

The player should leave thinking:

> “Why did I trust that image?”