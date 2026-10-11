package Plugins::BubbleSkin::Plugin;

#
# BubbleSkin - skin SPA de ejemplo para Lyrion Music Server (LMS)
#
# Esqueleto educativo que acompaña a la guía en docs/. Demuestra:
#   * skin registrado automáticamente por existir HTML/bubble
#   * preferencias propias del plugin
#   * página de ajustes (Settings.pm)
#   * comando CLI propio consumible vía /jsonrpc.js
#
# Publicado como ejemplo libre (MIT).
#

use strict;

use Slim::Utils::Log;
use Slim::Utils::Prefs;

my $log = Slim::Utils::Log->addLogCategory({
	'category'     => 'plugin.bubble-skin',
	'defaultLevel' => 'ERROR',
	'description'  => 'PLUGIN_BUBBLE_SKIN',
});

my $prefs = preferences('plugin.bubble-skin');

sub initPlugin {
	my $class = shift;

	# Valores por defecto de las preferencias propias
	$prefs->init({
		albumsPageSize => 20,
		accentColor    => '#3b82f6',
	});

	if (main::WEBUI) {
		# Página de ajustes del plugin (Ajustes -> Plugins / Ajustes del servidor)
		require Plugins::BubbleSkin::Settings;
		Plugins::BubbleSkin::Settings->new();
	}

	$class->initCLI();
}

sub shutdownPlugin {
	# Aquí iría la limpieza (desuscripciones, handlers, etc.)
}

# ---------------------------------------------------------------------------
# Comando CLI propio: accesible vía JSON-RPC como ["bubbleskin", "hello", ...]
#                                                               |requiere Player
#                                                               |  |es Query
#                                                               |  |  |tiene Tags
#                                                               C  Q  T  F(unción)
# ---------------------------------------------------------------------------
sub initCLI {
	Slim::Control::Request::addDispatch(['bubbleskin', 'hello', '_name'], [0, 0, 1, \&_cliHello]);
}

sub _cliHello {
	my $request = shift;

	if ($request->isNotCommand([['bubbleskin']])) {
		$request->setStatusBadDispatch();
		return;
	}

	my $name = $request->getParam('_name') || 'mundo';

	$request->addResult('mensaje', "Hola, $name! (desde Plugins::BubbleSkin)");
	$request->addResult('albumsPageSize', $prefs->get('albumsPageSize'));
	$request->addResult('accentColor', $prefs->get('accentColor'));
	$request->setStatusDone();
}

1;

__END__

# ---------------------------------------------------------------------------
# BONUS: cómo registrar páginas y handlers HTTP propios (ver docs/05).
# OJO con colisiones: las expresiones regulares son GLOBALES para todas las
# rutas (el prefijo del skin se elimina antes del matching), así que usa
# nombres bien distinguibles.
#
#	if (main::WEBUI) {
#		# Página renderizada con una plantilla propia:
#		Slim::Web::Pages->addPageFunction(qr{^bubble-extra$}i, sub {
#			my ($client, $params) = @_;
#			return Slim::Web::HTTP::filltemplatefile('bubble/extra.html', $params);
#		});
#
#		# Handler con control total de la respuesta (SVG dinámico, JSON...):
#		Slim::Web::Pages->addRawFunction(qr{bubble/api/(\w+)}i, sub {
#			my ($httpClient, $response) = @_;
#			$response->content_type('application/json');
#			...
#		});
#	}
#
#	Rutas resultantes: /bubble/bubble-extra  y  /bubble/bubble/api/<algo>
# ---------------------------------------------------------------------------
