package Plugins::BubbleSkin::Settings;

#
# Página de ajustes de BubbleSkin, accesible desde
# Ajustes -> Plugins (o Configuración -> Adicionales).
#

use strict;
use base qw(Slim::Web::Settings);
use Slim::Utils::Prefs;

my $prefs = preferences('plugin.bubble-skin');

sub name {
	return 'BUBBLE_SKIN';
}

sub page {
	return 'plugins/BubbleSkin/settings/basic.html';
}

sub prefs {
	return ($prefs, qw(albumsPageSize accentColor));
}

1;

__END__
