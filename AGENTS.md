# AGENTS.md - Agent Development Guidelines

## Project Overview

This is a multiplayer card game "Virus!" built with Next.js 14, TypeScript, Socket.IO, and Tailwind CSS. Players manage organs, viruses, and medicines in a turn-based multiplayer environment.

## Build Commands

```bash
# Development
npm run dev           # Start dev server on port 3001

# Production
npm run build         # Build for production
npm run start         # Start production server

# Code Quality
npm run lint          # Run ESLint
```

## Testing

This project uses manual testing scripts in the root directory:
- `test-socket.js` - Socket connection testing
- `test-create-room.js` - Room creation testing
- `test-full-game.js` - End-to-end game flow testing
- `debug-playwright.js` - Playwright browser automation

Run tests with Node.js:
```bash
node test-socket.js
```

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

### Naming Conventions
- **Enums**: PascalCase with UPPER_CASE values (e.g., `CardType.ORGAN`)
- **Variables/Functions**: camelCase (e.g., `handleGameAction`)
- **Components**: PascalCase (e.g., `GameBoard`)
- **Constants**: UPPER_CASE (e.g., `MAX_CARDS`)
- **Files**: camelCase for logic, PascalCase for components

### Component Structure
- Define interfaces for props at top
- Use TypeScript for all props
- Tailwind CSS classes for styling
- Example:
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

### Comments
- Minimal inline comments
- Export functions instead of classes
- Use enum for game constants (colors, card types, states)

## Architecture

### Frontend (Next.js App Router)
- `src/app/` - Pages and layouts
- `src/components/` - React components
- `src/game/` - Game logic shared between client/server

### Backend (Custom Server)
- `server.ts` - Entry point with Socket.IO integration
- `src/server/rooms.ts` - Room management
- `src/server/game-manager.ts` - Game state and action handling

### Types
- Centralized in `src/game/types.ts`
- Export all enums and interfaces
- Use for both client and server code

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
