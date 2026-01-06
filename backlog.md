Este es un Backlog de Producto estructurado profesionalmente. Para un proyecto de ingeniería de software, dividir el trabajo en bloques de 4 horas (0.5 mandays) es una excelente práctica de estimación.
📝 Backlog: Proyecto Virus! (TypeScript + Next.js)
🏆 Épica 1: Core de Lógica y Motor de Juego (Engine)
El objetivo es tener las reglas del juego funcionando en código puro, sin interfaz gráfica.
 * [Tarea 1.1] Definición de Modelos y Tipos (Interfaces de TS).
   * Detalle: Crear enums para colores, tipos de cartas y la interfaz de GameState. (4h)
 * [Tarea 1.2] Generador de Mazo y Algoritmo de Barajado.
   * Detalle: Implementar el algoritmo Fisher-Yates y la creación del mazo completo (68 cartas). (4h)
 * [Tarea 1.3] Lógica de Validación de Jugadas (Órganos y Virus).
   * Detalle: Función canPlayCard() que valide si un color coincide o si el órgano está protegido. (4h)
 * [Tarea 1.4] Lógica de Validación de Jugadas (Medicinas y Tratamientos).
   * Detalle: Lógica específica para curar y reglas especiales de cartas de acción. (4h)
 * [Tarea 1.5] Sistema de Cambio de Turno y Condición de Victoria.
   * Detalle: Lógica para saltar turnos, robar cartas automáticamente y detectar 4 órganos sanos. (4h)
🏆 Épica 2: Infraestructura de Servidor y Tiempo Real
Configuración del canal de comunicación para el multijugador.
 * [Tarea 2.1] Configuración de Socket.io en Next.js.
   * Detalle: Setup del servidor de WebSockets integrado o paralelo a las API Routes. (4h)
 * [Tarea 2.2] Gestión de Salas (Lobby System).
   * Detalle: Lógica para crear una sala con un ID y que otros se unan mediante una URL/Código. (4h)
 * [Tarea 2.3] Sincronización del Estado del Juego.
   * Detalle: Emitir el GameState a todos los clientes cada vez que alguien realiza una acción válida. (4h)
🏆 Épica 3: Interfaz de Usuario (Frontend)
Visualización y experiencia de usuario.
 * [Tarea 3.1] Layout General y Tablero del Jugador.
   * Detalle: Grid de CSS para mostrar los 4-5 espacios de órganos y la mano del jugador. (4h)
 * [Tarea 3.2] Componente de Carta Dinámico.
   * Detalle: Creación visual de la carta que cambie según tipo y color (usando Tailwind). (4h)
 * [Tarea 3.3] Interacción de "Arrastrar y Soltar" o "Click-to-Play".
   * Detalle: Implementar la selección de una carta y el objetivo (Target) en el tablero. (4h)
 * [Tarea 3.4] Feedback Visual y Modales de Turno.
   * Detalle: Indicadores de "Es tu turno", "Has ganado" y avisos de jugadas inválidas. (4h)
🏆 Épica 4: Pulido y Reglas Especiales
Detalles que hacen que el juego sea fiel al original.
 * [Tarea 4.1] Implementación de Cartas de Tratamiento Especiales.
   * Detalle: Lógica de "Ladrón de órganos", "Trasplante" y "Error Médico". (4h)
 * [Tarea 4.2] Sistema de Descarte.
   * Detalle: Permitir al jugador descartar hasta 3 cartas si no puede o no quiere jugar. (4h)
 * [Tarea 4.3] Animaciones básicas de transición.
   * Detalle: Uso de Framer Motion para que las cartas no aparezcan de golpe. (4h)
📊 Resumen de Esfuerzo Estimado:
 * Total de Tareas: 15 tareas.
 * Esfuerzo total: 60 horas aprox. (15 días de medio tiempo).
