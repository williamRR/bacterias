

Aquí tienes el documento reglas.md. Este archivo no es solo un manual de instrucciones, sino una especificación técnica que traduce las reglas del juego físico a lógica de programación (condicionales, estados y validaciones).
📜 Especificación Técnica de Reglas: Virus!
Este documento detalla la lógica de negocio que debe implementar el GameEngine para asegurar la integridad del juego.
1. El Estado de los Órganos (Máquina de Estados)
Un órgano en el cuerpo de un jugador puede estar en uno de los siguientes 5 estados. La lógica debe validar las transiciones:
| Estado | Composición (Cartas) | Descripción |
|---|---|---|
| Sano | 1 Órgano | Estado inicial al jugar un órgano. |
| Infectado | 1 Órgano + 1 Virus | El órgano no cuenta para ganar. |
| Vacunado | 1 Órgano + 1 Medicina | Protegido contra 1 virus. |
| Inmunizado | 1 Órgano + 2 Medicinas | Estado Final. No puede recibir virus ni ser robado/cambiado. |
| Extirpado | N/A | El órgano y sus cartas asociadas van al descarte (ocurre tras el 2º virus). |
2. Reglas de Validación (Conflictos)
2.1. Colores y Compatibilidad
 * Regla de Oro: Una carta de Virus o Medicina solo puede jugarse sobre un órgano del mismo color, a excepción de las cartas Multicolor.
 * Multicolor (Organ): Puede recibir virus o medicinas de cualquier color, pero basta con un virus de cualquier color para infectarlo.
 * Multicolor (Virus/Medicina): Puede afectar a cualquier órgano independientemente de su color.
2.2. Interacciones de Cartas
 * Virus sobre Órgano Sano → Estado: Infectado.
 * Virus sobre Órgano Vacunado → Se descartan el Virus y la Medicina. El Órgano queda Sano.
 * Virus sobre Órgano Infectado → Se descartan el Órgano y los 2 Virus (Extirpación).
 * Medicina sobre Órgano Sano → Estado: Vacunado.
 * Medicina sobre Órgano Infectado → Se descartan la Medicina y el Virus. El Órgano queda Sano.
 * Medicina sobre Órgano Vacunado → Estado: Inmunizado (se apilan las 2 medicinas).
3. Dinámica de Turnos y Flujo
 * Inicio de Turno: El jugador activo debe tener siempre 3 cartas en la mano (al inicio del juego).
 * Acción (Obligatoria): El jugador debe elegir una de estas dos opciones:
   * Jugar una carta: Aplicarla a su cuerpo, al de un rival o al mazo de descartes (Tratamientos).
   * Descartar: Tirar de 1 a 3 cartas de su mano al mazo de descartes.
 * Final de Turno:
   * El sistema verifica si el jugador actual ha cumplido la Condición de Victoria.
   * El jugador roba del mazo hasta volver a tener 3 cartas.
   * Se transfiere el token de turno al siguiente jugador ((index + 1) % totalPlayers).
4. Lógica de Cartas de Tratamiento (Acciones Especiales)
Estas cartas no se quedan en el tablero, van directo al descarte tras ejecutar su efecto:
 * Transplante: Intercambia un órgano entre dos jugadores (incluyéndote). Restricción: No se pueden intercambiar órganos del mismo color ni órganos inmunizados.
 * Ladrón de Órganos: Robas un órgano de un rival y lo pones en tu cuerpo. Restricción: No puede ser un color que ya tengas o un órgano inmunizado.
 * Contagio: Pasa tantos virus de tus órganos como puedas a los órganos de tus rivales.
 * Guante de Látex: Todos los demás jugadores descartan su mano completa. Pierden su turno de "jugar" pues solo podrán "robar" en su siguiente turno.
 * Error Médico: Intercambia todo tu cuerpo (órganos y sus cartas) con el de otro jugador.
5. Condición de Victoria
Un jugador es declarado ganador instantáneamente cuando su cuerpo contiene:
 * 4 Órganos de colores diferentes.
 * Todos deben estar Sanos, Vacunados o Inmunizados (ninguno infectado).
Próximo Paso Sugerido:
Ahora que tienes el Backlog y las Reglas, ¿te gustaría que te ayude con la Tarea 1.1 del backlog? Puedo escribir el archivo types.ts con todas estas definiciones para que empieces a codear el motor.
