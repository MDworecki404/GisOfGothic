/**
 * Dzieli `vobs.glb` na kilka plików według położenia węzłów (ion nie przyjmuje jednego pliku
 * z ponad 120 tys. węzłów). Węzły dzielimy na pół wzdłuż osi X (wschód), a każdą połowę wzdłuż osi Z
 * (północ), więc liczba części to 2, 4, 8… z równą liczbą węzłów w każdej.
 *
 * Użycie: node scripts/split-vobs-glb.mjs <vobs.glb> <folder-wynikowy> [liczba-części=4]
 */
import { NodeIO, PropertyType } from '@gltf-transform/core';
import fs from 'node:fs';
import path from 'node:path';

const [inputPath, outputDirectory, partsArgument = '4'] = process.argv.slice(2);
const partCount = Number(partsArgument);
if (!inputPath || !outputDirectory || !Number.isInteger(Math.log2(partCount))) {
	console.error('Użycie: node scripts/split-vobs-glb.mjs <vobs.glb> <folder-wynikowy> [2|4|8]');
	process.exit(1);
}
fs.mkdirSync(outputDirectory, { recursive: true });
const io = new NodeIO();

function readNodePositions(document) {
	return document
		.getRoot()
		.listNodes()
		.map((node, index) => {
			const [x, , z] = node.getTranslation();
			return { index, x, z };
		});
}

/** Rekurencyjnie dzieli listę na pół na przemian po X i po Z, aż powstanie `groupCount` grup. */
function splitIntoGroups(entries, groupCount, axis) {
	if (groupCount === 1) return [entries];
	const sorted = [...entries].sort((first, second) => first[axis] - second[axis]);
	const middle = sorted.length >> 1;
	const nextAxis = axis === 'x' ? 'z' : 'x';
	return [
		...splitIntoGroups(sorted.slice(0, middle), groupCount / 2, nextAxis),
		...splitIntoGroups(sorted.slice(middle), groupCount / 2, nextAxis)
	];
}

function isUnused(property) {
	return property.listParents().every((parent) => parent.propertyType === PropertyType.ROOT);
}

function disposeUnusedProperties(document) {
	const root = document.getRoot();
	for (const mesh of root.listMeshes()) {
		if (!isUnused(mesh)) continue;
		for (const primitive of mesh.listPrimitives()) primitive.dispose();
		mesh.dispose();
	}
	for (const list of [root.listMaterials(), root.listAccessors(), root.listTextures()]) {
		for (const property of list) if (isUnused(property)) property.dispose();
	}
}

const groups = splitIntoGroups(readNodePositions(await io.read(inputPath)), partCount, 'x');
for (const [partIndex, group] of groups.entries()) {
	const keptIndexes = new Set(group.map((entry) => entry.index));
	const document = await io.read(inputPath);
	document
		.getRoot()
		.listNodes()
		.forEach((node, index) => {
			if (!keptIndexes.has(index)) node.dispose();
		});
	disposeUnusedProperties(document);
	const outputPath = path.join(outputDirectory, `vobs_czesc_${partIndex + 1}.glb`);
	await io.write(outputPath, document);
	const megabytes = (fs.statSync(outputPath).size / 1e6).toFixed(0);
	console.log(`${outputPath}: ${group.length} węzłów, ${megabytes} MB`);
}
