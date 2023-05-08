
import { MessageType } from 'network/message/api'

export interface Message {
	type() : MessageType;
	valid() : boolean;
	parseObject(obj : Object) : Message;
	toObject() : Object;
}

enum Prop {
	UNKNOWN,
	TYPE,
	DATA,
}

export abstract class MessageBase {
	protected _type : MessageType;
	protected _data : Object;

	constructor(type : MessageType) {
		this._type = type;
		this._data = {};
	}

	type() : MessageType { return this._type; }
	valid() : boolean { return this._type !== MessageType.UNKNOWN && Object.keys(this._data).length > 0; }

	protected hasProp(prop : number) : boolean { return this._data.hasOwnProperty(prop); }
	protected getProp<T extends Object>(prop : number) : T { return <T>this._data[prop]; }
	protected setProp<T extends Object>(prop : number, obj : T) : void { this._data[prop] = obj;	}

	parseObject(obj : Object) : Message {
		if (obj.hasOwnProperty(Prop.TYPE)) {
			this._type = <MessageType>obj[Prop.TYPE];
		}
		if (obj.hasOwnProperty(Prop.DATA)) {
			this._data = <Object>obj[Prop.DATA];
		}
		return this;
	}
	toObject() : Object {
		let obj = {};
		obj[Prop.TYPE] = this._type;
		obj[Prop.DATA] = this._data;
		return obj;
	}
}