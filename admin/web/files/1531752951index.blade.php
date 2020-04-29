<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>@php
               if(!empty($prod_page)) {
                   if(!empty($product->page_name)) echo $product->page_name;
                   else {
                        if($product->course_sort == 1) {
                           echo $product->name.": ";
                           foreach($course_types as $course_type) {
                                foreach($product->courseTypes as $prod_course_type) {
                                    if($prod_course_type->pivot->course_type_id == $course_type->id AND $course_type->type == "course") {
                                       echo $course_type->name . ', ';
                                    }
                                }
                           }
                           echo " описание, стоимость, отзывы | Education & Travel";
                        }
                        else if($product->course_sort == 2) {
                            $i = 0;
                            foreach($catalogue_section_course as $catalogue_sec) {
                                if(!empty($product_catalogues)) {
                                    foreach($product_catalogues as $prod_cat) {
                                        if($catalogue_sec->id == $prod_cat->catalogue_id AND $i == 0) {
                                            $country_title = $catalogue_sec->title_name;
                                            $i++;
                                        }
                                    }
                                } else $country_title = "";
                            }
                            echo $product->name . ": Среднее образование " . $country_title . " по стоимости учебных заведений  | Education & Travel";
                        }
                        else if($product->course_sort == 3) {
                            $i = 0;
                            foreach($catalogue_section_course as $catalogue_sec) {
                                if(!empty($product_catalogues)) {
                                    foreach($product_catalogues as $prod_cat) {
                                        if($catalogue_sec->id == $prod_cat->catalogue_id AND $i == 0) {
                                            $country_title = $catalogue_sec->title_name;
                                            $i++;
                                        }
                                    }
                                } else $country_title = "";
                            }
                            echo $product->name . ": Высшее образование " . $country_title . " по стоимости учебных заведений  | Education & Travel";
                        }
                   }
               }
                else if(!empty($index_page->page_name)) echo $index_page->page_name;
                else if(!empty($courses->page_name)) echo $courses->page_name;
                else if(!empty($course->page_name)) echo $course->page_name;
                else if(!empty($language->page_name)) echo $language->page_name;
                else if(!empty($country->page_name)) echo $country->page_name;
                else if(!empty($page->page_name)) echo $page->page_name;
        @endphp</title>
    <meta name="description" content="@php
            if(!empty($prod_page)) {
               if(!empty($product->meta_desc)) {
                    echo $product->meta_desc;
                }
                else {
                    if(!empty($page_text[6]->title)) $number_1 = $page_text[6]->title;
                    if(!empty($page_text[7]->title)) $number_2 = $page_text[7]->title;
                    if(!empty($page_text[8]->title)) $numebr_3 = $page_text[8]->title;
                
                    if($product->course_sort == 1)  echo $product->name. " и другие языковые школы за рубежом c компанией Education & Travel, ✓ Консультации ✓ Подбор  ✓Звоните по ☎ (044) 596-18-23, ☎ (097) 721-60-83, ☎ (066) 440-01-52";
                    else if($product->course_sort == 2) echo $product->name, ", Среднее образование за рубежом ✓ Консультации ✓ Подбор учебных заведений ✓ Помощь в поступлении ✓Звоните по ☎ (044) 596-18-23 ☎ (097) 721-60-83, ☎ (066) 440-01-52";
                    else if($product->course_sort == 3) echo $product->name, ", Высшее образование за рубежом ✓ Консультации ✓ Подбор учебных заведений ✓ Помощь в поступлении ✓Звоните по ☎ (044) 596-18-23 ☎ +38 050 593-23-92 ☎ +38 066 440-01-52";
                }
            }
            else if(!empty($index_page->meta_desc)) echo $index_page->meta_desc;
            else if(!empty($courses->meta_desc)) echo $courses->meta_desc;
            else if(!empty($course->meta_desc)) echo $course->meta_desc;
            else if(!empty($language->meta_desc)) echo $language->meta_desc;
            else if(!empty($country->meta_desc)) echo $country->meta_desc;
            else if(!empty($page->meta_desc)) echo $page->meta_desc;
    @endphp" />
    @if(isset($_GET['page']))<meta name="robots" content="noindex"/> @endif
    
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" type="text/css" href="{{asset('css/bootstrap.css')}}" />
    <link rel="stylesheet" type="text/css" href="//fonts.googleapis.com/css?family=Lato" />

    <link rel="stylesheet" type="text/css" href="{{asset('css/font-awesome.min.css')}}" />
    <link rel="stylesheet" type="text/css"  href="{{asset('css/slick.css')}}" />
    <link rel="stylesheet" type="text/css" href="{{asset('css/slick-theme.css')}}" />
    <link rel="stylesheet" type="text/css" href="{{asset('css/nice-select.css')}}" />
    <link rel="stylesheet" type="text/css"  href="{{asset('css/styles.css')}}" />
    <link rel="stylesheet" type="text/css"  href="{{asset('css/print.css')}}" />
    <link rel="stylesheet" type="text/css"  href="{{asset('css/media.css')}}"/>
    <link rel="stylesheet" type="text/css"  href="{{asset('css/fotorama.css')}}"/>
    <link rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
    @stack('css')
</head>
<body>
@if(!empty($other_text_education))
<div id='seoTextWidget' style="display: none;">
    @if(!empty($other_text_education->main_image))
        @if(!empty($other_text_education->main_title))
            <h1 class="h2-main">{{$other_text_education->main_title}}</h1>
        @endif
        <div class="col-md-5 about-inner-img" style="margin-right: 15px;">
            <div class="about-img">
                <img src="{{asset('img/other_images/'.$other_text_education->main_image)}}" alt="about" class="img-responsive" />
            </div>
        </div>
        <div class="about-inner-text" style="width: 100%;">
            @if(!empty($other_text_education->text))
                @php echo htmlspecialchars_decode(stripslashes($other_text_education->text)) @endphp
            @endif
        </div>
    @else
        @if(!empty($other_text_education->main_title))
            <h1 class="h2-main">{{$other_text_education->main_title}}</h1>
        @endif
        @if(!empty($other_text_education->text))
            @php echo htmlspecialchars_decode(stripslashes($other_text_education->text)) @endphp
        @endif
    @endif
</div>
@endif
<div class="main">
<div class="header-all">
    <div class="top-nav">
        <div class="container">
            <div class="row">
                <div class="top-nav-inner">
                     <div class="fast-links">
                        <ul>
                             @if(!empty($pages))
                                 @foreach($pages as $page)
                                    <li><a href="{{url('/'.$page->url)}}" class="@if(!empty($page->class_name)){{$page->class_name}}@endif">{{$page->page_name}}</a></li>
                                @endforeach
                            @endif
                        </ul>
                    </div>
                    @if(!empty($share_buttons))
                        @if(count($share_buttons) > 0)
                            <div class="social-links">
                                <ul>
                                    @foreach($share_buttons as $share_button)
                                        <li><a href="{{$share_button->link}}" target="_blank"><i class="{{$share_button->class}}"></i></a></li>
                                    @endforeach
                                </ul>
                            </div>
                        @endif
                    @endif
                    <div class="top-nav-right">
                        <div class="localization" style="display: none;">
                            <div class="flag rus-flag">
                                <a href="#">
                                    <i>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </i>
                                РУС</a>
                            </div>
                            <div class="flag ukr-flag">
                                <a href="#">
                                    <i>
                                        <span></span>
                                        <span></span>
                                    </i>
                                УКР</a>
                            </div>
                        </div>
                        <div class="profile">
                            @if(!Auth()->user())
                            <a href="#" data-toggle="modal" data-target="#LogIn"> Вход</a>
                            @else
                                @if(Auth()->user()->role == 'admin')
                                    <a href="{{url('foo-table')}}"><i></i> Мой кабинет</a>
                                @else
                                    <a href="{{url('cabinet')}}"><i></i> Мой кабинет</a>
                                @endif    
                            <a href="{{ route('logout') }}"  onclick="event.preventDefault();
                                                     document.getElementById('logout-form').submit();">
                             Выход</a>
                                            <form id="logout-form" action="{{ route('logout') }}" method="POST" style="display: none;">
                                            {{ csrf_field() }}
                                            </form>
                            @endif
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    </div>
<div class="container">
    <div class="row">
        <div class="header">
            <div class="header-phone">
                <ul>
                    @if(!empty($page_text[6]->title))<li>{{$page_text[6]->title}}@endif
                    @if(!empty($page_text[7]->title))<li>{{$page_text[7]->title}}@endif
                    @if(!empty($page_text[8]->title))<li>{{$page_text[8]->title}}</li>@endif
                </ul>
            </div>
            <div class="consalting">
                <a href="#faq" class="button anchor">заказать консультацию</a>
            </div>
            <div class="mob-menu" data-toggle="modal" data-target="#MobModal">
                <div></div>
            </div>
            <div class="logo">
               <a href="{{ url('/') }}"> <img src="{{asset('img/logo.png')}}" alt="logo"/></a>
            </div>
            <div class="print_logo">
                <img src="{{asset('img/logo.png')}}" alt="logo"/>
            </div>
        </div>
    </div>
</div>
<div class="search-mobile-menu">
    <div class="container">
        <div class="row">
            <div class="search-mobile-menu-inner">
                    <div class="search-inner">
                        <form action="" method="get">
                            <input name="search" placeholder="Введите название курса или страну" required="" type="search">
                            <a href="#" class="fa fa-search"></a>
                        </form>
                 </div>
                 <div class="consalting">
                    <a href="#faq" class="button anchor">заказать консультацию</a>
                </div>
            </div>
            <div class="drop-menu col-md-12 search-list" style="display: none; width: 100%; left: 0;">
                <ul class="col-md-12" style="padding: 0;">
                    <li class="dropdown-submenu">

                    </li>
                </ul>
            </div>
        </div>
    </div>    
</div>
<div class="nav hidden-mobile">
    <div class="container-fluid">
        <div class="container">
            <div class="row">
                @php
                 $path_url = Request::path();
                 $uri_parts = explode('/', $path_url);
                 $path_url = $uri_parts[0];
                @endphp
                <ul class="nav-menu">
                    <li class="drop-link language-link language-link-first @if(!empty($courses_url[0]['url'])) {{ $courses_url[0]['url'] == $path_url ? 'active-menu' : '' }} @endif">
                        <a class="icon-slide" data-id="@if(!empty($courses_url[0]['id'])){{$courses_url[0]['id']}}@endif" href="@if(!empty($courses_url[0]['url'])) {{ url('/'.$courses_url[0]['url']) }} @endif">@if(!empty($courses_url[0]['name'])) {{$courses_url[0]['name']}} @endif<i class="fa fa-chevron-down"></i></a>
                        <div class="drop-menu col-md-12" style="width: 200px;">
                            @php
                                $catalogueLeft = array();
                                $catalogueRight = array();
                            @endphp 
                            @if(!empty($language_url))
                                @foreach($language_url as $keys=>$cat)
                                    @if ($keys % 2 == 0)
                                        @php $catalogueLeft[$cat['chpu']] = $cat['name']; @endphp
                                    @else
                                        @php $catalogueLeft[$cat['chpu']] = $cat['name']; @endphp
                                    @endif
                                @endforeach
                            @endif
                            @if(!empty($catalogueLeft))
                                 <ul class="col-md-12" style="padding: 0;">
                                    @foreach($catalogueLeft as $key=>$cat)
                                        <li class="dropdown-submenu">
                                            <a href="{{ url('/'.$courses_url[0]['url'].'/'.$key) }}">{{$cat}}</a>
                                            <ul class="dropdown-menu" style="background: #0ebed9;">
                                                @php
                                                    $langs = \App\LanguageSection::where('chpu', $key)->first();
                                                    $countries = \App\CatalogueSection::where('language_id',$langs->id)->orderBy('name', 'ASC')->where('active', '1')->get();
                                                @endphp
                                                @if(!empty($countries))
                                                    @foreach($countries as $keys)
                                                        <li><a href="{{ url('/'.$courses_url[0]['url'].'/'.$key.'/'.$keys->chpu) }}" tabindex="" href="#">{{$keys->name}}</a></li>
                                                    @endforeach
                                                @endif
                                            </ul>
                                        </li>
                                    @endforeach
                                </ul>
                            @endif
                        </div>
                    </li>
                      @if(!empty($courses_url))
                        @php $na = 0; @endphp
                        @php $nu = 0; @endphp
                        @foreach($courses_url as $keys)
                            @if($keys->id == 2)
                                <li class="drop-link language-link {{ $keys->url == $path_url ? 'active-menu' : '' }}">
                                    <a class="icon-slide" data-id="{{$keys->id}}" href="{{ url('/' . $keys->url) }}">{{ $keys->name }} <i class="fa fa-chevron-down"></i></a>
                                    <div class="drop-menu col-md-12">
                                        @php
                                            $catalogueLeft = array();
                                            $catalogueRight = array();
                                        @endphp
                                        @if(!empty($catalogue_section_course))
                                            @foreach($catalogue_section_course as $key=>$cat)
                                                @if($cat['course_id'] == $keys->id)
                                                    @php $na++; @endphp
                                                    @if ($na % 2 != 0)
                                                        @php $catalogueLeft[$cat['chpu']] = $cat['name']; @endphp
                                                    @else
                                                        @php $catalogueRight[$cat['chpu']] = $cat['name']; @endphp
                                                    @endif
                                                @endif
                                            @endforeach
                                        @endif
                                        @if(!empty($catalogueLeft))
                                            <ul class="col-md-6">
                                                @foreach($catalogueLeft as $key=>$cat)
                                                    <li><a href="{{ url('/'.$keys->url.'/'.$key) }}">{{$cat}}</a></li>
                                                @endforeach
                                            </ul>
                                        @endif
                                        @if(!empty($catalogueRight))
                                            <ul class="col-md-6">
                                                @foreach($catalogueRight as $key=>$cat)
                                                    <li><a href="{{ url('/'.$keys->url.'/'.$key) }}">{{$cat}}</a></li>
                                                @endforeach
                                            </ul>
                                        @endif
                                    </div>
                                </li>
                            @endif
                        @endforeach
                         @foreach($courses_url as $keys)
                            @if($keys->id == 3)
                                <li class="drop-link language-link {{ $keys->url == $path_url ? 'active-menu' : '' }}">
                                    <a class="icon-slide" data-id="{{$keys->id}}" href="{{ url('/' . $keys->url) }}">{{ $keys->name }} <i class="fa fa-chevron-down"></i></a>
                                    <div class="drop-menu col-md-12">
                                        @php
                                            $catalogueLeft = array();
                                            $catalogueRight = array();
                                        @endphp
                                        @if(!empty($catalogue_section_course))
                                            @foreach($catalogue_section_course as $key=>$cat)
                                                @if($cat['course_id'] == $keys->id)
                                                    @php $nu++; @endphp
                                                    @if ($nu % 2 != 0)
                                                        @php $catalogueLeft[$cat['chpu']] = $cat['name']; @endphp
                                                    @else
                                                        @php $catalogueRight[$cat['chpu']] = $cat['name']; @endphp
                                                    @endif
                                                @endif
                                            @endforeach
                                        @endif
                                        @if(!empty($catalogueLeft))
                                            <ul class="col-md-6">
                                                @foreach($catalogueLeft as $key=>$cat)
                                                    <li><a href="{{ url('/'.$keys->url.'/'.$key) }}">{{$cat}}</a></li>
                                                @endforeach
                                            </ul>
                                        @endif
                                        @if(!empty($catalogueRight))
                                            <ul class="col-md-6">
                                                @foreach($catalogueRight as $key=>$cat)
                                                    <li><a href="{{ url('/'.$keys->url.'/'.$key) }}">{{$cat}}</a></li>
                                                @endforeach
                                            </ul>
                                        @endif
                                    </div>
                                </li>
                            @endif
                        @endforeach
                    @endif
                     <li class="drop-link hidden-tablet-lg {{ 'country' == $path_url ? 'active-menu' : '' }}"><a href="#">страны <i  class="fa fa-chevron-down"></i></a>
                        <div class="drop-menu col-md-12">
                             @php
                                    $catalogueLeft = array();
                                    $catalogueRight = array();

                                    @endphp
                                    @if(!empty($catalogue_section))
                                    @foreach($catalogue_section as $key=>$cat)
                                        @if ($key % 2 == 0)
                                            @php $catalogueLeft[$cat['chpu']] = $cat['name']; @endphp
                                        @else
                                            @php $catalogueRight[$cat['chpu']] = $cat['name']; @endphp
                                        @endif
                                    @endforeach
                                    @endif
                                    @if(!empty($catalogueLeft))
                                    <ul class="col-md-6">
                                        @foreach($catalogueLeft as $key=>$cat)
                                            <li><a href="{{ url('country/'.$key) }}">{{$cat}}</a></li>
                                        @endforeach
                                    </ul>
                                    @endif
                                    @if(!empty($catalogueRight))
                                    <ul class="col-md-6">
                                       @foreach($catalogueRight as $key=>$cat)
                                            <li><a href="{{ url('country/'.$key) }}">{{$cat}}</a></li>
                                        @endforeach
                                     </ul>
                                    @endif
                       </div>
                     </li>            
                     <!--<li class="hidden-tablet-lg"><a href="{{ url('/faq') }}">FAQ</a></li>-->
                     <li class="hidden-tablet-lg {{ 'feedbacks' == $path_url ? 'active-menu' : '' }}"><a href="{{ url('/feedbacks') }}">отзывы</a></li>
                     <li class="search-inner hidden-tablet-lg">
                        <form action="" method="get">
                            <input name="search" placeholder="Введите название курса или страну" required="" type="search">
                            <a href="#" class="fa fa-search"></a>
                            <div class="drop-menu col-md-12 search-list" style="display: none; width: 100%; left: 0;">
                                <ul class="col-md-12">
                                    <li class="dropdown-submenu">

                                    </li>
                                </ul>
                            </div>
                        </form>
                     </li>
                     <li class="tablet-menu">
                         <div class="mob-menu-tablet" data-toggle="modal" data-target="#TabletModal">
                            <div></div>
                        </div>
                    </li>
                </ul>   
            </div>
        </div>
    </div>
</div>
</div>
        @if(isset($errors))
            @if (count($errors) > 0)
                    <div class="alert alert-danger">
                        <strong>Whoops!</strong> There were some problems with your input.<br><br>
                        <ul>
                            @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
            @endif
        @endif

        @yield('content')
  <div class="footer">
    <div class="container-fluid">
        <div class="container">
            <div class="row footer-inner">
                <div class="col-md-6 footer-inner-1">
                    <div class="col-xs-6 copy-inner">
                        <p class="copy"><a href="eductravel.com.ua">eductravel.com.ua</a> © 2016 - 2019</p>
                        @if(!empty($share_buttons))
                            @if(count($share_buttons) > 0)
                                <div class="social-links">
                                    <ul>
                                        @foreach($share_buttons as $share_button)
                                            <li><a href="{{$share_button->link}}" target="_blank"><i class="{{$share_button->class}}"></i></a></li>
                                        @endforeach
                                    </ul>
                                </div>
                            @endif
                        @endif
                    </div>
                </div>
                <div class="col-md-6 footer-inner-2">
                <div class="row footer-list">
                    <div class="col-md-6 col-xs-6 footer-list-1">
                        <ul>
                            <li><a href="@if(!empty($courses_url[0]['url'])) {{ url('/'.$courses_url[0]['url']) }} @endif">@if(!empty($courses_url[0]['name'])) {{$courses_url[0]['name']}} @endif</a></li>
                            <li><a href="@if(!empty($courses_url[1]['url'])) {{ url('/'.$courses_url[1]['url']) }} @endif">@if(!empty($courses_url[1]['name'])) {{$courses_url[1]['name']}} @endif</a></li>
                            <li><a href="@if(!empty($courses_url[2]['url'])) {{ url('/'.$courses_url[2]['url']) }} @endif">@if(!empty($courses_url[2]['name'])) {{$courses_url[2]['name']}} @endif</a></li>
                        </ul>
                    </div>
                    <div class="col-md-3 footer-list-2" style="display: none;">
                        <ul>
                            <li><a href="#">Страны</a></li>
                            <li><a href="#">Отзывы</a></li>
                            <li><a href="#">FAQ</a></li>
                        </ul>
                    </div>
                    <div class="col-md-3 footer-list-3">
                        <ul>
                            @if(!empty($pages))
                                 @php $i = 0; @endphp
                                 @foreach($pages as $page)
                                    <li><a href="{{url('/'.$page->url)}}">{{$page->page_name}}</a></li>
                                    @php
                                        $i++;
                                        if($i == 3) {
                                             break;
                                        }
                                    @endphp
                                @endforeach
                            @endif
                        </ul>
                    </div>
                </div>
                </div>
            </div>
        </div>
    </div>
</div>
</div>

<div class="mob-menu-inner-mobile modal fade" id="MobModal" role="dialog" tabindex="-1">
    <button type="button" class="close" data-dismiss="modal" aria-hidden="true"><i class="fa fa-times"></i></button>
    <div class="modal-dialog" role="document">
        <ul class="mob-menu-list">
            <li><a href="@if(!empty($courses_url[0]['url'])) {{ url('/'.$courses_url[0]['url']) }} @endif">@if(!empty($courses_url[0]['name'])) {{$courses_url[0]['name']}} @endif</a></li>
            <li><a href="@if(!empty($courses_url[1]['url'])) {{ url('/'.$courses_url[1]['url']) }} @endif">@if(!empty($courses_url[1]['name'])) {{$courses_url[1]['name']}} @endif</a></li>
            <li><a href="@if(!empty($courses_url[2]['url'])) {{ url('/'.$courses_url[2]['url']) }} @endif">@if(!empty($courses_url[2]['name'])) {{$courses_url[2]['name']}} @endif</a></li>
            <li class="dropdown">
              <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Страны <i  class="fa fa-chevron-down"></i></a>
              <ul class="dropdown-menu">
                  @if(!empty($catalogue_section))
                      @foreach($catalogue_section as $cat)
                        <li><a href="{{ url('country/'.$cat->chpu) }}">{{$cat->name}}</a></li>
                      @endforeach
                  @endif
              </ul>
            </li>
            <li><a href="#" style="display: none;">FAQ</a></li>
            <li><a href="{{ url('/feedbacks') }}">отзывы</a></li>
            <li><a href="#" style="display: none;">Все услуги</a></li>
             @if(!empty($pages))
                 @foreach($pages as $page)
                    <li><a href="{{url('/'.$page->url)}}">{{$page->page_name}}</a></li>
                @endforeach
             @endif
        </ul>
        <div class="localization" style="display: none;">
            <div class="flag rus-flag">
                <a href="#">
                    <i>
                        <span></span>
                        <span></span>
                        <span></span>
                    </i>
                РУС</a>
            </div>
            <div class="flag ukr-flag">
                <a href="#">
                    <i>
                        <span></span>
                        <span></span>
                    </i>
                УКР</a>
            </div>
        </div>
    </div>
</div>
<div class="mob-menu-inner-tablet modal fade" id="TabletModal" role="dialog" tabindex="-1">
    <button type="button" class="close" data-dismiss="modal" aria-hidden="true"><i class="fa fa-times" aria-hidden="true"></i></button>
    <div class="modal-dialog" role="document">
        <ul class="mob-menu-list">
            <li class="dropdown">
              <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Страны <i  class="fa fa-chevron-down"></i></a>
              <ul class="dropdown-menu">
                  @if(!empty($catalogue_section))
                      @foreach($catalogue_section as $cat)
                        <li><a href="{{ url('country/'.$cat->chpu) }}">{{$cat->name}}</a></li>
                      @endforeach
                  @endif
              </ul>
            </li>
            <li><a href="#" style="display: none;">FAQ</a></li>
            <li><a href="{{ url('/feedbacks') }}">отзывы</a></li>
            <li><a href="#" style="display: none;">Все услуги</a></li>
            @if(!empty($pages))
                 @foreach($pages as $page)
                    <li><a href="{{url('/'.$page->url)}}">{{$page->page_name}}</a></li>
                @endforeach
            @endif
            <li class="mobile-search">
                <a href="#"><i class="fa fa-search"></i>Поиск</a>
                <form action="" method="get" id="mobile-search-form" style="display: none;">
                    <input name="search" placeholder="Введите название курса или страну" required="" type="search" class="search-input">
                    <div class="drop-menu col-md-12 search-list" style="display: none; width: 100%; left: 0;">
                        <ul class="col-md-12">
                            <li class="dropdown-submenu">

                            </li>
                        </ul>
                    </div>
                </form>
            </li>
        </ul>
        <div class="localization" style="display: none;">
            <div class="flag rus-flag">
                <a href="#">
                    <i>
                        <span></span>
                        <span></span>
                        <span></span>
                    </i>
                РУС</a>
            </div>
            <div class="flag ukr-flag">
                <a href="#">
                    <i>
                        <span></span>
                        <span></span>
                    </i>
                УКР</a>
            </div>
        </div>
    </div>
</div>
<div class="login modal fade" id="LogIn" role="dialog" tabindex="-1">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">
            </button>
            <div class="modal-body">
                <ul class="login-tab">
                    <li class="active"><a data-toggle="tab" href="#sign-up">регистрация</a></li>
                    <li id="tab-order"><a data-toggle="tab" href="#sign-in">вход на сайт</a></li>
                </ul>
                <div class="tab-content">
                    <div class="tab-pane fade in active" id="sign-up">
                        <div class="login-form">
                            <form  action="/registration" method="POST">
                            {{ csrf_field() }}
                                <div class="form-group">
                                    <input type="text" placeholder="Ваше имя" name="name" class="form-control">
                                </div>
                                <div class="form-group">
                                    <input type="email" placeholder="Email" name="email" class="form-control">
                                </div>
                                <div class="form-group">
                                    <input type="password" placeholder="Пароль" name="password" class="form-control">
                                </div>
                                <div class="social-links">
                                    <span>Или войти через</span>
                                    <ul>
                                        <li><a href="{{url('/redirect')}}"><i class="fa fa-facebook"></i></a></li>
                                        <li><a href="{{url('/login/google')}}"><i class="fa fa-google-plus"></i></a></li>
                                    </ul>
                                </div>
                                <button class="button button-green">зарегистрироваться</button>

                            </form>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="sign-in">
                        <div class="login-form">
                            <form method="POST" action="{{ route('login') }}">
                                    {{ csrf_field() }}
                                <div class="form-group">
                                    <input type="email" placeholder="Email" name="email" class="form-control">
                                </div>
                                <div class="form-group">
                                    <input type="password" placeholder="Пароль" name="password" class="form-control">
                                </div>
                                <div class="social-links">
                                    <span>Или войти через</span>
                                    <ul>
                                        <li><a href="{{url('/redirect')}}"><i class="fa fa-facebook"></i></a></li>
                                        <li><a href="{{url('/login/google')}}"><i class="fa fa-google-plus"></i></a></li>
                                    </ul>
                                </div>
                                <button class="button button-green">вход на сайт</button>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<script src="{{asset('js/jquery.spincrement.min.js')}}"></script>
<script src="{{asset('js/bootstrap.min.js')}}"></script>
<script src="{{asset('js/slick.min.js')}}"></script>
<script src="{{asset('js/jquery.nice-select.min.js')}}"></script>
<script src="{{asset('js/jquery.scrolly.js')}}"></script>
<script src="{{asset('js/fotorama.js')}}"></script>

<script>
    $('.mobile-search').click(function () {
       $('#mobile-search-form').toggle();
    });

    $('.mobile-search form input').click(function () {
        return false;
    });

    var countryLength = $('.countries-list div.countries-list-inner').length;
    if(countryLength > 12) {
        for(var i = 0; i <= countryLength; i ++) {
            if(i > 12) {
                $(".countries-list div.countries-list-inner[data-id='" + i + "']").hide();
            }
        }
    } else {
        $('.all-country').hide();
    }

    $('.countries-inner .trans-button').click(function (e) {
        e.preventDefault();
        $(this).hide();
        for(var i = 0; i <= countryLength; i ++) {
            if(i > 12) {
                $(".countries-list div.countries-list-inner[data-id='" + i + "']").show(1000);
            }
        }
    });
    
    $(function() {
        $('.fotorama-university').fotorama(
            {
                thumbmargin: 20,
                thumbwidth: 138,
                thumbheight: 90,
                fit: 'scaledown',
                arrows: true

            }
        );
    });
    
    $(window).resize(form_data);
    $(document).ready(form_data);

    function form_data() {
        if ($(window).width() > 993) {
            $(".price-title a[href='#info']").click(function () {
                setTimeout(function () {
                    $('.university-card').hide(500);
                    $('.hideThis').show(1000);
                    $('.testHide').css('display', 'none');
                    $('.ent-description').css('float', 'left');
                }, 1500);
            });
        } else {
            $(".price-title a[href='#info']").click(function () {
                $('.university-card').hide();
                $('.hideThis').show(3000);

                $('.testHide').css('display', 'none');
                $('.ent-description').css('float', 'left');
                setTimeout(function () {
                    var top = $('#formData').offset().top;
                    $('body,html').animate({scrollTop: top}, 1000);
                }, 1500);

            });
        }
    }

    $(".card-button a[href='#info']").click(function () {
        
        var data = $(this).attr('data-id');
        var program = $("h4[data-id='"+ data + "']").text();
        $("select[name='program_id'] option").first().remove();

        $('#order_course div ul li').each(function() {
          if($( this ).text() == program) {
            $(this).addClass('selected');
            $("#order_course div span.current").text(program);
          } else {
             $(this).removeClass('selected');
          }
        });

            $('.university-card').hide(500);
            $('.hideThis').show(1000);
            $('.testHide').css('display' , 'none');
            $('.ent-description').css('float', 'left');

            setTimeout(function () {
                var top = $('#formData').offset().top;
                $('body,html').animate({scrollTop: top}, 1000);
            }, 1500);
    });
    
    $("#myBtn").on('click',function(){
        $('.university-card').hide(500);
        $('.hideThis').show(1000);
        $('.testHide').css('display' , 'none');
        $('.ent-description').css('float', 'left');

    });

    $("#canCel, #cancel").on('click',function(){
        $('.university-card').show(1000);
        $('.hideThis').hide();
        $('.testHide').show(1000);
        $('.ent-description').animate('float', 'right');
    });

    var user = '<?php if(!empty(Auth()->user()->id)) {echo Auth()->user()->id;} else {echo "";} ?>';
    $('#create').click(function (event) {
        event.preventDefault();
        var name = $('#name').val();
        var email = $('#email').val();
        var phone = $('#phone').val();
        var dates = $('#dates').val();
        var program_id = $('#program_id').val();
        var people_count = $('#people_count').val();
        //var notes = $('#notes').val();
        if(name == '' || email == '' || phone == '' || dates == '' || program_id == null || people_count == '') {
            if(name == '') {
                $('#name').css('border', '1px solid red');
            } else {
                $('#name').css('border', 'none');
            }
            if(program_id == '' || program_id == null) {
                $('#order_course div').css('border', '1px solid red');
            } else {
                $('#order_course div').css('border', 'none');
            }
            if(user == '') {
                if(email == '') {
                    $('#email').css('border', '1px solid red');
                } else {
                    $('#email').css('border', 'none');
                }
            }
            if(phone == '') {
                $('#phone').css('border', '1px solid red');
            } else {
                $('#phone').css('border', 'none');
            }
            if(dates == '') {
                $('#dates').css('border', '1px solid red');
            } else {
                $('#dates').css('border', 'none');
            }
            if(people_count == '') {
                $('#people_count').css('border', '1px solid red');
            } else {
                $('#people_count').css('border', 'none');
            }
            /*if(notes == '') {
                $('#notes').css('border', '1px solid red');
            } else {
                $('#notes').css('border', 'none');
            }*/
            return false;
        } else {
            $('#name').css('border', 'none');
            $('#order_course div').css('border', 'none');
            $('#email').css('border', 'none');
            $('#phone').css('border', 'none');
            $('#dates').css('border', 'none');
            $('#people_count').css('border', 'none');
            $('#notes').css('border', 'none');
        }
        save();
    })

    function save() {

        formData = $('#formData').serializeArray();

        console.log(formData);

        $.ajax({
            url: '{{route('insert.order')}}',
            type: 'POST',
            data:formData,
        })

            .done(function (data) {
                $('#formData div').hide();
                $('#name').val('');
                $('#email').val('');
                $('#phone').val('');
                $('#people_count').val('');
                $('#dates').val('');
                $('#notes').val('');
                $('#program_id').val('');
                $('.succes-order').show().html('Спасибо, Ваш запрос принят. <br> Мы свяжемся с Вами в ближайшее время. <br><br> Номер запроса: ' +  data["order"]);
                $('.closed').show();
            })

            .fail(function (data) {
                console.log(data);
                $('.succes-order').show().text('Ваша заявка не принята');
            });
    }
    
    $('input[name=search]').on("input",function(e){
        var value =  $(this).val();
        $('input[name=search]').val(value);

        $.ajax({
            type: 'GET',
            url: '/index',
            data: {value:value},
            success: function(data) {
                $('.search-list ul').empty();
                if(data['names'].length > 0) $('.search-list').show();
                else  $('.search-list').hide();

                for(var i = 0; i < data['names'].length; i++) {
                    $('.search-list ul').append('<li><a href="/' + data['links'][i] + '">' + data['names'][i] + '</a></li>');
                }
            }
        });
    });
    
    $(document).on("click",".search-list .a-input",function(e) {
        var href = $(this).attr('href');
        window.location.href = href;
    });
</script>

<script type="text/javascript" src="{{asset('js/main.js')}}"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js" type="text/javascript"></script>
@stack('scripts')
</body>
</html>

