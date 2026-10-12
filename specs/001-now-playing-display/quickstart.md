# Quickstart de validación — Now Playing kiosk display

Guía ejecutable para demostrar la feature de punta a punta (mapea a FR/SC del spec).
Sin framework de tests: checklist manual + gates de sintaxis (constitución VIII).

## Prerrequisitos

- LMS ≥ 8.0 en marcha con ≥ 1 reproductor y algo de música con carátula.
- **Flujo de desarrollo elegido (sin symlinks ni tocar el servidor/compose):** el desarrollo
  ocurre en este repo; cada fase completa se publica en GitHub y se prueba **desde la UI de
  LMS**, como haría un usuario final:
  1. Primera vez: *Ajustes → Plugins → Repositorios adicionales* → añadir la URL de
     `public.xml` de este repo → instalar *Bubble Skin*.
  2. Cada iteración: cuando se publica una nueva versión (`tools/release.py` + tag + GitHub
     Release), LMS la muestra como **actualización disponible** en *Ajustes → Plugins* →
     actualizar (LMS pedirá reinicio al instalar plugins, confírmalo).
  3. Ejecutar los escenarios E2E de la fase correspondiente (tabla abajo).

  Ventaja extra: cada prueba valida además el mecanismo de distribución real (SC-006).

## Gates de sintaxis (antes de probar nada)

```bash
node --check BubbleSkin/HTML/bubble/html/js/*.js
perl -c -I<stubs> BubbleSkin/Plugin.pm        # si se tocó Perl
python3 - <<'EOF'
import xml.dom.minidom, yaml
xml.dom.minidom.parse('BubbleSkin/install.xml')
yaml.safe_load(open('BubbleSkin/HTML/bubble/skinconfig.yml'))
EOF
```

## Escenarios E2E (FR/SC)

Preparación: reproduce un álbum local con duración y carátula en el reproductor elegido.

| # | Escenario | Pasos | Resultado esperado (mapea a) |
|---|---|---|---|
| 1 | Contento base 16:9 | Abrir `/bubble/?player=<mac>` en ventana 1920×1080 | Carátula ≥ 40 % del alto, metadatos, datos técnicos, progreso, "a continuación" (FR-001…006, SC-002) |
| 2 | Tiempo real | Con la pantalla abierta, cambiar de pista desde la UI Default | Pantalla actualiza en ≤ 2 s sin recarga (SC-001) |
| 3 | Pausa | Pausar desde otro cliente | Barra detenida + indicación de pausa ≤ 2 s (FR-010) |
| 4 | Detenido/cola vacía | `playlist clear` + stop | Estado "nada en reproducción" (FR-009) |
| 5 | Sin carátula | Reproducir track sin cover | Placeholder neutro (FR-011) |
| 6 | Radio en vivo | Reproducir emisora (sin duración) | Sin barra porcentual; tiempo transcurrido si lo reporta; bloque "a continuación" oculto (FR-005/006) |
| 7 | Textos largos | Track con título > ancho | Ticker lento derecha→izquierda, pausa final, salto a inicio; reset al cambiar pista; textos cortos estáticos (FR-012) |
| 8 | Vertical | DevTools device emulation 9:16 (1080×1920) y 3:4 (768×1024) | Disposición player estándar (portada arriba a todo ancho con márgenes, metadatos, progreso, bloque estado) sin scroll/solapes (FR-016, SC-007) |
| 9 | Sin controles | Tab por toda la página + intento de clics | Ningún elemento interactivo (SC-003) |
| 10 | Sin `?player=` | Abrir `/bubble/` a secas | Muestra el 1º reproductor conectado (FR-008) |
| 11 | Player inválido | `/bubble/?player=00:00:00:00:00:00` | Estado "reproductor no encontrado" legible (US5-AS3) |
| 12 | Offline | Cortar internet de la máquina display, recargar | La pantalla carga y funciona igual (SC-004, FR-014) |
| 13 | Desconexión | Parar el servidor LMS 60 s y rearrancar | Estado "sin conexión" discreto; recuperación sola (edge case) |
| 14 | Cambio de pista con ticker | Título largo, saltar de pista | Ticker reinicia desde posición inicial |
| 15 | Instalación por repo | Instalar el zip de la release en un LMS limpio vía URL del repo | Skin disponible y pantalla servida en `/bubble/` (SC-006) |

## Resultado

Toda fila en ✓ + gates de sintaxis en verde → la feature está conforme al spec y lista
para `/speckit.tasks` → implementación.
