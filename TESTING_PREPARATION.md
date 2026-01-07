# Preparación para Pruebas Unitarias

Este documento describe los cambios realizados para preparar el repositorio para pruebas unitarias.

## Cambios Realizados

### 1. División de `src/hooks/useGameActions.ts` (438 líneas)

**Archivos creados:**

- `src/utils/cardTargetCalculator.ts` - Lógica de cálculo de objetivos válidos para cartas
  - `calculateValidTargets()` - Calcula objetivos para cualquier carta
  - `calculateEnergyTransferSources()` - Calcula fuentes para transferencia de energía
  - `calculateEnergyTransferTargets()` - Calcula destinos para transferencia de energía
  - `calculateAllPlayersWithOrgans()` - Calcula todos los jugadores con órganos
  - `calculateAllPlayersExcept()` - Calcula jugadores excepto uno específico
  - `isSingularityCard()`, `isEnergyTransferCard()` - Predicados de tipo de carta
  - `buildTargetKey()` - Construye key para validación de objetivos

- `src/utils/cardActionHelpers.ts` - Helpers para construir mensajes y obtener textos
  - `buildPlayCardMessage()` - Construye mensaje para jugar carta
  - `buildPlayEnergyTransferMessage()` - Construye mensaje para transferencia de energía
  - `buildPlaySingularityMessage()` - Construye mensaje para singularidad
  - `buildDiscardCardMessage()` - Construye mensaje para descartar carta
  - `buildEndTurnMessage()` - Construye mensaje para terminar turno
  - `getCardPlayLogMessage()` - Obtiene mensaje de log para jugar carta
  - `getEnergyTransferLogMessage()` - Obtiene mensaje de log para transferencia de energía
  - `getSingularityLogMessage()` - Obtiene mensaje de log para singularidad
  - `getCardPlayNotification()` - Obtiene notificación para jugar carta
  - `getEnergyTransferNotification()` - Obtiene notificación para transferencia de energía
  - `getSingularityNotification()` - Obtiene notificación para singularidad

**Archivo modificado:**
- `src/hooks/useGameActions.ts` - Ahora solo maneja estado y hooks, delegando lógica a los helpers

### 2. División de `src/game/validation.ts` (270 líneas)

**Archivos creados:**
- `src/game/validation/organState.ts` - Lógica de estado de órganos
  - `getOrganState()` - Determina el estado de un slot basado en sus cartas

- `src/game/validation/organ.ts` - Validaciones para cartas de órganos
  - `canPlayOrgan()` - Valida si se puede jugar un órgano

- `src/game/validation/virus.ts` - Validaciones para cartas de virus
  - `canPlayVirus()` - Valida si se puede jugar un virus

- `src/game/validation/medicine.ts` - Validaciones para cartas de medicinas
  - `canPlayMedicine()` - Valida si se puede jugar una medicina

- `src/game/validation/treatment.ts` - Validaciones para cartas de tratamiento
  - `canPlayTreatment()` - Valida si se puede jugar un tratamiento
  - Funciones internas para cada tipo de tratamiento:
    - `canPlayEnergyTransfer()`
    - `canPlayEmergencyDecompression()`
    - `canPlayDataPiracy()`
    - `canPlayQuantumDesync()`
    - `canPlayProtocolError()`
    - `canPlaySingularity()`
    - `canPlayEventHorizon()`
    - `canPlayBackupSystem()`

- `src/game/validation/index.ts` - Exportador principal
  - Exporta todas las funciones de los módulos anteriores
  - `canPlayCard()` - Función principal que delega al tipo correcto

**Archivo eliminado:**
- `src/game/validation.ts` - Reemplazado por el módulo `validation/index.ts`

### 3. División de `src/hooks/useGameSocket.ts` (225 líneas)

**Archivos creados:**
- `src/utils/socketUtils.ts` - Utilidades de conexión socket
  - `getSocketUrl()` - Construye URL del servidor de socket
  - `getPlayerName()` - Obtiene o solicita nombre del jugador
  - `getBrowserId()` - Obtiene o genera ID único del navegador

- `src/utils/socketEventHandlers.ts` - Manejadores de eventos socket
  - `setupSocketEventHandlers()` - Configura todos los handlers de eventos
  - `setupSocketConnection()` - Configura y realiza la conexión
  - `SocketCallbacks` - Interface con todos los callbacks necesarios

**Archivo modificado:**
- `src/hooks/useGameSocket.ts` - Ahora solo maneja el hook, delegando a los helpers

### 4. Utilidades Testables

**Archivos creados:**
- `src/utils/audioUtils.ts` - Utilidades de audio testables
  - `setAudioConfig()`, `getAudioConfig()` - Configuración de audio
  - `isAudioEnabled()` - Verifica si el audio está habilitado
  - `playTone()` - Función base para reproducir tonos
  - Funciones de efectos específicos:
    - `playSuccessSound()`
    - `playWarningSound()`
    - `playErrorSound()`
    - `playInfoSound()`
    - `playTurnNotificationSound()`
    - `playVirusSound()`
    - `playMedicineSound()`
    - `playDiscardSound()`
    - `playSystemSound()`

- `src/utils/notificationManager.ts` - Gestor de notificaciones
  - `Notification` - Interface de notificación
  - `NotificationType` - Tipos de notificación
  - `notificationManager` - Instancia singleton
  - Métodos:
    - `add()` - Agrega una notificación
    - `remove()` - Elimina una notificación
    - `getNotifications()` - Obtiene todas las notificaciones
    - `subscribe()` - Se suscribe a cambios
    - `clear()` - Limpia todas las notificaciones

## Beneficios para Testing

### 1. Funciones Puras
La mayoría de las nuevas funciones son puras (no tienen efectos secundarios), lo que facilita el testing:
- `calculateValidTargets()` - Recibe entradas, devuelve salidas predecibles
- `getOrganState()` - Lógica pura de determinación de estado
- Todas las funciones de `canPlay*()` - Valida condiciones sin mutar estado

### 2. Separación de Responsabilidades
- Lógica de validación separada de React hooks
- Helpers de construcción de mensajes separados de lógica de negocio
- Utilidades independientes que pueden ser testeadas en aislamiento

### 3. Mocking Fácil
- Los callbacks de socket están en una interface separada
- Las funciones de audio pueden ser mockeadas para tests
- El notificationManager puede ser testeado sin dependencias externas

### 4. Módulos Pequeños
- Archivos más pequeños son más fáciles de entender y testear
- Cada módulo tiene una responsabilidad clara
- Menos líneas por archivo = menos código en cada test suite

## Estructura de Archivos

```
src/
├── game/
│   ├── validation/
│   │   ├── index.ts          (canPlayCard + exports)
│   │   ├── organState.ts     (getOrganState)
│   │   ├── organ.ts         (canPlayOrgan)
│   │   ├── virus.ts         (canPlayVirus)
│   │   ├── medicine.ts      (canPlayMedicine)
│   │   └── treatment.ts     (canPlayTreatment)
│   ├── deck.ts
│   ├── engine.ts
│   ├── theme.tsx
│   ├── types.ts
│   └── logger.ts
├── hooks/
│   ├── useGameActions.ts    (refactorizado, usa helpers)
│   └── useGameSocket.ts     (refactorizado, usa helpers)
├── utils/
│   ├── audio.ts             (existente, compatibilidad)
│   ├── audioUtils.ts        (nuevo, testable)
│   ├── cardActionHelpers.ts (nuevo, mensajes y textos)
│   ├── cardTargetCalculator.ts (nuevo, cálculo de objetivos)
│   ├── notificationManager.ts (nuevo, gestor de notificaciones)
│   ├── socketEventHandlers.ts (nuevo, handlers socket)
│   ├── socketUtils.ts       (nuevo, utilidades socket)
│   ├── slotOperations.ts    (existente)
│   └── ...
└── ...
```

## Próximos Pasos

### Tests Recomendados

1. **`src/game/validation/`** - Tests de validación
   - `organState.test.ts` - Tests de `getOrganState()`
   - `organ.test.ts` - Tests de `canPlayOrgan()`
   - `virus.test.ts` - Tests de `canPlayVirus()`
   - `medicine.test.ts` - Tests de `canPlayMedicine()`
   - `treatment.test.ts` - Tests de todos los tratamientos

2. **`src/utils/cardTargetCalculator.test.ts`**
   - Tests de cálculo de objetivos válidos
   - Tests de casos edge (no gameState, no jugador actual, etc.)

3. **`src/utils/cardActionHelpers.test.ts`**
   - Tests de construcción de mensajes
   - Tests de generación de textos de log y notificaciones

4. **`src/utils/audioUtils.test.ts`**
   - Tests de configuración de audio
   - Tests de funcionalidad con mocks

5. **`src/utils/notificationManager.test.ts`**
   - Tests de agregar, eliminar y obtener notificaciones
   - Tests de suscripción a cambios

6. **`src/game/deck.test.ts`**
   - Tests de creación de mazo
   - Tests de barajado
   - Tests de repartición

7. **`src/game/engine.test.ts`**
   - Tests de condiciones de victoria
   - Tests de robo de cartas
   - Tests de cambio de turno

### Frameworks Recomendados

- **Jest** - Framework de testing completo
- **React Testing Library** - Para tests de componentes
- **MSW** - Para mockear requests de socket (opcional)

### Ejemplo de Test

```typescript
// src/game/validation/organState.test.ts
import { getOrganState, OrganSlot } from './organState';
import { Card, CardType, OrganState } from '../types';

describe('getOrganState', () => {
  it('should return REMOVED when no organ card', () => {
    const slot: OrganSlot = { organCard: undefined, virusCards: [], medicineCards: [] };
    expect(getOrganState(slot)).toBe(OrganState.REMOVED);
  });

  it('should return IMMUNIZED when 2 medicines', () => {
    const organ: Card = { id: '1', type: CardType.ORGAN, color: Color.RED };
    const slot: OrganSlot = { organCard: organ, virusCards: [], medicineCards: [{ id: 'm1', type: CardType.MEDICINE, color: Color.RED }, { id: 'm2', type: CardType.MEDICINE, color: Color.RED }] };
    expect(getOrganState(slot)).toBe(OrganState.IMMUNIZED);
  });

  it('should return INFECTED when 1 virus', () => {
    const organ: Card = { id: '1', type: CardType.ORGAN, color: Color.RED };
    const slot: OrganSlot = { organCard: organ, virusCards: [{ id: 'v1', type: CardType.VIRUS, color: Color.RED }], medicineCards: [] };
    expect(getOrganState(slot)).toBe(OrganState.INFECTED);
  });

  // ... más tests
});
```

## Compatibilidad

Todos los cambios son retrocompatibles:
- Los exports originales de `src/game/validation.ts` están disponibles en `src/game/validation/index.ts`
- Los hooks originales mantienen la misma API
- Los archivos existentes que importan desde estos módulos seguirán funcionando

## Notas Adicionales

- Los archivos de servidor (`src/server/game-manager.ts`, `src/server/rooms.ts`) aún requieren refactorización similar
- Los componentes grandes (`Card.tsx`, `app/room/[id]/page.tsx`) podrían beneficiarse de extraer lógica en custom hooks
- Se recomienda configurar Jest con `ts-jest` para soporte de TypeScript
- Considerar agregar scripts de test en `package.json`:
  ```json
  {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
  ```
