# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Misión Espacial: S.O.S. Galaxia** - A multiplayer turn-based card game with a space theme. Players act as crew members repairing critical ship systems (Motor, Oxígeno, Navegación, Escudos). The game is a Spanish-localized adaptation of the "Virus!" card game mechanic.

## Commands

```bash
# Development
npm run dev           # Start dev server on http://0.0.0.0:3012

# Production
npm run build         # Build Next.js app
npm run start         # Start production server (NODE_ENV=production)

# Code quality
npm run lint          # Run ESLint
```

## Architecture

### Client-Server Model
- **Server**: Node.js with Socket.IO (`src/server/server.ts`)
- **Client**: Next.js 14 with React 18
- **Communication**: Real-time bidirectional events via Socket.IO
- **Room sessions**: 6-character codes, max 4 players, in-memory storage

### Server Structure
- **`server.ts`**: HTTP server + Socket.IO setup, connection handling
- **`rooms.ts`**: Room management (create/join/delete), player tracking, game initialization
- **`game-manager.ts`**: Game action processing, treatment card effects, state broadcasting via `broadcastGameState()`

### Game Engine (`src/game/`)
- **`types.ts`**: Core TypeScript interfaces (Card, Player, GameState, enums)
- **`engine.ts`**: Turn management, victory checking, card playing mechanics
- **`validation.ts`**: Move validation, rule enforcement (`canPlayCard()`, etc.)
- **`deck.ts`**: Card generation and shuffling
- **`body-utils.ts`**: Organ slot management (`getSlotFromBody()`, `setSlotInBody()`, `getBodyEntries()`)
- **`theme.ts`**: Spanish localization and space theme mappings

### Client Structure
- **`app/page.tsx`**: Main menu (room creation/join)
- **`app/create-room/page.tsx`**: Player name input and room creation
- **`app/room/[id]/page.tsx`**: Main game interface (800+ lines, complex state + Socket.IO client)
- **`components/GameBoard.tsx`**: Player system display with drag-and-drop
- **`components/Hand.tsx`**: Player's hand
- **`components/Card.tsx`**: Individual card component

## Game Mechanics

### Card Types (Spanish theme)
- **SISTEMA (ORGAN)**: Ship systems (Motor=RED, Oxígeno=BLUE, Navegación=GREEN, Escudos=YELLOW)
- **SABOTAJE (VIRUS)**: Attack cards that infect systems
- **REPARACIÓN (MEDICINE)**: Defense/repair cards
- **ACCIÓN (TREATMENT)**: Special abilities with unique effects

### Treatment Cards
- **INTERCAMBIO DE PIEZAS (TRANSPLANT)**: Swap systems between players (3 copies in deck)
- **ROBO DE PIEZAS (ORGAN_THIEF)**: Steal opponent's system with its upgrades (3 copies in deck)
- **SOBRECARGA DE RED (CONTAGION)**: Spread your viruses to other players (3 copies in deck)
- **INTERFERENCIA ELECTROMAGNÉTICA (LATEX_GLOVE)**: Force all opponents to discard hand (2 copies in deck)
- **FALLO DE TELETRANSPORTE (MEDICAL_ERROR)**: Swap entire body with another player (3 copies in deck)

**MEDICAL_ERROR UI Flow**:
1. Player selects the MEDICAL_ERROR card
2. Warning message appears explaining the effect (swap ALL systems)
3. Player must click on ANY opponent's system to select that player
4. "Cancel Operation" button available to abort
5. On confirmation, entire bodies are swapped between the two players

### System States
- **OPERATIVO (HEALTHY)**: Normal working state
- **AVERIADO (INFECTED)**: Has 1 virus, doesn't count toward victory
- **PROTEGIDO (VACCINATED)**: Has 1 medicine, blocks 1 virus
- **BLINDADO (IMMUNIZED)**: Has 2 medicines, fully protected
- **DESTRUIDO (REMOVED)**: Destroyed by 2 viruses, slot empty

### Victory Condition
First player to have all 4 systems installed (one of each color) in OPERATIVO, PROTEGIDO, or BLINDADO state wins.

### Turn Flow
1. Player must perform at least 1 action per turn
2. Actions: play any card, or discard up to 2 cards
3. After actions, refill hand to 3 cards from deck
4. Turn passes to next player

## Key Implementation Details

### State Synchronization
- `serializeGameState()` in `game-manager.ts` converts Map to Record for JSON serialization
- Client receives `game-state` events with full state update
- Turn validation enforced server-side (`currentPlayerIndex` check)

### Treatment Card Logic
Treatment cards have complex effects handled in `handleTreatmentCard()`:
- **TRANSPLANT**: Can swap organs between any two players (including self)
- **ORGAN_THIEF**: Steals organ AND preserves virus/medicine cards on it
- **CONTAGION**: Spreads viruses from infected systems to other players' same-colored systems
- **LATEX_GLOVE**: Affects all OTHER players (not the caster)
- **MEDICAL_ERROR**: Swaps entire bodies between two players

### Room Management
- Rooms auto-delete after 5 minutes of being empty
- Late joins allowed: new players dealt cards from existing deck
- Player disconnection handled with cleanup
- Max 4 players per room

### Spanish Localization
All UI text is in Spanish via `theme.ts`:
- Card types: SISTEMA, SABOTAJE, REPARACIÓN, ACCIÓN
- System names: MOTOR, OXÍGENO, NAVEGACIÓN, ESCUDOS
- State names: OPERATIVO, AVERIADO, PROTEGIDO, BLINDADO, DESTRUIDO
- UI labels: Turn indicators, action buttons, status messages

## Styling

- **Space theme**: Cyan/blue neon colors, starfield background animation
- **Tailwind CSS** with custom theme in `tailwind.config.ts`
- **Visual feedback**: Drag targets highlight, invalid moves show errors
- **Responsive**: Works on mobile and desktop
- **Icons**: Emojis for systems (🔧 Motor, 💨 Oxígeno, 🧭 Navegación, 🛡️ Escudos, 🖥️ Sistema Operativo)
