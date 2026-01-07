# AGENTS.md - Agent Development Guidelines

## Project Overview

This is a multiplayer card game "Virus!" built with Next.js 14, TypeScript, Socket.IO, and Tailwind CSS. Players manage organs, viruses, and medicines in a turn-based multiplayer environment.

## Build Commands

```bash
# Development
npm run dev           # Start dev server on port 3001 (Next.js)
npm run dev:server    # Start only custom server with Socket.IO

# Production
npm run build         # Build Next.js for production
npm run start         # Start production server (Next.js + custom server)
npm run start:next    # Start Next.js production server only

# Code Quality
npm run lint          # Run ESLint (fix all errors before committing)

# Asset Generation
npm run generate-assets              # Generate all game assets
npm run generate-assets:cards        # Generate card assets only
npm run generate-assets:icons        # Generate icon assets only
npm run generate-assets:backgrounds  # Generate background assets only

# Simulation
npm run simulate              # Run game simulation
npm run simulate:quick        # Run 1000 simulations with verbose output
npm run simulate:debug       # Run 100 simulations with verbose output
npm run analyze:deck         # Analyze deck balance
```

## Testing

### Manual Testing Scripts (Root Directory)
- `test-socket.js` - Socket connection testing
- `test-create-room.js` - Room creation testing
- `test-full-game.js` - End-to-end game flow testing
- `test-create-room-simple.js` - Simple room creation test
- `test-create-room-debug.js` - Debug room creation with logging
- `test-create-room-playwright.js` - Playwright browser automation

Run a single test:
```bash
node test-socket.js
node test-create-room.js
node test-full-game.js
```

### Unit Testing Structure
The codebase is prepared for unit testing with modularized, testable functions:

**Game Logic Tests** (src/game/validation/):
- `organState.test.ts` - Test organ state calculations
- `organ.test.ts` - Test organ card validation
- `virus.test.ts` - Test virus card validation
- `medicine.test.ts` - Test medicine card validation
- `treatment.test.ts` - Test all treatment cards

**Utility Tests**:
- `src/utils/cardTargetCalculator.test.ts` - Test target calculation logic
- `src/utils/cardActionHelpers.test.ts` - Test message building and text generation
- `src/utils/audioUtils.test.ts` - Test audio utilities with mocks
- `src/utils/notificationManager.test.ts` - Test notification management

**Engine Tests**:
- `src/game/engine.test.ts` - Test game state operations
- `src/game/deck.test.ts` - Test deck creation and shuffling

### Testing Guidelines
- Test pure functions from validation and utilities modules first
- Use Jest with `ts-jest` for TypeScript support
- Test edge cases: empty inputs, null values, boundary conditions
- Mock external dependencies: socket.io, audio context, localStorage
- Focus on testing game logic and business rules over UI interactions

## Code Style Guidelines

### Imports
- Use absolute imports with `@/` alias for src files
- Group imports: React/external → internal modules
- Example: `import { GameState } from '@/game/types';`

### File Naming
- Components: `PascalCase.tsx` (e.g., `GameBoard.tsx`)
- Utilities/Logic: `camelCase.ts` (e.g., `gameManager.ts`)
- Types: `types.ts` or `interfaces.ts`
- Next.js pages: `page.tsx`, `layout.tsx`

### TypeScript
- Strict mode enabled in `tsconfig.json`
- Explicit return types for exported functions
- Use `interface` for object shapes, `type` for unions/primitives
- Type guards: `function isMapBody(body: any): body is Map<Color, OrganSlot>`
- Export enums/interfaces from `types.ts` for reuse

### Naming Conventions
- **Enums**: PascalCase with UPPER_CASE values (e.g., `CardType.ORGAN`)
- **Variables/Functions**: camelCase (e.g., `handleGameAction`)
- **Components**: PascalCase (e.g., `GameBoard`)
- **Constants**: UPPER_CASE (e.g., `MAX_CARDS`)
- **Files**: camelCase for logic, PascalCase for components

### Component Structure
```tsx
interface CardProps {
  card: CardType;
  onClick?: () => void;
}

export default function Card({ card, onClick }: CardProps) {
  // component logic
}
```

### Error Handling
- Use try-catch for async operations
- Return boolean for success/failure where appropriate
- Validate inputs before processing
- Console.log for debugging (remove in production)

### Data Structures
- Use `Map` for player body slots internally, serialize to objects for transport
- Type guards for handling Map vs Record: `instanceof Map` checks
- Immutability: spread operators for copying objects

### Server-Side
- Socket.IO for real-time communication
- Room-based architecture: `join-room`, `create-room`, `game-action` events
- Serialize complex types (Maps) before socket transmission
- Event naming: kebab-case for socket events

### Formatting
- No Prettier config - use ESLint
- Indent with 2 spaces (default TypeScript)
- Trailing commas in objects/arrays
- Arrow functions for callbacks, named functions for exports

### Game Logic
- Separate validation (`validation.ts`) from game engine (`engine.ts`)
- Pure functions where possible
- Update game state, then broadcast via Socket.IO
- Check victory conditions after each turn

### State Management
- Server holds authoritative game state
- Client sends actions to server
- Server broadcasts updated state to all players
- Use type guards for type narrowing: `body is Map<Color, OrganSlot>`

## Architecture

### Frontend (Next.js App Router)
- `src/app/` - Pages and layouts
- `src/components/` - React components
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions

### Backend (Custom Server)
- `server.ts` - Entry point with Socket.IO integration
- `src/server/rooms.ts` - Room management
- `src/server/game-manager.ts` - Game state and action handling

### Game Logic (Shared)
- `src/game/types.ts` - Centralized type definitions
- `src/game/engine.ts` - Game state engine
- `src/game/validation.ts` - Action validation
- `src/game/deck.ts` - Card deck management

## Common Patterns

### Type Guard Example
```ts
function isMapBody(body: any): body is Map<Color, OrganSlot> {
  return body instanceof Map;
}
```

### Socket Event Handler
```ts
socket.on('game-action', ({ roomId, action }) => {
  handleGameAction(roomId, socket.id, action);
});
```

### Game State Update
```ts
// Update state
playCard(gameState, player, card);

// Broadcast to all players in room
broadcastGameState(roomId, gameState);

// Advance turn
nextTurn(gameState);
broadcastGameState(roomId, gameState);
```

## Notes

- Server runs on port 3001
- Experimental dev origins enabled for local network access
- Both Map and Record supported for body slots (for serialization)
- TypeScript strict mode enforced - fix all type errors before committing
