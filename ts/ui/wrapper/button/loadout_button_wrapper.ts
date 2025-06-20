
import { EntityType } from 'game/entity/api'
import { EquipTag } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { EquipPairs } from 'game/util/equip_pairs'

import { StringFactory } from 'strings/string_factory'

import { Icon, IconType } from 'ui/common/icon'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { NameWrapper } from 'ui/wrapper/name_wrapper'
import { TagWrapper } from 'ui/wrapper/tag_wrapper'

export class LoadoutButtonWrapper extends ButtonWrapper {

	private _titleElm : HTMLElement;
	private _pictureElm : HTMLElement;
	private _descriptionElm : HTMLElement;
	private _tagsElm : HTMLElement;

	constructor() {
		super();

		this.elm().classList.add(Html.classLoadoutButton);

		this._titleElm = Html.div();
		this._titleElm.classList.add(Html.classLoadoutButtonTitle);
		this._pictureElm = Html.div();
		this._pictureElm.classList.add(Html.classLoadoutButtonPicture);
		this._descriptionElm = Html.div();
		this._descriptionElm.classList.add(Html.classLoadoutButtonDescription);
		this._tagsElm = Html.div();
		this._tagsElm.classList.add(Html.classLoadoutButtonTags);

		this.elm().appendChild(this._titleElm);
		this.elm().appendChild(this._pictureElm);
		this.elm().appendChild(this._descriptionElm);
		this.elm().appendChild(this._tagsElm);
	}

	setEquipPair(pair : [EntityType, EntityType]) : void {
		/*
		let first = new NameWrapper();
		first.setEntityType(pair[0]);

		let second = new NameWrapper();
		second.setEntityType(pair[1]);

		this._titleElm.innerHTML = "";
		this._titleElm.appendChild(first.elm());
		this._titleElm.appendChild(this.createPlusDiv());
		this._titleElm.appendChild(second.elm());
		*/

		let first = StringFactory.getEntityTypeName(pair[0]).toTitleString();
		let second = StringFactory.getEntityTypeName(pair[1]).toTitleString();
		this._titleElm.innerHTML = first + this.createPlusDiv().outerHTML + second;

		this.setIcons(Icon.getEntityIconType(pair[0]), Icon.getEntityIconType(pair[1]));

		let mouse = Icon.create(IconType.MOUSE);
		let description = mouse.outerHTML + " (L): " + StringFactory.getEntityUsage(pair[0])
			+ "<br>" + mouse.outerHTML + " (R): " + StringFactory.getEntityUsage(pair[1]);
		this._descriptionElm.innerHTML = description;

		const color = ColorFactory.entityColor(pair[0]).toString();
		const tags = EquipPairs.getTags(pair);
		let tagHtml = [];
		tags.forEach((tag : EquipTag) => {
			let tagWrapper = new TagWrapper();
			tagWrapper.setName(StringFactory.getTagName(tag));
			tagWrapper.setBackgroundColor(color);
			tagHtml.push(tagWrapper.elm().outerHTML);
		});
		this._tagsElm.innerHTML = tagHtml.join(" ");
	}

	private setIcons(type : IconType, altType : IconType) : void {
		let icon = Icon.create(type);
		icon.classList.add(Html.classLoadoutButtonIcon);
		icon.style.textAlign = "right";
		this._pictureElm.appendChild(icon);

		this._pictureElm.appendChild(this.createPlusSpan());

		let altIcon = Icon.create(altType);
		altIcon.classList.add(Html.classLoadoutButtonIcon);
		altIcon.style.textAlign = "left";
		this._pictureElm.appendChild(altIcon);
	}
	private createPlusSpan() : HTMLElement {
		let plus = Html.span();
		plus.textContent = "+";
		plus.classList.add(Html.classLoadoutButtonPlus);
		return plus;
	}
	private createPlusDiv() : HTMLElement {
		let plus = Html.div();
		plus.textContent = "+";
		plus.classList.add(Html.classLoadoutButtonPlus);
		return plus;
	}
}