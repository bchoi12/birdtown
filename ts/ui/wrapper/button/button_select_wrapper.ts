
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

export class ButtonSelectWrapper extends ButtonWrapper {

	constructor() {
		super();

		this.elm().classList.add(Html.classButtonSelect);
	}
}