
type ComparatorFn<T> = (a : T, b : T) => boolean;

export class LinkedNode<T> {
	private _value: T;
	private _prev: LinkedNode<T>;
	private _next : LinkedNode<T>;

	constructor(value : T) {
		this._value = value;
		this._prev = null;
		this._next = null;
	}

	setValue(value : T) : void { this._value = value; }
	value() : T { return this._value; }

	hasNext() : boolean { return this._next !== null; }
	setNext(next : LinkedNode<T>) { this._next = next; }
	next() : LinkedNode<T> { return this._next; }

	hasPrev() : boolean { return this._prev !== null; }
	setPrev(prev : LinkedNode<T>) { this._prev = prev; }
	prev() : LinkedNode<T> { return this._prev; }
}

export class LinkedList<T> {

	private _head : LinkedNode<T>;
	private _tail : LinkedNode<T>;
	private _size : number;

	constructor() {
		this._head = null;
		this._tail = null;
		this._size = 0;
	}

	size() : number { return this._size; }
	empty() : boolean { return this._head === null; }
	head() : LinkedNode<T> { return this._head; }
	tail() : LinkedNode<T> { return this._tail; }

	peekFirst() : T { return this._head !== null ? this._head.value() : null; }
	peekLast() : T { return this._tail !== null ? this._tail.value() : null; }
	popFirst() : T { return this.delete(this._head); }
	popBack() : T { return this.delete(this._tail); }

	push(value : T) : T {
		if (this._head === null) {
			this._head = new LinkedNode<T>(value);
			this._tail = this._head;
			this._size = 1;
			return this._head.value();
		}

		const node = new LinkedNode<T>(value);
		node.setPrev(this._tail);
		this._tail.setNext(node);
		this._tail = node;
		this._size++;
		return node.value();
	}

	insert(value : T, comparator : ComparatorFn<T>) : T {
		if (this.empty()) { return this.push(value); }

		let current = this._head;
		while(current !== this._tail) {
			if (comparator(value, current.value())) {
				break;
			}
			current = current.next();
		}

		let node = new LinkedNode<T>(value);
		if (current.hasPrev()) {
			let prev = current.prev();
			node.setPrev(prev);
			prev.setNext(node);
		}
		current.setPrev(node);
		node.setNext(current);

		this._size++;
		return node.value();
	}

	delete(node : LinkedNode<T>) : T {
		if (this.empty()) { return null; }

		if (node.hasPrev()) {
			let prev = node.prev();
			prev.setNext(node.next());
		} else {
			this._head = node.next();
		}

		if (node.hasNext()) {
			let next = node.next();
			next.setPrev(node.prev());
		} else {
			this._tail = node.prev();
		}

		this._size--;
		return node.value();
	}
}