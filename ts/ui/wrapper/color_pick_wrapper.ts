
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { ColorWrapper } from 'ui/wrapper/color_wrapper'

export class ColorPickWrapper extends HtmlWrapper<HTMLElement> {

	private static readonly _defaultColor = "#FFFFFF";

	private _selectedColor : string;
	private _colorWrappers : Map<string, ColorWrapper>;

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classColorPick);
		this.elm().classList.add(Html.classNoSelect);

		this._selectedColor = ColorPickWrapper._defaultColor;
		this._colorWrappers = new Map();

	}

	selectedColor() : string { return this._selectedColor; }
	addColors(...colors : string[]) : void {
		for (let i = 0; i < colors.length; ++i) {
			this.addColor(colors[i]);
		}
	}
	select(color : string) : void {
		if (!this._colorWrappers.has(color)) {
			console.error("Error: cannot select color", color);
			return;
		}

		this._selectedColor = color;
		this.unselectExcept(color);
		this._colorWrappers.get(color).setSelected(true);
	}

	private addColor(color : string) : void {
		if (this._colorWrappers.has(color)) {
			return;
		}

		let colorWrapper = new ColorWrapper(color);
		colorWrapper.setOnClick(() => {
			this._selectedColor = colorWrapper.color();
			this.unselectExcept(this._selectedColor);
		});
		this.elm().appendChild(colorWrapper.elm());
		this._colorWrappers.set(color, colorWrapper);
	}

	private unselectExcept(selectedColor : string) : void {
		this._colorWrappers.forEach((wrapper : ColorWrapper, color : string) => {
			if (selectedColor === color) {
				return;
			}
			wrapper.setSelected(false);
		});
	}
}