# Sprite Generator for GameMaker

Una web privada diseñada para generar hojas de sprite pixel art retro 8-bit a partir de una sola imagen del personaje.

## Qué hace

- El usuario sube una imagen PNG del personaje.
- Elige la animación deseada: walk, idle, jump, attack, hurt, run.
- Elige la dirección: right, left, front, back.
- El sistema genera 12 frames con estilo retro 8-bit.
- Compone una hoja final con fondo transparente, lista para importar en GameMaker.

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
npm install
cp .env.example .env
npm start
```

Luego abre:

- http://localhost:3000

## Estructura

- `server.js`: servidor HTTP
- `public/`: frontend web
- `src/services/spriteService.js`: lógica para generar la hoja de sprite
- `generated/`: salida final del sprite sheet y el JSON

## Nota importante

Esta versión incluye una lógica de composición procedimental de 12 frames para funcionar sin depender de una clave de IA. El proyecto está preparado para integrar un flujo de IA más avanzado con Replicate si luego se activa `REPLICATE_API_TOKEN`.

## Salida

La app genera:

- una imagen PNG con la hoja de sprite
- un JSON con metadata del sprite

## Importar en GameMaker

1. Importa la hoja PNG.
2. Configura la resolución del frame (por ejemplo `64x64`).
3. Ajusta columnas y filas: `4 columnas / 3 filas`.
4. Usa velocidad de animación apropiada.

