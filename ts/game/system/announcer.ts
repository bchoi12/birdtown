
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'

import { MessageObject } from 'message'
import { UiMessage, UiMessageType } from 'message/ui_message'

import { ui } from 'ui'
import { AnnouncementType } from 'ui/api'

import { LinkedList } from 'util/linked_list'

export class Announcer extends SystemBase implements System {

	// Queue for exporting one announcement per frame.
	private _announcements : LinkedList<UiMessage>

	constructor() {
		super(SystemType.ANNOUNCER);

		this._announcements = new LinkedList();

		this.addProp<MessageObject>({
			has: () => { return !this._announcements.empty(); },
			export: () => { return this._announcements.popFirst().exportObject(); },
			import: (obj : MessageObject) => {
				const announcement = new UiMessage(UiMessageType.ANNOUNCEMENT);
				announcement.parseObject(obj);
				this.announce(announcement);
			},

			options: {
				filters: GameData.tcpFilters,
			},
		});
	}

	override initialize() : void {
		super.initialize();

		// Client-side welcome
    	let announcement = new UiMessage(UiMessageType.ANNOUNCEMENT);
    	announcement.setAnnouncementType(AnnouncementType.WELCOME);
    	ui.handleMessage(announcement);
	}

	announce(announcement : UiMessage) : void {
		if (announcement.type() !== UiMessageType.ANNOUNCEMENT || !announcement.valid()) {
			console.error("Error: skipping invalid announcement", announcement);
			return;
		}

		ui.handleMessage(announcement);

		// Add announcement to be exported.
		if (this.isSource()) {
			this._announcements.push(announcement);
		}
	}
}