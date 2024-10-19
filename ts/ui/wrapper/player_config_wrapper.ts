
import { game } from 'game'
import { PlayerConfig, PlayerInfo, StartRole } from 'game/util/player_config'

import { GameConfigMessage } from 'message/game_config_message'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { SettingWrapper } from 'ui/wrapper/label/setting_wrapper'

export class PlayerConfigWrapper extends HtmlWrapper<HTMLElement> {

	private _configElm : HTMLElement;
	private _errorElm : HTMLElement;
	private _config : PlayerConfig;
	private _teams : boolean;
	private _settingWrappers : Map<number, SettingWrapper<StartRole>>;

	constructor() {
		super(Html.div());

		this._configElm = Html.div();
		this._errorElm = Html.div();

		this._config = PlayerConfig.fromSetup();
		this._teams = false;
		this._settingWrappers = new Map();

		this.elm().appendChild(this._configElm);
		this.elm().appendChild(Html.br());
		this.elm().appendChild(this._errorElm);
		this.initialize();
	}

	config() : PlayerConfig {
		this.refreshConfig();

		return this._config;
	}

	addPlayer(id : number) : boolean {
		if (!this._config.addClient(id)) {
			return false;
		}
		this.addSettingWrapper(id, this._config.info(id));
		return true;
	}
	deletePlayer(id : number) : void {
		this._config.deleteClient(id);

		if (this._settingWrappers.has(id)) {
			this._configElm.removeChild(this._settingWrappers.get(id).elm());
		}
	}
	setTeams(teams : boolean) : void {
		this._teams = teams;
		this._config.setTeams(teams);

		this.refreshWrapper();
	}

	checkCanPlay(msg : GameConfigMessage) : boolean {
		const [errors, ok] = this.config().canPlay(msg);

		if (!ok) {
			this.setErrors(errors);
		}
		return ok;
	}
	setErrors(errors : Array<string>) : void {
		if (errors.length === 0) {
			this._errorElm.textContent = "";
			return;
		}

		let html = "Player setup is invalid!<br>";
		for (let i = 0 ; i < errors.length; ++i) {
			html += `<li>${errors[i]}</li>`;
		}
		this._errorElm.innerHTML = html;
	}

	private initialize() : void {
		this._config.playerMap().forEach((info : PlayerInfo, id : number) => {
			this.addSettingWrapper(id, info);
		});
	}

	private refreshWrapper() : void {
		this._settingWrappers.forEach((wrapper : SettingWrapper<StartRole>, id : number) => {
			wrapper.setValue(this._config.role(id));
		});
	}
	private refreshConfig() : void {
		this._settingWrappers.forEach((wrapper : SettingWrapper<StartRole>, id : number) => {
			this._config.setRole(id, wrapper.value());
		});
	}

	private addSettingWrapper(id : number, info : PlayerInfo) : void {
		let roleWrapper = new SettingWrapper<StartRole>({
			name: info.displayName,
			value: info.role,
			click: (current : StartRole) => {
				if (this._teams) {
					if (current === StartRole.TEAM_ONE) {
						return StartRole.TEAM_TWO;
					} else if (current === StartRole.TEAM_TWO) {
						return StartRole.SPECTATING;
					}
					return StartRole.TEAM_ONE;
				} else {
					if (current === StartRole.PLAYING) {
						return StartRole.SPECTATING;
					}
					return StartRole.PLAYING;
				}
			},
			text: (current : StartRole) => {
				return PlayerConfig.roleString(current);
			},
		});

		this._settingWrappers.set(id, roleWrapper);
		this._configElm.appendChild(roleWrapper.elm());
	}
}