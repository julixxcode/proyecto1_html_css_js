Proyecto 1 – HTML + CSS + JavaScript (Consumo de API ToDo)

Este proyecto corresponde al Parcial 2 y consiste en una aplicación web que consume una API pública de tareas.
Fue desarrollado con HTML, CSS y JavaScript puro, siguiendo los estándares solicitados: consumo de API, diseño responsive, dockerización y despliegue.

📌 Características principales

Interfaz construida en HTML + CSS + JS puro.

Consumo de todos los endpoints de la API 👉 https://todoapitest.juansegaliz.com/todos
:

Crear tarea

Listar todas las tareas

Consultar tarea individual

Actualizar tarea

Eliminar tarea

Validaciones básicas en el frontend para evitar datos incompletos.

Diseño responsive con media queries.

Dockerización lista para ejecutar en cualquier entorno.

Publicación en Docker Hub y repositorio en GitHub.

🚀 Requisitos previos

Tener instalado Docker
.

(Opcional) Tener instalado Docker Compose
.

🛠️ Estructura del proyecto
proyecto1_html_css_js/
│
├── index.html
├── styles.css
├── script.js
├── Dockerfile
├── docker-compose.yml          # Para build + run local
└── docker-compose.run.yml      # Para ejecutar desde Docker Hub

🐳 Dockerización
1. Construir y correr localmente

Con este comando se construye la imagen a partir del Dockerfile y se levanta un contenedor en el puerto 8080:

docker-compose up --build


Luego, acceder desde el navegador a:
👉 http://localhost:8080

2. Ejecutar desde Docker Hub

La imagen también está publicada en Docker Hub:
👉 julian1511/proyecto1_html_css_js:latest

Para correr directamente esa imagen:

docker-compose -f docker-compose.run.yml up -d

📦 Archivos Docker Compose
docker-compose.yml (build + run)
version: '3.8'

services:
  proyecto1:
    build: .
    container_name: proyecto1_html_css_js
    ports:
      - "8080:80"
    restart: unless-stopped

docker-compose.run.yml (run desde Docker Hub)
version: '3.8'

services:
  proyecto1:
    image: julian1511/proyecto1_html_css_js:latest
    container_name: proyecto1_html_css_js
    ports:
      - "8080:80"
    restart: unless-stopped

📚 Documentación técnica
🔹 Diferencia entre endpoint y recurso

Recurso: elemento principal expuesto por la API (en este caso, las tareas).

Endpoint: la URL específica que permite realizar operaciones sobre el recurso (/todos, /todos/{id}).

🔹 Manejo de JSON en el frontend

La API devuelve datos en formato JSON, que se procesan con fetch() en el frontend para mostrar, crear, actualizar o eliminar tareas dinámicamente en el DOM.

🔹 Dockerización

El Dockerfile usa la imagen base nginx para servir los archivos estáticos (HTML, CSS, JS).

Se configuró el puerto 80 en el contenedor y se expone en el host en el puerto 8080.

Se subió la imagen a Docker Hub para facilitar la ejecución sin necesidad de compilar.

📸 Evidencias

Capturas del CRUD funcionando.

Contenedor corriendo en Docker Desktop.

Imagen publicada en Docker Hub.

Código en GitHub.

(Aquí puedes pegar tus propios pantallazos según el reporte del parcial.)

📌 Autor

Nombre: Julian Murcia

GitHub: julixxcode

Docker Hub: julian1511
