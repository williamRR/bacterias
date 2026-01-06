#!/bin/bash

# Instalar dependencias
npm ci --production=false

# Construir Next.js
npm run build

# Iniciar servidor
npm start
