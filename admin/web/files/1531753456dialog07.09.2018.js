/*
 * Методы работы с диалогом
 */


/**
 * Обработчик даблклика по строке _грида_ - открываем форму редактирования записи
 * BUG ? Немотря на остановку всплывания событие всеравно срабатывает сначала для строки,
 *       а потом и для дива, спана или td по которому конкретно кликнули
 * @param {event} e
 */
function showGridDialogHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    var $row = $(e.target),
        //$grid =  $row.closest("table[role=grid]"),
        $grid = $row.closest("table[role=presentation]"),
        tablerowId = $row.closest("tr.jqgrow").attr('id'),
        selId = $grid.jqGrid("getCell", tablerowId, "ID");
        //rowData = $grid.data('rawData').rows[tablerowId - 1], // сырые данные, что пришли с сервера (сохраненные в gridAfterConfigLoad)
        //rowData = $grid.data('rawData').rows[selId],
        //recId = rowData['ID'];
    showDialog($row.parents('[role=presentation]'), false, {
        tablerowId: tablerowId,
        //recId: recId
        recId: selId
    });
}


/**
 * Show EditRecord dialog
 * @param jQuery object $row
 */
function showDialog($owner, isInsert, p, formId) {
    // на случай если пользователь несколько раз даблкликнул по строке таблицы
    if ($owner.data('formOpened'))
        return;
    else
        $owner.data('formOpened', true);

    if($owner.attr('data-name') == '')
        dialogFactName = '';
    else
        dialogFactName = $owner.attr('data-name');

    if($owner.attr('data-field') === undefined)
        dialogField = '';
    else
        dialogField = $owner.attr('data-field');

    if($owner.attr('data-form-id') === undefined)
        dialogFormId = '';
    else
        dialogFormId = $owner.attr('data-form-id');

    if (p === undefined)
        p = {};

    var gridId = $owner.attr('id'),
        dbId = getDbId(gridId, 'grid'),
        ownerType = $owner.hasClass('scheduler-wrapper') ? 'schedule' : 'grid',
        fkName, fkValue;

		if (formId === undefined)
            dialogId = makeId(dbId, 'dialog');
        else {
            dialogId = 'dialog-'+formId;
            dbId = formId;
        }

    if (ownerType === 'grid') {
        var gridParams = $owner.jqGrid('getGridParam'),
            fkName = gridParams.extName,
            fkValue = gridParams.postData.extId;
    } else if (ownerType === 'schedule') {
        fkName = $owner.data('fkName'),
            fkValue = $owner.data('fkValue');
    }

    var params = {
        gridId: gridId,
        dbId: dbId,
        dialogId: dialogId,
        fkName: fkName,
        fkValue: fkValue,
        isInsert: !!isInsert,
        ownerType: ownerType,
        $owner: $owner,
        dialogFactName: dialogFactName,
        dialogField: dialogField,
        dialogFormId: dialogFormId
    };
    if (p.tablerowId)
        params.tablerowId = p.tablerowId;

    if (p.recId)
        params.recId = p.recId;

    if (p.postData)
        params.postData = p.postData;
    // если конфиг еще не загружен
    if (!$('#' + dialogId).length) {
        dialogLoadCfg(params);
    } else {
        // если заглушка (можно не делать заглушки, а тоже вешать флажок на грид $grid.data('hasForm',false))
        if (!$('#' + dialogId).children().length)
            return;
        // every time save $owner
        $('#' + dialogId).data('$owner', $owner);
        dialogLoadData(params);
    }
}

function dialogLoadCfg(params) {
    var dbId = params.dbId,
        dialogId = params.dialogId;
    // грузим конфигурацию диалога (форму редактирования записи в таблице), если еще незагружено
    // на самом деле тут тоже можно использовать клиентский кеш (может форма вдруг появится в теч. сеанса)
    if (!$('#' + dialogId).length) {
        $.ajax({
            url: urlPrefix.dialog + dbId,
            dataType: 'json',
            cache: false,
            success: function (data) {
                console.log(1);
                if (data) {
                    if (data.success) {
                        var regExp = /\{%=([\w_]+)%\}/gi,
                            events = data.events,
                            visibles = data.visibles,
                            data = data.data, // вероятно надо было бы использовать другую переменную :)
                            dialogTpl = $('#template-dialog').html(),
                            tplformId = makeId(dbId, 'tplform'),
                            empty = data.content.length == 0,
                            crud = data.crud,
                            colModel = data.colModel;

                        if (empty) {
                            // Заглушка (имитация кеша), чтобы не грузить форму опять, если еще раз открывается тот же грид.
                            // Вместо этого можно использовать локальный кеш. Выставить некий флажок.
                            $('body').append('<div role="cache" id=' + dialogId + '></div>');
                            return;
                        }

                        data.id = dialogId;
                        delete data.crud;
                        delete data.colModel;
                        // вставляем в плейсхолдеры общего шаблона диалога: id ({%=id%}), заголовок ({%=title%}), контент ({%=content%}) (собственно саму форму)
                        dialogTpl = dialogTpl.replace(regExp, function (pattern, m) {
                            return anyToString(data[m]);
                        });
                        // добавляем в боди шаблон диалога для данного грида
                        var script = document.createElement('script');
                        script.id = tplformId;
                        script.type = 'text/my-tmpl';
                        $('body').append(script);
                        $('#' + tplformId).append(data.content);
                        $('body').append(dialogTpl);
                        // save crud
                        $('#' + dialogId).data('crud', crud);
                        // save events
                        $('#' + dialogId).data('events', events);
                        // save visibles
                        $('#' + dialogId).data('visibles', visibles);
                        // save colModel
                        $('#' + dialogId).data('colModel', colModel);
                        // button handlers
                        $('#' + dialogId).find('button[data-action=save]').click(saveDialogHandler);
                        $('#' + dialogId).find('button[data-action=mode]').click(changeModeDialogHandler);
                        $('#' + dialogId).find('button[data-action=delete]').click(deleteDialogHandler);

                        // добавляем глобальную функцию проверки видимости
						//console.log(visibles/*Js*/);
                        if (data.visiblesJs) {
                            var visFunc = 'processFormVisibility_' + dbId;

                            $.globalEval('function ' + visFunc + '(p) {var r = {}; ' + data.visiblesJs + ' return r;}');
                            $('#' + dialogId).data('visibilityFunc', true);
                        }
                        // корректировка геометрии формы (иначе приехавшая форма распирает ее)
                        var childWidth = $('#' + dialogId + ' .modal-body :first-child').outerWidth(true),
                            childHeight = $('#' + dialogId + ' .modal-body :first-child').outerHeight(true);
                        var widthOffset = 22; //62 bootstrap
                        $('#' + dialogId + ' .modal-dialog').css({
                            width: childWidth + widthOffset
                        });
                        $('#' + dialogId + ' .modal-body').css({
                            height: childHeight,
                            width: childWidth
                        });

                        // jscroll
                        $('#' + tplformId + ' form').css('height', 'auto');
                        $('#' + dialogId + ' form').css('height', 'auto');

                        // first time save $owner
                        $('#' + dialogId).data('$owner', params.$owner);
                        // load data
                        dialogLoadData(params);
                    } else {
                        msg = data.error;
                        showErrorMessage(msg);
                    }
                } else {
                    showErrorMessage(Messages.timeout);
                }
            },
            error: ajaxErrorHandler
        });
    }
}

function dialogLoadData(params) {
    var dbId = params.dbId,
        dialogId = params.dialogId,
        gridId = params.gridId,
        isInsert = params.isInsert,
        fkName = params.fkName,
        fkValue = params.fkValue,
        ownerType = params.ownerType,
        formDataUrl = urlPrefix.formData + dbId + (fkName && fkValue ? '&fkName=' + fkName + '&fkValue=' + fkValue : '') + (isInsert ? '&insert=1' : (params.recId ? '&extId=' + params.recId : ''));

    //Если это форма по конкретной записи добавляем стек вызовов
    if (params.gridId && params.tablerowId) {
        var rows = $('#' + params.gridId).data('rawData').rows,
            //record = rows[params.tablerowId-1],
            record = $('#' + params.gridId).jqGrid('getRowData', params.tablerowId),
            srcId = $('#' + params.gridId).closest('.modal').length ? $('#' + params.gridId).closest('.modal').attr('id') : $('#' + params.gridId).closest('.tab-pane').attr('id');

        addCallStack(dialogId, srcId, record);
    } else
    // иначе в стек добавляем postData
    if (params.gridId && params.isInsert) {
        var record = removePostPrefix(params.postData),
            srcId = $('#' + params.gridId).closest('.modal').length ? $('#' + params.gridId).closest('.modal').attr('id') : $('#' + params.gridId).closest('.tab-pane').attr('id');

        addCallStack(dialogId, srcId, record);
    }

    //Если есть стек вызовов делаем postData
    if ($('#' + dialogId).data('callStack')) {
        var callStack = $('#' + dialogId).data('callStack'),
            updatedColumns,
            postData = {};

        updatedColumns = getExternalValues(callStack, $('#' + dialogId).data('colModel'), removePostPrefix(params.postData));
        postData = addPostPrefix(updatedColumns);
        params.postData = postData;
    }
    $.ajax({
        url: formDataUrl,
        dataType: 'json',
        type: params.postData !== undefined ? 'POST' : 'GET',
        data: params.postData,
        success: function (data) {
            if (data) {
                if (data.success) {
                    var formData = data.data.data,
                        formLists = data.data.lists,
                        formColumns = data.data.columns,
                        $dialog = $('#' + dialogId),
                        visibility = data.data.visibility,
                        insertId = data.data.insert,
                        tplformId = makeId(dbId, 'tplform'),
                        regExp = /\{%=([\w_]+)%\}/gi,
                        gridRegExp = /\{%([\w_]+)%\}/gi,
                        listsRegExp = /\{\{(\w+)\-(\w+)\}\}/gi,
                        formContent = $('#' + tplformId).html(),
                        fields = [];

                    console.log(formData);

                    if (formData && typeof formData == 'object' && Object.keys(formData).length) {
                        //если это инсерт и был пустой поиск то подставляем в текстовые поля данные из формы поиска
                        if (insertId && $('#' + gridId).jqGrid('getGridParam', 'search') && !$('#' + gridId).jqGrid('getRowData').length) {
                            var id = getId(gridId, 'grid'),
                                searchId = makeId(id, 'search');

                            //1) Проходимся по выбранным полям в форме поиска и обновляем соотв-но formData
                            $('select[name=field\\[\\]]', $('#' + searchId + ' .modal-body form')).each(function () {
                                var field = $(this).val();
                                if (field) {
                                    var $value = $(this).closest('tr').find('input[name=value\\[\\]]');
                                    if ($value.length && $value.val()) {
                                        var value = $value.val(),
                                            colProp = $('#' + gridId).jqGrid('getColProp', field);
                                        if (colProp.formatter == 'date' && colProp.formatoptions.newformat && colProp.formatoptions.srcformat) {
                                            value = value.match(/\d\d\.\d\d\.\d\d\d\d/) ? $.jgrid.parseDate(colProp.formatoptions.newformat, value, colProp.formatoptions.srcformat) : '';
                                        }
                                        if (formData[field] !== undefined) {
                                            formData[field] = value;
                                        }
                                    }
                                }
                            });
                        }
                        // подстановка данных в шаблон формы
                        formContent = formContent.replace(regExp, function (pattern, m) {
                            fields.push(m);
                            return anyToString(formData[m]);
                        });
                        // если в форму встроен грид, то подставляем значение для его загрузки
                        formContent = formContent.replace(gridRegExp, function (pattern, m) {
                            return anyToString(formData[m]);
                        });
                        if (Object.keys(formLists).length) {
                            // подстановка списков
                            formContent = formContent.replace(listsRegExp, function (pattern, m) {
                                return anyToString(formLists[m]);
                            });
                        }
                    } else {
                        msg = "An empty record is returned!";
                        showErrorMessage(msg);
                    }
                    // если форма не пуста (есть инпуты)
                    if (fields.length) {
                        $dialog.find('.modal-body').html(formContent);

                        // set action
                        $('#' + dialogId + ' .modal-body form')
                            .attr('action', urlPrefix.updateForm + dbId + '&rec_id=' + (isInsert ? insertId : params.recId) + (fkName && fkValue ? '&fkName=' + fkName + '&fkValue=' + fkValue : ''))
                            .attr('method', 'post')
                            .data('tableId', gridId)
                            .data('isInsert', isInsert)
                            .data('fields', fields)
                            .data('rawData', formData)
                            .data('visibility', visibility);
                        // Внимание! .data() не работает с переменными: после установки $dialogForm.data('key','value')
                        // в другом методе попытка прочитать $dialogForm.data('key') даст undefined. BUG ?

                        if (!isInsert) {
                            if (ownerType == 'grid')
                                $('#' + dialogId + ' .modal-body form').data('rowId', params.tablerowId);

                            $('#' + dialogId + ' .modal-body form').data('recId', params.recId);
                        } else {
                            $('#' + dialogId + ' .modal-body form').data('recId', insertId);
                            // set edit-mode
                            setDialogReadMode(dialogId, false);
                            //setDialogReadMode(dialogId);
                        }
                        setDialogReadMode(dialogId, false);

                        // инициализация зависимых полей
                        dialogPrepareEvents(dialogId, urlPrefix.formEvent + dbId + (fkName && fkValue ? '&fkName=' + fkName + '&fkValue=' + fkValue : ''));
                        // подготовка значений инпутов
                        dialogBeforeShow(dialogId);

                        // запуск компонент
                        dialogInitComponents(dialogId, fkName, fkValue, !isInsert ? params.recId : '');

                        // инициализация переключателей видимости (после компонент, т.к. надо слушать в том числе и компоненты)
                        dialogPrepareVisibles(dialogId, urlPrefix.formVisibles + dbId + (fkName && fkValue ? '&fkName=' + fkName + '&fkValue=' + fkValue : ''));

                        if ($dialog.data('modalInited'))
                            $dialog.modal('show');
                        else {
                            // first time copy height from
                            $dialog.find('.mylePreloaderWrapper').height($('#' + dialogId + ' .modal-body').height());

                            // init and show modal
                            $dialog.modal({
                                    backdrop: 'static' // don't close dialog by clicking outside the window
                                })
                                .on('shown.bs.modal', function (e) {
                                    var $dialog = $(this),
                                        $dialogTabs = $dialog.find('.myleModalFormTabs'),
                                        $formTabId = $dialogTabs.find('.nav-tabs').attr('id');
                                    $('#'+$formTabId+'.nav-tabs').tabdrop('layout');
                                    // correct tab-content width if needed
                                    if ($dialogTabs.length) {
                                        /*
                                        var tabsWidth = $dialogTabs.outerWidth(),
                                            tabsParentWidth = $dialogTabs.parent().width();

                                        $dialogTabs.next('.tab-content').css({
                                            width: tabsParentWidth - tabsWidth
                                        });
                                        dialogCorrectTabs(dialogId);
                                        */
                                    } else {
                                        // wrap everything except .myleModalFormTitleBlock in one block
                                        wrapFormBody(dialogId);
                                        //$('#'+dialogId+' .myleModalFormBody').jScrollPane();
                                    }

                                    dialogHideEmptyFields(dialogId);
                                    //dialogCorrectFullHeight(dialogId);

                                    if ($dialog.data('visibilityFunc')) {
                                        processVisibility(dialogId);
                                    }

                                    // show grid if needed
                                    $('.grid-wrapper', this).each(function () {
                                        var $ct = $(this),
                                            dbId = $ct.attr('data-grid'),
                                            extData = {
                                                id: $ct.attr('data-extvalue'),
                                                name: $ct.attr('data-extfield')
                                            };

                                        insertGrid($ct, dbId, extData);
                                    });

                                    // make this child last
                                    $('body').append(this);

                                    //dialogRefreshScroller(dialogId);

                                    $dialog.find('.mylePreloaderWrapper').addClass('myleHidden');
                                    //добавляем класс к вкладке с таблицей
                                    $('.grid-wrapper').parent('.tab-pane').addClass('gridTab');
                                })
                                .on('hidden.bs.modal', function () {
                                    var $dialog = $(this),
                                        $owner = $dialog.data('$owner');

                                    // set flag
                                    $owner.data('formOpened', false);
                                    // reset preloader
                                    $dialog.find('.mylePreloaderWrapper').removeClass('myleHidden');

                                    //garbage collection
                                    $('.grid-wrapper', this).each(function () {
                                        var $ct = $(this),
                                            dbId = $ct.attr('data-grid'),
                                            extId = $ct.attr('data-extvalue'),
                                            gridId = makeId(dbId, 'grid', extId);

                                        // remove grid
                                        $('#gbox_' + gridId).remove();
                                        // remove components
                                        //$(".datepicker").remove(); // иначе после закрытия формы перестает работать в тулбаре
                                    });

                                    // destroy select2 components markup
                                    $('[role=lookup], [role=boxedit]', $dialog).each(function () {
                                        $(this).select2('destroy');
                                    });
                                    $(".select2-hidden-accessible").remove();
                                    $(".bootstrap-datetimepicker-widget").remove();

                                    // in case of insert - remove inserted row
                                    if ($('.modal-body form', $dialog).data('isInsert') && +$('.modal-body form', $dialog).data('recId')) {
                                        deleteFormRecord(gridId, +$('.modal-body form', $(this)).data('recId'));
                                    }
                                    $dialog.find('form').html('');
                                    // set read-mode
                                    //setDialogReadMode(dialogId);
                                    setDialogReadMode(dialogId, false);
                                    // pop callStack
                                    var callStack = $dialog.data('callStack');
                                    if (callStack)
                                        callStack.pop();
                                });
                            $dialog.data('modalInited', true);
                        }
                    } else {
                        msg = "This form is empty!";
                        showErrorMessage(msg);
                    }
                } else {
                    msg = data.error;
                    showErrorMessage(msg);
                }
                console.log(params.dialogField);
                if(params.dialogFactName != '') {
                   $('input[name="Main[' + params.dialogField + ']"]').val(params.dialogFactName);
                   $('.manager-info').css({'display' : 'block'});
                }

                if (formColumns && typeof formColumns == 'object' && Object.keys(formColumns).length) {
                    for (var key in formColumns) {
                        if($("#wrapper_Main_"+key).length) {
                            if(!$("#manager-info").length) {
                                if(($("#wrapper_Main_"+key + ' input#Main_'+key).val() != '')) {
                                    $('#wrapper_Main_' + key).append('<span class="manager-info">...</span>');
                                } else $('#wrapper_Main_' + key).append('<span style="display: none;" class="manager-info">...</span>');
                            }
                        }
                    }
                }

                if($("#Main_LOGO").length) {
                    $(document).on('click', '.kv-file-remove', function() {
                        $('#Main_LOGO').fileinput('clear');
                        $('#basic-url').val('');
                    });

                    $(document).on('change paste', '#basic-url', function() {
                        var imageSrc = $(this).val();
                        if(imageSrc == '') $('#Main_LOGO').fileinput('clear');
                        else showImage(imageSrc);
                    });

                    $(document).on('change', '#Main_LOGO', function() {
                       $('#basic-url').val('');
                    });

                    if(imageSrc == '' || imageSrc === undefined) var imageSrc = 'http://www.rothgygax.ch/wp-content/uploads/2017/09/avatar1.jpg';
                    showImage(imageSrc);

                    if($('#wrapper_Main_LOGO').length) {
                        $('#wrapper_Main_LOGO').append('<input type="text" id="basic-url" role="string">');
                    }
                }

            } else {
                showErrorMessage(Messages.timeout);
            }
        },
        error: ajaxErrorHandler
    })
}

function wrapFormBody(dialogId) {
    var $form = $('#' + dialogId + ' form'),
        titleClass = 'myleModalFormTitleBlock';

    $form.append('<div class="myleModalFormBody" role="vertical-block"></div>');
    var $formBody = $form.children(':last-child');
    $form.children(':not(:last-child)').each(function () {
        if (!$(this).hasClass(titleClass)) {
            $formBody.append(this);
        }
    });
}

function dialogPrepareEvents(dialogId, formEventUrl) {
    var $dialog = $('#' + dialogId),
        events = $dialog.data('events');

    if (!events)
        return;

    for (key in events) {
        if (!events.hasOwnProperty(key))
            continue;

        // lists
        $('#' + dialogId + ' [data-field=' + key + ']').change(function (e) {
            // actually we need to use a post request with all form's fields values
            $.ajax({
                url: formEventUrl + '&field=' + $(this).attr('data-field'),
                dataType: 'json',
                type: 'POST',
                data: dialogSerializeForm(dialogId),
                success: function (data) {
                    console.log(3);
                    var fieldsData = data.data;

                    for (var field in fieldsData) {
                        if (!fieldsData.hasOwnProperty(field))
                            continue;

                        var $field = $('#' + dialogId + ' [data-field=' + field + ']');
                        if ($field.length) {
                            switch ($field.attr('role')) {
                                case 'lookup':
                                case 'boxedit':
                                    if ('select' == $field.prop("tagName").toLowerCase()) {
                                        $field.html('<option></option>' + fieldsData[field]);
                                        $field.select2("destroy");
                                        $field.select2({
                                                //placeholder: "Выберите значение",
                                                allowClear: true
                                            })
                                            .on("select2-open", function (e) {
                                                var $results = $('#select2-drop .select2-results');
                                                /*if(!!$results.data('jsp')) {
                                                    $results.data('jsp',null);
                                                    $results.jScrollPane();
                                                }
                                                else
                                                    $results.jScrollPane();

                                                dialogRefreshScroller(dialogId);*/
                                            })
                                            .on("select2-close", function (e) {
                                                //dialogRefreshScroller(dialogId);
                                            })
                                            .on("select2-removed", function (e) {
                                                //dialogRefreshScroller(dialogId);
                                            });
                                    } else {
                                        //set value to empty string
                                        $field.select2("val", "");
                                    }
                                    $field.trigger('change');
                                    break;
                            }
                        }
                    }
                },
                error: ajaxErrorHandler
            });
        });
        // grids
        $('#' + dialogId + ' [data-gridfield=' + key + ']').each(function (e) {
            var srcId = $(this).attr('data-grid');

            for (var i = 0, l = events[key].length; i < l; i++) {
                var $targetGrid = $('#' + dialogId + ' [data-gridfield=' + events[key][i] + ']');

                if ($targetGrid.length) {
                    var targetId = $targetGrid.attr('data-grid'),
                        dnc = gridDependences[srcId] !== undefined ? gridDependences[srcId] : [];

                    if (dnc.indexOf(targetId) == -1) {
                        dnc.push(targetId);
                    }
                    gridDependences[srcId] = dnc;
                }
            }
        });
    }
}

function dialogPrepareVisibles(dialogId, formVisibleUrl) {
	//console.log("dialogPrepareVisibles");
    var $dialog = $('#' + dialogId),
        dbId = getDbId(dialogId, 'dialog'),
        visibles = $dialog.data('visibles'),
        visibilityFunc = $dialog.data('visibilityFunc')
/*
    $('#' + dialogId + ' label').toggle(
        function(){
            var $check = $(this).prev('input[type=checkbox]');
            $check.click();
            $check.attr("checked","checked");
            $check.attr("data-value","1");
            $check.prev('input[type=hidden]').val("1");
        }, function() {
            var $check = $(this).prev('input[type=checkbox]');
            $check.click();
            $check.removeAttr('checked');
            $check.attr("data-value","0");
            $check.prev('input[type=hidden]').val("0");
        }
    );
*/
    $('#' + dialogId + ' label').click(function() {
        var $check = $(this).prev('input[type=checkbox]');
        var checked = $check.is(':checked');
        if (checked) {
            $check.removeAttr('checked');
            $check.attr("data-value","0");
            $check.prev('input[type=hidden]').val("0");
        } else {
            $check.attr("checked","checked");
            $check.attr("data-value","1");
            $check.prev('input[type=hidden]').val("1");
        }
    });

    //прячем части формы, в зависимости от значений компонент (deprecated)
    if (visibles) {
        for (var key in visibles) {
            if (!visibles.hasOwnProperty(key))
                continue;
            // lists
            $('#' + dialogId + ' [data-field=' + key + ']').change(function (e) {
                var field = $(this).attr('id').substr("Main_".length),
                    value = $(this).val();

                dialogVisibleHandler(dialogId, formVisibleUrl, field, value);
            });
            // checkboxes
            $('#' + dialogId + ' input[type=checkbox]#Main_' + key).click(function (e) {
                var field = $(this).prev().attr('id').substr("Main_".length),
                    value = $(this).prev().prop('checked') ? 1 : 0;
                dialogVisibleHandler(dialogId, formVisibleUrl, field, value);
            });
            // text fields
            $('#' + dialogId + ' [role=string]#Main_' + key + ', #' + dialogId + ' [role=text]#Main_' + key).change(function (e) {
                var field = $(this).attr('id').substr("Main_".length),
                    value = $(this).val();

                dialogVisibleHandler(dialogId, formVisibleUrl, field, value);
            });
            // dates
            $('#' + dialogId + ' div.date').each(function () {
                if ($(this).find('#Main_' + key).length) {
                    $(this).datepicker()
                        .on('changeDate', function (ev) {
                            var $input = $(this).find('input'),
                                field = $input.attr('id').substr("Main_".length),
                                value = $input.val();

                            if (value)
                                value = $.jgrid.parseDate($input.attr('data-newformat'), value, $input.attr('data-srcformat'));

                            dialogVisibleHandler(dialogId, formVisibleUrl, field, value);
                        });
                }
            });
            // times
            $('#' + dialogId + ' input[role=time]#Main_' + key).on('dp.change', function (e) {
                var field = $(this).attr('id').substr("Main_".length),
                    value = $(this).val();

                dialogVisibleHandler(dialogId, formVisibleUrl, field, value);
            });
        }
        //first run before modal show
        dialogVisibleResponse(dialogId, $('#' + dialogId + ' .modal-body form').data('visibility'));
    }
    //прячем части формы, в зависимости от значений компонент
    if (visibilityFunc) {
        // lists
        $('#' + dialogId + ' [data-field]').change(function (e) {
            processVisibility(dialogId);
        });
        // checkboxes
        $('#' + dialogId + ' input[type=checkbox]').click(function (e) {
            processVisibility(dialogId);
        });
        // text fields
        $('#' + dialogId + ' [role=string], #' + dialogId + ' [role=text], #' + dialogId + ' [role=number]').keyup(function (e) {
            processVisibility(dialogId);
        });
        // dates
        $('#' + dialogId + ' div.date').each(function () {
            if ($(this).find('[id^=Main_]').length) {
                $(this).datepicker()
                    .on('changeDate', function (ev) {
                        processVisibility(dialogId);
                    });
            }
        });
        // times
        $('#' + dialogId + ' input[role=time]').on('dp.change', function (e) {
            processVisibility(dialogId);
        });

        //first run before modal show
        processVisibility(dialogId);
    }

    // unset required class - why is here??
    dialogUnsetRequiredClass(dialogId);
}

function dialogUnsetRequiredClass(dialogId) {
    // lists
    $('#' + dialogId + ' [data-field]').change(function (e) {
        $(this).closest('[id^=wrapper_Main_]').removeClass('hasToFill');
    });
    // checkboxes
    $('#' + dialogId + ' input[type=checkbox]').click(function (e) {
        $(this).closest('[id^=wrapper_Main_]').removeClass('hasToFill');
    });
    // text fields
    $('#' + dialogId + ' [role=string], #' + dialogId + ' [role=text], #' + dialogId + ' [role=number]').keyup(function (e) {
        $(this).closest('[id^=wrapper_Main_]').removeClass('hasToFill');
    });
    // dates
    $('#' + dialogId + ' div.date').each(function () {
        if ($(this).find('[id^=Main_]').length) {
            $(this).datepicker()
                .on('changeDate', function (ev) {
                    $(this).closest('[id^=wrapper_Main_]').removeClass('hasToFill');
                });
        }
    });
    // times
    $('#' + dialogId + ' input[role=time]').on('dp.change', function (e) {
        $(this).closest('[id^=wrapper_Main_]').removeClass('hasToFill');
    });
}

function dialogVisibleHandler(dialogId, formVisibleUrl, field, value) {
    $.ajax({
        url: formVisibleUrl + '&field=' + field,
        dataType: 'json',
        type: 'POST',
        data: field + '=' + value,
        success: function (data) {
            console.log(4);
            if (data.success) {
                dialogVisibleResponse(dialogId, data.data);
            }
        },
        error: ajaxErrorHandler
    })
}

function dialogVisibleResponse(dialogId, fieldsData) {
    var $dialog = $('#' + dialogId);
    for (var field in fieldsData) {
        if (!fieldsData.hasOwnProperty(field))
            continue;

        // inline elements
        $('#wrapper_Main_' + field, $dialog)[fieldsData[field] ? 'show' : 'hide']();

        // grids
        $(' [data-gridfield=' + field + ']', $dialog)[fieldsData[field] ? 'show' : 'hide']();
    }
}

function processVisibility(dialogId, fieldsData) {
	console.log("processVisibility");
    var dbId = getDbId(dialogId, 'dialog');

    if (fieldsData === undefined) {
        // 1) Собираем данные формы
        var formData = getFormDataWithFormat(dialogId);

        fieldsData = removePostPrefix(formData);
    }
    // 2) Передаем их параметром функции
    var visibility = window['processFormVisibility_' + dbId](fieldsData);
    // 3) Отрабатываем видимости в соотв-ии с возвращенным значением
    dialogVisibleResponse(dialogId, visibility);
}

function dialogFireGridEvent(gridId) {
    var dbId = getDbId(gridId, 'grid'),
        suffix = gridId.substr(makeId(dbId, 'grid').length);

    if (gridDependences[dbId] !== undefined) {
        var dnc = gridDependences[dbId];
        for (var i = 0, l = dnc.length; i < l; i++) {
            $('#' + makeId(dnc[i] + suffix, 'grid')).trigger("reloadGrid");
        }
    }
}

function dialogBeforeShow(dialogId) {
    //CRUD для кнопок
    var crud = $('#' + dialogId).data('crud'),
        $mdialog = $('#' + dialogId + ' .modal-dialog'),
        readMode = $mdialog.hasClass('read-mode'),
        $dialog = $('#' + dialogId),
        formData = $dialog.find('.modal-body form').data('rawData'),
        visibles = $('#' + dialogId).data('visibles'),
        visibilityFunc = $('#' + dialogId).data('visibilityFunc');

    if (crud) {
        if (readMode) {
            $('#' + dialogId).find('button[data-action=mode]')[!!crud.u ? 'removeClass' : 'addClass']('my-hidden');
        } else {
            $('#' + dialogId).find('button[data-action=save]')[(!!crud.c) ? 'removeClass' : 'addClass']('my-hidden');
        }

        // delete
        $('#' + dialogId).find('button[data-action=delete]')[!!crud.d ? 'removeClass' : 'addClass']('my-hidden');
    }

    // преобразование tmpl-* в *
    $('#' + dialogId + ' [tmpl-for], #' + dialogId + ' [tmpl-id], #' + dialogId + ' [id^=tmpl-wrapper_]').each(function () {
        var $this = $(this);

        if ($this.attr('tmpl-for')) {
            $this.attr('for', $this.attr('tmpl-for')).removeAttr('tmpl-for');
        } else if ($this.attr('tmpl-id')) {
            $this.attr('id', $this.attr('tmpl-id')).removeAttr('tmpl-id');
        } else {
            var $tmplId = $this.attr('id'),
                $id = $tmplId.substring("tmpl-".length);

            $this.attr('id', $id);
        }
    });

    // установка значений selected для селектов, преобразуемых в компонент lookup или boxedit
    $('#' + dialogId + ' select[role=lookup], #' + dialogId + ' select[role=boxedit]').each(function () {
        var value = $(this).attr('data-value').split(','),
            id = $(this).attr('id'),
            i = 0,
            l = this.options.length,
            readerValue = [];

        // placeholder
        if (!$(this).attr('data-placeholder'))
            $(this).attr('data-placeholder', ' ');

        if (l) {
            // select
            for (i; i < l; i++) {
                for(var x = 0; x <= value.length; x++) {
                    if ($(this.options[i]).val() == value[x]) {
                        $(this.options[i]).attr('selected', 'selected');
                        readerValue.push($(this.options[i]).text());
                        if ($(this).attr('role') == 'lookup')
                            break;
                    }
                }
            }
            var opts = $(this).html();
            opts = '<option></option>' + opts;
            $(this).html(opts);
        } else {
            // hidden
            $hidden = $('<input type="hidden">');
            $.each($(this).prop("attributes"), function () {
                $hidden.attr(this.name, this.value);
            });
            $hidden.val($(this).data('value'));
            $(this).replaceWith($hidden);
        }
        if (readerValue.length) {
            $('[data-id=' + id + ']', $('#' + dialogId)).html(readerValue.join(', '));
        }
    });

    // установка формата даты
    $('#' + dialogId + ' input[role=date]').each(function () {
        var srcformat = $(this).attr('data-srcformat'),
            newformat = $(this).attr('data-newformat'),
            id = $(this).attr('id'),
            value = $(this).val();
        if (value.length > 0) {
            var date = new Date(value);
            var parsedData = date.toLocaleString('ru', {day: 'numeric', month: 'numeric', year: 'numeric'});
            //$(this).val($.jgrid.parseDate(srcformat, value, newformat));
            $(this).val(parsedData);
            $('[data-id=' + id + ']', $('#' + dialogId)).html($(this).val());
        }
        // ридонли для айпеда
        if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
            $(this).attr('readonly', true);
        }
    });

    // установка значения ридера чекбокса
    $('#' + dialogId + ' input[role=checkbox]').each(function () {
        var id = $(this).attr('id'),
            $checkbox = $(this);

        $('[data-id=' + id + ']', $('#' + dialogId)).text($checkbox.attr('data-valueyes') == $checkbox.attr('data-value') ? $checkbox.attr('data-labelyes') : $checkbox.attr('data-labelno'));
    });

    // вычистка <br> из инпутов
    $('#' + dialogId + ' [role=text]').each(function () {
        $(this).val($(this).val().replace(/<br>/gi, ''));
    });

    // установка значения viewfield для лукапов
    $('#' + dialogId + ' input[role=lookup], #' + dialogId + ' input[role=boxedit]').each(function () {
        var id = $(this).attr('id'),
            viewField = $(this).data('viewfield');

        $('[data-id=' + id + ']', $('#' + dialogId)).text(anyToString(formData[viewField]));
    });

    // Подстановка значения ID в заголовок формы
    $('#' + dialogId + ' .idString').html('ID ' + formData.ID);
}

function dialogHideEmptyFields(dialogId) {
    var hideBlocks = false,
        className = 'myleReadModeHidden',
        $readersParent = $('#' + dialogId + ' .myleModalFormTabs').length ? $('#' + dialogId + ' [role=tabs-block] .tab-pane.active') : $('#' + dialogId + ' .myleModalFormBody');

    $('[role=reader]', $readersParent).each(function () {
        var $this = $(this),
            value = $this.text(),
            $wrapper = $this.closest('[role=wrapper]'),
            visible = $wrapper.css('display') != 'none';

        if (value.length == 0 && $this.hasClass('checkbox-reader')) {
            value = $this.prevAll('[role=caption]').text();
        }

        if (!value && visible || value && !visible) {
            hideBlocks = true;
            $wrapper[value ? 'removeClass' : 'addClass'](className);
        }
    });
    if (hideBlocks)
        dialogHideEmptyBlocks(dialogId);
}

function dialogHideEmptyBlocks(dialogId, editMode) {
    var recursion,
        loop = 0,
        className = 'myleReadModeHidden',
        $blocksParent = $('#' + dialogId + ' .myleModalFormTabs').length ? $('#' + dialogId + ' [role=tabs-block] .tab-pane.active') : $('#' + dialogId + ' .myleModalFormBody');

    do {
        recursion = false;
        $('[role$=-block]', $blocksParent).each(function () {
            var $this = $(this),
                value = $this.height() > 0,
                visible = $this.css('display') != 'none';

            if (!value && visible || value && !visible) {
                recursion = true;
                $this[value ? 'removeClass' : 'addClass'](className);
            }
        });
        loop++;
    }
    while (recursion === true);
}

function dialogInitComponents(dialogId, fkName, fkValue, recId) {
    // datepicker
    $('#' + dialogId + ' input[role=date]').each(function () {
        $(this).wrap('<div class="date" data-date="' + $(this).val() + '"></div>')
            .wrap('<div class="myleInputDate add-on"></div>');
    });
    $('#' + dialogId + ' .myleInputDate').each(function () {
        $(this).append('<span class="icon"></span>');
    });
    $('#' + dialogId + ' div.date').datepicker({
        format: 'dd.mm.yyyy',
        weekStart: 1,
    }).on('changeDate', function (ev) {
        if (ev.viewMode == 'days')
            $(this).datepicker('hide');
        else if (ev.viewMode == 'clear') {
            $(this).find('input').val('');
            //$(this).find('input').get(0).focus();
            $(this).datepicker('hide');
        }
    }).on('skip', function (ev) {
        $(this).datepicker('hide');
    }).on('show', function (ev) {
        // correct picker position
        var inputOffset = parseInt($(this).find('.add-on').css('paddingLeft')),
            $dpOffset = $(this).data('datepicker').picker.offset(),
            pavlikOffset = 24;

        $(this).data('datepicker').picker.css('left', $dpOffset.left + inputOffset - pavlikOffset);
        $(this).find('.add-on').addClass('active');
    }).on('hide', function (ev) {
        $(this).find('.add-on').removeClass('active');
    });
    /*$('#'+dialogId+' input[role=date]').datepicker({
        format: 'dd.mm.yyyy',
    }).on('changeDate',function(ev){
        if (ev.viewMode == 'days' || ev.viewMode == 'clear')
            $(this).datepicker('hide');
    }).on('skip',function(ev){
        $(this).datepicker('hide');
    });*/
    // correct z-index
    $(".datepicker").css({
        'z-index': 10000
    });

    //timepicker
    $('#' + dialogId + ' input[role=time]').each(function () {
        $(this).wrap('<div class="myleThemeTimepicker time"></div>');
    });
    $('#' + dialogId + ' .myleThemeTimepicker').each(function () {
        $(this).append('<span class="icon"></span>');
    });
    // icon click
    $('#' + dialogId + ' .myleThemeTimepicker .icon').click(function (e) {
        var $parent = $(this).parent(),
            $picker = $('input[role=time]', $parent);

        $picker.focus();
    });

    $('#' + dialogId + ' input[role=time]').datetimepicker({
        format: 'H:mm',
        pickDate: false,
        pick12HourFormat: false
    });

    // ckeditor
    /*$('#'+dialogId+' textarea[role=editor]').ckeditor({
        toolbarGroups : [
            { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] }
        ],
        height: 100
    });*/

    // Корректировка ширины выпадающих списков
    $('#' + dialogId + ' [role=boxedit], #' + dialogId + ' [role=lookup]').each(function () {
        if ($(this).width() < 10) {
            $(this).width($(this).closest('.myleModalFormTitleBlock').length ? 293 : 225);
        } else
            $(this).width($(this).width());
    });


    //lookup as combobox
    $('#' + dialogId + ' select[role=lookup], #' + dialogId + ' select[role=boxedit]').select2({
            //placeholder: " ",
            allowClear: true
        })
        .on("select2-open", function (e) {
            // в один момент времени только у одного дива есть id=select2-drop
            console.log(111);
            var $resultsParent = $('#select2-drop');
            if ($(this).closest('.myleModalFormTitleBlock').length)
                $resultsParent.addClass('myleSelect2dropInTitle');
            else
                $resultsParent.addClass('myleSelect2dropCommon');
            $(this).next().hide();
        })
        .on("select2-close", function (e) {
            console.log(222);
            //dialogRefreshScroller(dialogId);
            $('.select2-drop').removeClass('myleSelect2dropInTitle').removeClass('myleSelect2dropCommon');
            var selectCoutn = $(this);
            if(selectCoutn.context.value != '') $(this).next().show();
        })
        .on("select2-removed", function (e) {
            $(this).next().hide();
            //dialogRefreshScroller(dialogId);
        });

    //lookup as autocomplete
    $('#' + dialogId + ' input[role=lookup]').select2({
            //placeholder: "Search for a movie",
            allowClear: true,
            minimumInputLength: 0,
            ajax: { // instead of writing the function to execute the request we use Select2's convenient helper
                url: function (term) {
                    return urlPrefix.getOptions + getDbId(dialogId, 'dialog') + (fkName && fkValue ? '&fkName=' + fkName + '&fkValue=' + fkValue : '') + (recId ? '&mainrec_id=' + recId : '') + '&field=' + $(this).data('field') + '&term=' + term;
                },
                dataType: 'json',
                type: 'POST',
                data: function (term) {
                    return dialogSerializeForm(dialogId);
                },
                results: function (data, page) { // parse the results into the format expected by Select2.
                    // since we are using custom formatting functions we do not need to alter remote JSON data

                    for (var i = 0, l = data.length; i < l; i++) {
                        data[i] = {
                            id: data[i].ID,
                            text: data[i].ITEM,
                        }
                    }
                    return {
                        results: data
                    };
                }
            },
            initSelection: function (element, callback) {
                console.log(element);
                var id = $(element).val(),
                    url = urlPrefix.getOptions + getDbId(dialogId, 'dialog') + (fkName && fkValue ? '&fkName=' + fkName + '&fkValue=' + fkValue : '') + (recId ? '&mainrec_id=' + recId : '') + '&field=' + $(element).data('field') + '&rec_id=' + id;
                if (id !== "") {
                    $.ajax(url, {
                        dataType: "json",
                        type: 'POST',
                        data: dialogSerializeForm(dialogId),
                    }).done(function (data) {

                        if (data.length) {
                            data = {
                                id: data[0].ID,
                                text: data[0].ITEM,
                            };
                            // больше не подгружаем,а заполняем значение сразу (приезжает с данными)
                            //$('[data-id='+$(element).attr('id')+']',$('#'+dialogId)).html(data.text);
                            callback(data);
                        }
                    });
                }
            },
            //escapeMarkup: function (m) { return m; } // we do not want to escape markup since we are displaying html in results
        })
        .on("select2-open", function (e) {
            // в один момент времени только у одного дива есть id=select2-drop

            var $resultsParent = $('#select2-drop');
            if ($(this).closest('.myleModalFormTitleBlock').length)
                $resultsParent.addClass('myleSelect2dropInTitle');
            else
                $resultsParent.addClass('myleSelect2dropCommon');
            $(this).next().hide();
        })
        .on("select2-close", function (e) {
            console.log($(this));
            //dialogRefreshScroller(dialogId);
            $('.select2-drop').removeClass('myleSelect2dropInTitle').removeClass('myleSelect2dropCommon');
            var selectCoutn = $(this);
            if(selectCoutn.context.value != '') $(this).next().show();
        })
        .on("select2-removed", function (e) {
            $(this).next().hide();
            //dialogRefreshScroller(dialogId);
        })
        .on("select2-loaded", function (e) {
            // в один момент времени только у одного дива есть id=select2-drop
        });

    //boxedit (like FB tags)
    $('#' + dialogId + ' input[role=boxedit]').select2({
            //placeholder: "Search for a movie",
            minimumInputLength: 0,
            multiple: true,
            allowClear: true,
            ajax: { // instead of writing the function to execute the request we use Select2's convenient helper
                url: function (term) {
                    return urlPrefix.getOptions + getDbId(dialogId, 'dialog') + (fkName && fkValue ? '&fkName=' + fkName + '&fkValue=' + fkValue : '') + (recId ? '&mainrec_id=' + recId : '') + '&field=' + $(this).data('field') + '&term=' + term;
                },
                dataType: 'json',
                type: 'POST',
                data: function (term) {
                    return dialogSerializeForm(dialogId);
                },
                results: function (data, page) { // parse the results into the format expected by Select2.
                    // since we are using custom formatting functions we do not need to alter remote JSON data
                    for (var i = 0, l = data.length; i < l; i++) {
                        data[i] = {
                            id: data[i].ID,
                            text: data[i].ITEM,
                        }
                    }
                    return {
                        results: data
                    };
                }
            },
            initSelection: function (element, callback) {
                var id = $(element).val(),
                    url = urlPrefix.getOptions + getDbId(dialogId, 'dialog') + (fkName && fkValue ? '&fkName=' + fkName + '&fkValue=' + fkValue : '') + (recId ? '&mainrec_id=' + recId : '') + '&field=' + $(element).data('field') + '&rec_id=' + id;
                if (id !== "") {
                    $.ajax(url, {
                        dataType: "json",
                        type: 'POST',
                        data: dialogSerializeForm(dialogId),
                    }).done(function (data) {
                        var mydata = [],
                            readerValue = [];

                        for (var i = 0, l = data.length; i < l; i++) {
                            mydata[i] = {
                                id: data[i].ID,
                                text: data[i].ITEM,
                            }
                            readerValue.push(data[i].ITEM);
                        }
                        // больше не подгружаем,а заполняем значение сразу (приезжает с данными)
                        //$('[data-id='+$(element).attr('id')+']',$('#'+dialogId)).html(readerValue.join(', '));
                        callback(mydata);
                    });
                }
            },
            //escapeMarkup: function (m) { return m; } // we do not want to escape markup since we are displaying html in results
        })
        .on("select2-open", function (e) {
            // в один момент времени только у одного дива есть id=select2-drop
            var $resultsParent = $('#select2-drop');
            console.log(789);

            if ($(this).closest('.myleModalFormTitleBlock').length)
                $resultsParent.addClass('myleSelect2dropInTitle');
            else
                $resultsParent.addClass('myleSelect2dropCommon');
        })
        .on("select2-close", function (e) {
            // dialogRefreshScroller(dialogId);
            $('.select2-drop').removeClass('myleSelect2dropInTitle').removeClass('myleSelect2dropCommon');
        })
        .on("select2-removed", function (e) {
            //dialogRefreshScroller(dialogId);
        }).on("select2-loaded", function (e) {
            // в один момент времени только у одного дива есть id=select2-drop
            var $results = $('#select2-drop .select2-results');

            /*if(!!$results.data('jsp')) {
                $results.data('jsp',null);
                $results.jScrollPane();
            }
            else
                $results.jScrollPane();*/
        });

    //checkbox
    $('#' + dialogId + ' input[role=checkbox]').each(function () {
        var $checkbox = $(this);

        $('<input type="hidden" name="' + $checkbox.attr('name') + '" value="' + $checkbox.attr('data-valueno') + '">').insertBefore($checkbox);
        if ($checkbox.attr('data-valueyes') == $checkbox.attr('data-value'))
            $checkbox.attr('checked', 'checked');

    });

    // prevent ENTER
    $('#' + dialogId + ' [role=string]').bind('keypress', function (e) {
        if ((e.keyCode || e.which) == 13) {
            e.preventDefault();
        }
    });

    // only numbers
    $('#' + dialogId + ' [role=number]').bind('keypress', function (e) {
        var charCode = (e.which) ? e.which : e.keyCode
        if (charCode != 46 && (charCode > 31 && (charCode < 48 || charCode > 57)))
            e.preventDefault();
    });

    //inner button handlers
    $('#' + dialogId + ' [type=button][role=inner]').click(function () {
        var $this = $(this);

        switch ($this.data('action')) {
            case 'grid':
                if ($this.data('dbid')) {
                    showGridDialog($this.data('dbid'), $this.attr('value'), {
                        id: $('#' + dialogId + ' .modal-body form').data('recId')
                    });

                    var originalRecord = $('#' + dialogId + ' .modal-body form').data('rawData'),
                        currentMainRecord = getFormDataWithFormat(dialogId),
                        record = removePostPrefix(currentMainRecord);

                    record = $.extend({}, originalRecord, record);
                    addCallStack(makeId($this.data('dbid'), 'griddialog'), dialogId, record);
                }
                break;
        }
    })
}

function dialogReheightTextEditors(dialogId) {
    // установка высоты инпута в соотв-ии с высотой ридера (для текста)
    if ($('#' + dialogId + ' .modal-dialog').hasClass('read-mode')) {
        $('#' + dialogId + ' [role=reader]').each(function () {
            var $editor = $('#' + dialogId + ' #' + $(this).attr('data-id'));

            if ($editor.length && ($editor.attr('role') == 'text')) {
                var //borderOffset = $editor.outerHeight() - $editor.height();
                    height = $(this).height(); // - editorOffset; //border

                $editor.height(height);
            }
        });
    }
}

/**
 * Хендлер нажатия на кнопку "Сохранить" в форме редактирования записи
 * @param {event} e
 */
function saveDialogHandler(e) {
    e.preventDefault();

    var $button = $(this),
        $dialog = $button.closest('.modal'),
        dialogId = $dialog.attr('id'),
        $form = $dialog.find('.modal-body form');

    console.log($dialog, '$dialog');
    console.log($dialog, '$dialog');
    console.log(dialogId, 'dialogId');
    console.log($form, '$form');

    if (!$form.length)
        return;
    $button.button('loading');


    var form = $form,
        formData = new FormData()
    formParams = form.serializeArray();

    $.each(form.find('input[type="file"]'), function(i, tag) {
        $.each($(tag)[0].files, function(i, file) {
            formData.append(tag.name, file);
            console.log(tag.name);
            console.log(file);
        });
    });

    $.each(formParams, function(i, val) {
        formData.append(val.name, val.value);
    });

    console.log(1111111111111111111111111);

    $.ajax({
        url: $form.attr('action'), //+($form.data('rowId') ? '' : '&insert=1'),
        // processData: false, //esi vor dnum es file@ uxarkuma
        // contentType: false, //esi vor dnum es file@ uxarkuma
        // cache: false, //esi vor dnum es file@ uxarkuma
        dataType: 'json',
        type: $form.attr('method'),
        data: dialogSerializeForm(dialogId), //formData esi vor dnum es file@ uxarkuma
        success: function (data, textStatus, jqXHR) {
            console.log(5);
            if (data) {
                if (data.success) {
                    console.log($form.data);
                    var gridId = $form.data('tableId'),
                        rowId = $form.data('rowId'),
                        rowData = data.data,
                        userData = data.userdata,
                        $grid = $('#' + gridId),
                        ownerType = $grid.hasClass('scheduler-wrapper') ? 'schedule' : 'grid';

                    if (ownerType == 'grid') {
                        console.log('grid');
                        var p = $grid.jqGrid('getGridParam');
                        // запись успешно сохранена
                        if (rowId) {
                            console.log('rowId');
                            // если апдейт и были изменения обновляем соотв-ю строку грида
                            if (Object.keys(rowData).length) {
                                // выставляем флаг, для применения форматирования
                                /*$.jqgrid.formatter.date.reformatAfterEdit = true;*/
                                // добавляем кастомные столбцы в набор данных
                                for (var i = 0, l = p.colModel.length; i < l; i++) {
                                    var column = p.colModel[i];
                                    if (typeof column.formatter == 'function') {
                                        rowData[column.name] = '';
                                    }
									if (column.formatter == 'date') {
                                        var date = new Date(rowData[column.name]);
                                        if (!isNaN(date.getTime())) {
                                            var day = date.getDate().toString();
                                            var month = (date.getMonth() + 1).toString();
                                            rowData[p.colModel[i]['name']] = (day[1] ? day : '0' + day[0]) + '.' + (month[1] ? month : '0' + month[0]) + '.' + date.getFullYear();
                                        }
									}
                                }

                                /*if(rowData['FACT_NAME'] != 'undefined') {
                                    if($("#wrapper_Main_MANAGER_ID").length) {
                                        $('#wrapper_Main_MANAGER_ID a span.select2-chosen, select[name="Main[MANAGER_ID]"] :selected').text(rowData['FACT_NAME']);
                                    }
                                }*/

                                if(rowData['FACT_NAME'] != 'undefined') {
                                    console.log(gridId, rowID, rowData['FACT_NAME'], rowData['ID'])
                                    if($("select[data-value='" + rowData['ID'] +"']").length) {
                                        $("select[data-value='" + rowData['ID'] +"'] :selected").text(rowData['FACT_NAME']);
                                        var selectDiv = $("select[data-value='" + rowData['ID'] +"']").prev().attr('id');
                                        $('#' + selectDiv + ' a .select2-chosen').text(rowData['FACT_NAME']);
                                    } else if($("input[value='" + rowData['ID'] +"']").length) {
                                        $("input[value='" + rowData['ID'] +"']").text(rowData['FACT_NAME']);
                                        var selectDiv = $("input[value='" + rowData['ID'] +"']").prev().attr('id');
                                        $('#' + selectDiv + ' a .select2-chosen').text(rowData['FACT_NAME']);
                                    }
                                }

                                $grid.jqGrid('setRowData', rowId, rowData);
                                if (p.userDataOnFooter) {
                                    // обновляем футер
                                     $grid.jqGrid("footerData", "set", userData, true);
                                }
                            }
                        } else {
                            var rawData = $grid.data('rawData'),
                                rowID = rawData.rows.length + 1,
                                jsp = $('#gbox_' + gridId + ' .ui-jqgrid-bdiv').data('jsp');

                            rawData.rows.push(rowData);

                            // addrow
                            /*
                            $grid.jqGrid('addRow', {
                                rowID: rowID,
                                initdata: rowData,
                                position: "first",
                                useDefValues: false,
                                useFormatter: false,
                                addRowParams: {
                                    extraparam: {}
                                }
                            });
                            */
                            $grid.jqGrid('addRowData', {
                                rowid: rowID,
                                data: rowData,
                                position: "first"
                            });
                            // mark row as new
                            $('tr[id=' + rowID + ']', $grid).addClass('myleNewRecord');
                            // prevent delete record onHide
                            $form.data('recId', null);
                            // scrollTop
                            if (jsp)
                                jsp.scrollToY(0);
                        }
                        // fireEvent
                        if(rowData['FACT_NAME'] != 'undefined') {
                            console.log($grid.attr('data-field'), '$grid');
                            console.log($grid.attr('data-form-id'), '$grid');
                            var data = {
                                fieldId: $grid.attr('data-field'),
                                formID: $grid.attr('data-form-id')
                            };
                            if($('input[eform_id="' + data.formID + '"]').length) {
                                $('input[eform_id="' + data.formID + '"]').val(rowData['ID']).trigger('change');
                            } else if($('select[eform_id="' + data.formID + '"]').length) {
                                $('select[eform_id="' + data.formID + '"').val(rowData['ID']).trigger('change');
                            }
                            $grid.trigger("reloadGrid");
                        }
                    } else if (ownerType == 'schedule') {
                        console.log(2);
                        // запись успешно сохранена
                        if (rowId) {
                            // если апдейт и были изменения обновляем соотв-ю строку грида
                            if (Object.keys(rowData).length) {
                                // reload scheduler
                                $('button[role=refresh]', $grid).trigger('click');
                            }
                        } else {
                            console.log(3);
                            // reload scheduler
                            $('button[role=refresh]', $grid).trigger('click');
                            // prevent delete record onHide
                            $form.data('recId', null);
                        }
                    }
                    if (data.error)
                        showWarningMessage(data.error);

                    $dialog.modal('hide');
                } else {
                    if (data.requiredFields !== undefined) {
                        $.each(data.requiredFields, function (i, item) {
                            $('#wrapper_Main_' + this, $dialog).addClass('hasToFill');
                        });
                    } else {
                        var msg = data.error;
                        showErrorMessage(msg);
                    }
                    //$dialog.modal('hide');

                }
            } else {
                console.log(55);
                showErrorMessage(Messages.timeout);
            }
        },
        error: ajaxErrorHandler,
        complete: function (jqXHR, textStatus) {
            $button.button('reset');
        }
    });
}

function dialogSerializeForm(dialogId) {
    var $elements = $('#' + dialogId + ' input, #' + dialogId + ' select, #' + dialogId + ' textarea');

    console.log($elements);

    return serializeWithFormat($elements);
}

function serializeWithFormat($elements) {
    var serialized = [];
    data = getFieldsDataWithFormat($elements, false, true);

    console.log('222222222222222222222222');
    console.log($elements);

    for (var name in data) {
        if (!data.hasOwnProperty(name))
            continue;

        var value = data[name];
        serialized.push(encodeURIComponent(name) + '=' + encodeURIComponent(value));
    }
    return serialized.join('&');
}

function getFormDataWithFormat(dialogId) {
    var $elements = $('#' + dialogId + ' input, #' + dialogId + ' select, #' + dialogId + ' textarea');
    return getFieldsDataWithFormat($elements, true);
}

function getFieldsDataWithFormat($elements, forceCheckboxes, visibleOnly) {
    forceCheckboxes = typeof forceCheckboxes !== 'undefined' ? forceCheckboxes : false;
    visibleOnly = typeof visibleOnly !== 'undefined' ? visibleOnly : false;
    var data = {};

    $elements.each(function () {
        var value = $(this).val(),
            name = $(this).attr('name');

		//console.log(name,' - ',value,' - ', $(this).attr('type'));

        if (!name)
            return;
        /*
        if ($(this).attr('role') == 'checkbox') {
            if (!$(this).checked) {
                if (!forceCheckboxes) {
                    return;
                } else {
                    value = $(this).attr('data-valueno') ? $(this).attr('data-valueno') : 0;
                }
            } else {
                value = $(this).attr('data-valueyes') ? $(this).attr('data-valueyes') : 1;
            }
        }
        */
        if ($(this).attr('role') == 'checkbox' && !$(this).checked) {
            if (!forceCheckboxes) {
                return;
            } else {
                value = $(this).attr('data-valueno') ? $(this).attr('data-valueno') : 0;
            }
        }

        if ($(this).attr('role') == 'radio' && !this.checked) {
            return;
        }
        if (($(this).attr('role') == 'date' || $(this).attr('role') == 'time') && value.length > 0) {
            var date = new Date(value);
            //value = date.toLocaleString('ru', {day: 'numeric', month: 'numeric', year: 'numeric'});
            //value = $.jgrid.parseDate($(this).attr('data-newformat'), value, $(this).attr('data-srcformat'));
        }
        // $.each(form.find('input[type="file"]'), function(i, tag) {
        //     $.each($(tag)[0].files, function(i, file) {
        //         data.append(tag.name, file);
        //     });
        // });

        if($(this).attr('type') == 'file'){
            console.log(33333333333333333333333333);
            console.log($(this));
        }

        data[name] = value;
    });
    return data;
}

function changeModeDialogHandler(e) {
    e.preventDefault();

    var $button = $(this),
        $mdialog = $button.closest('.modal-dialog'),
        readMode = $mdialog.hasClass('read-mode'),
        $dialog = $button.closest('.modal'),
        dialogId = $dialog.attr('id');

    if (readMode) {
        dialogReheightTextEditors(dialogId)
        setDialogReadMode(dialogId, false);
    } else {
        setDialogReadMode(dialogId);
    }

    dialogCorrectTabs(dialogId);

    //dialogCorrectFullHeight(dialogId);

    //dialogRefreshScroller(dialogId);
}

/**
 * Refreshes jsp scroller on the modal body
 * @param string dialogId
 */
function dialogRefreshScroller(dialogId) {
    var $dbody = $('#' + dialogId + ' .modal-body');

    /*if (!$dbody.data('jsp')) {
        $dbody.jScrollPane();
    }
    else {
        $dbody.data('jsp').reinitialise();
    }*/
    // active tab
    /*if($dbody.has($('.tab-content')).length) {
        var $active = $('.tab-content .tab-pane.active',$dbody);

        if ($active.length) {
            if (!$active.data('jsp')) {
                $active.jScrollPane();
            }
            else {
                $active.data('jsp').reinitialise();
            }
        }
    }*/
}

function setDialogReadMode(dialogId, readMode) {
    var readMode = readMode === undefined ? true : !!readMode,
        $mdialog = $('#' + dialogId + ' .modal-dialog');

    if (readMode) {
        $mdialog.addClass('read-mode');
    } else {
        $mdialog.removeClass('read-mode');
    }
}


function dialogCorrectTabs(dialogId) {
    //console.log('dialogCorrectTabs: '+dialogId);
    var $dialog = $('#' + dialogId),
        bodyHeight = $('.modal-body', $dialog).height(),
        formHeight = $('form', $dialog).height(),
        firstBlockHeight = $('.myleModalFormTitleBlock', $dialog).outerHeight(true);

    //console.log(bodyHeight+' - '+firstBlockHeight);
    if ($dialog.has($('.tab-content')).length) {
        var $tabsParent = $('.tab-content', $dialog).parent();

        if (bodyHeight - formHeight > 0) {
            $tabsParent.css('height', bodyHeight - firstBlockHeight);
        } else {
            $tabsParent.css('height', formHeight - firstBlockHeight);
        }
    }
}

/**
 * Растягивает блок (пока один!) с классом fullHeight на всю оставшуюся высоту формы
 * а также корректирует высоту вложенных в него таблиц, если они есть.
 * @param string dialogId
 * @returns void
 */
/*function dialogCorrectFullHeight(dialogId) {
    var minHeight = 200;

    $('#'+dialogId+' .fullHeight').each(function(){
        //console.log(this,$(this).is(":visible"));
        if(!$(this).is(":visible"))
            return;

        var $me = $(this),
            $parent = $me.parent(),
            idx = $me.index(),
            parentHeight = $parent.height(),
            heightOffset = $me.outerHeight(true) - $me.height(),
            innerHeight = 0;

        //console.log(this,$me.outerHeight(true),$me.height());
        //console.log($parent[0]);
        $parent.children().each(function(i,el){
            if(i!=idx) {
                innerHeight += $(this).outerHeight(true);
                //console.log(this,$(this).outerHeight(true));
            }
        });
        //console.log(parentHeight+' - '+innerHeight+' - '+heightOffset+' = '+(parentHeight - innerHeight - heightOffset));
        if (parentHeight - innerHeight > minHeight) {
            var newHeight = parentHeight - innerHeight - heightOffset;
            $me.height(newHeight);
            //console.log('new outerHeight: '+ $me.outerHeight(true)+' innerHeight:'+$me.height());

            // ресайзим таблицы
            // !! надо ресайзить только ближайшие таблицы-чайлды
            // а в данном случае будут ресайзиться и вложенные fullHeight
            $('table[id^=grid]',$me).each(function(){
                //console.log('resize grid '+$(this).attr('id'));
                gridResize($(this).attr('id'));
            });
        }
    });
}*/

function deleteDialogHandler(e) {
    e.preventDefault();
    var $me = $(this);

    showConfirmDialog(function () {
        var $button = $me,
            $dialog = $button.closest('.modal'),
            $form = $dialog.find('.modal-body form'),
            gridId = $form.data('tableId'),
            $grid = $('#' + gridId),
            ownerType = $grid.hasClass('scheduler-wrapper') ? 'schedule' : 'grid',
            recId;

        if (ownerType == 'grid') {
            var rowId = $form.data('rowId'),
                rowData = $grid.data('rawData').rows[rowId - 1];

            recId = rowData['ID'];
        } else if (ownerType == 'schedule') {
            recId = $form.data('recId');
        }

        deleteFormRecord(gridId, recId, true);
        $dialog.modal('hide');
    });
}

function deleteFormRecord(gridId, recId, refresh) {
    var $grid = $('#' + gridId),
        dbId = getDbId(gridId, 'grid'),
        ownerType = $grid.hasClass('scheduler-wrapper') ? 'schedule' : 'grid',
        deleteUrl = urlPrefix.deleteForm + dbId + '&rec_id=' + recId;

    $.ajax({
        url: deleteUrl,
        dataType: 'json',
        type: 'POST',
        success: function (data, textStatus, jqXHR) {
            console.log(6);
            if (data) {
                if (data.success) {
                    if (!!refresh) {
                        if (ownerType == 'grid') {
                            //reload grid
                            $grid.trigger("reloadGrid");
                            // fireEvent
                            dialogFireGridEvent(gridId);
                        } else if (ownerType == 'schedule') {
                            // reload scheduler
                            $('button[role=refresh]', $grid).trigger('click');
                        }
                    }
                } else {
                    msg = data.error;
                    showErrorMessage(msg);
                }
            } else {
                showErrorMessage(Messages.timeout);
            }
        },
        error: ajaxErrorHandler
    });
}

function dialogSearchSearchButtonHandler(e) {
    e.preventDefault();
    var $search = $(this).closest('.myleSearchForm'),
        searchId = $search.attr('id'),
        gridId = makeId(getId(searchId, 'search'), 'grid'),
        postData = $('#' + gridId).jqGrid('getGridParam', 'postData'),
        searchRules = [];

    searchRules = dialogGetSearchRules(searchId);
    if (searchRules.length) {
        postData.searchRules = JSON.stringify(searchRules);
        $('#' + gridId).jqGrid('setGridParam', {
            search: true,
            postData: postData,
            page: 1
        });
        $('#' + gridId).trigger("reloadGrid");
        //hide dialog
        $search.find('[role=close]').trigger('click');
    } else {
        var msg = "Введите условия поиска";
        showErrorMessage(msg);
    }
}

function dialogGetSearchRules(searchId) {
    var searchRules = [],
        gridId = makeId(getId(searchId, 'search'), 'grid');

    $('select[name=field\\[\\]]', $('#' + searchId + ' .myleSearchBody .myleSearchFields')).each(function () {
        var field = $(this).val();
        if (field) {
            var $value = $(this).closest('.myleSearchFieldWrapper').find('input[name=value\\[\\]]');
            if ($value.length && $value.val()) {
                var value = $value.val(),
                    colProp = $('#' + gridId).jqGrid('getColProp', field);

                if (colProp.formatter == 'date' && colProp.formatoptions.newformat && colProp.formatoptions.srcformat && value.match(/\d\d\.\d\d\.\d\d\d\d/)) {
                    value = $.jgrid.parseDate(colProp.formatoptions.newformat, value, colProp.formatoptions.srcformat);
                }
                searchRules.push({
                    field: field,
                    op: 'cn',
                    data: value
                });
            }
        }
    });

    return searchRules;
}

function dialogSearchClearButtonHandler(e) {
    e.preventDefault();
    var $search = $(this).closest('.myleSearchForm'),
        searchId = $search.attr('id'),
        gridId = makeId(getId(searchId, 'search'), 'grid'),
        postData = $('#' + gridId).jqGrid('getGridParam', 'postData');

    // reset form state
    gridMakeDefaultSearchMarkup(gridId);

    delete postData.searchRules;
    $('#' + gridId).jqGrid('setGridParam', {
        search: false,
        postData: postData,
        page: 1
    });
    $('#' + gridId).trigger("reloadGrid");

    //hide dialog
    //$search.find('[role=close]').trigger('click');
}

function dialogSearchCloseButtonHandler(e) {
    e.preventDefault();

    var $search = $(this).closest('.myleSearchForm'),
        searchId = $search.attr('id'),
        gridId = makeId(getId(searchId, 'search'), 'grid'),
        searchRules = dialogGetSearchRules(searchId);

    $('#t_' + gridId)[searchRules.length ? 'addClass' : 'removeClass']('myleSearchExists');
    $search.css('top', '');
}

function dialogSearchAddBlockHandler(e) {
    e.preventDefault();
    var $this = $(this),
        $search = $this.closest('[id^=' + idPrefix.search + ']'),
        $blockOwner = $search.find('.myleSearchBody .myleSearchFields'),
        $inputs = $blockOwner.find('input[name=value\\[\\]]'),
        add = true,
        block = $search.data('searchBlock');

    $inputs.each(function () {
        add &= $(this).val().match(/\S/) !== null;
    });
    if (add) {
        $blockOwner.append(block);
        //init component
        $('select ', $search).select2({
            //placeholder: "Выберите столбец",
            allowClear: true,
            minimumResultsForSearch: -1
        }).on("change", function (e) {
            var $search = $(this).closest('.myleSearchForm');

            dialogSearchShowAddButton($search.attr('id'));
        }).on("select2-open", function (e) {
            var $results = $('#select2-drop .select2-results');

            $results.parent().addClass('myleSearchListbox');
        });
    }
}

function dialogSearchRemoveBlockHandler(e) {
    e.preventDefault();
    var $this = $(this),
        $block = $this.closest('.myleSearchFieldWrapper'),
        $dialog = $this.closest('.myleSearchForm'),
        dialogId = $dialog.attr('id');

    $block.remove();
    dialogSearchShowAddButton(dialogId);
}

function dialogSearchShowAddButton(dialogId) {
    var $dialog = $('#' + dialogId),
        $blockOwner = $dialog.find('.myleSearchBody .myleSearchFields'),
        $button = $dialog.find('[role=add]'),
        className = 'myleNotvisible',
        show = true;

    $('select[name=field\\[\\]]', $blockOwner).each(function () {
        if (!$(this).val()) {
            show = false;
            return;
        }
    });
    $button[show ? 'removeClass' : 'addClass'](className);
}

function dialogShowSortDialog(gridId) {
    var sortId = makeId(getId(gridId, 'grid'), 'sort');

    // init and show modal
    //$('#' + sortId).css('top', 0);
    $('#' + sortId).modal('show');
}

function dialogSortSortButtonHandler(e) {
    e.preventDefault();
    var $sort = $(this).closest('.myleSortForm'),
        sortId = $sort.attr('id'),
        gridId = makeId(getId(sortId, 'sort'), 'grid'),
        sortname = "",
        sortorder = "asc",
        sortRules = [];

    //Собираем данные формы;
    $('select[name=field\\[\\]]', $('#' + sortId + ' .myleSortBody form')).each(function () {
        var field = $(this).val();
        if (field) {
            var $value = $(this).closest('.myleSortFieldWrapper').find('input[name=order\\[\\]]');

            sortRules.push([field, ($value.prop('checked') ? 'desc' : 'asc')]);
        }
    });
    if (sortRules.length) {
        for (var i = 0, l = sortRules.length; i < l; i++) {
            sortname += (i > 0 ? ',' : '') + sortRules[i][0] + (i + 1 < l ? ' ' + sortRules[i][1] : '');
        }
        sortorder = sortRules[l - 1][1];
        $('#' + gridId).jqGrid('setGridParam', {
            sortname: sortname,
            sortorder: sortorder
        });
        $('#' + gridId).trigger("reloadGrid");
        $sort.find('[role=close]').trigger('click');
    } else {
        var msg = "Выберите столбец сортировки";
        showErrorMessage(msg);
    }
}

function dialogSortClearButtonHandler(e) {
    e.preventDefault();

    var $sort = $(this).closest('.myleSortForm'),
        sortId = $sort.attr('id'),
        $blockOwner = $sort.find('.myleSortBody form'),
        sortColumns = $sort.data('sortColumns'),
        options = [],
        gridId = makeId(getId(sortId, 'sort'), 'grid');

    // reset form state
    for (var i = 0, l = sortColumns.length; i < l; i++) {
        options.push('<option value="' + sortColumns[i][0] + '">' + sortColumns[i][1] + '</option>');
    }
    var orderId = 'order_' + Math.random().toString().substring(2);
    $blockOwner.html('<div class="myleSortFieldWrapper"><button class="myleSortToolButton" role="remove"></button><select data-placeholder="Выберите столбец" name="field[]"><option></option>' + options.join('') + '</select><input type="checkbox" name="order[]" value="desc" class="myleSortCheckbox" id="' + orderId + '"><label for="' + orderId + '" ></label></div>');
    //init component
    $('select ', $sort).select2({
        //placeholder: "Выберите столбец",
        allowClear: true,
        minimumResultsForSearch: -1
    }).on("change", function (e) {
        var $sort = $(this).closest('.myleSortForm');

        dialogSortShowAddButton($sort.attr('id'));
    }).on("select2-open", function (e) {
        var $results = $('#select2-drop .select2-results');

        $results.parent().addClass('myleSortListbox');
    });
    $sort.find('[role=add]').addClass('myleNotvisible');

    $('#' + gridId).jqGrid('setGridParam', {
        sortname: '',
        sortorder: 'asc'
    });
    $('#' + gridId).trigger("reloadGrid");
}

function dialogSortCloseButtonHandler(e) {
    e.preventDefault();

    var $sort = $(this).closest('.myleSortForm');

    $sort.css('top', '');
}

function dialogSortAddBlockHandler(e) {
    e.preventDefault();

    var $this = $(this),
        $sort = $this.closest('[id^=' + idPrefix.sort + ']'),
        $blockOwner = $sort.find('.myleSortBody form'),
        sortColumns = $sort.data('sortColumns'),
        add = true,
        options = [],
        selectedColumns = [];

    $('select[name=field\\[\\]]', $blockOwner).each(function () {
        var field = $(this).val();
        if (field) {
            selectedColumns.push(field);
        } else {
            add = false;
            return;
        }
    });
    /*for(var i=0,l=sortColumns.length;i<l;i++) {
        //if (selectedColumns.indexOf(sortColumns[i][0]) == -1) {
            options.push('<option value="'+sortColumns[i][0]+'">'+sortColumns[i][1]+'</option>');
        //}
    }*/
    if (add && selectedColumns.length < sortColumns.length) {
        for (var i = 0, l = sortColumns.length; i < l; i++) {
            options.push('<option value="' + sortColumns[i][0] + '">' + sortColumns[i][1] + '</option>');
        }
        var orderId = 'order_' + Math.random().toString().substring(2);
        $blockOwner.append('<div class="myleSortFieldWrapper"><button class="myleSortToolButton" role="remove"></button><select data-placeholder="Выберите столбец" name="field[]"><option></option>' + options.join('') + '</select><input type="checkbox" name="order[]" value="desc" class="myleSortCheckbox" id="' + orderId + '"><label for="' + orderId + '" ></label></div>');
        //init component
        $('select ', $sort).select2({
            //placeholder: "Выберите столбец",
            allowClear: true,
            minimumResultsForSearch: -1
        }).on("change", function (e) {
            var $sort = $(this).closest('.myleSortForm');

            dialogSortShowAddButton($sort.attr('id'));
        }).on("select2-open", function (e) {
            var $results = $('#select2-drop .select2-results');

            $results.parent().addClass('myleSortListbox');
        });
    }
    $sort.find('[role=add]').addClass('myleNotvisible');
}

function dialogSortRemoveBlockHandler(e) {
    e.preventDefault();
    var $this = $(this),
        $block = $this.closest('.myleSortFieldWrapper'),
        $dialog = $this.closest('.myleSortForm'),
        dialogId = $dialog.attr('id');

    $block.remove();
    dialogSortShowAddButton(dialogId);
}

function dialogSortShowAddButton(dialogId) {
    var $sort = $('#' + dialogId),
        $blockOwner = $sort.find('.myleSortBody form'),
        $button = $sort.find('[role=add]'),
        sortColumns = $sort.data('sortColumns'),
        selectedColumns = [],
        className = 'myleNotvisible',
        show = true;

    $('select[name=field\\[\\]]', $blockOwner).each(function () {
        var field = $(this).val();
        if (field) {
            selectedColumns.push(field);
        } else {
            show = false;
            return;
        }
    });
    if (show && selectedColumns.length >= sortColumns.length)
        show = false;

    $button[show ? 'removeClass' : 'addClass'](className);
}

function showGridDialog(dbId, title, extData) {
    if (extData === undefined)
        extData = {};

    var regExp = /\{%=([\w_]+)%\}/gi,
        dialogTpl = $('#template-griddialog').html(),
        griddialogId = makeId(dbId, 'griddialog'),
        extId = (extData && extData.id !== undefined) ? extData.id : '',
        gridId = makeId(dbId, 'grid', extId),
        data = {
            id: griddialogId,
            title: title
        };

    // вставляем в плейсхолдеры общего шаблона диалога: id ({%=id%}), заголовок ({%=title%}), контент ({%=content%}) (собственно саму форму)
    dialogTpl = dialogTpl.replace(regExp, function (pattern, m) {
        return anyToString(data[m]);
    });
    $('body').append(dialogTpl);

    //вставляем грид внутрь body
    if (dbId == 1644) {
        insertScheduler($('#' + griddialogId + ' .modal-body'), dbId, extData, title, gridId);
    } else {
        insertGrid($('#' + griddialogId + ' .modal-body'), dbId, extData, title, gridId);
    }

    $('#' + griddialogId).modal({
        backdrop: 'static' // don't close dialog by clicking outside the window
    }).on('hidden.bs.modal', function () {
        // pop callStack
        var callStack = $('#' + griddialogId).data('callStack');
        if (callStack)
            callStack.pop();

        // remove dialog markup
        $('#' + griddialogId).remove();
    });
}

function showGridDialogForm(dbId, title, extData) {
    if (extData === undefined)
        extData = {};
    //dialogTpl = $('#template-griddialog').html(),
    var regExp = /\{%=([\w_]+)%\}/gi,
        dialogTpl = $('#template-dialog').html(),
        griddialogId = makeId(dbId, 'griddialog'),
        extId = (extData && extData.id !== undefined) ? extData.id : '',
        gridId = makeId(dbId, 'grid', extId),
        data = {
            id: griddialogId,
            title: title
        };

    // вставляем в плейсхолдеры общего шаблона диалога: id ({%=id%}), заголовок ({%=title%}), контент ({%=content%}) (собственно саму форму)
    dialogTpl = dialogTpl.replace(regExp, function (pattern, m) {
        return anyToString(data[m]);
    });
    $('body').append(dialogTpl);

    console.log(dbId);
    console.log(extData);
    console.log(title);
    console.log(gridId);

    //вставляем грид внутрь body
    if (dbId == 1644) {
        insertScheduler($('#' + griddialogId + ' .modal-body'), dbId, extData, title, gridId);
    } else {
        var gridData = insertGrid($('#' + griddialogId + ' .modal-body'), dbId, extData, title);
    }
    var gridData = $('#' + griddialogId + ' .ui-jqgrid-btable.ui-common-table');
    return gridData;
}

$(document).on('click', 'span.manager-info', function() {
    var select = $(this).prev().attr('name');
    var value = $('select[name="' + select + '"] :selected').val();
    if(value === undefined) {
        var value = $(this).prev().attr('value');
    }
    var form_id = $(this).prev().attr('eform_id');
    var managerData = showGridDialogForm(form_id, ' ', {id: value});
    setTimeout(function(){
        var managerData = showGridDialogForm(form_id, ' ', {id: value});
        $(managerData[0]).attr("data-name", '');
        showDialog(managerData, false, {tablerowId: "jqg10", recId: value});
    }, 400);
});

$(document).on('keyup', 'input[role=combobox]', function(e) {
    if(e.keyCode == 13) {
       var name = $(this).val();
       var form_id = $('.select2-dropdown-open').next().attr('eform_id');
       var form_field = $('.select2-dropdown-open').next().attr('eform_field');
       if(name === undefined || form_id === undefined) return false;
        showGridDialogForm(form_id, ' ', {id: 1});
        setTimeout(function(){
            var dialogData = showGridDialogForm(form_id, ' ', {id: 1});
            $(dialogData[0]).attr("data-name", name);
            $(dialogData[0]).attr("data-field", form_field);
            $(dialogData[0]).attr("data-form-id", form_id);
            showDialog(dialogData, true);
        }, 400);
        $(".select2-dropdown-open").select2("close");
        $(dialogData[0]).attr("data-name", '');
    }
});

//lookup as autocomplete
$(document).on('change', '#wrapper_Main_CLIENT_ID input[role=lookup]', function(e) {
    var clientID = $(this).val();
    var form_id = $(this).attr('eform_id');
    var dialogData = showGridDialogForm(1758, ' ', {id: clientID});
    setTimeout(function(){
        dialogData = showGridDialogForm(1758, ' ', {id: clientID});
    }, 400);
    console.log(dialogData[0]);
    $('.grid-wrapper[data-grid="1758"] .ui-jqgrid-bdiv table').replaceWith(dialogData[0]);
});

function showImage(image=null) {
    console.log(image);
    var btnCust = '';
    $("#Main_LOGO").fileinput('destroy');

    $("#Main_LOGO").fileinput({
        uploadUrl: "/file-upload-batch/1",
        overwriteInitial: true,
        maxFileSize: 1500,
        showClose: false,
        showCaption: false,
        browseOnZoneClick: true,
        dropZoneEnabled:true,
        removeLabel: '',
        removeIcon: '<i class="glyphicon glyphicon-remove"></i>',
        removeTitle: 'Cancel or reset changes',
        elErrorContainer: '#kv-avatar-errors-2',
        msgErrorClass: 'alert alert-block alert-danger',
        defaultPreviewContent: '<img src="http://plugins.krajee.com/uploads/default_avatar_male.jpg" alt="Your Avatar"><h6 class="text-muted">Click to select</h6>',
        layoutTemplates: {main2: '{preview} ' +  btnCust + ' {remove} {browse}'},
        allowedFileExtensions: ["jpg", "png", "gif"],
        initialPreview: [
            image
        ],
        initialPreviewAsData: true,
        nitialPreviewFileType: 'image'
    });

}