
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export class ColumnsWrapper extends HtmlWrapper<HTMLElement> {

	private _columns : Array<HTMLElement>;

	private constructor(columnWeights : Array<number>) {
		super(Html.div());

		this._columns = new Array();

		if (columnWeights.length <= 0) {
			console.error("Warning: created ColumnsWrapper with %d columns", columnWeights.length);
		}

		this.elm().style.display = "flex";

		for (let i = 0; i < columnWeights.length; ++i) {
			let column = Html.div();
			column.style.flex = "" + columnWeights[i];
			column.style.padding = "0 0.3em";
			column.style.whiteSpace = "pre-wrap";

			this.appendColumn(column);
		}
	}

	static withColumns(columns : number) : ColumnsWrapper {
		const weights = new Array(columns);
		weights.fill(1);
		return new ColumnsWrapper(weights);
	}

	static withWeights(weights : Array<number>) : ColumnsWrapper {
		return new ColumnsWrapper(weights);
	}

	private appendColumn(column : HTMLElement) : void {
		this._columns.push(column);
		this.elm().appendChild(column);
	}

	hasColumnElm(index : number) : boolean { return index >= 0 && index < this._columns.length; }
	columnElm(index : number) : HTMLElement {
		if (!this.hasColumnElm(index)) {
			console.error("Error: querying for non-existent column %d", index);
			return null;
		}

		return this._columns[index];
	}
}