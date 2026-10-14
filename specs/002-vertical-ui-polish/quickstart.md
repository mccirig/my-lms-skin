# Quickstart: Validar UI/UX polish del modo vertical

**Feature**: specs/002-vertical-ui-polish

## Prerrequisitos

- LMS 8.0+ ejecutándose y accesible desde la red.
- Navegador con herramientas de desarrollo (Chrome/Edge/Firefox).
- Skin BubbleSkin instalado y activo como skin del repositorio de terceros.
- Al menos un reproductor configurado y con una playlist de 2+ pistas.

## Instalación / recarga del skin

1. Construir el paquete:
   ```bash
   python3 tools/release.py 0.2.0
   ```
2. Verificar que `dist/bubbleskin-0.2.0.zip` existe y que `public.xml` contiene el SHA-1 correcto.
3. Hacer commit y push:
   ```bash
   git add -A && git commit -m "release: 0.2.0 vertical UI polish"
   git tag v0.2.0
   git push && git push origin v0.2.0
   ```
4. En LMS, ir a **Ajustes → Skin** y seleccionar (o recargar) BubbleSkin. La URL del repositorio es:
   ```
   https://raw.githubusercontent.com/mccirig/my-lms-skin/main/public.xml
   ```

## Escenarios de validación

### 1. Modo vertical con pista activa y siguiente track

1. Abrir la URL del skin en una ventana del navegador, por ejemplo:
   ```
   http://<lms-host>:9000/bubble/
   ```
2. Activar las herramientas de desarrollo y cambiar el viewport a un dispositivo vertical (por ejemplo iPad Mini: 744×1133).
3. Reproducir una pista con una playlist de al menos 2 canciones.
4. **Resultado esperado**:
   - Fondo `#252f3c`.
   - Cover cuadrado, ancho completo con márgenes, alto ≤ 60% del viewport, sin deformación.
   - Título en 100% opacidad con formato "01 · Título".
   - Artista, álbum y línea técnica al 50% opacidad.
   - Barra de progreso `#4e8dca` sobre fondo `#3a4046`.
   - Caja de status con fondo `#263036`, título "A continuación" y miniatura + título/artista del siguiente track.

### 2. Modo vertical sin siguiente track

1. Dejar la playlist con una sola pista.
2. **Resultado esperado**: la caja de status muestra título "Nada que reproducir".

### 3. Sin pista activa

1. Detener la reproducción y vaciar la playlist (o cambiar a un reproductor sin playlist).
2. **Resultado esperado**: caja de status muestra título "Nada en reproducción".

### 4. Sin conexión con LMS

1. Cargar la skin con una pista activa.
2. Detener el contenedor de LMS o desconectar la red del cliente.
3. **Resultado esperado**: caja de status muestra título "Sin conexión con el servidor".

### 5. Modo horizontal

1. Rotar/redimensionar el viewport a landscape (por ejemplo 1133×744).
2. **Resultado esperado**: los colores de la paleta nueva se aplican correctamente y no hay regresiones de layout (todos los elementos visibles).

### 6. Viewports estrechos

1. Probar anchos entre 320 px y 480 px en modo vertical.
2. **Resultado esperado**: no aparece scroll; el cover sigue limitado al 60% de la altura; el texto permanece legible.

## Comandos de validación automática (antes de commit)

```bash
# JavaScript
for f in BubbleSkin/HTML/bubble/html/js/*.js; do node --check "$f"; done

# Manifiestos
xmllint --noout BubbleSkin/install.xml BubbleSkin/public.xml 2>/dev/null || python3 -c "import xml.etree.ElementTree as ET; ET.parse('BubbleSkin/install.xml'); ET.parse('BubbleSkin/public.xml')"
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml')); yaml.safe_load(open('BubbleSkin/skinconfig.yml'))"

# strings.txt: verificar formato TSV y presencia de EN
python3 <<'PY'
import re
with open('BubbleSkin/strings.txt') as fh:
    lines = fh.readlines()
token = None
for i, line in enumerate(lines, 1):
    line = line.rstrip('\n')
    if not line:
        continue
    if not line.startswith('\t'):
        token = line
        if not re.match(r'^[A-Z][A-Z0-9_]*$', token):
            raise SystemExit(f"Invalid token at line {i}: {token}")
    else:
        if token is None:
            raise SystemExit(f"Translation before token at line {i}")
        parts = line.lstrip('\t').split('\t')
        if len(parts) != 2 or parts[0] not in ('EN','ES'):
            raise SystemExit(f"Bad translation line {i}: {line}")
print("strings.txt OK")
PY
```

## Notas

- Para ver colores exactos usar el picker de las herramientas de desarrollo.
- Para medir el alto del cover usar el panel de Layout/Computed Styles.
- Si la fuente Roboto no está instalada, el navegador caerá en la sans-serif del sistema; en un kiosk controlado se recomienda instalar Roboto en el sistema operativo o, alternativamente, incluirla autocontenida en una futura iteración.
