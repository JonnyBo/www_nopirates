class Dependencies {
	constructor(mylsObject) {
		this.mylsObject = mylsObject;
		this.columns = mylsObject.columns;
	}

	destroy() {
		this.mylsObject = null;
		this.columns = null;
	}

	init(object, tableData) {
		this.object = object;
		this.tableData = tableData;
	}

	async process(dataField) {
		if (DEBUG)
			console.log("process ", dataField);
		const column = this.columns.columns[dataField];

		if (column && column.dependencies) {
			await this.doVisibleDependencies(column);
			if (column.dependencies.caption)
				this.doCaptionDependencies(column);

			if (column.dependencies.restrictions) {
				this.doValidationDependencies(column);
			}

			if (column.dependencies.value) {
				this.doValueDependencies(column);
			}
			if (column.dependencies.data) {
				this.doDataDependencies(column);
			}

			if (column.dependencies.edit) {
				this.doEditDependencies(column);
			}
		}
	}

	doVisibleDependencies(column) {
		const self = this;
		return new Promise(async resolve => {
			if (column.dependencies.visible) {
				this.object.beginUpdate();
				let pr = [];
				$.each(column.dependencies.visible, function (index, field) {
					const targetColumn = self.columns.columns[field];
					pr.push(self.setFieldVisible(targetColumn));
				});
				await Promise.all(pr);
				this.object.endUpdate();
			}
		resolve();
		});
	}

	async setFieldVisible(column) {
		const self = this;
		return new Promise(async resolve => {
			const visibleCondition = column.visibleCondition;
			if (visibleCondition) {
				if (DEBUG) {
					console.time("setFieldVisible " + column.dataField);
				}
				const result = await self.doCondition(visibleCondition, column);
				if (column.toClear === undefined || column.toClear === result) {
					self.mylsObject.setFieldVisible(self.object, column, result);
					column.toClear = !result;
				}
				if (DEBUG) {
					console.timeEnd("setFieldVisible " + column.dataField);
				}
				resolve(result);
			}
			resolve(true);
		});
	}

	async doCondition(cond, column, saveToDeps = true) {
		const self = this;
		return new Promise(async (resolve, reject) => {
			const condTmp = cond;
			if (cond[0] != '=') {
				if (cond[0] === ":") cond = app.getConfigParam(cond);
				if (column)
					if (cond !== null) cond = self.mylsObject.prepareValue(cond, column.dataField);
				resolve(cond);
			} else {
				if (this.mylsObject.deps.hasOwnProperty(cond)) {
					resolve(this.mylsObject.deps[cond]);
				} else {
					if (DEBUG)
						console.log("doCondition ", cond);

					try {
						await setComplexParamValues();
						await setDBParamValues(column);
						cond = cond.substring(1);
						cond = eval(cond);
						if (condTmp.indexOf("$db.") == -1 && saveToDeps)
							self.mylsObject.deps[condTmp] = cond;
						resolve(cond);
					} catch (error) {
						await self.mylsObject.processResult(error);
						reject();
					}

				}

			}
		});

		function setComplexParamValues() {
			return new Promise((resolve) => {
				const regExp = /\:([a-zA-Z]\w*(\.[a-zA-Z]\w*)?)/gi; // :param_name.param_name
				const fields = cond.match(regExp);
				const pr = [];
				$.each(fields, async function (index, item) {
					const field = item.substring(1);
					const getFieldValue = self.mylsObject.getFieldValue(field, true);
					pr.push(getFieldValue);
					let value = await getFieldValue;
					if (value === undefined || value === null) value = 'null';
					const re = new RegExp(item, "g");
					cond = cond.replace(re, value);
				});
				Promise.all(pr).then(() => resolve());
			});
		}

		function setDBParamValues(column) {
			const dbRegExp = /\$db\.\w+(\(.*\))?/gi; //$db.proc_name(:params)
			const fields = cond.match(dbRegExp);
			const pr = [];
			$.each(fields, function (index, item) {
				const field = item.substring(4);
				self.mylsObject.deps[item] = null;
				const result = self.getValueFromDB(field, item, column);
				result.then((data) => {
					if (data) {
						//data.value = $.isNumeric(data.value) ? parseFloat(data.value) : data.value;
						//if (data.value !== null) return self.mylsObject.prepareValue(data.value, field);
						cond = cond.replace(data.item, data.value);
					}
				});
				pr.push(result);
			});
			return Promise.all(pr);
		}
	}

	async getValueFromDB(field, item, column) {
		return new Promise(async (resolve, reject) => {
			try {
				const value = await app.processData('form/getdbdata', 'post', {'proc': field});
				resolve({
					item: item,
					value: app.getJsDate(value.success.result, true, column)
				});
			} catch (error) {
				await this.mylsObject.processResult(error);
				reject();
			}
		});
	}

	doCaptionDependencies(column) {
		const self = this;
		$.each(column.dependencies.caption, function (index, field) {
			if (DEBUG)
				console.log("doCaptionDependencies ", field);
			const targetColumn = self.columns.columns[field];
			self.setFieldCaption(targetColumn);
		});
	}

	async setFieldCaption(column) {
		if (column.toClear) return;
		if (DEBUG) {
			console.time("setFieldCaption " + column.dataField);
		}
		const parts = column.caption.split('@');
		if (parts.length > 1) {
			const rule = '=' + parts[0].substr(2, parts[0].length - 3);
			if (rule) {
				const result = await this.doCondition(rule, column);
				const caption = {text: app.translate.saveString(result ? parts[1].substr(1, parts[1].length - 2) : parts[2].substr(1, parts[2].length - 2))};
				this.mylsObject.setFieldCaption(this.object, column, caption);
			}
		}
		if (DEBUG) {
			console.timeEnd("setFieldCaption " + column.dataField);
		}
	}

	async doValidationDependencies(column) {
		const self = this;
		$.each(column.dependencies.restrictions, async function (index, field) {
			const targetColumn = self.columns.columns[field];
			await self.setFieldValidation(targetColumn);
		});
	}

	async setFieldValidation(column) {
		const self = this;

		let allRules = await this.setFieldRequired(column);
		allRules = this.setFieldRestrictions(column, allRules);

		this.mylsObject.setFieldValidation(this.object, column, allRules);
	}

	async setFieldRequired(column) {
		const self = this;
		return new Promise(async (resolve) => {
			if (column.required) {
				let path = column.dataField;
				if (DEBUG) {
					console.time("setFieldRequired " + column.dataField);
				}
				//const rules = [];
				const result = this.doCondition(column.required, column);
				const rules = self.columns.getValidationRules(column);

				// Соединяем правило с теми, которые были заданы изначально
				/*let foundRequired = false;
				rules.filter((rule) => {
					if ((rule.type === 'required') && result) {
						foundRequired = true;
						return true;
					}
					if (rule.type !== 'required') return true;
				});

				if (!foundRequired && result) {
					rules.push({type: 'required'});
				}*/

				if (DEBUG) {
					console.timeEnd("setFieldRequired " + column.dataField);
				}
				resolve(rules);
			} else resolve([]);
		});

	}

	setFieldRestrictions(column, allRules) {
		const self = this;
		if (column.restrictions) {
			if (DEBUG) {
				console.time("setFieldRestrictions " + column.dataField);
			}

			const parts = column.restrictions.split('@');
			if (parts.length == 2) {
				const rule = '=' + parts[0].substr(1, parts[0].length - 2);
				const msg = parts[1].substr(1, parts[1].length - 2);

				const rules = [{
					type: 'async',
					message: msg,
					ignoreEmptyValue: true,
					isValid: true,
					validationCallback: function (e) {
						if (column.dataType == 'datetime') {
							column.editor.option("value", e.value);
						}
						return self.doCondition(rule, column);
					}
				}];
				return allRules.concat(rules);
			}
			if (DEBUG) {
				console.timeEnd("setFieldRestrictions " + column.dataField);
			}
		}
		return allRules;
	}

	async doValueDependencies(column) {
		const self = this;
		const pr = [];
		$.each(column.dependencies.value, function (index, field) {
			const targetColumn = self.columns.columns[field];
			self.setFieldValue(targetColumn);
		});
	}

	async setFieldValue(column) {
		if (DEBUG) {
			console.time("setFieldValue " + column.dataField);
		}
		const vd = column.defaultValue;
		if (vd) {
			const result = await this.doCondition(vd, column);
			this.mylsObject.setFieldValue(this.object, column, result);
		}
		if (DEBUG) {
			console.timeEnd("setFieldValue " + column.dataField);
		}
	}

	doDataDependencies(column) {
		const self = this;
		const pr = [];
		$.each(column.dependencies.data, async function (index, field) {
			const targetColumn = self.columns.columns[field];
			self.setFieldData(targetColumn);
		});
	}

	setFieldData(column) {
		if (column.dataType == 'lookup') {
			const lookup = column.editor;
			if (lookup) {
				lookup.getDataSource().store().clearRawDataCache();
				lookup.getDataSource().load();
			}
		}
		if (this.mylsObject.columns.isObject(column.dataField)) {
			column.editor.setParams(this.tableData);
		}
	}

	doEditDependencies(column) {
		const self = this;
		const pr = [];
		$.each(column.dependencies.edit, async function (index, field) {
			const targetColumn = self.columns.columns[field];
			self.setFieldEditable(targetColumn);
		});
	}

	async setFieldEditable(column) {
		if (DEBUG) {
			console.time("setFieldEditable " + column.dataField);
		}
		const vd = column.editCondition;
		if (vd) {
			const result = await this.doCondition(vd, column);
			this.mylsObject.setFieldEditable(this.object, column, result);
		}
		if (DEBUG) {
			console.timeEnd("setFieldEditable " + column.dataField);
		}
	}
}