
import { ui } from 'ui'
import { InfoType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'

export class InfoRowWrapper extends HtmlWrapper<HTMLElement> {

	private _cellElms : Map<InfoType, HTMLElement>;

	constructor(order : Array<InfoType>) {
		super(Html.tr());

		this._cellElms = new Map();

		for (let i = 0; i < order.length; ++i) {
			let cell = Html.td();
			cell.style.display = "none";
			cell.style.textAlign = i === 0 ? "left" : "right";

			this._cellElms.set(order[i], cell);

			this.elm().appendChild(cell);
		}
	}

	updateCell(type : InfoType, value : number | string) : void {
		if (!this._cellElms.has(type)) {
			console.error("Error: missing info cell for", InfoType[type]);
			return;
		}

		let cell = this._cellElms.get(type);
		cell.textContent = "" + value;
		cell.style.display = "table-cell";
	}
	hideCell(type : InfoType) : void {
		if (!this._cellElms.has(type)) {
			console.error("Error: cannot hide missing info cell for", InfoType[type]);
			return;
		}

		let cell = this._cellElms.get(type);
		cell.style.display = "none";
	}

	hasContent(type : InfoType) : boolean { return this._cellElms.get(type).textContent.length > 0; }
	clearContent(type : InfoType) : void { this._cellElms.get(type).textContent = ""; }
}