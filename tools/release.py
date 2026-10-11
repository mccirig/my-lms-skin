#!/usr/bin/env python3
#
# release.py - prepara una release del plugin BubbleSkin para el mecanismo de
# repositorios de terceros de LMS (Lyrion Music Server).
#
# Hace, en orden:
#   1. Fija <version> en BubbleSkin/install.xml (sustituye DEVELOPMENT).
#   2. Crea dist/bubbleskin-<version>.zip con la carpeta BubbleSkin/ dentro
#      (formato que espera el instalador de extensiones de LMS, ver
#      Slim/Utils/PluginDownloader.pm: extractTree("$plugin/", ...)).
#      El zip es DETERMINISTA (mismo contenido -> mismo SHA-1).
#   3. Calcula el SHA-1 del zip y actualiza public.xml (version, url, sha).
#
# Uso:
#   python3 tools/release.py 0.1.0
#
# Después: commitea TODO (incluido dist/), sube a main, crea el tag v<version>
# y haz push del tag. El workflow de GitHub (release.yml) crea la release y
# adjunta el zip commiteado, asi el SHA-1 de public.xml siempre coincide.
#
# Solo usa la libreria estandar de Python.

import argparse
import hashlib
import re
import sys
import zipfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PLUGIN_NAME = "BubbleSkin"
PLUGIN_DIR = REPO_ROOT / PLUGIN_NAME
INSTALL_XML = PLUGIN_DIR / "install.xml"
PUBLIC_XML = REPO_ROOT / "public.xml"
DIST_DIR = REPO_ROOT / "dist"

DEFAULT_REPO = "https://github.com/mccirig/my-lms-skin"


def info(msg):
    print(f"INFO: {msg}")


def error(msg):
    print(f"ERROR: {msg}")
    sys.exit(1)


def set_install_xml_version(version):
    text = INSTALL_XML.read_text(encoding="utf-8")
    new, count = re.subn(r"<version>.*?</version>", f"<version>{version}</version>", text, count=1)
    if count == 0:
        error(f"No se encontro <version> en {INSTALL_XML}")
    INSTALL_XML.write_text(new, encoding="utf-8")
    info(f"install.xml -> version {version}")


def create_zip(version):
    """Zip determinista: entradas ordenadas, sin metadatos de fecha/hora,
    compression level fijo. Mismo contenido -> mismo SHA-1."""
    DIST_DIR.mkdir(exist_ok=True)
    zip_path = DIST_DIR / f"bubbleskin-{version}.zip"

    files = sorted(
        p for p in PLUGIN_DIR.rglob("*")
        if p.is_file() and "__pycache__" not in p.parts
    )
    if not files:
        error(f"No hay archivos en {PLUGIN_DIR}")

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for path in files:
            rel = path.relative_to(PLUGIN_DIR).as_posix()
            arcname = f"{PLUGIN_NAME}/{rel}"
            zinfo = zipfile.ZipInfo(arcname, date_time=(1980, 1, 1, 0, 0, 0))
            zinfo.compress_type = zipfile.ZIP_DEFLATED
            zinfo.external_attr = 0o100644 << 16  # archivo normal, rw-r--r--
            zf.writestr(zinfo, path.read_bytes())
            # Crear la entrada del directorio padre explicitamente no es
            # necesario: el extractor de LMS recrea los directorios.

    info(f"creado {zip_path} ({len(files)} archivos)")
    return zip_path


def sha1_of(path):
    digest = hashlib.sha1()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def update_public_xml(version, url, sha1):
    text = PUBLIC_XML.read_text(encoding="utf-8")

    text, n = re.subn(
        rf'(<plugin name="{PLUGIN_NAME}" version=")[^"]*(")',
        rf"\g<1>{version}\g<2>",
        text,
        count=1,
    )
    if n == 0:
        error(f'No se encontro <plugin name="{PLUGIN_NAME}" version="..."> en public.xml')

    text, n = re.subn(r"<url>.*?</url>", f"<url>{url}</url>", text, count=1)
    if n == 0:
        error("No se encontro <url> en public.xml")

    text, n = re.subn(r"<sha>.*?</sha>", f"<sha>{sha1}</sha>", text, count=1)
    if n == 0:
        error("No se encontro <sha> en public.xml")

    PUBLIC_XML.write_text(text, encoding="utf-8")
    info("public.xml actualizado (version, url, sha)")


def main():
    parser = argparse.ArgumentParser(description="Prepara una release de BubbleSkin para el mecanismo de repositorios de LMS.")
    parser.add_argument("version", help="version de la release, p. ej. 0.1.0")
    parser.add_argument(
        "--repo",
        default=DEFAULT_REPO,
        help=f"URL base del repositorio git (default: {DEFAULT_REPO})",
    )
    args = parser.parse_args()

    if not re.fullmatch(r"\d+\.\d+\.\d+", args.version):
        error("La version debe ser X.Y.Z (p. ej. 0.1.0)")

    version = args.version
    zip_name = f"bubbleskin-{version}.zip"
    tag = f"v{version}"
    # Los releases de GitHub sirven los assets bajo .../releases/download/<tag>/<asset>
    zip_url = f"{args.repo}/releases/download/{tag}/{zip_name}"

    set_install_xml_version(version)
    zip_path = create_zip(version)
    sha1 = sha1_of(zip_path)
    info(f"SHA-1: {sha1}")
    update_public_xml(version, zip_url, sha1)

    print()
    print("Listo. Pasos siguientes:")
    print(f"  git add -A")
    print(f"  git commit -m \"Release {tag}\"")
    print(f"  git push origin main")
    print(f"  git tag {tag} && git push origin {tag}")
    print()
    print("El workflow .github/workflows/release.yml creara el release en GitHub")
    print(f"y adjuntara dist/{zip_name}.")
    print()
    print("Los usuarios instalan anadiendo esta URL en LMS:")
    print("  Ajustes -> Plugins -> Repositorios adicionales:")
    print("  https://raw.githubusercontent.com/mccirig/my-lms-skin/main/public.xml")


if __name__ == "__main__":
    main()
