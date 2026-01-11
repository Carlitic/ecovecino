# Eco Vecinos - Gestión de Comunidades 🏢✨

**Eco Vecinos** es una plataforma web moderna e intuitiva diseñada para simplificar la gestión de comunidades de vecinos. Permite digitalizar la comunicación y administración de fincas, facilitando la vida tanto a presidentes como a propietarios e inquilinos.

### 🌐 Demo en Vivo
Puedes ver el proyecto funcionando aquí:  
👉 **[https://carlitic.github.io/ecovecino/](https://carlitic.github.io/ecovecino/)**

## 🚀 Características Principales

La aplicación está dividida en paneles según el rol del usuario, asegurando que cada persona tenga acceso a las herramientas que necesita.

### 👥 Gestión de Roles
*   **Super Admin**: Gestor global de la plataforma. Puede crear nuevas comunidades y asignar presidentes.
*   **Presidente**: Administrador de una comunidad específica. Gestiona vecinos, convoca juntas y modera el tablón.
*   **Vecino (Propietario/Inquilino)**: Residente que puede reportar incidencias, ver anuncios y asistir a juntas.

### 🛠 Funcionalidades
*   **📋 Tablón de Anuncios**: Espacio digital para comunicados oficiales (ej. cortes de agua) y servicios de contacto (fontaneros, electricistas).
*   **⚠️ Gestión de Incidencias**: Sistema para reportar averías (luz fundida, puerta rota). Los vecinos crean el aviso y el presidente actualiza el estado (Pendiente -> En Proceso -> Resuelta).
*   **📹 Juntas Online**: Convocatoria de reuniones con integración de videollamadas (Jitsi) para que los vecinos puedan asistir desde casa.
*   **📒 Agenda de Vecinos**: Base de datos de propietarios e inquilinos, gestionada por el presidente y administradores.
*   **🏢 Gestión Multi-Comunidad**: (Super Admin) Capacidad para gestionar múltiples comunidades desde un solo panel.

## 💻 Tecnologías Utilizadas

Este proyecto ha sido construido utilizando las últimas tecnologías web para asegurar rendimiento y escalabilidad:

*   **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Estilos**: CSS3 Moderno (Variables, Flexbox, Grid) + Diseño **Responsive con Drawer Lateral** para móviles.
*   **Backend & Base de Datos**: [Appwrite](https://appwrite.io/) 🚀
    *   **Authentication**: Gestión segura de usuarios, sesiones y roles.
    *   **Database**: Base de datos relacional para comunidades, usuarios e incidencias.
    *   **Hosting**: Despliegue en GitHub Pages (SPA via HashRouter).

## 📦 Instalación y Despliegue

Para ejecutar este proyecto en local:

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/carlitic/ecovecino.git
    cd ecovecino
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar Appwrite**:
    *   Crea un proyecto en Appwrite Cloud.
    *   Copia tu `Project ID`, `Database ID` y `Collection IDs` en un archivo `.env` (usa `.env.example` como guía).

4.  **Ejecutar en desarrollo**:
    ```bash
    npm run dev
    ```

5.  **Construir para producción**:
    ```bash
    npm run build
    ```

---
Diseñado y desarrollado para facilitar la convivencia vecinal. 🏡🤝
