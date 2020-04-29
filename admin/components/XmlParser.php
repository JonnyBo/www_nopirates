<?php

namespace app\components;

use Yii;
use yii\base\Component;

/**
 * Парсер xml кастомных столбцов.
 */
class XmlParser extends Component
{

    protected $xmlReader;
    protected $xmlWriter;

    public function __construct()
    {
        $this->xmlReader = Yii::$app->xmlReader;
        $this->xmlWriter = Yii::$app->xmlWriter;
    }

    // Входная функция разбора xml сборного столбца
    public function parseColumn($xml)
    {
        $arr = $this->readXML($xml);
        $template = [];
        //$result = [];
        $this->processColumnParsing($arr, $template);

        //$result['xml'] = $arr;
        //$result['div'] = $template;
        //$result['template'] = $this->writeXML($template);
        return $this->writeXML($template);
    }

    // Читаем xml и конвертируем его в массиа
    private function readXML($xml)
    {
        $this->xmlReader->xml($xml);
        return $this->xmlReader->parse();
    }

    // Читаем массик и конвертируем его в xml
    private function writeXML($arr)
    {
        return $this->processXMLWriting($arr);
    }

    private function processXMLWriting($arr)
    {
        $xml = '';
        foreach ($arr as $value) {
            if (isset($value['name'])) {
                $xml .= '<' . $value['name'];
                if (isset($value['attributes']))
                    foreach ($value['attributes'] as $key => $attr) {
                        $xml .= ' ' . $key . '="' . $attr . '"';
                    }
                $xml .= '>';
                if (isset($value['value']))
                    if (!is_array($value['value']))
                        $xml .= $value['value'];
                    else
                        $xml .= $this->processXMLWriting($value['value']);
                /*foreach ($value['value'] as $v) {

                }*/
                $xml .= '</' . $value['name'] . '>';
            }
        }
        return $xml;
    }


    /**
     * Рекурсивая функция обработки массива шаблона столбца
     * @param $arr текущий элемент массива Values
     * @param $template текущий элемент массива преобразованного шаблона
     */
    private function processColumnParsing($arr, &$template, $dir = 'v')
    {
        if (isset($arr['name'])) {

            $name = strtolower(str_replace('{}', '', $arr['name']));

            switch ($name) {
                case 'block':
                    $t = [];
                    $t['name'] = 'div';
                    $this->processColumnBlock($arr, $t);
                    if (isset($arr['value'])) {
                        $i = 0;
                        foreach ($arr['value'] as $key => $value) {
                            $this->processColumnParsing($value, $t['value'], $t['attributes']['data-dir']);
                            if ($t['attributes']['data-dir'] == 'h' && $t['attributes']['data-delimiter'] != '' && $i < count($arr['value']) - 1) {
                                $delim = [];
                                $delim['name'] = 'span';
                                $delim['value'] = $t['attributes']['data-delimiter'];
                                $delim['attributes']['role'] = 'data-delimiter';
                                $delim['attributes']['delimiter-field'] = $value['attributes']['name'];
                                //$delim['attributes']['delimiter-field'] = $arr['value'][$key + 1]['attributes']['name'];
                                $t['value'][] = $delim;
                            }
                            $i++;
                        }
                    }
                    $template[] = $t;
                    break;
                case 'field':
                    $this->processColumnField($arr, $template, $dir);
                    break;
                default:
                    $this->processColumnHtml($arr, $template, $dir);

            }


            //array_push($template, $t);
            // $template[] = $t;
        }
    }


    /**
     * @param $arr
     * @param $template
     */
    private function processColumnHtml($arr, &$template, $dir)
    {
        $t = [];
        $t['name'] = strtolower(str_replace('{}', '', $arr['name']));
        if (isset($arr['attributes'])) {
            $t['attributes'] = [];

            foreach ($arr['attributes'] as $key => $value) {
                $value = str_replace(['{', '}'], ['$', '$'], $value);
                $t['attributes'][$key] = $value;
            }
        }
        if (isset($arr['value']) && !is_array($arr['value']))
            $t['value'] = $arr['value'];
        if (isset($arr['value']) && is_array($arr['value'])) {
            $t['value'] = [];
            foreach ($arr['value'] as $key => $value) {
                $this->processColumnParsing($value, $t['value'], $dir);
            }
        }
        $template[] = $t;
    }

    /**
     * @param $arr
     * @param $template
     */
    private function processColumnBlock($arr, &$template)
    {
        if (isset($arr['attributes'])) {
            if (isset($arr['attributes']['dir']))
                switch (strtolower($arr['attributes']['dir'])) {
                    case 'vertical':
                        $template['attributes']['data-dir'] = 'v';
                        break;
                    case 'horizontal':
                        $template['attributes']['data-dir'] = 'h';
                        break;
                    case 'multi':
                        $template['attributes']['data-dir'] = 'm';
                        break;
                    default:
                        $template['attributes']['data-dir'] = 'v';
                }
            if (isset($arr['attributes']['class']))
                $template['attributes']['class'] = $arr['attributes']['class'];
            if (isset($arr['attributes']['delimiter']))
                $template['attributes']['data-delimiter'] = str_replace(' ', '&nbsp;', $arr['attributes']['delimiter']);
        } else
            $template['attributes']['data-dir'] = 'v';
    }

    private function processColumnField($arr, &$template, $dir)
    {
        if (isset($arr['attributes'])) {

            // обертка для поля
            //if ($dir == 'v' && (isset($arr['attributes']['caption']) || isset($arr['attributes']['postcaption']))) {
            $t = [];
            $t['name'] = 'span';
            $t['attributes']['role'] = 'field-set';
            if (isset($arr['attributes']['class']))
                $t['attributes']['class'] = $arr['attributes']['class'];
            $t['attributes']['data-for'] = strtolower($arr['attributes']['name']);
            $t['value'] = [];
            $template[] = $t;
            $template = &$template[count($template) - 1]['value'];
            // }

            // префикс для поля
            if (isset($arr['attributes']['caption'])) {
                $t = [];
                $t['name'] = 'span';
                $t['value'] = str_replace(' ', '&nbsp;', $arr['attributes']['caption']);
                if (isset($arr['attributes']['caption_class'])) {
                    $t['attributes']['class'] = $arr['attributes']['caption_class'];
                }
                $t['attributes']['role'] = 'caption';
                //$t['attributes']['caption-for'] = strtolower($arr['attributes']['name']);
                $template[] = $t;
            }

            // значение поля
            $t = [];
            $t['name'] = 'span';
           // if (isset($arr['attributes']['class']))
           //     $t['attributes']['class'] = $arr['attributes']['class'];
            if (isset($arr['attributes']['name'])) {
                $t['attributes']['data-field'] = $arr['attributes']['name'];
                $t['value'] = '$' . strtolower($arr['attributes']['name']) . '$';
            }
            $template[] = $t;

            // постфикс для поля
            if (isset($arr['attributes']['postcaption'])) {
                $t = [];
                $t['name'] = 'span';
                $t['value'] = str_replace(' ', '&nbsp;', $arr['attributes']['postcaption']);
                if (isset($arr['attributes']['postcaption-class'])) {
                    $t['attributes']['class'] = $arr['attributes']['postcaption-class'];
                }
                $t['attributes']['role'] = 'postcaption';
                $template[] = $t;
            }
        }
    }

    // Входная функция разбора xml формы
    public function parseForm($xml)
    {
        $arr = $this->readXML($xml);
        $template = [];
        //$result = [];

        $colCount = 1;
        $this->processFormParsing($arr, $template, $colCount);

        $result['xml'] = $arr;
        $result['template'] = $template;
        //$result['template'] = $this->writeXML($template);


        return $template;
    }

    /**
     * Рекурсивая функция обработки массива шаблона формы
     * @param $arr текущий элемент массива Values
     * @param $template текущий элемент массива преобразованного шаблона
     */
    private function processFormParsing($arr, &$template, $dir = 'vertical', $colCount = 1)
    {
        $curDir = 'vertical';
        if (isset($arr['name'])) {

            $name = strtolower(str_replace('{}', '', $arr['name']));

            switch ($name) {
                case 'form':
                    $t = [];
                    $t['name'] = 'form';
                    $colCount = $this->processItemAttributes($arr, $t);
                    if (isset($arr['attributes']['dir'])) {
                        $t['formtype'] = $arr['attributes']['dir'];
                        $curDir = $t['formtype'];
                    }
                    if (isset($arr['value'])) {
                        foreach ($arr['value'] as $key => $value) {
                            $this->processFormParsing($value, $t['items'], $curDir, $colCount);
                        }
                    }
                    $template[] = $t;
                    break;
                case 'block':
                    $t = [];
                    if (isset($arr['attributes']['dir'])) {
                        $curDir = $arr['attributes']['dir'];
                        if ($curDir == 'tabs') {
                            $t['itemType'] = 'tabbed';
                            $t['tabPanelOptions']['height'] = "100%";
                            $t['tabPanelOptions']['deferRendering'] = false;
                            //$template['scrollingEnabled'] = true;
                            $t['tabPanelOptions']['showNavButtons'] = true;
                            //$template['swipeEnabled'] = false;
                        }
                        if ($curDir == 'group') {
                            $t['itemType'] = 'group';
                        }
                        if ($curDir == 'tab') {
                            $t['itemType'] = 'tab';
                            if (isset($arr['attributes']['tabcontent'])) {
                                $t['tabcontent'] = $arr['attributes']['tabcontent'];
                            } else {
                                $t['tabcontent'] = 'object';
                            }
                        }
                    }
                    if ($curDir == 'group')
                        $colCount = $this->processFormBlockTag($arr, $t, $curDir, $colCount);
                    else
                        $colCount = $this->processFormBlockTag($arr, $t, $dir, $colCount);
                    if (isset($arr['value'])) {
                        foreach ($arr['value'] as $key => $value) {
                            if ($curDir == 'tabs')
                                $this->processFormParsing($value, $t['tabs'], $curDir, $colCount);
                            else
                                if ($dir == 'tabs' || $curDir == 'group')
                                    $this->processFormParsing($value, $t['items'], $curDir, $colCount);
                                else
                                    $this->processFormParsing($value, $template, $curDir, $colCount);
                        }
                    }
                    if (!empty($t))
                        $template[] = $t;
                    break;
                case 'input':
                    $t = [];
                    $this->processFormInputTag($arr, $t, $dir, $colCount);
                    if (!empty($t))
                        $template[] = $t;
                    break;
                case 'button':
                    $t = [];
                    $this->processFormButtonTag($arr, $t);
                    if (!empty($t))
                        $template[] = $t;
                    break;
            }
        }
    }

    private function processItemAttributes($arr, &$template, $colCount = 1)
    {
        if (isset($arr['attributes']['class'])) {
            $template['cssClass'] = $arr['attributes']['class'];
        }
        if (isset($arr['attributes']['colcount'])) {
            $colCount = /*$template['colcount'] =*/
                (int)$arr['attributes']['colcount'];
        }
        if (isset($arr['attributes']['width'])) {
            $template['width'] = $arr['attributes']['width'];
        }
        if (isset($arr['attributes']['height'])) {
            $template['height'] = $arr['attributes']['height'];
        }
        if (isset($arr['attributes']['colspan'])) {
            $template['colSpan'] = (int)$arr['attributes']['colspan'];
        }
        return $colCount;
    }

    private function processFormBlockTag($arr, &$template, $dir, $colCount = 1)
    {
        // Если у группы есть заголовок
        if (isset($arr['attributes']['caption'])) {
            // И это таб
            if ($dir == 'tabs')
                $template['title'] = $arr['attributes']['caption'];
            // Или группа
            if ($dir == 'group')
                $template['caption'] = $arr['attributes']['caption'];
        }
        $colCount = $this->processItemAttributes($arr, $template, $colCount);

        if ($dir == 'tabs') {
            $template['colCount'] = $colCount;
            $template['objectType'] = 'tab';
        }
        if ($dir == 'group') {
            $template['colCount'] = $colCount;
            $template['objectType'] = 'group';
        }
        return $colCount;
    }

    private function processFormInputTag($arr, &$template, $dir, $colCount = 1)
    {
        if (isset($arr['attributes']['class'])) {
            $template['cssClass'] = $arr['attributes']['class'];
        }

        if (isset($arr['attributes']['caption'])/* && $arr['attributes']['caption']*/) {
            $template['label']['text'] = $arr['attributes']['caption'];
        } else
            $template['label']['text'] = '';

        if (isset($arr['attributes']['field'])) {
            $template['dataField'] = strtolower($arr['attributes']['field']);
        }

        if (isset($arr['attributes']['placeholder'])) {
            $template['editorOptions']['placeholder'] = strtolower($arr['attributes']['placeholder']);
        }

        if (isset($arr['attributes']['text'])) {
            $template['text'] = strtolower($arr['attributes']['text']);
        }

        if (isset($arr['attributes']['colcount'])) {
            $template['colSpan'] = (int)$arr['attributes']['colcount'];
        }
        if (isset($arr['attributes']['height'])) {
            $template['height'] = $arr['attributes']['height'];
        }
        if (isset($arr['attributes']['grouped'])) {
            $template['grouped'] = true;
        }
        if (isset($arr['attributes']['type'])) {
            switch (strtolower($arr['attributes']['type'])) {
                case 'empty':
                    $template['itemType'] = 'empty';
                    break;
                case 'string':
                    $template['editorType'] = 'dxTextBox';
                    $template['editorOptions']['showClearButton'] = 'true';
                    $template['editorOptions']['spellcheck'] = 'true';
                    break;
                case 'checkbox':
                    $template['editorType'] = 'dxCheckBox';
                    $template['label']['text'] = '';
                    $template['editorOptions']['text'] = $arr['attributes']['caption'];
                    break;
                case 'date':
                    $template['editorType'] = 'dxDateBox';
                    $template['dataType'] = 'date';
                    $template['editorOptions']['showClearButton'] = 'true';
                    $template['editorOptions']['displayFormat'] = 'shortdate';
                    break;
                case 'datetime':
                    $template['editorType'] = 'dxDateBox';
                    $template['dataType'] = 'datetime';
                    $template['editorOptions']['showClearButton'] = 'true';
                    break;
                case 'time':
                    $template['editorType'] = 'dxDateBox';
                    $template['dataType'] = 'time';
                    $template['editorOptions']['showClearButton'] = 'true';
                    $template['editorOptions']['displayFormat'] = 'HH:mm';
                    break;
                case 'number':
                    $template['editorType'] = 'dxNumberBox';
                    $template['editorOptions']['showClearButton'] = 'true';
                    $template['editorOptions']['format'] = '#,###';
                    break;
                case 'text':
                    $template['editorType'] = 'dxTextArea';
                    $template['editorOptions']['maxHeight'] = '100';
                    //$template['editorOptions']['minHeight'] = '100';
                    $template['editorOptions']['autoResizeEnabled'] = 'true';
                    $template['editorOptions']['spellcheck'] = 'true';
                    break;
                case 'lookup':
                    $template['editorType'] = 'dxLookup';
                    $template['editorOptions']['valueExpr'] = 'id';
                    $template['editorOptions']['displayExpr'] = 'item';
                    $template['editorOptions']['usePopover'] = 'false';
                    $template['editorOptions']['showPopupTitle'] = 'false';
                    $template['editorOptions']['showClearButton'] = 'true';
                    break;
                case 'radio':
                    $template['editorType'] = 'dxRadioGroup';
                    $template['editorOptions']['valueExpr'] = 'id';
                    $template['editorOptions']['displayExpr'] = 'item';
                    $template['editorOptions']['layout'] = isset($arr['attributes']['layout']) ? $arr['attributes']['layout'] : 'horizontal';

                    break;
                case 'select':
                    $template['editorType'] = 'dxSelectBox';
                    $template['editorOptions']['valueExpr'] = 'id';
                    $template['editorOptions']['displayExpr'] = 'item';
                    $template['editorOptions']['showClearButton'] = 'true';
                    break;
                case 'boxedit':
                case 'tagbox':
                    $template['objectType'] = 'tagbox';
                    break;
                case 'list':
                    $template['objectType'] = 'list';
                    break;
                case 'label':
                    $template['objectType'] = 'label';
                    break;
                case 'colorbox':
                    $template['objectType'] = 'colorbox';
                    break;
                case 'treeview':
                    $template['objectType'] = 'treeview';
                    break;
                case 'grid':
                    $template['objectType'] = 'grid';
                    break;
                case 'cards':
                    $template['objectType'] = 'cards';
                    break;
                case 'dashboard':
                    $template['objectType'] = 'dashboard';
                    break;
                case 'tree':
                    $template['objectType'] = 'tree';
                    break;
                case 'image':
                    $template['objectType'] = 'image';
                    break;
                case 'file':
                    $template['objectType'] = 'file';
                    break;
                case 'documents':
                    $template['objectType'] = 'documents';
                    break;
                case 'chart':
                    $template['objectType'] = 'chart';
                    break;
                case 'kanban':
                    $template['objectType'] = 'kanban';
                    break;
                case 'buttongroup':
                    $template['objectType'] = 'buttongroup';
                    break;
                case 'scheduler':
                    $template['objectType'] = 'scheduler';
                    break;
                case 'pivot':
                    $template['objectType'] = 'pivot';
                    break;
                case 'html':
                    $template['objectType'] = 'html';
                    break;
                case 'layout':
                    $template['objectType'] = 'layout';
                    break;
            }
        }
    }

    private function processFormButtonTag($arr, &$template)
    {
        $template['label']['text'] = '';

        if (isset($arr['attributes']['class'])) {
            $template['cssClass'] = $arr['attributes']['class'];
        }

        if (isset($arr['attributes']['caption'])) {
            $template['caption'] = $arr['attributes']['caption'];
        }

        if (isset($arr['attributes']['field'])) {
            $template['dataField'] = strtolower($arr['attributes']['field']);
        }

        if (isset($arr['attributes']['height'])) {
            $template['height'] = $arr['attributes']['height'];
        }
        if (isset($arr['attributes']['width'])) {
            $template['width'] = $arr['attributes']['width'];
        }
        if (isset($arr['attributes']['openform'])) {
            $parts = explode(';', $arr['attributes']['openform']);
            if (isset($parts[0]))
                $template['openForm']['tableId'] = $parts[0];
            if (isset($parts[1]))
                $template['openForm']['extId'] = $parts[1];
            if (isset($parts[2]))
                $template['openForm']['errorMsg'] = $parts[2];
            if (isset($parts[3]))
                $template['openForm']['reload'] = $parts[3];
        }
        if (isset($arr['attributes']['openreport'])) {
            $parts = explode(';', $arr['attributes']['openreport']);
            if (isset($parts[0]))
                $template['openReport']['reportId'] = $parts[0];
            if (isset($parts[1])) {
                $params = explode(',',$parts[1]);
                $template['openReport']['params'] = [];
                foreach($params as $param) {
                    $template['openReport']['params'][$param] = $param;
                }
            }
        }
        if (isset($arr['attributes']['execproc'])) {
            $parts = explode(';', $arr['attributes']['execproc']);
            if (isset($parts[0]))
                $template['execProc']['proc'] = $parts[0];
            if (isset($parts[1]))
                $template['execProc']['reload'] = $parts[1];
        }
        $template['objectType'] = 'button';
    }


    public function parsePivot($xml)
    {
        $xml = simplexml_load_string($xml);
        $json = json_encode($xml);
        $json = str_replace('@attributes', 'attributes', $json);
        $array = json_decode($json, TRUE);
        return $array;
    }

    public function parseDashboard($xml)
    {
        $arr = $this->readXML($xml);
        $template = [];
        $this->processLayoutParsing($arr, $template, $arr['attributes']['dir']);
        return json_encode($template);
    }

    /**
     * Рекурсивая функция обработки массива шаблона dashboard
     * @param $arr текущий элемент массива Values
     * @param $template текущий элемент массива преобразованного шаблона
     */
    private function processLayoutParsing($arr, &$template, $dir)
    {
        if (!$dir) $dir = 'vertical';
        if (isset($arr['name'])) {

            $name = strtolower(str_replace('{}', '', $arr['name']));

            switch ($name) {
                case 'block':
                    $t = [];
                    //$t['content'] = [];
                    //$t['type'] = $dir == 'v'?'column':'row';
                    switch ($dir) {
                        case 'vertical':
                            $t['type'] = 'column';
                            break;
                        case 'horizontal':
                            $t['type'] = 'row';
                            break;
                        case 'tabs':
                            $t['type'] = 'stack';
                            break;
                        //default:
                            //$t['type'] = 'column';

                    }
                    if ($arr['attributes']['style']) $t['style'] = $arr['attributes']['style'];
                    if ($arr['attributes']['class']) $t['class'] = $arr['attributes']['class'];
                    //$this->processColumnBlock($arr, $t);
                    if (isset($arr['value'])) {
                        $i = 0;
                        foreach ($arr['value'] as $key => $value) {
                            $this->processLayoutParsing($value, $t['content'], $value['attributes']['dir']);
                            $i++;
                        }
                    }
                    $template[] = $t;
                    break;
                case 'field':
                    $t = [];
                    $t['type'] = 'component';
                    $t['componentName'] = $arr['attributes']['name'];
                    //$t['componentName'] = 'layout';
                    $t['title'] = $arr['attributes']['caption'];
                    if ($arr['attributes']['width']) $t['width'] = $arr['attributes']['width'];
                    if ($arr['attributes']['style']) $t['style'] = $arr['attributes']['style'];
                    if ($arr['attributes']['class']) $t['class'] = $arr['attributes']['class'];
                    if ($arr['attributes']['height']) $t['height'] = $arr['attributes']['height'];
                    if ($arr['attributes']['close']) $t['isClosable'] = $arr['attributes']['close'];
                    $template[] = $t;
                    break;
            }


            //array_push($template, $t);
            // $template[] = $t;
        }
    }

    private function createSrartBlock($attr) {
        $res = '<div';
        foreach($attr as $key => $val) {
            if ($key == 'class')
                $res .= ' '.$key.'="'.$val.'"';
            else
                $res .= ' data-'.$key.'="'.$val.'"';
        }
        $res .= '>$$content$$</div>';
        return $res;
    }

    private function createElement($field, $tag) {
        //print_r($field->attributes());
        $result = '<' . $tag;
        if ($field->attributes()->{'class'}) {
            $result .= ' class="' . $field->attributes()->{'class'} . '"';
        }

        //if (count($field->attributes()) > 1) {
        if ($field->attributes()->{'caption'}) {
            $result .= ' data-caption="' . $field->attributes()->{'caption'} . '"';
            //echo $field->attributes()->{'class'} . ' - ' . $field->attributes()->{'caption_class'};
            if ($field->attributes()->{'caption_class'} && ($field->attributes()->{'class'} != $field->attributes()->{'caption_class'})) {
                //$result .= '<span class="' . $field->attributes()->{'caption_class'} . '">' . $field->attributes()->{'caption'} . '</span>';
                $result .= ' data-caption_class="' . $field->attributes()->{'caption_class'} . '"';
            }
        }
        if ($field->attributes()->{'postcaption'}) {
            $result .= ' data-caption="' . $field->attributes()->{'postcaption'} . '"';
            if ($field->attributes()->{'postcaption_class'} && ($field->attributes()->{'class'} != $field->attributes()->{'postcaption_class'})) {
                //$result .= '<span class="' . $field->attributes()->{'postcaption_class'} . '">' . $field->attributes()->{'postcaption'} . '</span>';
                $result .= ' data-postcaption_class="' . $field->attributes()->{'postcaption_class'} . '"';
            }
        }

        //}
        $result .= '>';
        $result .= '$' . strtolower($field->attributes()->{'name'}) . '$';


        $result .= '</' . $tag . '>';
        return $result;
    }

    private function createObject($object, $tag) {
        $result = '<' . $tag;
        $result .= $object;
        $result .= '</' . $tag . '>';
        return $result;
    }

    private function createBlock($block) {
        $result = '';
        $tag = 'div';
        $result .= '<div';
        foreach($block->attributes() as $key => $val) {
            $result .= ' data-'.$key.'="'.$val.'"';
            if ($key == 'dir' && $val == 'horizontal') {
                $tag = 'span';
            }
        }
        $result .= '>';
        foreach($block as $key => $bb) {
            if ($key == 'field')
                $result .= $this->createElement($bb, $tag);
            elseif ($key == 'block')
                $result .= $this->createBlock($bb);
            else
                $result .= $this->createObject($bb, $tag);
        }
        $result .= '</div>';
        return $result;
    }

    public function parseXML ($xml, $tag) {
        $result = '';
        foreach($xml as $key => $val) {
            switch($key) {
                case 'block':
                    $result .= $this->createBlock($val);
                    break;
                case 'field':
                    $result .= $this->createElement($val, $tag);
                    break;
                default:
                    $result .= $this->createObject($val, $tag);
                    break;
            }
        }
        return $result;
    }

    public function getXmlTemplate($xmlstr) {
        $result = '';
        $tag = 'div';
        $xml = simplexml_load_string($xmlstr);
        if ($xml->attributes()->{'dir'} == 'vertical' && count($xml->attributes()) == 1) {
            //не формируем верхний див
            $tag = 'div';
            $result = $this->parseXML($xml, $tag);
        } else {
            //формируем верхний тег
            if ($xml->attributes()->{'dir'} == 'horizontal') {
                $tag = 'span';
            }
            $result = $this->createSrartBlock($xml->attributes());
            $result = str_replace('$$content$$', $this->parseXML($xml, $tag), $result);
        }
        return $result;
    }
}
