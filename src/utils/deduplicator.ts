/**
 * Deduplication utilities for state detection results
 * Ensures clean, unique results in export data
 */

/**
 * Remove duplicates from a simple string array
 * @param arr Array with potential duplicates
 * @returns Sorted array with unique values
 */
export function deduplicateArray(arr: string[]): string[] {
	return Array.from(new Set(arr)).sort();
}

/**
 * Remove duplicates from dependency arrays, handling version formats
 * Handles formats like "package (1.0.0)" and normalizes for comparison
 * @param deps Array of dependencies with potential duplicates
 * @returns Sorted array with unique dependencies
 */
export function deduplicateDependencies(deps: string[]): string[] {
	const seen = new Set<string>();
	const result: string[] = [];

	for (const dep of deps) {
		const normalized = normalizeDependencyName(dep);
		if (!seen.has(normalized)) {
			seen.add(normalized);
			result.push(dep);
		}
	}

	return result.sort();
}

/**
 * Normalize dependency name for comparison
 * Extracts package name from formats like "package (version)" or "package@version"
 * @param dep Dependency string in various formats
 * @returns Normalized package name in lowercase
 */
function normalizeDependencyName(dep: string): string {
	// Extract package name from "package (version)" format
	let packageName = dep.split('(')[0].trim();

	// Handle npm-style "package@version" format
	packageName = packageName.split('@')[0].trim();

	// Normalize to lowercase for case-insensitive comparison
	return packageName.toLowerCase();
}

/**
 * Deduplicate and merge multiple arrays
 * Useful for combining results from multiple parsers
 * @param arrays Multiple arrays to merge and deduplicate
 * @returns Single sorted array with unique values
 */
export function mergeAndDeduplicate(...arrays: string[][]): string[] {
	const combined = arrays.flat();
	return deduplicateArray(combined);
}

/**
 * Deduplicate with custom key extraction
 * @param arr Array with potential duplicates
 * @param keyFn Function to extract comparison key from each item
 * @returns Array with unique items based on key function
 */
export function deduplicateBy<T>(arr: T[], keyFn: (item: T) => string): T[] {
	const seen = new Set<string>();
	const result: T[] = [];

	for (const item of arr) {
		const key = keyFn(item).toLowerCase();
		if (!seen.has(key)) {
			seen.add(key);
			result.push(item);
		}
	}

	return result;
}

