

class Options {
	
	public leftKeyCode : number;
	public rightKeyCode : number;
	public jumpKeyCode : number;
	public interactKeyCode : number;
	public mouseClickKeyCode : number;
	public altMouseClickKeyCode : number;

	public scoreboardKeyCode : number;
	public pauseKeyCode : number;
	public chatKeyCode : number;

	public enableFullscreen : boolean;
	public enablePointerLock : boolean;

	public predictionWeight : number;

	public debugInspector : boolean;
	public debugPhysics : boolean;
	public debugDelay : number;

	constructor() {
		this.leftKeyCode = 65;
		this.rightKeyCode = 68;
		this.jumpKeyCode = 32;
		this.interactKeyCode = 69;
		this.mouseClickKeyCode = 83;
		this.altMouseClickKeyCode = 16;

		this.pauseKeyCode = 27;
		this.chatKeyCode = 13;
		this.scoreboardKeyCode = 9;

		this.enableFullscreen = false;
		this.enablePointerLock = false;

		this.predictionWeight = 0.5;

		// Debug properties
		this.debugInspector = false;
		this.debugPhysics = false;
		this.debugDelay = 30;
	}
}

export const options = new Options();