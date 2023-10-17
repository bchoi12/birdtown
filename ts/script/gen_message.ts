

const enumClass = "GameConfigProp";

const map = new Map<string, string>([

["PLAYERS_MIN", "number"],
["PLAYERS_MAX", "number"],

]);

console.log("// Begin auto-generated code");
console.log("");
map.forEach((type : string, enumName : string) => {
	let words = enumName.split("_");
	let camelWords = [];
	words.forEach((word : string) => {
		word = word.toLowerCase();
		word = word.charAt(0).toUpperCase() + word.slice(1);
		camelWords.push(word);
	});
	const camelCase = camelWords.join("");
	
	console.log("has" + camelCase + "() : boolean { return this.has(" + enumClass + "." + enumName + "); }");
	console.log("get" + camelCase + "() : " + type + " { return this.get<" + type + ">(" + enumClass + "." + enumName + "); }");
	console.log("set" + camelCase + "(value : " + type + ") : void { return this.set<" + type + ">(" + enumClass + "." + enumName + ", value); }");

	console.log("");
});
console.log("// End auto-generated code");