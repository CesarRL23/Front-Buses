# Instrucciones de Uso - Microservicio de Seguridad

## Inicio Rápido

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

El proyecto estará disponible en: `http://localhost:5173`

## Navegación por el Sistema

### Paso 1: Registro de Usuario

1. Abre el navegador en `http://localhost:5173`
2. Serás redirigido automáticamente a `/login`
3. Haz clic en "Regístrate aquí" en la parte inferior
4. Completa el formulario de registro:
   - **Nombre**: Tu nombre
   - **Apellido**: Tu apellido
   - **Email**: Un email válido (puede ser ficticio)
   - **Contraseña**: Debe cumplir con:
     - Mínimo 8 caracteres
     - Al menos una mayúscula
     - Al menos una minúscula
     - Al menos un número
     - Al menos un carácter especial
   - **Confirmar Contraseña**: Repite la contraseña
5. Acepta los términos y condiciones
6. Haz clic en "Crear Cuenta"
7. Serás redirigido al Dashboard

### Paso 2: Login con Usuario Existente

1. En la página de login, usa las credenciales de prueba:
   - **Email**: `admin@buses.com`
   - **Contraseña**: `Password123!`
2. Haz clic en "Iniciar Sesión"
3. Serás redirigido a la página de verificación 2FA

### Paso 3: Verificación 2FA

1. En la página de 2FA, ingresa el código: `123456`
2. El código se puede ingresar:
   - Escribiendo dígito por dígito
   - Pegando el código completo
3. Haz clic en "Verificar Código"
4. Serás redirigido al Dashboard

### Paso 4: Explorar el Dashboard

El Dashboard muestra:
- Estadísticas simuladas de buses activos
- Usuarios totales
- Rutas activas
- Alertas del día
- Actividad reciente
- Rutas populares

### Paso 5: Ver y Editar Perfil

1. Haz clic en tu nombre en la barra de navegación
2. O haz clic en el icono de usuario
3. Verás tu información personal:
   - Nombre y apellido
   - Email
   - Teléfono
   - Roles asignados
   - Estado de 2FA
4. Para editar:
   - Haz clic en "Editar Perfil"
   - Modifica los campos deseados
   - Haz clic en "Guardar"
   - O "Cancelar" para descartar cambios

### Paso 6: Recuperar Contraseña

1. Desde la página de login, haz clic en "¿Olvidaste tu contraseña?"
2. Ingresa tu email
3. Haz clic en "Enviar Instrucciones"
4. Verás un mensaje de confirmación simulado

### Paso 7: Cerrar Sesión

1. Haz clic en "Cerrar Sesión" en la barra de navegación
2. Serás redirigido al login
3. Tu sesión se eliminará del localStorage

## Funcionalidades Especiales

### Botones OAuth (Solo UI)

Los botones de login social (Google, Microsoft, GitHub) son solo visuales:
- No realizan autenticación real
- Al hacer clic, muestran un log en consola
- Están diseñados para demostración de UI

### Indicador de Fortaleza de Contraseña

En el registro, el indicador muestra:
- **Muy débil**: Rojo (0%)
- **Débil**: Naranja (1-40%)
- **Media**: Amarillo (41-60%)
- **Fuerte**: Azul (61-80%)
- **Muy fuerte**: Verde (81-100%)

### Contador 2FA

El código 2FA tiene un temporizador de 60 segundos:
- Después de 60 segundos, puedes solicitar un nuevo código
- El botón "Reenviar código" se habilita cuando termina el tiempo

## Datos de Prueba

### Usuario Administrador
```
Email: admin@buses.com
Contraseña: Password123!
Código 2FA: 123456
Roles: admin, driver
```

### Usuario Regular
```
Email: user@buses.com
Contraseña: Password123!
Roles: user
```

## Rutas del Sistema

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Redirige a `/login` |
| `/login` | Público | Inicio de sesión |
| `/register` | Público | Registro de usuario |
| `/forgot-password` | Público | Recuperación de contraseña |
| `/two-factor` | Autenticado | Verificación 2FA |
| `/dashboard` | Protegido | Panel principal |
| `/profile` | Protegido | Perfil de usuario |

## Persistencia de Datos

Los datos se almacenan en:
- **localStorage**: Token y datos de usuario
- **Memoria**: Lista de usuarios simulados

Al cerrar sesión:
- Se elimina el token de localStorage
- Se elimina la información del usuario

## Validaciones Implementadas

### Email
- Formato válido requerido
- Verificación con regex

### Contraseña
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número
- Al menos 1 carácter especial

### Código 2FA
- Exactamente 6 dígitos numéricos
- No permite letras o caracteres especiales

## Comandos Útiles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Ejecutar linter
npm run typecheck    # Verificar tipos TypeScript
```

## Solución de Problemas

### El servidor no inicia
```bash
rm -rf node_modules
npm install
npm run dev
```

### Error de tipos TypeScript
```bash
npm run typecheck
```

### Error en el build
```bash
npm run build
```

### Puerto 5173 ocupado
Vite usará automáticamente el siguiente puerto disponible (5174, 5175, etc.)

## Notas Importantes

1. **No hay backend**: Todos los datos son simulados
2. **No hay persistencia**: Los datos se pierden al refrescar después de registrarse
3. **Token falso**: El JWT generado es solo para demostración
4. **OAuth simulado**: Los botones sociales no funcionan
5. **Solo frontend**: Este es únicamente la capa de presentación

## Arquitectura

```
AuthProvider (Context)
    ↓
AppRoutes (Router)
    ↓
Pages (Login, Register, Dashboard, etc.)
    ↓
Components (Navbar, FormInput, etc.)
    ↓
Services (authService - simulado)
    ↓
Utils (fakeJwt, validations)
```

## Próximos Pasos

Para producción, necesitarías:
1. Conectar a un backend real
2. Implementar JWT real
3. Agregar HTTPS
4. Implementar rate limiting
5. Agregar pruebas automatizadas
6. Configurar CI/CD
7. Implementar logging
8. Agregar monitoreo
9. Implementar OAuth real
10. Usar una base de datos real
