
class Settings {
	
	public leftKeyCode : number;
	public rightKeyCode : number;
	public jumpKeyCode : number;
	public interactKeyCode : number;
	public squawkKeyCode : number;
	public mouseClickKeyCode : number;
	public altMouseClickKeyCode : number;

	public scoreboardKeyCode : number;
	public pauseKeyCode : number;
	public chatKeyCode : number;

	public enableFullscreen : boolean;
	public enablePointerLock : boolean;
	public enableAntiAlias : boolean;
	public enablePrediction : boolean;

	public predictionTime : number;

	public debugInspector : boolean;
	public debugDelay : number;
	public debugJitter : number;
	public debugSendFailure : number;

	constructor() {
		this.leftKeyCode = 65;
		this.rightKeyCode = 68;
		this.jumpKeyCode = 32;
		this.interactKeyCode = 69;
		this.squawkKeyCode = 81;
		this.mouseClickKeyCode = 83;
		this.altMouseClickKeyCode = 16;

		this.pauseKeyCode = 27;
		this.chatKeyCode = 13;
		this.scoreboardKeyCode = 9;

		this.enableFullscreen = false;
		this.enablePointerLock = false;
		this.enableAntiAlias = true;
		this.enablePrediction = true;

		this.predictionTime = 500;

		// Debug properties
		this.debugInspector = false;
		this.debugDelay = 0;
		this.debugJitter = 0;
		this.debugSendFailure = 0;
	}

	// TODO: save and load from cookie
}

export const settings = new Settings();