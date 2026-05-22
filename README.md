# Prueba Técnica NTTData

Aplicación Angular para la gestión de productos financieros.

## Requisitos previos

Por favor asegurate de tener instalado lo siguiente antes de comenzar:

- [Node.js](https://nodejs.org/) v22.16.0
- [npm](https://www.npmjs.com/) v10 o superior
- [Angular CLI](https://angular.dev/tools/cli) v21

Puedes verificar las versiones con:

```bash
node -v
npm -v
ng version
```

## Instalación

Clona el repositorio e instala las dependencias:

```bash
git clone https://github.com/tu-usuario/prueba-tecnica-nttdata.git
cd prueba-tecnica-nttdata
npm install
```

## Variables de entorno

El proyecto usa los archivos en `src/environments/`:

- `environment.ts` → desarrollo (por defecto apunta a `http://localhost:3002/bp/products`)
- `environment.prod.ts` → producción

Si necesitas cambiar la URL de la API, edita el campo `apiUrl` en el archivo correspondiente antes de compilar.

## Levantar el servidor de desarrollo

```bash
npm start
```

o equivalentemente:

```bash
ng serve
```

Abre el navegador en `http://localhost:4200/`. La aplicación se recarga automáticamente al guardar cambios.

## Compilar para producción

```bash
npm run build
```

Los archivos compilados se generan en la carpeta `dist/`. Esta build aplica optimizaciones de rendimiento automáticamente.

## Pruebas unitarias

El proyecto usa [Jest](https://jestjs.io/) como framework de testing.

### Ejecutar todas las pruebas

```bash
npm test
```

### Ejecutar en modo watch (re-ejecuta al guardar cambios)

```bash
npm run test:watch
```

### Ejecutar con reporte de cobertura

```bash
npm run test:coverage
```

El reporte de cobertura se genera en la carpeta `coverage/`. Abre `coverage/index.html` en el navegador para ver el detalle por archivo.
