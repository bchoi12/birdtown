
const version = "2.1";

const b = "boolean";
const s = "string";
const n = "number";
const o = "Object";
const dm = "DataMap"

let baseSerializableTypes = new Set<string>([b, s, n, o, dm]);
let serializableTypes = new Set<string>();
baseSerializableTypes.forEach((type : string) => {
	serializableTypes.add(type);
	serializableTypes.add("Array<" + type + ">");
});
let serializableRegex = new Set<string>();
serializableRegex.add(".*Type");

// Command: node js/script/gen_message.js
//
// Start params
//

const enumClass = "UiProp";
const map = new Map<string, string>([
    ["ANNOUNCEMENT_TYPE", "AnnouncementType"],
    ["CLIENT_ID", "number"],
    ["COUNTERS_MAP", "Map<CounterType, number>"],
    ["DIALOG_TYPE", "DialogType"],
    ["DISPLAY_NAME", "string"],
    ["NAMES", "Array<string>"],
    ["ON_SUBMIT", "() => void"],
    ["PAGES", "Array<DialogPage>"],
    ["TOOLTIP_TYPE", "TooltipType"],
    ["TTL", "number"],
]);

//
// End params
//

let serializable = true;
map.forEach((type : string) => {
	if (!serializable) {
		return;
	}
	if (serializableTypes.has(type)) {
		return;
	}

	let matchRegex = false;
	serializableRegex.forEach((regex : string) => {
		if (matchRegex) {
			return;
		}
		let regExp = new RegExp(regex);
		if (type.match(regExp) !== null) {
			matchRegex = true;
		}
	});
	if (!matchRegex) {
		serializable = false;
	}
});

function println(msg : string) : void {
	console.log("    " + msg);
}

println("// Begin auto-generated code (v" + version + ")");
println("override serializable() { return " + (serializable ? "true" : "false") + "; }");
println("")
map.forEach((type : string, enumName : string) => {
	let words = enumName.split("_");
	let camelWords = [];
	words.forEach((word : string) => {
		word = word.toLowerCase();
		word = word.charAt(0).toUpperCase() + word.slice(1);
		camelWords.push(word);
	});
	const camelCase = camelWords.join("");
	
	println("has" + camelCase + "() : boolean { return this.has(" + enumClass + "." + enumName + "); }");
	println("get" + camelCase + "() : " + type + " { return this.get<" + type + ">(" + enumClass + "." + enumName + "); }");
	println("get" + camelCase + "Or(value : " + type + ") : " + type + " { return this.getOr<" + type + ">(" + enumClass + "." + enumName + ", value); }");
	println("set" + camelCase + "(value : " + type + ") : void { this.set<" + type + ">(" + enumClass + "." + enumName + ", value); }");

	println("");
});
println("/*");
println("const enumClass = \"" + enumClass + "\";");
map.forEach((type : string, enumName : string) => {
	println("[\"" + enumName + "\", \"" + type + "\"],",)
});
println("*/");
println("// End auto-generated code (v" + version + ")");