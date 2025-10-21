// Project definition types
export interface ProjectDefinition {
	id: string;
	name: string;
	path: string;
	description?: string;
	lastAccessed: Date;
	active: boolean;
}

export interface ProjectRegistry {
	projects: ProjectDefinition[];
	currentProject?: string;
}
