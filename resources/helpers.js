/**
 * Created by M. Yegorov on 7/10/14.
 */

int10 = function(string){
	return parseInt(string, 10)
}



if (!Function.prototype.bind) {
	Function.prototype.bind = function (oThis) {
		if (typeof this !== "function") {
			// closest thing possible to the ECMAScript 5 internal IsCallable function
			throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
		}

		var aArgs = Array.prototype.slice.call(arguments, 1),
			fToBind = this,
			fNOP = function () {},
			fBound = function () {
				return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
					aArgs.concat(Array.prototype.slice.call(arguments))
				);
			};

		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();

		return fBound;
	};
}

bind = function (context, funcNames) {
	/*
	 *  если funcNames:
	 * 	строка - указанная функция привязывается к контексту класса по ее имени
	 * 	массив строк - все функции, перечисленные по именам, привязываются к контексту класса
	 *	не подан - все функции прототипа класса привязываются к контексту класса
	 * */

	// собственно, функция привязки к контексту
	var _bind = function (funcName) {
		context[funcName] = context[funcName].bind(context);
	}

	switch (typeof funcNames) {
		// второй аргумент вообще не подан - привязываем все функции
		case 'undefined':

			for (var memberName in context) {
				if (typeof context[memberName] == 'function' && memberName.indexOf('_') != 0) _bind(memberName);
			}

			break;
		// подан массив - привязываем все его элементы к контексту
		case 'object':

			for (var i = 0; i < funcNames.length; i++) _bind(funcNames[i]);

			break;
		// подана строка - привязываем одну функцию
		case 'string':
		default:

			_bind(funcNames);
	}
}
