<?php

/**
 * @author JonnyBo
 * @copyright 2020
 */
$xmlstr0 = <<<XML0
<block dir="horizontal" delimiter=" ">
   <field name="teacher_name" caption="tttttttttt" />
   <field name="mobile_phone"/>
   <img src="/img/Asset 6.png">
</block>
XML0;

$xmlstr1 = <<<XML1
<block dir="vertical">
   <field name="mobile_phone" caption="Телефон: " caption_class="mylsThemeBold" class="mylsThemeBold" postcaption=" ffffff" postcaption_class="mylsThemeBold"/>
   <field name="email" caption="Е-мейл: " caption_class="mylsThemeBold" postcaption=" ggggggggg" postcaption_class="hhhhhhhhh"/>
</block>
XML1;

$xmlstr = <<<XML
<block dir="vertical">
   <block dir="horizontal" delimiter=" ">
      <field name="start_date"/>
      <field name="end_date" caption=" - "/>
   </block>
   <field name="teacher_name" caption="переносится на " caption_class="mylsThemeSmallFont"/>
   <block dir="horizontal" delimiter=" " class="mylsThemeSmallFont">
      <field name="mobile_phone"/>
      <field name="email" caption=" - "/>
   </block>
</block>
XML;

?>
<head>
    <link href="css/blockColumn.css" rel="stylesheet">
</head>
<div id="out"></div>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
<script>
	const templates = [<?php echo json_encode($xmlstr0); ?>, <?php echo json_encode($xmlstr1); ?>, <?php echo json_encode($xmlstr); ?>];
	const data = {
		client_id: 238,
		id: 238,
		surname: "Santaren Villafrela",
		name: "Mario",
		//mobile_phone: "55555555555",
		mobile_phone: "",
		email: "mariosv1993@gmail.vom",
		//email: "",
		sys_client_type_id: 1,
		photo: "boy.svg ",
		start_date: "04.06.2018",
		end_date: "10.06.2018",
		branch_name: "Cabanes 40",
		discipline_name: "Español",
		teacher_name: "Mario Santaren Villafrela",
	};

	var info = {
		name: "Преподаватели",
		a: 1,
		v: 1,
		e: 1,
		d: 1,
		formId: 1880,
		tableId: 1879,
		titleField: "",
		importProc: "",
		view: "",
		description: "https://www.manula.com/manuals/myls/myls-school-knowledge-base/1/ru/topic/myls-school-teachers",
		refreshAll: false,
		selParams: [],
		insParams: [],
		updParams: [],
		delParams: [
			{0: "ext_id"},
			{1: "lang"}
		],
		idField: "client_id",
		tableName: "clients",
		tableType: "cards",
	};

	function processField(item) {
		const $item = $(item);
		const dataField = $item.attr("name");

		let value = data[dataField];
		if (value == '' || value == undefined || value == null) {
			$item.remove();
		}

		const classValue = $item.attr("class");
		const caption = $item.attr('caption');
		const postcaption = $item.attr('postcaption');
		if (caption) {
			const captionClass = $item.attr("caption_class");
			if (captionClass && captionClass != classValue)
				value = `<span class="${captionClass}">${caption}</span>` + value;
			else
				value = caption + value;
		}
		if (postcaption) {
			const postcaptionClass = $item.attr("caption_class");
			if (postcaptionClass && postcaptionClass != classValue)
				value += `<span class="${postcaptionClass}">${postcaption}</span>`;
			else
				value += postcaption;
		}
		if (classValue) value = `<span class="${classValue}">${value}</span>`;
		$item.html(value);
	}

	function addDelimetr($tpl) {
		var $block = $($tpl).find('[delimiter]');
		$block.each(() => {
			$(this).children(':not(:first-child)').before(`<delimiter>${$(this).attr('delimiter')}</delimiter>`);
		});
		$block.removeAttr('delimiter');
	}

	function clearCode($tpl) {
		$($tpl).find('block:not([class]), delimiter:not([class]), field').replaceWith(function () {
			return this.childNodes;
		});
		$($tpl).find('block[class]').replaceWith(function () {
			return $(`<span class="${$(this).attr('class')}"></span>`).append(this.childNodes);
		});
	}

	let i = 0;
	for (template of templates) {
		console.time(i);
		let $tpl = $('<div></div>').append($(template));
		$tpl.find("block[dir=vertical]").attr("delimiter", "<br>");
		$.each($tpl.find("field"), (_, item) => {
			processField(item);
		});

		addDelimetr($tpl);
		clearCode($tpl);
		console.timeEnd(i++);
		console.log(template);
		console.log($($tpl).get(0));
		$('#out').append($($tpl));
	}


</script>