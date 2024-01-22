
export interface SpecialName {
	text : string;
	color? : string;
}

export namespace SpecialNames {
	export function test() : SpecialName {
		return {
			text: "test",
			color: "#FF0000",
		}
	}
}