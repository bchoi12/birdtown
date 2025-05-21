
import { Html, HtmlWrapper } from 'ui/html'

export class RowWrapper extends HtmlWrapper<HTMLTableRowElement> {

	constructor() {
		super(Html.tr());
	}

	setOnClick(fn : (data : string) => void) {
		this.elm().classList.add(Html.classTableRowSelect);

		const cells = this.elm().cells;
		for (let i = 0; i < cells.length; ++i) {
			cells[i].onclick = () => {
				fn(cells[i].textContent);
			};
		}
	}

	setOnDoubleClick(fn : (data : string) => void) {
		const cells = this.elm().cells;
		for (let i = 0; i < cells.length; ++i) {
			cells[i].ondblclick = () => {
				fn(cells[i].textContent);
			};
		}
	}
}