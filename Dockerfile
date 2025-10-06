# Usamos la imagen base de Nginx ligera
FROM nginx:alpine

# Copiamos todos los archivos del proyecto a la carpeta donde Nginx sirve la web
COPY . /usr/share/nginx/html

# Exponemos el puerto 80 (para acceder desde el navegador)
EXPOSE 80
