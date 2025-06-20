
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { ColumnWrapper } from 'ui/wrapper/column_wrapper'

export class ColumnsWrapper extends HtmlWrapper<HTMLElement> {

	private _columns : Array<ColumnWrapper>;

	private constructor(columnWeights : Array<number>) {
		super(Html.div());

		this.elm().classList.add(Html.classColumns);

		this._columns = new Array();

		if (columnWeights.length <= 0) {
			console.error("Warning: created ColumnsWrapper with %d columns", columnWeights.length);
		}

		this.elm().style.display = "flex";

		for (let i = 0; i < columnWeights.length; ++i) {
			let column = new ColumnWrapper();
			column.elm().style.flex = columnWeights[i] + " 1 auto";
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

	private appendColumn(column : ColumnWrapper) : void {
		this._columns.push(column);
		this.elm().appendChild(column.elm());
	}

	hasColumn(index : number) : boolean { return index >= 0 && index < this._columns.length; }
	column(index : number) : ColumnWrapper {
		if (!this.hasColumn(index)) {
			console.error("Error: querying for non-existent column %d", index);
			return null;
		}

		return this._columns[index];
	}
}