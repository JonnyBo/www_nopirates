class Columns {

	constructor(columns, idn, mylsObject) {
		this.columns = columns.columns;
		this.summary = columns.summaries;
		this.idn = idn;
		this.setSummaryFormat();
		this.colCaches = [];
		this.mylsObject = mylsObject;
	}

	getColumnsByColumnType(type, first = false) {
		let column = null;
		if (!first)
			column = [];
		$.each(this.columns, function (_, item) {
			if (item.columnType != null) {
				if ($.isArray(item.columnType)) {
					$.each(item.columnType, function (i, el) {
						if ($.type(el) == 'object') {
							if (type in el) {
								if (first) {
									column = item;
									return false;
								} else {
									column.push(item);
								}
							}
							//console.log(i, el);
						} else {
							if (el == type) {
								if (first) {
									column = item;
									return false;
								} else {
									column.push(item);
								}
							}
						}
					});
				} else {
					if (item.columnType == type) {
						if (first) {
							column = item;
							return false;
						} else {
							column.push(item);
						}
					}
				}

			}
		});
		return column;
	}

	getFilterColumns() {
		let fcolumns = [];
		$.each(this.columns, function (index, item) {
			if ((item.hasOwnProperty('useColumn') && item.useColumn) && item.dataType != 'block' && item.dataType != 'image') {
				fcolumns.push(item);
			}
		});
		return fcolumns;
	}

	getUsedColumns() {
		let fcolumns = {};
		$.each(this.columns, function (index, item) {
			if ((item.hasOwnProperty('useColumn') && item.useColumn)) {
				fcolumns[index] = item;
				if (item.usedInBlock || !item.visible)
					item.showInColumnChooser = false;
			}
		});
		return fcolumns;
	}

	// Проставляем, используется ли столбец в сборных столбцах, чтобы он не попадал в список столбцов
	setUsedColumns(item) {
		if (item.usedColumns) {
			const self = this;
			$.each(item.usedColumns, function (index, item) {
				self.columns[item].usedInBlock = true;
			});
		}
	}

	convertDateTimeColumns(data) {
		let self = this;
		$.each(this.columns, function (index, item) {
			if ((item.dataType == 'time' || item.dataType == 'datetime' || item.dataType == 'date') && data && data[item.dataField]) {
				data[item.dataField] = app.convertDateTime(data[item.dataField]);
			}
		});
		return data;
	}

	convertFromDateTimeColumns(data) {
		const self = this;
		$.each(this.columns, function (index, item) {
			if ((item.dataType == 'time' || item.dataType == 'datetime' || item.dataType == 'date') && data && data[item.dataField]) {
				data[item.dataField] = self.convertFromDateTime(data[item.dataField]);
				if (item.dataType == 'date')
					data[item.dataField] = data[item.dataField].slice(0, 10);
			}
		});
		return data;
	}

	convertFromDateTime(date) {
		if (!date) return null;
		const regex = /\d{4}-\d{2}-\d{2}((T|\ )\d{2}:\d{2}:\d{2})?/g;
		if (String(date).search(regex) == -1)
			date = DevExpress.localization.formatDate(new Date(date), 'yyyy-MM-ddTHH:mm:ssx');
		date = date.slice(0, 19).replace('T', ' ');
		return date;
	}

	getUsedFields(template, columnTypes = null) {
		let cols = [];
		if (template && template.length) {
			const regexp = /\$([\w_]+)\$/gi;
			cols = template.match(regexp);
			$.each(cols, function (index, item) {
				cols[index] = item.substring(1, item.length - 1);
			});
		} else if (columnTypes && columnTypes.length) {
			let self = this;
			$.each(columnTypes, function (_, item) {
				let column = self.getColumnsByColumnType(item, true);
				if (column) {
					if (column.dataType == 'block') {
						cols = cols.concat(self.getUsedFields(column.template));
					} else {
						if (column.hasOwnProperty('columns')) {
							cols = cols.concat(column.columns);
						} else {
							cols.push(column.dataField);
						}
					}
				}
			});
		}
		return cols;
	}

	setColorToCell(item, result, info) {
		let style = '',
			colorClass = '';
		if (info && info.data) {
			if (info.data[item.dataField + '__bgcolor']) {
				colorClass = $.Color(info.data[item.dataField + '__bgcolor']).contrastColor();
				style += 'background-color:' + info.data[item.dataField + '__bgcolor'] + ';';
				result = '<span style="' + style + '" class="myls-colored-value ' + colorClass + '">' + result + '</span>';
			}
			if (info.data[item.dataField + '__color']) {
				style += 'color:' + info.data[item.dataField + '__color'] + ';';
				result = '<span style="' + style + '">' + result + '</span>';
			}
			if (info.data[item.dataField + '__class']) {
				result = '<span class="' + info.data[item.dataField + '__class'] + '">' + result + '</span>';
			}
		}
		return result;
	}

	/* Процедура форматирования столбцов для сборных столбцов
	cellValue - текущее значение поля
	//     item      - столбец текущего поля
	//     columns   - массив всех столбцов
	//     info      - текущая строка данных
	//     */
	//
	//     //getFormattedCellValue = profile(getFormattedCellValue);
	getFormattedCellValue(cellValue, item, info) {
		const self = this;
		let infoData = info.data ? info.data : info;

		if (item.dataType === 'image') {
			return formatImage();
		}

		if (item.dataType === 'url') {
			return formatUrl();
		}

		if (item.dataType === 'color') {
			return formatColor();
		}
		// Обрабатываем даты
		if (item.dataType === 'date') {
			return formatDate();
		}
		// Обрабатываем числа
		if (item.dataType === 'number') {
			return formatNumber();
		}
		// Обрабатываем строки на наличие урла/емейла/телефона
		if (item.dataType === 'string') {
			return formatString();
		}

		if (item.dataType === 'lookup' && !item.editor) {
			return formatLookup();
		}

		if (item.dataType === 'block' || (item.template && (item.dataType != 'lookup' || (item.dataType == 'lookup' && item.editor)))) {
			return formatBlock();
		}
		return cellValue;

		function formatImage() {
			if (cellValue !== null && cellValue !== '' && cellValue !== undefined) {
				return "<span class='myls-field-image'><img src='files/" + cellValue + "'></span>";
			} else {
				return cellValue;
			}
		}

		function formatUrl() {
			if (cellValue !== null && cellValue !== '' && cellValue !== undefined) {
				const href = infoData[item.extField];
				return "<a class='myls-grid-url' href='/site/download?file=" + href + "'>" + cellValue + "</a>";
			} else {
				return cellValue;
			}
		}

		function formatColor() {
			if (cellValue !== null && cellValue !== '' && cellValue !== undefined) {
				return "<span class='myls-grid-column-color " + $.Color(cellValue).contrastColor() + "' style='background-color: " + cellValue + "'></span>";
			} else {
				return cellValue;
			}
		}

		function formatDate() {
			if (cellValue !== null && cellValue !== '' && cellValue !== undefined) {
				try {
					cellValue = DevExpress.localization.formatDate(new Date(cellValue), item.format);
					cellValue = this.setColorToCell(item, cellValue, info);
					return cellValue;
				} catch (e) {
					return cellValue;
				}
			}
		}

		function formatNumber() {
			if (cellValue !== null && cellValue !== '' && cellValue !== undefined) {
				try {
					let format = "#,##0";
					if (item.format.precision > 0) {
						format += '.' + '0'.repeat(item.format.precision);
					}
					cellValue = DevExpress.localization.formatNumber(cellValue, format);
					return self.setColorToCell(item, cellValue, info);
				} catch (e) {
					return cellValue;
				}
			}
		}

		 function formatString() {
			if (cellValue !== null && cellValue !== '' && cellValue !== undefined) {
				let result = cellValue,
					currPattern = '';
				if (item.pattern == 'email') {
					result = '<span id="' + app.cntToolTip + '_' + item.dataField + '" class="myls-tooltip" data-href="mailto:' + cellValue + '" data-type="email">' + cellValue + '</span>';
				}
				if (item.pattern == 'phone') {
					result = '<span id="' + app.cntToolTip + '_' + item.dataField + '" class="myls-tooltip" data-href="tel:' + cellValue + '" data-type="tel">' + cellValue + '</span>';
				}
				if (item.pattern == 'url') {
					let prefix = '';
					if (cellValue.indexOf("://") == -1)
						prefix = "http://";
					result = '<span id="' + app.cntToolTip + '_' + item.dataField + '" class="myls-tooltip" data-href="' + prefix + cellValue + '" data-type="globe">' + cellValue + '</span>';
				}

				// При наличии формы - обрабатываем ее
				if (item.extFormId && item.extFormField) {
					const uuid = app.create_UUID();
					self.mylsObject.dependencies.init(self.mylsObject, infoData);
					self.mylsObject.dependencies.doCondition(item.extFormId).then((extFormId) => {
						if (extFormId) {
							const idn = app.getIdn(app.appInfo.tables[extFormId].tableType, extFormId, infoData[item.extFormField], 'popup');
							$(`#${uuid}`).attr('data-url', idn);
						}
					});
					result = `<span class="myls-open-object-container"><span class="myls-open-object_text"> ${cellValue}</span><i id="${uuid}" class="dx-icon-edit myls-open-object" data-idn="${self.idn}"></i></span>`;
					//console.log(idn);
				}

				// Заменяем __idn__, если вдруг у нас тут ссылка на объект
				result = app.replaceAll(result, '__idn__', self.idn);
				app.cntToolTip++;
				result = self.setColorToCell(item, result, info);
				return result;
			} else {
				return cellValue;
			}
		}

		function formatLookup() {
			let result = cellValue;
			if (item.extFormId && item.extFormField) {
				result = '<span class="myls-open-object-container"><span class="myls-open-object_text"> ' + cellValue + '</span><i class="dx-icon-edit myls-open-object" data-ext-id="' + infoData[item.extFormField] + '" data-table="' + item.extFormId + '" data-id="' + infoData['id'] + '" data-view="popup" data-type="form" data-title="Редактировать ' + cellValue + '" data-idn="' + idn + '"></i></span>';
				result = self.setColorToCell(item, result, info);
				return result;
			} else {
				result = self.setColorToCell(item, result, info);
				return result;
			}
		}

		function formatBlock() {
			let emptyFields = [];
			const regExp = /\$([\w_]+)\$/gi; // $имя_столбца$
			// Вставляем, где нужно idn
			item.template = item.template.replace('$__idn__$', self.idn);
			let template = item.template.replace(regExp, function (pattern, m) {
				let value = infoData[m] !== undefined && infoData[m] !== null ? infoData[m] : '';
				if (value === '') {
					emptyFields.push(m);
				} else {
					if (item.dataType === 'block' || item.dataType === 'string')
						value = self.getFormattedCellValue(value, self.columns[m], info);
					if ((item.dataType == 'lookup' || item.dataType == 'list') && app.isDate(value)) {
						value = DevExpress.localization.formatDate(new Date(value), 'dd.MM.yyyy');
					}
				}
				return value;
			});

			app.translate.saveTranslateBlock(template);

			if (emptyFields.length) {
				let selectors = [];
				for (let i = 0, l = emptyFields.length; i < l; i++) {
					selectors.push('*[data-field=' + emptyFields[i] + ']');
					selectors.push('*[data-for=' + emptyFields[i] + ']');
					selectors.push('*[prev-delimiter-field=' + emptyFields[i] + ']');
					selectors.push('*[delimiter-field=' + emptyFields[i] + ']');
				}
				selectors = selectors.join(', ');

				let $tpl = $(template);
				$(selectors, $tpl).each(function () {
					$(this).remove();
					template = $tpl.get(0);
				});
				//подчищаем пустые
				$tpl = $(template);
				$('span[role="field-set"], div', $tpl).each(function () {
					if ($.trim($(this).text()) == '' && !$(this).hasClass('fa') && !$.contains(this, $('img', $(this)).get(0)))
						$(this).remove();
				});

				// Подчищаем лишние разделители в конце поля
				$('*[role="data-delimiter"]:last-child', $tpl).each(function () {
					if ($.trim($(this).text()) == '' && !$(this).hasClass('fa'))
						$(this).remove();
				});
				template = $tpl.get(0);
			}

			return template.outerHTML ? template.outerHTML : template;
		}

	}

	getItemValueByColumnType(type, data) {
		// Находим индекс столбца по полю columnType
		const column = this.getColumnsByColumnType(type, true);
		// Если столбец с таким индексом найден, то начинаем искать в массиве данных data значение поля
		// этого столбца
		if (column) {
			return this.getFormattedCellValue(data[column.dataField], column, data);
		} else {
			// Если столбец не найден
			return null;
		}
	}

	processCellTemplates() {
		const self = this;
		$.each(this.columns, function (index, item) {
			self.setCellTemplates(item);
			self.setUsedColumns(item);
			item.validationRules = self.getValidationRules(item);
			if (item.sortField) {
				item.calculateSortValue = item.sortField;
			}
		});
	}

	setCellTemplates(item) {
		const self = this;
		// Обрабатываем изображения в таблице
		if (item.dataType === 'image') {
			templateImage();
		}
		if (item.dataType === 'url') {
			templateUrl();
		}
		if (item.dataType === 'color') {
			templateColor();
		}
		if (item.dataType === 'tagbox') {
			templateTagBox();
		}
		if (item.dataType == 'boolean') {
			templateBoolean();
		}
		// Анализируем строку на поиск урлов, телефонов и так далее
		if (item.dataType === 'string') {
			templateString();
		}

		if (item.dataType === 'lookup') {
			templateLookup();
		}
		if (item.dataType === 'date') {
			templateDate('dd.MM.yyyy', "yyyy-MM-dd");
		}

		if (item.dataType === 'datetime') {
			templateDate('dd.MM.yyyy HH:mm', "yyyy-MM-ddTHH:mm:ssx");
		}

		if (item.dataType === 'time') {
			templateDate('HH:mm', "yyyy-MM-ddTHH:mm:ssx");
		}

		// Обрабатываем сборные столбцы, забирая данные из других столбцов
		if (item.dataType === 'block' && item.template !== '') {
			templateBlock();
		}

		function templateImage() {
			item.cellTemplate = function (element, info) {
				$(element).html(self.getFormattedCellValue(info.text, item, info));
			};
			item.allowFiltering = false;
			item.allowSorting = false;
		}

		function templateUrl() {
			item.cellTemplate = function (element, info) {
				$(element).html(self.getFormattedCellValue(info.text, item, info));
			};
		}

		function templateColor() {
			item.cellTemplate = function (element, info) {
				$(element).html(self.getFormattedCellValue(info.text, item, info));
			};
			item.headerFilter = {
				dataSource: function (data) {
					data.dataSource.postProcess = function (results) {
						$.each(results, function (index, filterItem) {
							const value = filterItem.text;
							filterItem.template = function () {
								return "<div style='width: 20px; height: 20px; background-color: " + value + "'></div>";
							};
						});
						return results;
					};
				}
			};
			item.allowSorting = false;
		}

		function templateTagBox() {
			/*item.cellTemplate = function (element, info) {
				$(element).html(getFormattedCellValue(info.text, item, columns, info));
			};*/
			/*item.headerFilter = {
				dataSource: function (data) {
					data.dataSource.postProcess = function (results) {
						var newResults = [];
						$.each(results, function (index, filterItem) {
							var values = filterItem.text.split(',');
							$.each(values, function (index, value) {
								value = value.trim();
								var exists = false;
								$.each(newResults, function (index, r) {
									if (r.text == value) {
										exists = true;

									}
								});

								if (!exists) {
									newResults.push({
										text: value,
										value: [[item.dataField, 'startsWith', value + ','], 'or', [item.dataField, 'endsWith', ', ' + value], 'or', [item.dataField, 'contains', ', ' + value + ','], 'or', [item.dataField, '=', value]]
									});
								}
							});
						});
						newResults = newResults.sort(function (a, b) {
							if (a.text < b.text) {
								return -1;
							}
							if (a.text > b.text) {
								return 1;
							}
							return 0;
						});
						return newResults;
					};
				}
			};*/
			//item.allowFiltering = false;
			item.allowSorting = false;
		}

		function templateBoolean() {
			item.falseText = app.translate.saveString("Нет");
			item.trueText = app.translate.saveString("Да");
		}

		function templateString() {
			item.cellTemplate = function (element, info) {
				$(element).html(self.getFormattedCellValue(info.text, item, info));
			};
		}

		function templateLookup() {

			item.lookup = {
				dataSource: self.mylsObject.initLookupDataSource(item),
				valueExpr: 'id',
				displayExpr: 'item',
			};
			item.cellTemplate = function (element, info) {
				$(element).html(self.getFormattedCellValue(info.text, item, info));
			};
		}

		function templateDate(format, serialFormat) {
			if (!item.editorOptions) item.editorOptions = [];
			item.dataType = 'date';
			item.format = format;
			item.editorOptions.dateSerializationFormat = serialFormat;
			item.editorOptions.useMaskBehavior = true;
			item.editorOptions.type = item.dataType;
			item.cellTemplate = function (element, info) {
				$(element).html(self.getFormattedCellValue(info.data[info.column.dataField], item, info));
			};
		}

		function templateBlock() {
			item.allowFiltering = false;
			item.renderAsync = true;
			if (!item.sortField)
				item.allowSorting = false;

			item.cellTemplate = function (element, info) {
				$(element).html(self.getFormattedCellValue(info.text, item, info));
			};
		}

	}

	getValidationRules(column) {
		let rules = [];
		if (column && ((column.hasOwnProperty("required") && column.required != '' && column.required !== null) ||
			(column.hasOwnProperty("pattern") && column.pattern != '' && column.pattern !== null))) {

			if (column.hasOwnProperty("required") && column.required != '' && column.required !== null) {
				if (column.required.charAt(0) != '=')
					rules.push({
						type: 'async',
						message: column.dataField,
						ignoreEmptyValue: false,
						isValid: true,
						validationCallback: function (e) {
							return new Promise((resolve, reject)=> {
								console.log(`${column.dataField} - ${e.value}`);
								if (e.value === null || e.value === undefined || e.value === '') reject();
								else resolve();
							})

						}
					});
			}

			if (column.hasOwnProperty("pattern") && column.pattern != '' && column.pattern !== null) {
				if (column.pattern.charAt(0) != '=') {
					// Встроенные паттерны
					switch (column.pattern.toLowerCase()) {
						case 'email':
							ruleEmail();
							break;
						case 'phone':
							rulePhone();
							break;
						case 'url':
							ruleUrl();
							break;
					}

				} else {
					// Паттерн на основе регулярного выражения
					let pattern = column.pattern.substring(1);
					if (pattern.charAt(0) != '^') {
						pattern = '^' + pattern;
					}
					if (pattern.charAt(pattern.length - 1) != '$') {
						pattern = pattern + '$';
					}

					rules.push({
						type: "pattern",
						pattern: pattern
					});
				}
			}
		}
		return rules;

		function ruleEmail() {
			rules.push({
				type: "email"
			});
			column.mode = "email";
		}

		function rulePhone() {
			rules.push({
				type: "custom",
				validationCallback: function (e) {
					return String(e.value).search(app.patterns.phone_form) >= 0;
				},
				ignoreEmptyValue: true,
				message: app.translate.saveString('Внесенное значение не является допустимым форматом телефона')
				//pattern: patterns.phone_form
			});
			column.mode = "tel";
		}

		function ruleUrl() {
			rules.push({
				type: "custom",
				validationCallback: function (e) {
					return String(e.value).search(app.patterns.url_form) >= 0;
				},
				ignoreEmptyValue: true,
				message: app.translate.saveString('Внесенное значение не является допустимым форматом url')
				//pattern: patterns.phone_form
			});
			column.mode = "url";
		}
	}

	setSummaryFormat() {
		if (this.summary && this.summary.length > 0) {
			$.each(this.summary, function (index, item) {
				item.displayFormat = "{0}";
			});
		}
	}

	setColumnsByTypeVisible(component, type, isVisible) {
		$.each(this.columns, function (index, item) {
			if (item.dataType === type) {
				component.columnOption(item.dataField, "visible", isVisible);
			}
		});
	}

	getTableDataByColumns(data) {
		let rawData = {};
		if (data) {
			$.each(this.columns, function (index, item) {
				if (data.hasOwnProperty(index))
					rawData[index] = data[index];
			});
		}
		return rawData;
	}

	setDefaultValues(data) {
		// Проставляем значения по-умолчанию
		$.each(this.columns, function (index, item) {
			if (item.defaultValue !== undefined && item.defaultValue != null && item.defaultValue[0] != '=') {
				if (item.defaultValue[0] == ':') {
					data[item.dataField] = app.getConfigParam(item.defaultValue);
				} else if (item.dataType == 'lookup')
					data[item.dataField] = parseInt(item.defaultValue, 10);
				else
					data[item.dataField] = item.defaultValue;
			}
		});
	}

	setDataToColumns(data) {
		$.each(this.columns, function (index, item) {
			if (data.hasOwnProperty(index)) {
				item.value = data[index];
			}
		});
	}

	solveFloatProblem(updateArr) {
		// Решаем проблему с полями с фиксированной точкой
		const self = this;
		$.each(updateArr, function (index) {
			if (self.columns[index] && self.columns[index].dataType &&
				self.columns[index].dataType && self.columns[index].dataType == 'number' && self.columns[index].format.precision > 0 && updateArr[index]) {
				updateArr[index] = updateArr[index].toString();
			}
		});
	}

	solveBooleanProblem(updateArr) {
		const self = this;
		$.each(updateArr, function (index, item) {
			if (self.columns[index] && self.columns[index].dataType == 'boolean') updateArr[index] = updateArr[index] ? 1 : 0;
		});
	}

	getFieldPath(column) {
		let path = column.dataField;
		if (column.path)
			path = column.path + path;
		return path;
	}

	isObject(field) {
		return app.objectTypes.indexOf(this.columns[field].dataType) == -1 ? false : true;
	}

	setDataDependenciesFromObject(column, params) {
		const self = this;
		if (params && !column.dataConditions)
			column.dataConditions = [];
		$.each(params, (field) => {
			field = field.substring(1);
			if (self.columns[field]) {
				column.dataConditions.push(field);
				if (!self.columns[field].dependencies)
					self.columns[field].dependencies = {};
				if (!self.columns[field].dependencies.data)
					self.columns[field].dependencies.data = [];
				self.columns[field].dependencies.data.push(column.dataField);
			}

		});
	}

	destroy() {
		this.destroyEditors();
		app.destroyArray(this.columns);
		app.destroyArray(this.summary);
		app.destroyArray(this.colCaches);
		app.mylsObject = null;
	}

	destroyEditors() {
		$.each(this.columns, (index, item) => {
			if (item.editor && item.dataType == 'html') {
				item.editor.destroy();
			}
		});
	}

}