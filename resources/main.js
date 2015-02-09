/**
 * Created by M. Yegorov on 7/10/14.
 */

Calculator = function(quant, cap, modifier, mode, add_data){
	bind(this);

	// ПРИГОТОВЛЕНИЯ

	//приводим значения к числам
	this.modifier = int10(modifier);
	this.diceQuant = int10(quant);

	//если еслть модификатор - прибавляем или отнимаем 1 дайс к пулу
	if (!isNaN(this.modifier) && this.modifier != 0) {
		this.diceQuant += 1;
		console.log('bonus or penalty')
	}

	//считываем параметры дайса
	this.minDiceVal = 1;
	this.maxDiceVal = int10(cap);

	// вычисляем общее число комбинаций (формула - макс.число дайса ^ число дайсов)
	this.combinationsQant = Math.pow(this.maxDiceVal, this.diceQuant);

	//предупреждение о слишком сложном рассчете
	if (this.combinationsQant > 10000000) {
		if (!confirm('More than 10 mln combinations! Calculation may be too slow. Sure you want to try?'))
		return false;
	}

	//обнуляем таблицы
	$('.result').hide();

	//ФОРМИРОВАНИЕ МАССИВА КОМБИНАЦИЙ

	//задаем переменные
	this.pool = [];
	this.combinations = [];

	// засекаем время начала подсчета
	var before = new Date();

	// первый (минимальный) экземпляр распределения
	var i = this.diceQuant;
	while (i--){
		this.pool.push(this.minDiceVal);
	}

	// заполняем массив всех возможных комбинаций
	var i = 1;
	while (i++ <= this.combinationsQant) {
		this.combinations.push(this.pool.slice()); //добавляем комбинацию в массив (без slice присваивается ссылка)
		this.pool = this.addOne(this.pool); // инкрементируем пул
	}

	$('#total').html(this.combinations.length);


	// ЧТО ДАЛЬШЕ:

	// вариант с суммированием значений
	console.log('mode:', mode)
	switch (mode) {
		case 'sum': this.getSumsDistribution(); break;
		case 'successes': this.getSuccessesDistribution(); break;
	}


	//засекаем время окончания подсчета
	var after = new Date();

	//выводим служебные результаты в консоль
	console.log('total combinations', this.combinations.length)
	console.log('calculated in ', after.getTime() - before.getTime(), ' ms')
};

Calculator.prototype = {
	addOne:function(pool){

		var i = pool.length;
		while (i--){
			if (pool[i] == this.maxDiceVal) {
				pool[i] = this.minDiceVal;
				continue;
			}
			pool[i]++;
			break;
		}

		return pool;
	},

	getSum:function(arr){
		var sum = 0, i = arr.length;

		if (this.modifier != 0){
			var that = this;
			i--;
			arr.sort(function(a,b){ return (b - a) * that.modifier; })
		}

		while(i--){
			sum += arr[i]
		}

		return sum;
	},

	// число комбинаций, дающих в сумме число, меньшее заданного (проигрышных комбинаций)
	getFaultsQuant:function(difficulty){

		var i = difficulty, rolls = 0;
		while(i--){
			if (!isNaN(this.distribution[i])) rolls += this.distribution[i]
		}

		return rolls;
	},

	countSuccesses: function(pool, difficulty){
		var successes = 0;

		var i = pool.length;
		while (i--){
			if (pool[i] >= difficulty) successes += 1;
		}

		return successes;
	},



	getSumsDistribution:function(){
		this.sums = [];
		this.distribution = [];

		// вычисляем кол-во комбинаций
		var i = this.combinations.length;
		while (i--) {

			var pool = this.combinations[i];
			var sum = this.getSum(pool);

			// забиваем комбинацию в массив комбинаций
			if (typeof this.sums[sum] == 'undefined') this.sums[sum] = [];
			this.sums[sum].push(pool.slice())

			// инкриментируем массив кол-ва комбинаций
			if (typeof this.distribution[sum] == 'undefined') this.distribution[sum] = 0;
			this.distribution[sum] += 1;
		}


		//заполняем таблицу

		var table = $('#sumsTable .table_results');
		var toCopy = $('#sumsTable .copy td');

		table.empty();
		toCopy.empty();

		// заполняем таблицу
		var i = -1;
		while(++i < this.distribution.length){

			if (typeof this.distribution[i] != 'undefined'){
				var faults = this.getFaultsQuant(i);

				table.append(
					'<tr>' +
					'	<td>'+ i +'</td>' +
					'	<td>'+ this.distribution[i] +'</td>' +
					'	<td>'+ ((this.distribution[i]/this.combinationsQant)*100).toFixed(2) +'%</td>' +
					'	<td>'+ ((1-(faults/this.combinationsQant))*100).toFixed(2) +'%</td>' +
					'	<td>'+ faults +'</td>' +
					'</tr>'
				)

				toCopy.eq(0).html(toCopy.eq(0).html()+'<p>'+ i +'</p>');
				toCopy.eq(1).html(toCopy.eq(1).html()+'<p>'+ this.distribution[i] +'</p>');
				toCopy.eq(2).html(toCopy.eq(2).html()+'<p>'+ ((this.distribution[i]/this.combinationsQant)*100).toFixed(2).replace('.',',') +'</p>');
				toCopy.eq(3).html(toCopy.eq(3).html()+'<p>'+ ((1-(faults/this.combinationsQant))*100).toFixed(2).replace('.',',') +'</p>');
				toCopy.eq(4).html(toCopy.eq(4).html()+'<p>'+ faults +'</p>');
			}
		}

		$('#sumsTable').show();
	},

	getSuccessesDistribution:function(){

		var maxSuccesses = this.diceQuant;
		var maxDifficulty = this.maxDiceVal;
		this.matrix = {};


		var d = 1;
		while (d++ < maxDifficulty) {

			// создать запись матрицы по сложности
			if (typeof this.matrix[d] == 'undefined') this.matrix[d] = [];

			var i = this.combinations.length;
			while (i--) {
				var pool = this.combinations[i];

				var successes = this.countSuccesses(pool, d);
				if (successes > 0) {
					if (typeof this.matrix[d][successes] == 'undefined')	this.matrix[d][successes] = {pools:[], count: 0, sum:0};
					this.matrix[d][successes].count += 1;
					this.matrix[d][successes].pools.push(pool.slice());
				}
			}

			var s = maxSuccesses;
			var sum = 0;
			while (s--){
				this.matrix[d][s+1].sum = (sum += this.matrix[d][s+1].count);
			}
		}

		//заполняем таблицу

		var table = $('#successesTable');

		table.empty().html($('#successesTableTemplate').html());

		var toCopy = $('#successesTable .copy');
		var toHeader = $('#successesTable .header');
		var toResults = $('#successesTable .table_results');

		var s = 0;
		while (s++ < maxSuccesses) {
			toHeader.append('<th>X>='+s+'</th>');
			toCopy.append('<td></td>');
		}

		var d = 1;
		while (d++ < maxDifficulty) {

			var tr = $('<tr></tr>');
			toResults.append(tr);
			tr.append('<th>'+ d +'</th>');
			toCopy.find('td').eq(0).html(toCopy.find('td').eq(0).html() + '<p>'+d+'</p>');

			var s = 0;
			while (s++ < maxSuccesses) {
				var chance = ((this.matrix[d][s].sum/this.combinationsQant)*100).toFixed(2)
				tr.append('<td>' +  chance  +  '%</td>')
				toCopy.find('td').eq(s).html(toCopy.find('td').eq(s).html() + '<p>'+chance.replace('.',',')+'</p>');
			}
		}


		$('#successesTable').show();
	}
}

$(function(){

	$('input.spinner-die').spinner({
		min:1,
		max:10
	});

	$('input.spinner-difficulty').spinner({
		min:2,
		max:24
	});

	$('[name="mode"]').change(function(e){
		var mode = $(e.currentTarget).val();

		$('.if').hide();
		$('.if-'+mode).show();
	});

	$('#button_calculate').click(function(){
		//берем значения
		var quant = int10($('#input_dice_number').val());
		var cap = int10($('#input_dice_cap').val());

		var modifier = int10($('[name="type"]:checked').val());
		var mode = $('[name="mode"]:checked').val();

		var add_data = {};

		/*if (mode == 'successes'){
			add_data.difficulty = int10($('[name="difficulty"]').val());
		}*/

		// прогоняем калькулятор
		window.calc = new Calculator(quant, cap, modifier, mode, add_data)
	})
})
