# Manual de Copias de Seguridad
 
La información de su negocio (ventas, productos, cierres de caja) es un activo fundamental. NexPOS almacena todo en una base de datos local dentro de su computadora. Si el equipo sufre algún desperfecto, un corte eléctrico severo o algún problema de disco, esos datos podrían verse comprometidos.
 
Para prevenir cualquier pérdida, el sistema incluye un módulo dedicado a la creación y restauración de copias de seguridad.
 
## Crear un Respaldo
 
El proceso es muy sencillo:
- 1. Ingrese a la sección "Respaldos" desde el menú lateral.
- 2. Presione el botón "Elegir Carpeta y Respaldar".
- 3. Se abrirá el explorador de archivos de Windows. Seleccione la carpeta donde desea guardar la copia (se recomienda un pendrive USB o una carpeta de respaldos en el escritorio).
- 4. El sistema generará automáticamente un archivo con un nombre que incluye la fecha y hora exacta (por ejemplo: NexPOS_Backup_2026-04-13_15-30-00.db).
 
## Restaurar un Respaldo
 
Si necesita volver a un estado anterior de su base de datos (por ejemplo, tras un problema en el equipo):
- 1. Presione el botón "Seleccionar Archivo .db".
- 2. Busque y seleccione el archivo de respaldo que desea restaurar.
- 3. El sistema le pedirá una confirmación de seguridad, ya que esta acción reemplazará todos los datos actuales.
- 4. Tras confirmar, deberá cerrar y volver a abrir NexPOS para que los cambios se apliquen correctamente.
 
**Importante**: Al restaurar un respaldo, la base de datos actual se sobreescribe por completo. Todos los datos que se hayan generado después de la fecha de ese respaldo se perderán.
 
## Frecuencia Recomendada
 
Se aconseja realizar una copia de seguridad al menos cada 30 días. El sistema le mostrará un aviso visual si detecta que ha pasado más de un mes desde el último respaldo, recordándole que es momento de proteger su información.
