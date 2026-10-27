/** Szuka w pliku GLB danych, które mogą psuć kafelkowanie: NaN/Inf, zerowe skale, puste lub dziwne siatki. */
import { NodeIO } from '@gltf-transform/core';

const [inputPath] = process.argv.slice(2);
const document = await new NodeIO().read(inputPath);
const root = document.getRoot();
const problems = new Map();
const report = (kind, detail) => {
	const list = problems.get(kind) ?? [];
	list.push(detail);
	problems.set(kind, list);
};

root.listNodes().forEach((node, index) => {
	const values = [...node.getTranslation(), ...node.getRotation(), ...node.getScale()];
	if (values.some((value) => !Number.isFinite(value))) report('węzeł z NaN/Inf', index);
	if (node.getScale().some((scale) => Math.abs(scale) < 1e-6)) report('zerowa skala', index);
	if (!node.getMesh()) report('węzeł bez siatki', index);
	const [x, y, z] = node.getTranslation();
	if (Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) > 1e6)
		report('węzeł daleko od środka', `${index}: ${x},${y},${z}`);
});
root.listMeshes().forEach((mesh, index) => {
	if (mesh.listPrimitives().length === 0) report('siatka bez prymitywów', mesh.getName() || index);
	for (const primitive of mesh.listPrimitives()) {
		const position = primitive.getAttribute('POSITION');
		if (!position || position.getCount() === 0)
			report('prymityw bez pozycji', mesh.getName() || index);
		else {
			const array = position.getArray();
			for (let i = 0; i < array.length; i++) {
				if (!Number.isFinite(array[i])) {
					report('NaN/Inf w pozycjach', mesh.getName() || index);
					break;
				}
			}
		}
		if (primitive.getMode() !== 4)
			report('tryb prymitywu ≠ trójkąty', `${mesh.getName() || index}: ${primitive.getMode()}`);
		const indices = primitive.getIndices();
		if (indices && indices.getCount() % 3 !== 0)
			report('liczba indeksów niepodzielna przez 3', mesh.getName() || index);
		if (!primitive.getMaterial()) report('prymityw bez materiału', mesh.getName() || index);
		if (position && !primitive.getAttribute('NORMAL'))
			report('brak normalnych', mesh.getName() || index);
	}
});
root.listTextures().forEach((texture, index) => {
	const size = texture.getSize();
	if (!size || size.some((side) => side === 0)) report('tekstura 0 px', texture.getName() || index);
	else if (size.some((side) => side > 4096)) report('tekstura >4096', `${index}: ${size}`);
	if (!['image/png', 'image/jpeg'].includes(texture.getMimeType()))
		report('typ tekstury', texture.getMimeType());
});
for (const [kind, list] of problems) console.log(`${kind}: ${list.length}`, list.slice(0, 5));
if (problems.size === 0) console.log('brak znalezionych problemów');
