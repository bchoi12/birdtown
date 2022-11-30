

class Options {
	
	public leftKeyCode : number;
	public rightKeyCode : number;
	public jumpKeyCode : number;

	constructor() {
		this.leftKeyCode = 65;
		this.rightKeyCode = 68;
		this.jumpKeyCode = 32;
	}
}

export const options = new Options();