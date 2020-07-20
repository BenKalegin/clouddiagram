
 
 



/// <reference path="Enums.ts" />

declare module CloudDiagram.Web.Models {
	interface MindMapNodeStyle {
		id: number;
		parentId: number;
		fillColor: string;
		strokesColor: string;
	}
	interface MindMapNode {
		id: number;
		text: string;
		styleId: number;
	}
	interface MindMapLink {
		from: number;
		to: number;
		left: boolean;
	}
	interface MindMapBasicDto {
		version: number;
	}
	interface MindMapDto extends CloudDiagram.Web.Models.MindMapBasicDto {
		nodeStyles: CloudDiagram.Web.Models.MindMapNodeStyle[];
		nodes: CloudDiagram.Web.Models.MindMapNode[];
		links: CloudDiagram.Web.Models.MindMapLink[];
	}
	interface StartOptions {
		lastDiagram: string;
	}
}


