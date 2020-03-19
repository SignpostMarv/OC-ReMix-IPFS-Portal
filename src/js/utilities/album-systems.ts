import {
	Album,
	System,
	Game,
} from '../../module';

const AlbumSystemsPromises: WeakMap<Album, Promise<System[]>> = new WeakMap();

function MaybeAddToSystemArray(games: Game[], systems: System[]): void
{
	games.forEach(game => {
		game.systems.forEach(system => {
			if ( ! systems.includes(system)) {
				systems.push(system);
			}
		});
	});
}

export async function AlbumSystems(album: Album): Promise<System[]>
{
	if ( ! AlbumSystemsPromises.has(album)) {
		AlbumSystemsPromises.set(album, new Promise(yup => {
			const systems: System[] = [];

			MaybeAddToSystemArray(album.games, systems);

			album.discs.forEach(disc => {
				disc.tracks.forEach(track => {
					if ('games' in track) {
						MaybeAddToSystemArray(track.games as Game[], systems);
					}
				});
			});

			yup(systems);
		}));
	}

	return await (AlbumSystemsPromises.get(album) as Promise<System[]>);
}
