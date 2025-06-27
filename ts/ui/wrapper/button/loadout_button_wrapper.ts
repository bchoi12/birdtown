
import { EntityType } from 'game/entity/api'
import { EquipTag } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { EquipFactory } from 'game/factory/equip_factory'

import { StringFactory } from 'strings/string_factory'

import { Icon, IconType } from 'ui/common/icon'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { NameWrapper } from 'ui/wrapper/name_wrapper'
import { TagWrapper } from 'ui/wrapper/tag_wrapper'

export class LoadoutButtonWrapper extends ButtonWrapper {

	private _firstType : EntityType;
	private _secondType : EntityType;

	private _titleElm : HTMLElement;
	private _firstEquipElm : HTMLElement;
	private _titlePlusElm : HTMLElement;
	private _secondEquipElm : HTMLElement;

	private _pictureElm : HTMLElement;
	private _firstIcon : HTMLElement;
	private _picturePlusElm : HTMLElement;
	private _secondIcon : HTMLElement;

	private _descriptionElm : HTMLElement;
	private _firstKeyElm : HTMLElement;
	private _firstDescriptionElm : HTMLElement;
	private _secondKeyElm : HTMLElement;
	private _secondDescriptionElm : HTMLElement;

	private _tagsElm : HTMLElement;

	constructor() {
		super();

		this.elm().classList.add(Html.classLoadoutButton);

		this._firstType = EntityType.UNKNOWN;
		this._secondType = EntityType.UNKNOWN;

		this._titleElm = Html.div();
		this._titleElm.classList.add(Html.classLoadoutButtonTitle);
		this._firstEquipElm = Html.span();
		this._titlePlusElm = this.createPlusDiv();
		this._secondEquipElm = Html.span();

		this._titleElm.appendChild(this._firstEquipElm);
		this._titleElm.appendChild(this._titlePlusElm);
		this._titleElm.appendChild(this._secondEquipElm);

		this._pictureElm = Html.div();
		this._pictureElm.classList.add(Html.classLoadoutButtonPicture);
		this._firstIcon = Icon.baseElement();
		this._firstIcon.classList.add(Html.classLoadoutButtonIcon);
		this._firstIcon.style.textAlign = "right";
		this._picturePlusElm = this.createPlusSpan();
		this._secondIcon = Icon.baseElement();
		this._secondIcon.classList.add(Html.classLoadoutButtonIcon);
		this._secondIcon.style.textAlign = "left";

		this._pictureElm.appendChild(this._firstIcon);
		this._pictureElm.appendChild(this._picturePlusElm);
		this._pictureElm.appendChild(this._secondIcon);

		this._descriptionElm = Html.div();
		this._descriptionElm.classList.add(Html.classLoadoutButtonDescription);
		let mouse = Icon.create(IconType.MOUSE);
		this._firstKeyElm = Html.span();
		this._firstKeyElm.innerHTML = `${mouse.outerHTML} (L): `;
		this._firstKeyElm.style.visibility = "hidden";
		this._firstDescriptionElm = Html.span();
		this._secondKeyElm = Html.span();
		this._secondKeyElm.innerHTML = `${mouse.outerHTML} (R): `;
		this._secondKeyElm.style.visibility = "hidden";
		this._secondDescriptionElm = Html.span();

		this._descriptionElm.appendChild(this._firstKeyElm);
		this._descriptionElm.appendChild(this._firstDescriptionElm);
		this._descriptionElm.appendChild(Html.br());
		this._descriptionElm.appendChild(this._secondKeyElm);
		this._descriptionElm.appendChild(this._secondDescriptionElm);

		this._tagsElm = Html.div();
		this._tagsElm.classList.add(Html.classLoadoutButtonTags);

		this.elm().appendChild(this._titleElm);
		this.elm().appendChild(this._pictureElm);
		this.elm().appendChild(this._descriptionElm);
		this.elm().appendChild(this._tagsElm);
	}

	updatePair(pair : [EntityType, EntityType]) : void {
		this.updateFirst(pair[0]);
		this.updateSecond(pair[1]);
	}

	updateFirst(type : EntityType) : void {
		if (type === EntityType.UNKNOWN) {
			return;
		}

		this._firstEquipElm.textContent = StringFactory.getEntityTypeName(type).toTitleString();
		this._firstKeyElm.style.visibility = "visible";
		this._firstDescriptionElm.textContent = StringFactory.getEntityUsage(type).toString();
		Icon.change(this._firstIcon, Icon.getEntityIconType(type));

		const color = ColorFactory.entityColor(type).toString();
		const tags = EquipFactory.getEntityTags(type);
		this.updateTags(tags, color);

		this._firstType = type;
	}
	clearAll() : void {
		this._firstEquipElm.textContent = "";
		this._titlePlusElm.style.visibility = "hidden";

		Icon.clear(this._firstIcon);
		this._picturePlusElm.style.visibility = "hidden";

		this._firstEquipElm.textContent = "";
		this._firstDescriptionElm.textContent = "";
		this._firstKeyElm.style.visibility = "hidden";

		this._firstType = EntityType.UNKNOWN;

		this.clearSecond();
	}

	updateSecond(type : EntityType) : void {
		if (type === EntityType.UNKNOWN) {
			return;
		}

		this._secondEquipElm.textContent = StringFactory.getEntityTypeName(type).toTitleString();
		this._secondKeyElm.style.visibility = "visible";
		this._secondDescriptionElm.textContent = StringFactory.getEntityUsage(type).toString();
		Icon.change(this._secondIcon, Icon.getEntityIconType(type));

		if (this._firstType !== EntityType.UNKNOWN) {
			this._titlePlusElm.style.visibility = "visible";
			this._picturePlusElm.style.visibility = "visible";

			const color = ColorFactory.entityColor(this._firstType).toString();
			const tags = EquipFactory.getTags([this._firstType, this._secondType]);
			this.updateTags(tags, color);
		}

		this._secondType = type;
	}
	clearSecond() : void {
		this._secondEquipElm.textContent = "";
		this._titlePlusElm.style.visibility = "hidden";

		Icon.clear(this._secondIcon);
		this._picturePlusElm.style.visibility = "hidden";

		this._secondEquipElm.textContent = "";
		this._secondDescriptionElm.textContent = "";
		this._secondKeyElm.style.visibility = "hidden";

		this._secondType = EntityType.UNKNOWN;
	}

	private updateTags(tags : Set<EquipTag>, color : string) : void {
		let tagHtml = [];
		tags.forEach((tag : EquipTag) => {
			let tagWrapper = new TagWrapper();
			tagWrapper.setName(StringFactory.getTagName(tag));
			tagWrapper.setBackgroundColor(color);
			tagHtml.push(tagWrapper.elm().outerHTML);
		});
		this._tagsElm.innerHTML = tagHtml.join(" ");
	}

	private createPlusSpan() : HTMLElement {
		let plus = Html.span();
		plus.textContent = "+";
		plus.classList.add(Html.classLoadoutButtonPlus);
		plus.style.visibility = "hidden";
		return plus;
	}
	private createPlusDiv() : HTMLElement {
		let plus = Html.div();
		plus.textContent = "+";
		plus.classList.add(Html.classLoadoutButtonPlus);
		plus.style.visibility = "hidden";
		return plus;
	}
}