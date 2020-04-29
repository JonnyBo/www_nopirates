const DEBUG = false;
if (DEBUG) {
	doDependencies = profile(doDependencies);
	doVisibleDependencies = profile(doVisibleDependencies);
	doRequireDependencies = profile(doRequireDependencies);
	doRestrictions = profile(doRestrictions);
	doDataDependencies = profile(doDataDependencies);
	doCaptionDependencies = profile(doCaptionDependencies);
	doValueDependencies = profile(doValueDependencies);
}

// Отрабатываем зависимости поля при его изменении
function doDependencies(e, dataField, value, mode, columns, tableData, tHistory, deps) {
	if (DEBUG)
		console.log("doDependencies ", dataField);
	var allRules = {};
	var column = columns[dataField];
	if (column && column.hasOwnProperty('dependencies')) {
		//e.component.beginUpdate();
		$.when(doVisibleDependencies(column, e, value, columns, tableData, tHistory, deps)).done(function () {
			//e.component.endUpdate();
			if ((column.dependencies.hasOwnProperty('required') && column.dependencies.required.length) ||
				(column.dependencies.hasOwnProperty('restrictions'))) {

				var pr = [];
				$.each(column.dependencies.restrictions, function (index, field) {
					var targetColumn = columns[field];
					if (!targetColumn.toClear) {
						pr.push(doRequireDependencies(targetColumn, allRules, value, field, columns, tableData, tHistory, deps));
						pr.push(doRestrictions(targetColumn, allRules, value, field, columns, tableData, tHistory, deps));
					}
				});
				$.when.apply($, pr).done(function () {
					e.component.beginUpdate();
					$.each(allRules, function (index, item) {
						var path = index;
						var targetColumn = columns[index];
						if (targetColumn.path)
							path = targetColumn.path + index;
						if (targetColumn.toClear) {
							//columns[index].validationRules = [];
						} else {
							if (!targetColumn.customEditor && e.component.itemOption(path) && targetColumn.editor && (!targetColumn.validationRules || JSON.stringify(targetColumn.validationRules) !== JSON.stringify(item)))
								e.component.itemOption(path, "validationRules", item);
							targetColumn.validationRules = item;
							// columns[index].validationRules = item;
						}
					});
					e.component.endUpdate();
				}).fail(function (error) {
					showError(idn, error);
				});
			}

			//e.component.beginUpdate();
			if (column.dependencies['data'] && column.dependencies.data.length)
				doDataDependencies(column, e, value, columns, tableData, tHistory, deps);
			if (column.dependencies['caption'] && column.dependencies.caption.length)
				doCaptionDependencies(column, e, value, columns, tableData, tHistory, deps);
			if (mode !== 'open' && column.dependencies['value'] && column.dependencies.value.length)
				doValueDependencies(column, e, value, columns, tableData, tHistory, deps);
			//e.component.endUpdate();
		}).fail(function () {
			//   e.component.endUpdate();
		});
	}
}

function doDataDependencies(column, e, value, columns, tableData, tHistory, deps) {
	$.each(column.dependencies.data, function (index, field) {
		if (DEBUG)
			console.log("doDataDependencies ", field);
		//debugger
		var targetColumn = columns[field];
		doDataDependenciesField(targetColumn, field, e, value, columns, tableData, tHistory, deps);
	});
}

function doDataDependenciesField(targetColumn, field, e, value, columns, tableData, tHistory, deps) {
	if (targetColumn.dataType == 'lookup') {
		var lookup = targetColumn.editor;
		if (lookup) {
			var value = lookup.option("value");
			//lookup.option("value", null);
			var ds = lookup.getDataSource();
			if (ds) {
				/*if (!ds.isLoaded() && targetColumn.loadPromise) {
					$.when(targetColumn.loadPromise).done(function () {
						// debugger
						doIt(ds, lookup, value, targetColumn, tableData, deps);
					});
				} else*/
				doIt(ds, lookup, value, targetColumn, tableData, deps);

			}
		}
	}

	function doIt(ds, lookup, value, column, tableData, deps) {
		var params = {};
		if (column.hasOwnProperty('dataConditions') && tableData)
			params = getParams(column.dataConditions, tableData, columns, tHistory);
		params.lang = config.lang;
		params.company_id = config.company_id;
		params.__user_client_id__ = config.client_id;
		if ((column.dataType == 'lookup' || column.dataType == 'tagbox') && column.dataParams != JSON.stringify(params)) {
			var store = ds.store();
			if (store)
				store.clearRawDataCache();
			ds.load();
		}

		//value = tableData[column.dataField];

		/*$.when(ds.load()).done(function () {
			// Проверяем, есть ли значение, которое было в лукапе до перезагрузки, и, если нет, то обнулем
			// текущее значение
			//debugger
			console.log(ds);
			removeFromDeps(column.dataField);
			if (value)
				$.when(ds.store().byKey(value)).fail(function (error) {
					//debugger
					tableData[column.dataField] = null;
					lookup.option("value", null);

					lookup.repaint();
				}).done(function () {
					tableData[column.dataField] = value;
					lookup.option("value", value);

					lookup.repaint();
				});
			//lookup.repaint();
		}).fail(function (error) {
			//removeFromDeps(column.dataField);
			//tableData[column.dataField] = null;
			//lookup.option("value", null);

			//lookup.repaint();
		});*/
	}
}



function doValueDependencies(column, e, value, columns, tableData, tHistory, deps) {
	var deferred = $.Deferred();
	var pr = [];
	if (column.dependencies && column.dependencies.value)
		$.each(column.dependencies.value, function (index, field) {
			var targetColumn = columns[field];
			if (!targetColumn.toClear) {
				var dp = doValueDependenciesField(targetColumn, e, value, columns, tableData, tHistory, deps);

				pr.push(dp.promise());
			}
		});
	$.when.apply($, pr).done(function (data) {
		deferred.resolve();
	});
	return deferred.promise();
}

function doValueDependenciesField(targetColumn, e, value, columns, tableData, tHistory, deps) {
	var deferred = $.Deferred();
	let field = targetColumn.dataField;
	if (DEBUG)
		console.log("doValueDependencies ", field);
	//debugger
	var vd = targetColumn.defaultValue;
	if (vd) {
		var dp = $.Deferred();
		$.when(doConditionPromise(vd, columns, tableData, tHistory, deps)).done(function (result) {
			if (!targetColumn.customEditor) {
				/*var path = field;
				if (targetColumn.path)
					path = targetColumn.path + field;*/

				var editor = targetColumn.editor;//  'visible', result);
				if (!editor) {
					editor = e.component.getEditor(field);
					if (editor) targetColumn.editor = editor;
				}
				if (editor) {
					// tableData.field = result;
					editor.option("value", result);
				}
			} else {
				setCustomEditorsValue(targetColumn, result);
			}
			tableData[targetColumn.dataField] = result;
			dp.resolve();
		}).fail(function () {
			dp.reject();
		});
	}
	return deferred.promise();
}

function doVisibleDependencies(column, e, value, columns, tableData, tHistory, deps) {
	var deferred = $.Deferred();

	if (column.dependencies.visible) {
		e.component.beginUpdate();
		let pr = [];
		$.each(column.dependencies.visible, function (index, field) {
			if (DEBUG)
				console.log("doVisibleDependencies ", field);
			var targetColumn = columns[field];
			var vd = targetColumn.visibleCondition;
			if (vd) {
				let dp = doConditionPromise(vd, columns, tableData, tHistory, deps);
				pr.push(dp);
				$.when(dp).done(function (result) {
					if (targetColumn.toClear === undefined || targetColumn.toClear === result) {
						var path = field;
						if (targetColumn.path)
							path = targetColumn.path + field;

						if (e.component.itemOption(path))
							e.component.itemOption(path, "visible", result);//  'visible', result);
						targetColumn.toClear = !result;
					}

					//deferred.resolve();
				});
			} //else deferred.resolve();
		});
		$.when.apply($, pr).done(function() {
			e.component.endUpdate();
			deferred.resolve();
		});
		//e.component.endUpdate();
	} else deferred.resolve();
	return deferred;
}

function doCaptionDependencies(column, e, value, columns, tableData, tHistory, deps) {
	e.component.beginUpdate();
	$.each(column.dependencies.caption, function (index, field) {
		if (DEBUG)
			console.log("doCaptionDependencies ", field);
		var targetColumn = getColumnByField(columns, field);
		doCaptionDependenciesField(targetColumn, field, null, e, value, columns, tableData, tHistory, deps);
	});
	e.component.endUpdate();
}

function doCaptionDependenciesField(targetColumn, field, item, e, value, columns, tableData, tHistory, deps) {
	var parts = targetColumn.caption.split('@');
	if (parts.length > 1) {
		var rule = '=' + parts[0].substr(2, parts[0].length - 3);
		if (rule) {
			$.when(doConditionPromise(rule, columns, tableData, tHistory, deps)).done(function (result) {
				var path = field;
				if (targetColumn.path)
					path = targetColumn.path + field;

				if (parts.length == 3) {
					if (item) {
						item.label = {text: saveString(result ? parts[1].substr(1, parts[1].length - 2) : parts[2].substr(1, parts[2].length - 2))};
					} else if (e.component.itemOption(path))
						e.component.itemOption(path, "label", {text: saveString(result ? parts[1].substr(1, parts[1].length - 2) : parts[2].substr(1, parts[2].length - 2))});//  'visible', result);
				}
			});
		}
	}
}

function doRestrictions(targetColumn, allRules, value, field, columns, tableData, tHistory, deps) {
	var deferred = $.Deferred();
	if (targetColumn.restrictions) {
		if (DEBUG)
			console.log("doRestrictionsDependencies ", field);
		var path = field;
		var parts = targetColumn.restrictions.split('@');
		if (parts.length == 2) {
			var rule = '=' + parts[0].substr(1, parts[0].length - 2);
			var msg = parts[1].substr(1, parts[1].length - 2);

			var rules = [{
				//type: 'custom',
				type: 'async',
				message: msg,
				ignoreEmptyValue: true,
				isValid: true,
				validationCallback: function (e) {
					if (targetColumn.dataType == 'datetime'/* || targetColumn.dataType == 'date' || targetColumn.dataType == 'time'*/) {
						targetColumn.editor.option("value", e.value);
					}
					//return doCondition(rule, columns, tableData, tHistory);
					return doConditionPromise(rule, columns, tableData, tHistory, deps);
				}
			}];
			if (allRules[path] && allRules[path].length)
				allRules[path] = allRules[path].concat(rules);
			else
				allRules[path] = rules;
			deferred.resolve();

		} else deferred.resolve();
	} else deferred.resolve();
	return deferred.promise();
}

function doRequireDependenciesPromise(targetColumn, columns, tableData, tHistory, deps) {
	var deferred = $.Deferred();
	if (targetColumn.required[0] == '=')
		$.when(doConditionPromise(targetColumn.required, columns, tableData, tHistory, deps)).done(function (result) {
			deferred.resolve(result);
		});
	else deferred.resolve(true);
	return deferred.promise();

	/*if (targetColumn.required[0] == '=')
		return doCondition(targetColumn.required, columns, tableData, tHistory);
	else
		return true;*/
}

function doRequireDependencies(targetColumn, allRules, value, field, columns, tableData, tHistory, deps) {
	var deferred = $.Deferred();
	if (targetColumn.required) {
		var path = field;
		if (DEBUG)
			console.log("doRequireDependencies ", field);
		//$.when(doRequireDependenciesPromise(targetColumn, columns, tableData, tHistory, deps)).done(function (result) {
		$.when(doConditionPromise(targetColumn.required, columns, tableData, tHistory, deps)).done(function (result) {
			var column = columns[field];
			var rules = [];
			if (column) {
				rules = getValidationRules(column);
			}
			// Соединяем правило с теми, которые были заданы изначально
			var foundRequired = false;
			if (rules && rules.length) {
				$.each(rules, function (index, rule) {
					if (rule.type == 'required') {
						if (!result) {
							rules.splice(index, 1);
						}
						foundRequired = true;
						return false;
					}
				});
			}
			if (!foundRequired && result) {
				rules.push({type: 'required'});
			}
			allRules[path] = rules;

			deferred.resolve();
		});
	} else deferred.resolve();
	return deferred.promise();
}

function setValueFromDB(field, item) {
	var deferred = $.Deferred();
	$.when(getData('/form/getdbdata', 'post', {'proc': field})).done(function (value) {
		deferred.resolve({
			'item': item,
			'value': getJsDate(value.success.result, true)
		});
	}).fail(function (error) {
		showError(null, error);
		deferred.reject();
	});
	return deferred.promise();
}

function doConditionPromise(cond, columns, tableData, tHistory, deps) {
	// Promise version
	// debugger
	var deferred = $.Deferred();
	if (cond[0] != '=')
		deferred.resolve(cond);
	else {
		if (deps.hasOwnProperty(cond)) {
			deferred.resolve(deps[cond]);
		} else {
			if (DEBUG)
				console.log("doCondition ", cond);
			var condTmp = cond;
			var regExp = /\:([a-zA-Z]\w*(\.[a-zA-Z]\w*)?)/gi; // :param_name.param_name
			var dbRegExp = /\$db\.\w+(\(.*\))?/gi; //$db.proc_name(:params)
			var fields = cond.match(regExp);
			$.each(fields, function (index, item) {
				var field = item.substring(1);
				var value = getFieldValue(field, tableData, columns, tHistory, true);
				if (value === undefined) value = null;
				var re = new RegExp(item, "g");
				cond = cond.replace(re, value);
			});

			fields = cond.match(dbRegExp);
			var pr = [];
			$.each(fields, function (index, item) {
				var result = true;
				var field = item.substring(4);
				//if (!deps.hasOwnProperty(item)) {
				deps[item] = null;
				result = setValueFromDB(field, item, cond);
				$.when(result).done(function (data) {
					if (data) {
						//var re = new RegExp(item, "g");
						//deps[data.item] = data.value;
						cond = cond.replace(data.item, data.value);
					}
				});
				/*} else {
					cond = cond.replace(item, deps[field]);
				}*/

				pr.push(result);
			});
			$.when.apply($, pr).done(function () {
				// Убираем первое равно
				cond = cond.substring(1);
				var result = eval(cond);
				if (condTmp.indexOf("$db.") == -1)
					deps[condTmp] = result;
				deferred.resolve(result);
			}).fail(function (error) {
				showError(idn, error);
				deferred.reject();
			});
		}
	}
	return deferred.promise();
}

function doCondition(cond, columns, tableData, tHistory) {
	if (cond[0] != '=') return cond;
	var regExp = /(\:([a-zA-Z]\w*(\.[a-zA-Z]\w*)?))/gi; // :param_name.param_name :param_name
	var dbRegExp = /\$db\.\w+(\(.*\))?/gi; //$db.proc_name(:params)
	var fields = cond.match(regExp);
	var pr = [];
	$.each(fields, function (index, item) {
		var field = item.substring(1);
		var re = new RegExp(item, "g");
		var value = getFieldValue(field, tableData, columns, tHistory);
		cond = cond.replace(re, value);
	});
	// Убираем первое равно
	cond = cond.substring(1);
	var result = eval(cond);

	return result;
}

function getFieldValuePromise(field, complexField, columns, tableData, tHistory) {
	var pr = $.Deferred();
	var value = null;
	if (columns.hasOwnProperty(field))
		switch (columns[field].dataType) {
			case 'lookup':
				if (complexField.length == 1) {
					value = tableData[field];
					pr.resolve(value);
				} else {
					if (columns[field].editor) {
						$.when(getLookupValue(field, complexField[1], columns, tableData)).done(function (value) {
							pr.resolve(value);
						});
					}
				}
				break;
			default:
				value = tableData[field];
				pr.resolve(value);
		}
	else pr.resolve(value);
	return pr.promise();
}

function getFieldValue(field, tableData, columns, tHistory, toDB) {
	// Promise version
	/*var deferred = $.Deferred();
	var complexField = field.split('.');
	field = complexField[0];
	$.when(getFieldValuePromise(field, complexField)).done(function (value) {
		if (value !== null && value !== undefined) {
			switch (columns[field].dataType) {
				case 'string':
				case 'date':
					value = "'" + value + "'";
					break;
				case 'time':
				case 'datetime':
					value = "'" + convertDateTime(value) + "'";
			}
		}
		deferred.resolve(value);
	});
	return deferred.promise();*/

	var value = null;
	switch (field) {
		case 'company_id':
			return config.company_id;
		case 'lang':
			return config.lang;
		case '__user_client_id__':
			return config.client_id;
		default:
			null;
	}

	var complexField = field.split('.');
	field = complexField[0];

	if (columns.hasOwnProperty(field))
		switch (columns[field].dataType) {
			case 'lookup':
				if (complexField.length == 1) {
					value = tableData[field];
				} else {
					if (columns[field].editor) {
						value = getLookupValue(field, complexField[1], columns, tableData);
					}
				}
				break;
			default:
				value = tableData[field];
		}

	// Проходим по истории и добавляем, если необходимо, внешние ключи
	if (!value && complexField.length == 1) {
		var reverseHistory = tHistory.slice(0, tHistory.length - 1);
		$.each(reverseHistory.reverse(), function (index, item) {
			if (item.extField !== undefined && field == item.extField && item.extId !== undefined) {
				value = item.extId;
			}
		});
	}

	if (value !== null && value !== undefined) {
		switch (columns[field].dataType) {
			case 'lookup':
				value = $.isNumeric(value) ? value : "\'" + value + "\'";
				break;
			case 'string':
				value = $.isNumeric(value) ? value : "\'" + value + "\'";
				break;
			case 'boolean':
				value = value ? 1 : 0;
				break;
			case 'time':
			case 'datetime':
				value = toDB ? convertFromDateTime(value) : getJsDate(value);
				value = "\'" + value + "\'";
				break;
			case 'date':
				value = toDB ? convertFromDateTime(value) : getJsDate(value);
				value = "\'" + value.slice(0, 10) + "\'";
		}
	}
	return value;
}

function getLookupValue(field, param, columns, tableData) {
	// Promise version
	/* var deferred = $.Deferred();
	 $.when(columns[field].editor.getDataSource().store().byKey(tableData[field])).done(function (data) {
		 deferred.resolve(data[param]);
	 }).fail(function () {
		 deferred.reject();
	 });
	 return deferred.promise();*/

	var items = columns[field].editor.getDataSource().store().__rawData;
	var value = null;
	$.each(items, function (index, item) {
		if (item.id == tableData[field]) {
			value = item[param];

		}
	});
	return value;
}