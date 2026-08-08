# Paramedic Rescue

A Pokémon-style paramedic simulation game. Walk a small town, respond to
emergency calls, triage and treat patients, manage your medical supplies,
and level up your EMT skills — built with TypeScript and HTML5 Canvas, no
game framework, no external assets.

## Why Canvas + TypeScript, no engine

The game is designed to be playable as a single self-contained HTML file
inside Claude's Artifact viewer (e.g. on an iPad, no install/hosting
needed), which requires everything inlined into one file well under 16MB.
A hand-rolled canvas engine with procedurally-drawn tiles/sprites keeps the
whole game to well under 1MB.

## Development

```sh
npm install
npm run dev          # watch + serve at http://localhost:8000
npm run typecheck
```

## Building the playable artifact

```sh
npm run build:artifact
```

Produces `dist/artifact/paramedic-rescue.html` — a single self-contained
file (no external requests) that can be opened directly in a browser or
published via Claude's Artifact tool.

## Controls

- Move: Arrow keys / WASD, or the on-screen d-pad (touch)
- Confirm / interact: Enter, Space, Z, or the on-screen "A" button
- Cancel / back: Escape, X, or the on-screen "B" button
- Menu: I, Tab, or the on-screen "≡" button

## Project structure

See `src/engine` (game loop, scenes, input, rendering), `src/scenes`
(Title, Overworld, Patient Encounter, Station, overlays), `src/world`
(tile map, camera, procedural rendering), `src/data` (patients, items,
treatments, progression), and `src/systems` (encounter, vitals,
inventory, progression, save).
