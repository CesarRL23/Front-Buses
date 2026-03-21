# Microservicio de Seguridad - Buses Inteligentes

Frontend del microservicio de autenticación y seguridad para el sistema de Buses Inteligentes. Implementado con React 18, TypeScript, y datos simulados (mock).

## Características

### Funcionalidades Implementadas

- **Login**: Autenticación con email y contraseña
- **Registro**: Creación de cuenta con validación de contraseña
- **Recuperación de Contraseña**: Simulación de envío de email
- **Verificación 2FA**: Código de 6 dígitos con contador regresivo
- **Dashboard**: Panel principal con estadísticas simuladas
- **Perfil de Usuario**: Visualización y edición de datos personales

### Características Técnicas

- TypeScript con tipado estricto
- Context API para gestión de autenticación
- React Router DOM para navegación
- TailwindCSS para estilos
- Componentes reutilizables
- Arquitectura modular y escalable
- Sin conexión a backend real (100% simulado)

## Estructura del Proyecto

```
src/
├── app/
│   └── AppRoutes.tsx           # Configuración de rutas
├── pages/
│   ├── Login.tsx               # Página de inicio de sesión
│   ├── Register.tsx            # Página de registro
│   ├── Dashboard.tsx           # Panel principal
│   ├── Profile.tsx             # Perfil de usuario
│   ├── ForgotPassword.tsx      # Recuperación de contraseña
│   └── TwoFactor.tsx           # Verificación 2FA
├── components/
│   ├── Navbar.tsx              # Barra de navegación
│   ├── PrivateRoute.tsx        # Protección de rutas
│   ├── FormInput.tsx           # Input reutilizable
│   └── PasswordStrengthIndicator.tsx  # Indicador de fortaleza
├── context/
│   └── AuthContext.tsx         # Contexto de autenticación
├── services/
│   └── authService.ts          # Servicio de autenticación simulado
├── types/
│   └── auth.types.ts           # Tipos TypeScript
├── hooks/
│   └── useAuth.ts              # Hook personalizado
├── utils/
│   └── fakeJwt.ts              # Utilidades JWT simuladas
└── main.tsx
```

## Instalación y Ejecución

### Prerrequisitos

- Node.js 18 o superior
- npm o yarn

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:5173`

### Build de Producción

```bash
npm run build
```

### Preview de Build

```bash
npm run preview
```

## Credenciales de Prueba

### Usuario Administrador
- **Email**: admin@buses.com
- **Contraseña**: Password123!
- **2FA**: 123456

### Usuario Regular
- **Email**: user@buses.com
- **Contraseña**: Password123!

## Rutas Disponibles

| Ruta | Descripción | Protegida |
|------|-------------|-----------|
| `/login` | Inicio de sesión | No |
| `/register` | Registro de usuario | No |
| `/forgot-password` | Recuperación de contraseña | No |
| `/two-factor` | Verificación 2FA | Sí |
| `/dashboard` | Panel principal | Sí |
| `/profile` | Perfil de usuario | Sí |

## Tecnologías Utilizadas

- **React 18**: Biblioteca UI
- **TypeScript**: Tipado estático
- **Vite**: Build tool y dev server
- **React Router DOM**: Navegación
- **TailwindCSS**: Estilos
- **Lucide React**: Iconos
- **Context API**: Gestión de estado
- **Axios**: Cliente HTTP (preparado, no usado)

## Características de Seguridad Simuladas

- JWT falso generado localmente
- Validación de fortaleza de contraseña
- Autenticación de dos factores (2FA)
- Rutas protegidas con PrivateRoute
- Tokens almacenados en localStorage

## Notas Importantes

- **NO** hay conexión a backend real
- **NO** hay seguridad real implementada
- **NO** se consumen APIs reales
- **TODO** funciona con datos simulados
- El objetivo es **SOLO** la capa de presentación
- Los botones OAuth (Google, Microsoft, GitHub) son solo UI

## Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linter ESLint
npm run typecheck    # Verificación de tipos TypeScript
```

## Validaciones Implementadas

### Registro
- Nombre y apellido requeridos
- Email con formato válido
- Contraseña con:
  - Mínimo 8 caracteres
  - Al menos una mayúscula
  - Al menos una minúscula
  - Al menos un número
  - Al menos un carácter especial
- Confirmación de contraseña
- Aceptación de términos

### Login
- Email con formato válido
- Contraseña requerida
- Manejo de errores

### 2FA
- Código de 6 dígitos numéricos
- Contador regresivo de 60 segundos
- Opción de reenvío de código

## Próximos Pasos (No Implementados)

Para convertir este frontend en una aplicación funcional:

1. Conectar a un backend real
2. Implementar autenticación OAuth real
3. Usar JWT reales
4. Implementar encriptación de contraseñas
5. Conectar a una base de datos
6. Implementar refresh tokens
7. Agregar rate limiting
8. Implementar HTTPS
9. Agregar pruebas unitarias e integración
10. Implementar CI/CD

## Licencia

Este es un proyecto de demostración sin licencia específica.
