let favourites: Favourite[] = [];

const savedFavouritesLiteral = localStorage.getItem('favourites');

const savedFavourites =
	savedFavouritesLiteral
		? JSON.parse(savedFavouritesLiteral)
		: [];

if ( ! (savedFavourites instanceof Array)) {
	console.warn('saved favourites was not an array!');
}

favourites.push(...(savedFavourites as any[]).filter((maybe) => {
	return (
		maybe instanceof Array &&
		3 === maybe.length &&
		'string' === typeof maybe[0] &&
		'number' === typeof maybe[1] &&
		'number' === typeof maybe[2]
	);
}));

export type Favourite = [string, number, number];

export function IsFavourite(favourite: Favourite): boolean
{
	return !! favourites.find(maybe => {
		return (
			maybe[0] === favourite[0] &&
			maybe[1] === favourite[1] &&
			maybe[2] === favourite[2]
		);
	});
}

export function AddFavourite(favourite: Favourite): void
{
	const alreadyThere = IsFavourite(favourite);

	if ( ! alreadyThere) {
		favourites.push(favourite);
	}

	localStorage.setItem('favourites', JSON.stringify(favourites));
}

export function RemoveFavourite(favourite: Favourite): void
{
	favourites = favourites.filter(maybe => {
		return ! (
			maybe[0] === favourite[0] &&
			maybe[1] === favourite[1] &&
			maybe[2] === favourite[2]
		);
	});
}
