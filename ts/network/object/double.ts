
import { DataObject, DataObjectBase } from 'network/data'

export class Double extends DataObjectBase<number> implements DataObject<number> {

	constructor() {
		super();

		this.initialize(0.0);
	}
}