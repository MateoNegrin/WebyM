# Proyecto de curso DWYM 2026 sem. 2

Este repositorio contiene el código de referencia para el proyecto final del curso de Desarrollo Web y Mobile, edición 2do semestre de 2026. 

## Inicio

Forkear el repo e invitar al resto del equipo como colaboradores. Instalar las dependencias con `npm i` en la raíz del repositorio.

Este repositorio contiene código de base para comenzar el desarrollo de las interfaces de usuario _web_ y _mobile_ de la aplicación. La API será provista por la cátedra en un hosting a definir.

### Carpeta `/docs/`

El planteo del proyecto se encuentra en [`./docs/DWYM-Proyecto-2026sem2.pdf`](./docs/DWYM-Proyecto-2026sem2.pdf). Si el equipo desea adjuntar más documentación (e.g. de [Batalla Naval](https://en.wikipedia.org/wiki/Battleship_%28game%29)) puede dejarla aquí.

La subcarpeta `/docs/designs` se deja para los diseños de las interfaces de usuario a implementar. Para diseños visuales recomendamos [Excalidraw](https://excalidraw.com/), ya que tiene un [plugin](https://marketplace.visualstudio.com/items?itemName=pomdtr.excalidraw-editor) muy útil para [VS code](https://code.visualstudio.com/).

### Paquete `/package/web`

La implementación del frontend web usa [Vite](https://vite.dev/). Para iniciar el servidor local de debug se hace `npm start`.

Este paquete para _web_ tiene configurados [ESLint](https://eslint.org/) y [Prettier](https://prettier.io/) para conveniencia de los estudiantes. Pueden modificar estas configuraciones si requieren.

### Paquete `/package/mobile`

La implementación del frontend mobile usa [Expo](https://expo.dev/). Para iniciar el servidor de debugging se hace `npm start`.

Este paquete para _mobile_ también tiene configurado [ESLint](https://eslint.org/), además de varios paquetes más relacionados con Expo.

## Actualización del _fork_

Si se modifica el código en el repo original, se puede actualizar el fork con los siguientes comandos:

+ Respaldar el estado actual del repo forkeado.

+ Conectar su fork con el repo original: `git remote add upstream https://github.com/ucu-fit-dwym/dwym-project-2026sem2.git`

+ Verificar que upstream haya sido agregado: `git remote -v`

+ Traer los cambios de main upstream a su repo local: `git fetch upstream main`

+ Cambiar a su rama local main: `git checkout main`

+ Hacer merge de los cambios: `git merge upstream/main`

_Fin_