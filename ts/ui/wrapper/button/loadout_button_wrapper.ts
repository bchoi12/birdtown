
import { EntityType } from 'game/entity/api'

import { StringFactory } from 'strings/string_factory'

import { Icon, IconType } from 'ui/common/icon'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'


export class LoadoutButtonWrapper extends ButtonWrapper {

	private _titleElm : HTMLElement;
	private _pictureElm : HTMLElement;
	private _descriptionElm : HTMLElement;

	constructor() {
		super();

		this.elm().classList.add(Html.classLoadoutButton);

		this._titleElm = Html.div();
		this._titleElm.classList.add(Html.classLoadoutButtonTitle);
		this._pictureElm = Html.div();
		this._pictureElm.classList.add(Html.classLoadoutButtonPicture);
		this._descriptionElm = Html.div();
		this._descriptionElm.classList.add(Html.classLoadoutButtonDescription);

		this.elm().appendChild(this._titleElm);
		this.elm().appendChild(this._pictureElm);
		this.elm().appendChild(this._descriptionElm);
	}

	setEquipPair(pair : [EntityType, EntityType]) : void {
		let first = StringFactory.getEntityTypeName(pair[0]).toTitleString();
		let second = StringFactory.getEntityTypeName(pair[1]).toTitleString();
		this.setTitleHTML(first + this.plusDiv().outerHTML + second);

		this.setIcons(Icon.getEntityIconType(pair[0]), Icon.getEntityIconType(pair[1]));

		let mouse = Icon.create(IconType.MOUSE);
		let description = "";
		description += mouse.outerHTML + " (L): " + StringFactory.getEntityUsage(pair[0])
			+ "<br>" + mouse.outerHTML + " (R): " + StringFactory.getEntityUsage(pair[1]);
		this.setDescriptionHTML(description);
	}

	override setIcon(type : IconType) : void {}

	private setTitleHTML(html : string) : void {	
		this._titleElm.innerHTML = html;
	}
	private setIcons(type : IconType, altType : IconType) : void {
		let icon = Icon.create(type);
		icon.classList.add(Html.classLoadoutButtonIcon);
		icon.style.textAlign = "right";
		this._pictureElm.appendChild(icon);

		this._pictureElm.appendChild(this.plusSpan());

		let altIcon = Icon.create(altType);
		altIcon.classList.add(Html.classLoadoutButtonIcon);
		altIcon.style.textAlign = "left";
		this._pictureElm.appendChild(altIcon);
	}
	private setDescriptionHTML(html : string) : void {
		this._descriptionElm.innerHTML = html;
	}

	private plusSpan() : HTMLElement {
		let plus = Html.span();
		plus.textContent = "+";
		plus.classList.add(Html.classLoadoutButtonPlus);
		return plus;
	}
	private plusDiv() : HTMLElement {
		let plus = Html.div();
		plus.textContent = "+";
		plus.classList.add(Html.classLoadoutButtonPlus);
		return plus;
	}
}