
import { game } from 'game'
import { PlayerConfig, PlayerInfo, StartRole, TeamMode } from 'game/util/player_config'

import { GameConfigMessage } from 'message/game_config_message'

import { ui } from 'ui'
import { IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { SettingWrapper } from 'ui/wrapper/label/setting_wrapper'

export class PlayerConfigWrapper extends HtmlWrapper<HTMLElement> {

	private _configElm : HTMLElement;
	private _infoElm : HTMLElement;
	private _config : PlayerConfig;
	private _settingWrappers : Map<number, SettingWrapper<StartRole>>;

	constructor() {
		super(Html.div());

		this._configElm = Html.div();
		this._infoElm = Html.div();
		this._infoElm.style.textAlign = "center";
		this._infoElm.style.display = "none";
		this._infoElm.style.marginBottom = "1em";

		this._config = PlayerConfig.fromSetup();
		this._settingWrappers = new Map();

		this.elm().appendChild(this._infoElm);
		this.elm().appendChild(this._configElm);
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
	setTeamMode(mode : TeamMode, max? : number) : void {
		this._config.setTeamMode(mode, max);
		this.refreshWrapper();
	}

	checkCanPlay(msg : GameConfigMessage) : boolean {
		const [errors, ok] = this.config().canPlay(msg);

		if (!ok) {
			this.setErrors(errors);
		}
		return ok;
	}

	addRandomButton(max? : number) : void {
		let random = new ButtonWrapper();

		random.setIcon(IconType.DICE)
		random.setText("Randomize Teams");
		random.addOnClick(() => {
			this._config.randomizeTeams(max);
			this.refreshWrapper();
		});
		random.elm().style.marginTop = "1em";
		this.elm().appendChild(random.elm());
	}
	setInfo(html : string) : void {
		this._infoElm.style.display = "block";
		this._infoElm.innerHTML = html;
	}
	setErrors(errors : Array<string>) : void {
		if (errors.length === 0) {
			this._infoElm.textContent = "";
			this._infoElm.style.display = "none";
			return;
		}

		this._infoElm.style.display = "block";
		this._infoElm.style.textAlign = "left";
		let html = "Player setup is invalid!<br>";
		for (let i = 0 ; i < errors.length; ++i) {
			html += `<li>${errors[i]}</li>`;
		}
		this._infoElm.innerHTML = html;
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
				switch (this._config.teamMode()) {
				case TeamMode.TWO_TEAMS:
					if (current === StartRole.TEAM_ONE) {
						return StartRole.TEAM_TWO;
					} else if (current === StartRole.TEAM_TWO) {
						return StartRole.SPECTATING;
					}
					return StartRole.TEAM_ONE;
				default:
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