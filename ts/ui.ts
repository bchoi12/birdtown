
import { game } from 'game'

import { GameMessage, GameMessageType } from 'message/game_message'
import { GameConfigMessage } from 'message/game_config_message'

import { settings } from 'settings'

import { AnnouncementType, ChatType, ChatOptions, HudType, HudOptions, DialogType, InfoType, KeyType, StatusType, TooltipType, TooltipOptions, UiMode } from 'ui/api'
import { Handler } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'

import { AnnouncementHandler } from 'ui/handler/announcement_handler'
import { ChatHandler } from 'ui/handler/chat_handler'
import { ClientsHandler } from 'ui/handler/clients_handler'
import { DialogHandler } from 'ui/handler/dialog_handler'
import { FeedHandler } from 'ui/handler/feed_handler'
import { FocusHandler } from 'ui/handler/focus_handler'
import { FullscreenHandler } from 'ui/handler/fullscreen_handler'
import { HudHandler } from 'ui/handler/hud_handler'
import { InputHandler } from 'ui/handler/input_handler'
import { KeyBindHandler } from 'ui/handler/key_bind_handler'
import { LoginHandler } from 'ui/handler/login_handler'
import { MenuHandler } from 'ui/handler/menu_handler'
import { PointerLockHandler } from 'ui/handler/pointer_lock_handler'
import { ScoreboardHandler } from 'ui/handler/scoreboard_handler'
import { SettingsHandler } from 'ui/handler/settings_handler'
import { StatsHandler } from 'ui/handler/stats_handler'
import { StatusHandler } from 'ui/handler/status_handler'
import { TimerHandler } from 'ui/handler/timer_handler'
import { TooltipHandler } from 'ui/handler/tooltip_handler'
import { TrayHandler } from 'ui/handler/tray_handler'

import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'

import { isLocalhost } from 'util/common'
import { Optional } from 'util/optional'
import { Vec, Vec2 } from 'util/vector'

class UI {

	private static readonly _clientMessageTypes = new Set([
		GameMessageType.CLIENT_INIT, GameMessageType.CLIENT_JOIN, GameMessageType.CLIENT_DISCONNECT
	])

	private _mode : UiMode;
	private _audioContext : Optional<AudioContext>;

	private _handlers : Map<HandlerType, Handler>;

	private _announcementHandler : AnnouncementHandler;
	private _chatHandler : ChatHandler;
	private _clientsHandler : ClientsHandler;
	private _dialogHandler : DialogHandler;
	private _feedHandler : FeedHandler;
	private _focusHandler : FocusHandler;
	private _fullscreenHandler : FullscreenHandler;
	private _hudHandler : HudHandler;
	private _inputHandler : InputHandler;
	private _keyBindHandler : KeyBindHandler;
	private _loginHandler : LoginHandler;
	private _menuHandler : MenuHandler;
	private _pointerLockHandler : PointerLockHandler;
	private _scoreboardHandler : ScoreboardHandler;
	private _settingsHandler : SettingsHandler;
	private _statsHandler : StatsHandler;
	private _statusHandler : StatusHandler;
	private _timerHandler : TimerHandler;
	private _tooltipHandler : TooltipHandler;
	private _trayHandler : TrayHandler;

	constructor() {
		this._mode = UiMode.UNKNOWN;
		this._audioContext = new Optional();

		this._handlers = new Map();		

		this._announcementHandler = this.add(new AnnouncementHandler());
		this._chatHandler = this.add(new ChatHandler());
		this._clientsHandler = this.add(new ClientsHandler());
		this._dialogHandler = this.add(new DialogHandler());
		this._feedHandler = this.add(new FeedHandler());
		this._focusHandler = this.add(new FocusHandler());
		this._fullscreenHandler = this.add(new FullscreenHandler());
		this._hudHandler = this.add(new HudHandler());
		this._inputHandler = this.add(new InputHandler());
		this._keyBindHandler = this.add(new KeyBindHandler());
		this._loginHandler = this.add(new LoginHandler());
		this._menuHandler = this.add(new MenuHandler());
		this._pointerLockHandler = this.add(new PointerLockHandler());
		this._scoreboardHandler = this.add(new ScoreboardHandler());
		this._settingsHandler = this.add(new SettingsHandler());
		this._statsHandler = this.add(new StatsHandler());
		this._statusHandler = this.add(new StatusHandler());
		this._timerHandler = this.add(new TimerHandler());
		this._tooltipHandler = this.add(new TooltipHandler());
		this._trayHandler = this.add(new TrayHandler());
	}

	setup() : void {
		this._handlers.forEach((handler) => {
			handler.setup();
		});
	}
	onPlayerInitialized() : void {
		this._handlers.forEach((handler) => {
			handler.onPlayerInitialized();
		});
	}

	handleClientMessage(msg : GameMessage) : void {
		if (!msg.valid() || !UI._clientMessageTypes.has(msg.type())) {
			console.error("Error: invalid client message", msg);
			return;
		}

		this._handlers.forEach((handler) => {
			handler.handleClientMessage(msg);
		});
	}

	add<T extends Handler>(handler : T) {
		this._handlers.set(handler.type(), handler);
		return handler;
	}
	mode() : UiMode { return this._mode; }
	setMode(mode : UiMode) : void {
		if (this._mode === mode) {
			return;
		}

		const oldMode = this._mode;
		this._mode = mode;

		if (isLocalhost()) {
			console.log("UI mode %s -> %s", UiMode[oldMode], UiMode[mode]);	
		}

		this._handlers.forEach((handler) => {
			handler.onModeChange(mode, oldMode);
		});	
	}
	setGameConfig(config : GameConfigMessage) : void { this._scoreboardHandler.setGameConfig(config); }

	openMenu() : void { this._menuHandler.enable(); }
	applySettings() : void {
		if (settings.useInspector()) {
			game.scene().debugLayer.show();
		} else {
			game.scene().debugLayer.hide();
		}
		game.runner().setRenderSpeed(settings.fpsSetting);
		game.world().applyShadowSetting(settings.shadowSetting);
	}

	audioContext() : AudioContext {
		// Lazy initialize since I think browser needs user input beforehand
		if (!this._audioContext.has()) {
			this._audioContext.set(new AudioContext());
		}
		return this._audioContext.get();
	}
	inputWidth() : number { return this._inputHandler.inputWidth(); }
	inputHeight() : number { return this._inputHandler.inputHeight(); }
	screenRect() : DOMRect { return this._inputHandler.screenRect(); }
	focused() : boolean { return this._focusHandler.focused(); }
	timeSinceFocusChange() : number { return Date.now() - this._focusHandler.lastChangeTime(); }

	applyFullscreen() : void { this._fullscreenHandler.applyFullscreen(); }
	isFullscreen() : boolean { return this._fullscreenHandler.isFullscreen(); }

	setPointerLockRequested(requested : boolean) : void {
		this._pointerLockHandler.setPointerLockRequested(requested);
	}
	pointerLocked() : boolean { return this._pointerLockHandler.pointerLocked(); }

	updatePos(clientId : number, pos : Vec) : void {
		let context = this.audioContext();
		if (clientId === game.clientId()) {
			let listener = context.listener;
			if (listener.positionX) {
				listener.positionX.setValueAtTime(pos.x, context.currentTime);
				listener.positionY.setValueAtTime(pos.y, context.currentTime);
				listener.positionZ.setValueAtTime(pos.z ? pos.z : 0, context.currentTime);
			} else {
				// Support Firefox
				listener.setPosition(pos.x, pos.y, pos.z ? pos.z : 0);
			}
			return;
		}

		if (this._clientsHandler.hasClient(clientId)) {
			this._clientsHandler.getClient(clientId).updatePos(pos);
		}
	}

	pushAnnouncement(msg : GameMessage) : void { this._announcementHandler.pushAnnouncement(msg); }
	setTimer(millis : number) : void { this._timerHandler.setTime(millis); }
	clearTimer() : void { this._timerHandler.clear(); }
	setHudClientId(id : number) : void { this._hudHandler.setClientId(id); }
	updateHud(huds : Map<HudType, HudOptions>) : void { this._hudHandler.updateHud(huds); }
	hideHud() : void { this._hudHandler.hideHud(); }
	addPlayer(clientId : number) : void { this._scoreboardHandler.addPlayer(clientId); }
	removePlayer(clientId : number) : void { this._scoreboardHandler.removePlayer(clientId); }
	highlightPlayer(clientId : number) : void { this._scoreboardHandler.highlightPlayer(clientId); }
	showScoreboard() : void { this._scoreboardHandler.stickyShow(); }
	hideScoreboard() : void { this._scoreboardHandler.hide(); }
	updateInfo(id : number, type : InfoType, value : number) : void { this._scoreboardHandler.updateInfo(id, type, value); }
	clearInfo(id : number, type : InfoType) : void { this._scoreboardHandler.clearInfo(id, type); }
	pushDialog<T extends DialogWrapper>(type : DialogType) : T { return this._dialogHandler.pushDialog(type); }
	forceSubmitDialog(type : DialogType) : void { this._dialogHandler.forceSubmitDialog(type); }
	showTooltip(type : TooltipType, options : TooltipOptions) : void { this._tooltipHandler.showTooltip(type, options); }
	pushFeed(msg : GameMessage) : void { this._feedHandler.pushFeed(msg); }
	hideTooltip(type : TooltipType) : void { this._tooltipHandler.hideTooltip(type); }
	setDebugStats(enabled : boolean) : void { this._statsHandler.setDebug(enabled); }
	hasStatus(type : StatusType) : boolean { return this._statusHandler.hasStatus(type); }
	showStatus(type : StatusType) : void { this._statusHandler.showStatus(type); }
	hideStatus(type : StatusType) : void { this._statusHandler.hideStatus(type); }
	disableStatus(type : StatusType) : void { this._statusHandler.disableStatus(type); }
	usingTray() : boolean { return this._trayHandler.hasMouse(); }

	chat(type : ChatType, msg : string, options? : ChatOptions) : void { this._chatHandler.chat(type, msg, options); }
	clear() : void {
		this._handlers.forEach((handler) => {
			handler.clear();
		});	
	}

	keys() : Set<KeyType> { return this._inputHandler.keys(); }
	clearKeys() : void { this._inputHandler.clearKeys(); }
	mouse() : Vec2 { return this._inputHandler.mouse(); }
	resetKeyBinds() : void { this._inputHandler.reset(); }

	addStream(clientId : number, stream : MediaStream) : void { this._clientsHandler.addStream(clientId, stream); }
	removeStream(clientId : number) : void { this._clientsHandler.removeStream(clientId); }
	removeStreams() : void { this._clientsHandler.removeStreams(); }
	handleVoiceError(clientId : number) : void {
		if (clientId === game.clientId()) {
			ui.chat(ChatType.ERROR, "Couldn't connect to your microphone. Please double check you have granted Birdtown permission to access your mic.");
			this._trayHandler.handleVoiceError();
		}
	}
}

export const ui = new UI();