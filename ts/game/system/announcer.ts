
import { StepData } from 'game/game_object'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'

import { UiMessage, UiMessageType } from 'message/ui_message'

import { ui } from 'ui'
import { AnnouncementType } from 'ui/api'

type Announcement = {
	type : AnnouncementType;
	names : Array<string>;
}

export class Announcer extends SystemBase implements System {

	constructor() {
		super(SystemType.ANNOUNCER);
	}

	override postUpdate(stepData : StepData) : void {
		super.postUpdate(stepData);

		/*
    	let winnerMsg = new UiMessage(UiMessageType.ANNOUNCEMENT);
    	winnerMsg.setAnnouncementType(AnnouncementType.GAME_FINISH);
    	winnerMsg.setNames(["somebody (TODO)"]);
    	ui.handleMessage(winnerMsg);
    	*/
	}
}