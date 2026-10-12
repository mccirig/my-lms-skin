package Plugins::BubbleSkin::Plugin;

#
# BubbleSkin - pantalla "Now Playing" para display dedicado (kiosk) en LMS.
#
# v1.0: una sola pantalla de solo lectura servida desde HTML/bubble/.
# Backend minimo: solo preferencias propias y pagina de ajustes.
#
# MIT.
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
}

sub shutdownPlugin {
	# Aquí iría la limpieza (desuscripciones, handlers, etc.)
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
