# Usar Node.js 18 Alpine para un tamaño menor
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente compilado
COPY dist/ ./dist/
COPY tsconfig.json ./

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appointment -u 1001

# Cambiar propiedad de archivos al usuario nodejs
RUN chown -R appointment:nodejs /app
USER appointment

# Exponer puerto
EXPOSE 3002

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3002

# Comando para iniciar la aplicación
CMD ["npm", "start"] 