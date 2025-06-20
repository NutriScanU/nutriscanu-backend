    # Usar la imagen base oficial de Node.js
    FROM node:18

    # Crear un directorio de trabajo dentro del contenedor
    WORKDIR /app

    # Copiar los archivos del proyecto al contenedor
    COPY . .

    # Instalar las dependencias del backend
    RUN npm install

    # Descargar el script wait-for-it.sh para esperar a que la base de datos esté lista
    COPY wait-for-it.sh /wait-for-it.sh
    RUN chmod +x /wait-for-it.sh

    # Exponer el puerto donde el backend estará corriendo
    EXPOSE 5000

    # Comando para esperar que PostgreSQL esté disponible antes de iniciar el backend
    CMD /wait-for-it.sh db:5432 -- node server.js