
import { game } from 'game'

import { GameMessage, GameMessageType } from 'message/game_message'

import { settings } from 'settings'

import { AnnouncementType, CounterType, CounterOptions, DialogType, InfoType, KeyType, TooltipType, TooltipOptions, UiMode } from 'ui/api'
import { Handler } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'

import { AnnouncementHandler } from 'ui/handler/announcement_handler'
import { ChatHandler } from 'ui/handler/chat_handler'
import { ClientsHandler } from 'ui/handler/clients_handler'
import { CountersHandler } from 'ui/handler/counters_handler'
import { DialogHandler } from 'ui/handler/dialog_handler'
import { FeedHandler } from 'ui/handler/feed_handler'
import { InputHandler } from 'ui/handler/input_handler'
import { KeyBindHandler } from 'ui/handler/key_bind_handler'
import { LoginHandler } from 'ui/handler/login_handler'
import { MenuHandler } from 'ui/handler/menu_handler'
import { ScoreboardHandler } from 'ui/handler/scoreboard_handler'
import { SettingsHandler } from 'ui/handler/settings_handler'
import { StatsHandler } from 'ui/handler/stats_handler'
import { TimerHandler } from 'ui/handler/timer_handler'
import { TooltipHandler } from 'ui/handler/tooltip_handler'
import { TrayHandler } from 'ui/handler/tray_handler'

import { isLocalhost } from 'util/common'
import { Optional } from 'util/optional'
import { Vec, Vec2 } from 'util/vector'

class UI {

	private _mode : UiMode;
	private _audioContext : Optional<AudioContext>;

	private _handlers : Map<HandlerType, Handler>;

	private _announcementHandler : AnnouncementHandler;
	private _chatHandler : ChatHandler;
	private _clientsHandler : ClientsHandler;
	private _countersHandler : CountersHandler;
	private _dialogHandler : DialogHandler;
	private _feedHandler : FeedHandler;
	private _inputHandler : InputHandler;
	private _keyBindHandler : KeyBindHandler;
	private _loginHandler : LoginHandler;
	private _menuHandler : MenuHandler;
	private _scoreboardHandler : ScoreboardHandler;
	private _settingsHandler : SettingsHandler;
	private _statsHandler : StatsHandler;
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
		this._countersHandler = this.add(new CountersHandler());
		this._dialogHandler = this.add(new DialogHandler());
		this._feedHandler = this.add(new FeedHandler());
		this._inputHandler = this.add(new InputHandler());
		this._keyBindHandler = this.add<KeyBindHandler>(new KeyBindHandler());
		this._loginHandler = this.add<LoginHandler>(new LoginHandler());
		this._menuHandler = this.add<MenuHandler>(new MenuHandler());
		this._scoreboardHandler = this.add<ScoreboardHandler>(new ScoreboardHandler());
		this._settingsHandler = this.add<SettingsHandler>(new SettingsHandler());
		this._statsHandler = this.add<StatsHandler>(new StatsHandler());
		this._timerHandler = this.add<TimerHandler>(new TimerHandler());
		this._tooltipHandler = this.add<TooltipHandler>(new TooltipHandler());
		this._trayHandler = this.add<TrayHandler>(new TrayHandler());
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

	handleMessage(msg : GameMessage) : void {
		if (!msg.valid()) {
			console.error("Error: invalid message", msg);
			return;
		}

		this._handlers.forEach((handler) => {
			handler.handleMessage(msg);
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

	openMenu() : void { this._menuHandler.enable(); }
	applySettings() : void {
		if (settings.useInspector()) {
			game.scene().debugLayer.show();
		} else {
			game.scene().debugLayer.hide();
		}
		game.runner().setRenderSpeed(settings.fpsSetting);
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

	requestFullscreen() : void { document.documentElement.requestFullscreen(); }
	exitFullscreen() : void {
		if (this.isFullscreen()) {
			document.exitFullscreen();
		}
	}
	isFullscreen() : boolean { return window.innerHeight === screen.height; }

	requestPointerLock() : void { game.canvas().requestPointerLock(); }
	exitPointerLock() : void {
		if (this.isPointerLocked()) {
			document.exitPointerLock();
		}
	}
	isPointerLocked() : boolean { return document.pointerLockElement === game.canvas(); }

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

	setTimer(millis : number) : void { this._timerHandler.setTime(millis); }
	clearTimer() : void { this._timerHandler.clear(); }
	updateCounters(counters : Map<CounterType, CounterOptions>) : void { this._countersHandler.updateCounters(counters); }
	updateInfo(id : number, type : InfoType, value : number | string) : void { this._scoreboardHandler.updateInfo(id, type, value); }
	clearInfo(id : number, type : InfoType) : void { this._scoreboardHandler.clearInfo(id, type); }
	pushDialog(type : DialogType) : void { this._dialogHandler.pushDialog(type); }
	forceSubmitDialog(type : DialogType) : void { this._dialogHandler.forceSubmitDialog(type); }
	showTooltip(type : TooltipType, options : TooltipOptions) : void { this._tooltipHandler.showTooltip(type, options); }
	hideTooltip(type : TooltipType) : void { this._tooltipHandler.hideTooltip(type); }
	setDebugStats(enabled : boolean) : void { this._statsHandler.setDebug(enabled); }
	usingTray() : boolean { return this._trayHandler.hasMouse(); }

	chat(msg : string) : void { this._chatHandler.chat(msg); }
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
			ui.chat("Error: failed to enable microphone. Please check that you have a device connected and have allowed permissions.");
			this._trayHandler.handleVoiceError();
		}
	}
}

export const ui = new UI();